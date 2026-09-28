"use client";

import { Suspense, useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { activateAccount, previewInvitation } from "./actions";

const initialState = { error: undefined as string | undefined };

type Preview = {
  fullName: string;
  email: string;
  childName: string;
};

function ActivateForm() {
  const [state, formAction, isPending] = useActionState(
    activateAccount,
    initialState,
  );
  // El link del email trae ?code= para autorrellenar el formulario.
  const codeParam = useSearchParams().get("code") ?? "";
  const [preview, setPreview] = useState<Preview | null>(null);
  useEffect(() => {
    if (!codeParam) {
      return;
    }
    previewInvitation(codeParam).then((result) => {
      if (result.ok) {
        setPreview({
          fullName: result.fullName,
          email: result.email,
          childName: result.childName,
        });
      }
    });
  }, [codeParam]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FBF4EC] p-[40px]">
      <div className="w-full max-w-[440px]">
        <div className="mb-[22px] flex h-[58px] w-[58px] items-center justify-center rounded-[18px] bg-[linear-gradient(155deg,#F8C3A8,#F2937A)] shadow-[0_12px_26px_-10px_rgba(238,129,100,.65)]">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
          </svg>
        </div>
        <h1 className="m-0 mb-[8px] font-display text-[32px] font-semibold leading-[1.15] text-[#3F362E]">Bienvenida a OpenDayCare</h1>
        <p className="m-0 mb-[26px] text-[15.5px] leading-[1.55] text-[#94887B]">
          Te invitaron a seguir el día de tu hijo. Creá tu contraseña para activar la cuenta.
        </p>

        <div className="mb-[22px] flex items-center gap-[14px] rounded-[16px] border-[1.5px] border-[#EADFD0] bg-white px-[16px] py-[14px]">
          <div className="flex h-[44px] w-[44px] items-center justify-center rounded-full bg-[#A9D9E8] font-display text-[19px] font-semibold text-[#1F7A93]">
            {(preview?.childName ?? "O").charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="text-[13px] text-[#94887B]">Te invitaron a seguir el día de</div>
            <div className="font-display text-[17px] font-semibold text-[#3F362E]">{preview?.childName ?? "tu hijo"}</div>
          </div>
        </div>

        {preview && (
          <div className="mb-[22px] rounded-[16px] border-[1.5px] border-[#EADFD0] bg-white px-[16px] py-[14px]">
            <div className="mb-[6px] text-[12px] font-bold tracking-[.7px] text-[#94887B]">INVITADO/A</div>
            <div className="text-[15px] font-extrabold text-[#3F362E]">{preview.fullName}</div>
            <div className="text-[14px] text-[#94887B]">{preview.email}</div>
          </div>
        )}

        <form action={formAction}>
          <label htmlFor="code" className="mb-[8px] block text-[12px] font-bold tracking-[.7px] text-[#94887B]">CÓDIGO DE INVITACIÓN</label>
          <input
            id="code"
            name="code"
            required
            autoComplete="one-time-code"
            placeholder="Ej. 7K4P9"
            defaultValue={codeParam}
            className="mb-[18px] w-full rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white px-[16px] py-[14px] font-display text-[18px] font-bold tracking-[3px] text-[#3F362E] uppercase placeholder:normal-case placeholder:font-sans placeholder:text-[15px] placeholder:font-normal placeholder:tracking-normal focus:outline-none"
          />

          <label htmlFor="email" className="mb-[8px] block text-[12px] font-bold tracking-[.7px] text-[#94887B]">EMAIL</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            readOnly={preview !== null}
            autoComplete="email"
            placeholder="tu@email.com"
            key={preview?.email ?? "editable"}
            defaultValue={preview?.email ?? ""}
            className="mb-[18px] w-full rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white px-[16px] py-[14px] text-[15px] text-[#3F362E] read-only:bg-[#F6EFE4] focus:outline-none"
          />

          <label htmlFor="password" className="mb-[8px] block text-[12px] font-bold tracking-[.7px] text-[#94887B]">CREAR CONTRASEÑA</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="Mínimo 8 caracteres"
            className="mb-[18px] w-full rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white px-[16px] py-[14px] text-[15px] text-[#3F362E] focus:outline-none"
          />

          <label className="mb-[24px] flex cursor-pointer items-start gap-[12px] rounded-[14px] bg-[#FBF1D6] px-[16px] py-[14px]">
            <input type="checkbox" defaultChecked className="hidden" />
            <span className="mt-[1px] flex h-[24px] w-[24px] flex-none items-center justify-center rounded-[8px] bg-[#5FB97E]">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </span>
            <span className="text-[14px] leading-[1.45] text-[#8A7234]">
              Autorizo a la guardería a tomar y compartir fotos de mi hijo dentro de la app.
            </span>
          </label>

          {state?.error && (
            <p role="alert" className="m-0 mb-[16px] rounded-[12px] bg-[#FBE9E4] px-[14px] py-[12px] text-[14px] font-bold text-[#C5503A]">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="block w-full rounded-[15px] bg-[linear-gradient(180deg,#F4977E,#EE8164)] px-[16px] py-[15px] text-center text-[16px] font-extrabold text-white shadow-[0_10px_22px_-8px_rgba(238,129,100,.7)] disabled:opacity-60"
          >
            {isPending ? "Activando…" : "Activar mi cuenta"}
          </button>
        </form>
        <p className="m-0 mt-[22px] text-center text-[14.5px] text-[#94887B]">
          ¿Ya tenés cuenta?{" "}
          <Link href="/auth/login" className="font-extrabold text-[#C5503A]">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function ActivateAccountPage() {
  return (
    <Suspense>
      <ActivateForm />
    </Suspense>
  );
}
