"use server";

import { cookies, headers } from "next/headers";
import { Resend } from "resend";

import { createClient } from "@/utils/supabase/server";

const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 5;
const MAX_CODE_ATTEMPTS = 5;
const EXPIRATION_DAYS = 7;
const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;

const RELATIONSHIPS = ["mother", "father", "guardian"] as const;
export type Relationship = (typeof RELATIONSHIPS)[number];

export type InvitationInput = {
  childId: string;
  fullName: string;
  email: string;
  relationship: string;
};

export type InvitationResult =
  | { ok: true; code: string; emailSent: boolean }
  | { ok: false; error: string };

const GENERIC_ERROR = "No se pudo enviar la invitación. Intentá de nuevo.";

// Genera un código de CODE_LENGTH caracteres sin ambiguos (0/O, 1/I).
function generateCode() {
  const randomValues = crypto.getRandomValues(new Uint32Array(CODE_LENGTH));
  let code = "";
  for (const value of randomValues) {
    code += CODE_ALPHABET[value % CODE_ALPHABET.length];
  }
  return code;
}

function isRelationship(value: string): value is Relationship {
  return (RELATIONSHIPS as readonly string[]).includes(value);
}

async function buildActivationUrl(code: string) {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const path = `/auth/activate-account?code=${code}`;
  if (!host) {
    return path;
  }
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";
  return `${protocol}://${host}${path}`;
}

export async function sendInvitation(
  input: InvitationInput,
): Promise<InvitationResult> {
  const childId = input.childId.trim();
  const fullName = input.fullName.trim();
  const email = input.email.trim().toLowerCase();
  const relationship = input.relationship;

  if (!childId || !fullName || !EMAIL_PATTERN.test(email) || !isRelationship(relationship)) {
    return { ok: false, error: GENERIC_ERROR };
  }

  const supabase = createClient(await cookies());

  const { data: child } = await supabase
    .from("children")
    .select("full_name")
    .eq("id", childId)
    .single();
  const kidName = (child as { full_name?: string } | null)?.full_name;
  if (!kidName) {
    return { ok: false, error: GENERIC_ERROR };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Ya vinculado: no crea un pendiente redundante (mensaje propio, solo staff).
  const { data: alreadyLinked } = await supabase.rpc(
    "is_email_linked_to_child",
    { p_child_id: childId, p_email: email },
  );
  if (alreadyLinked === true) {
    return { ok: false, error: "Este email ya está vinculado a este niño." };
  }

  // Re-invitar: cancela la invitación pending vigente del mismo niño + email.
  const nowIso = new Date().toISOString();
  const { data: previous } = await supabase
    .from("invitations")
    .select("id, email")
    .eq("child_id", childId)
    .eq("status", "pending")
    .gt("expires_at", nowIso);
  const previousIds = ((previous ?? []) as { id: string; email: string }[])
    .filter((row) => row.email.toLowerCase() === email)
    .map((row) => row.id);
  if (previousIds.length > 0) {
    await supabase
      .from("invitations")
      .update({ status: "cancelled" })
      .in("id", previousIds);
  }

  const expiresAt = new Date(
    Date.now() + EXPIRATION_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  // Inserta con reintento ante colisión del UNIQUE(code).
  let code: string | null = null;
  for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt += 1) {
    const candidate = generateCode();
    const { error } = await supabase.from("invitations").insert({
      child_id: childId,
      invited_by: user?.id ?? null,
      full_name: fullName,
      email,
      relationship,
      code: candidate,
      status: "pending",
      expires_at: expiresAt,
    });
    if (!error) {
      code = candidate;
      break;
    }
    if (error.code !== "23505") {
      return { ok: false, error: GENERIC_ERROR };
    }
  }
  if (!code) {
    return { ok: false, error: GENERIC_ERROR };
  }

  // Email simple (texto + HTML mínimo); el código ya quedó guardado.
  let emailSent = false;
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.INVITATION_EMAIL_FROM;
  if (apiKey && from) {
    const expiryLabel = new Intl.DateTimeFormat("es", {
      dateStyle: "long",
    }).format(new Date(expiresAt));
    const activationUrl = await buildActivationUrl(code);
    const text =
      `Hola ${fullName},\n\n` +
      `Te invitaron a seguir el día de ${kidName} en OpenDayCare.\n\n` +
      `Tu código de invitación es: ${code}\n` +
      `Vence el ${expiryLabel}.\n\n` +
      `Activá tu cuenta aquí: ${activationUrl}\n`;
    try {
      const resend = new Resend(apiKey);
      const { error } = await resend.emails.send({
        from,
        to: [email],
        subject: `Tu código para seguir a ${kidName} en OpenDayCare`,
        text,
        html: `<p>Hola ${fullName},</p><p>Te invitaron a seguir el día de <strong>${kidName}</strong> en OpenDayCare.</p><p>Tu código de invitación es: <strong>${code}</strong></p><p>Vence el ${expiryLabel}.</p><p><a href="${activationUrl}">Activá tu cuenta aquí</a></p>`,
      });
      emailSent = !error;
      if (error) {
        console.error("[invitation] Resend error:", error);
      }
    } catch (unknownError) {
      console.error("[invitation] Resend error:", unknownError);
    }
  } else {
    console.warn(
      "[invitation] RESEND_API_KEY o INVITATION_EMAIL_FROM sin configurar; se omite el envío.",
    );
  }

  return { ok: true, code, emailSent };
}
