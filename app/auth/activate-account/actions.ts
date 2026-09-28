"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import { createClient } from "@/utils/supabase/server";

const GENERIC_ERROR =
  "No pudimos activar tu cuenta. Revisá el email y el código e intentá de nuevo.";
const SHORT_PASSWORD_ERROR =
  "La contraseña debe tener al menos 8 caracteres.";

export type InvitationPreview =
  | { ok: true; fullName: string; email: string; childName: string }
  | { ok: false };

// Vista previa de solo lectura para ?code=: nombre, email y niño invitado.
export async function previewInvitation(
  code: string,
): Promise<InvitationPreview> {
  const normalized = code.trim().toUpperCase();
  if (!normalized) {
    return { ok: false };
  }
  const supabase = createClient(await cookies());
  const { data } = await supabase.rpc("preview_invitation", {
    p_code: normalized,
  });
  const row = (
    data as { full_name: string; email: string; child_name: string }[] | null
  )?.[0];
  if (!row) {
    return { ok: false };
  }
  return {
    ok: true,
    fullName: row.full_name,
    email: row.email,
    childName: row.child_name,
  };
}

export type ActivateState = {
  error?: string;
};

type RedeemedInvitation = {
  invitation_id: string;
  child_id: string;
  full_name: string;
  relationship: "mother" | "father" | "guardian";
  daycare_id: string;
};

export async function activateAccount(
  _prevState: ActivateState,
  formData: FormData,
): Promise<ActivateState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !code) {
    return { error: GENERIC_ERROR };
  }
  if (password.length < 8) {
    return { error: SHORT_PASSWORD_ERROR };
  }

  const supabase = createClient(await cookies());

  // Canje anónimo: valida código + pending + vigente + email por dentro.
  // Sin filas = genérico (no revela qué falló).
  const { data: redeemed } = await supabase.rpc("redeem_invitation", {
    p_code: code,
    p_email: email,
  });
  const invitation = (redeemed as RedeemedInvitation[] | null)?.[0];
  if (!invitation) {
    return { error: GENERIC_ERROR };
  }

  // Crea auth.users; el trigger handle_new_user crea public.users (rol parent).
  // Email ya registrado = mismo error genérico.
  const { data: signUpData, error: signUpError } =
    await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: invitation.full_name,
          role: "parent",
          daycare_id: invitation.daycare_id,
        },
      },
    });
  if (signUpError || !signUpData.user) {
    console.error("[activate] signUp failed:", signUpError);
    return { error: GENERIC_ERROR };
  }

  // Sesión: el signup la trae si la confirmación de email está apagada.
  let parentId = signUpData.user.id;
  if (!signUpData.session) {
    const { data: signInData, error: signInError } =
      await supabase.auth.signInWithPassword({ email, password });
    if (signInError || !signInData.session) {
      console.error("[activate] signIn failed:", signInError);
      return { error: GENERIC_ERROR };
    }
    parentId = signInData.user.id;
  }

  // Vínculo (23505 = ya vinculado, se continúa) y cierre de la invitación.
  const { error: linkError } = await supabase.from("parent_children").insert({
    parent_id: parentId,
    child_id: invitation.child_id,
    relationship: invitation.relationship,
  });
  if (linkError && linkError.code !== "23505") {
    console.error("[activate] link failed:", linkError);
    return { error: GENERIC_ERROR };
  }

  await supabase
    .from("invitations")
    .update({ status: "accepted", accepted_at: new Date().toISOString() })
    .eq("id", invitation.invitation_id);

  revalidatePath("/", "layout");
  redirect("/");
}
