"use client";

import { useActionState } from "react";
import Link from "next/link";

import { signIn } from "./actions";

const initialState = { error: undefined as string | undefined };

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(signIn, initialState);

  return (
    <div className="grid min-h-screen grid-cols-[1.05fr_1fr] bg-[#FBF4EC]">
      <div className="relative flex flex-col justify-between overflow-hidden bg-[linear-gradient(155deg,#F6A98E_0%,#F2937A_45%,#EC7E62_100%)] px-[60px] py-[56px] text-white">
        <div className="absolute -top-[140px] -right-[120px] h-[420px] w-[420px] rounded-full bg-white/12" />
        <div className="absolute -bottom-[110px] -left-[80px] h-[300px] w-[300px] rounded-full bg-white/10" />

        <div className="relative flex items-center gap-[13px]">
          <div className="flex h-[46px] w-[46px] items-center justify-center rounded-[14px] bg-white/22">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
            </svg>
          </div>
          <span className="font-display text-[21px] font-semibold tracking-[.5px]">OpenDayCare</span>
        </div>

        <div className="relative">
          <h1 className="m-0 mb-[18px] font-display text-[42px] font-semibold leading-[1.12]">
            El día de cada niño,
            <br />
            compartido con su familia.
          </h1>
          <p className="m-0 max-w-[430px] text-[17px] leading-[1.6] text-white/92">
            Publicá momentos, gestioná las salas y mantené a las familias cerca, desde un solo lugar.
          </p>
        </div>

        <div className="relative text-[14px] text-white/90">🌿 Guardería Sala Soles</div>
      </div>

      <div className="flex items-center justify-center p-[40px]">
        <div className="w-full max-w-[392px]">
          <h2 className="m-0 mb-[6px] font-display text-[30px] font-semibold text-[#3F362E]">Iniciar sesión</h2>
          <p className="m-0 mb-[28px] text-[15px] text-[#94887B]">Ingresá para ver el día de hoy.</p>

          <form action={formAction}>
            <label htmlFor="email" className="mb-[8px] block text-[12px] font-bold tracking-[.7px] text-[#94887B]">EMAIL</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="tu@email.com"
              className="mb-[18px] w-full rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white px-[16px] py-[14px] text-[15px] text-[#3F362E] placeholder-[#B6A99B] focus:outline-none"
            />

            <label htmlFor="password" className="mb-[8px] block text-[12px] font-bold tracking-[.7px] text-[#94887B]">CONTRASEÑA</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="mb-[10px] w-full rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white px-[16px] py-[14px] text-[15px] text-[#3F362E] placeholder-[#B6A99B] focus:outline-none"
            />

            <div className="mb-[20px] text-right">
              <a href="#" className="text-[13.5px] font-bold text-[#C5503A]">
                ¿Olvidaste tu contraseña?
              </a>
            </div>

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
              Iniciar sesión
            </button>
          </form>

          <p className="m-0 mt-[24px] text-center text-[14.5px] text-[#94887B]">
            ¿Te invitó la guardería?{" "}
            <Link href="/auth/activate-account" className="font-extrabold text-[#C5503A]">
              Activá tu cuenta
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
