"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import { createClient } from "@/utils/supabase/server";

const INVALID_CREDENTIALS_MESSAGE =
  "Email o contraseña incorrectos. Intentá de nuevo.";

export type SignInState = {
  error?: string;
};

export async function signIn(
  _prevState: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const supabase = createClient(await cookies());

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: INVALID_CREDENTIALS_MESSAGE };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: INVALID_CREDENTIALS_MESSAGE };
  }

  revalidatePath("/", "layout");
  redirect("/");
}
