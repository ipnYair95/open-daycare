"use client";

import { useState } from "react";

import { sendInvitation } from "./invitation-actions";

const inputClasses =
  "w-full rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white px-4 py-[13px] text-[15px] text-[#3F362E] placeholder:text-[#B6A99B]";
const labelClasses =
  "mb-2 text-[12px] font-extrabold tracking-[.7px] text-[#94887B]";
const relationships = ["Mamá", "Papá", "Tutor/a"] as const;
// Mapeo parentesco UI → enum public.relationship_type.
const relationshipMap: Record<string, string> = {
  "Mamá": "mother",
  "Papá": "father",
  "Tutor/a": "guardian",
};
const emailPattern = /^\S+@\S+\.\S+$/;

function validateName(name: string) {
  return name.trim() === "" ? "El nombre es obligatorio" : null;
}

function validateEmail(email: string) {
  if (email.trim() === "") {
    return "El email es obligatorio";
  }
  if (!emailPattern.test(email)) {
    return "Formato de email inválido";
  }
  return null;
}

export default function LinkParentModal({
  kidName,
  childId,
}: {
  kidName: string;
  childId: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [relationship, setRelationship] = useState<string>("Mamá");
  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [code, setCode] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function handleSend() {
    const nextNameError = validateName(name);
    const nextEmailError = validateEmail(email);
    setNameError(nextNameError);
    setEmailError(nextEmailError);
    if (nextNameError || nextEmailError) {
      return;
    }
    if (!childId) {
      setSubmitError("Este perfil es de demostración; solo se puede invitar desde niños registrados.");
      return;
    }
    setSending(true);
    setSubmitError(null);
    const result = await sendInvitation({
      childId,
      fullName: name.trim(),
      email: email.trim(),
      relationship: relationshipMap[relationship] ?? relationship,
    });
    setSending(false);
    if (!result.ok) {
      setSubmitError(result.error);
      return;
    }
    setCode(result.code);
    setEmailSent(result.emailSent);
  }

  return (
    <>
      <a
        href="#"
        onClick={(event) => {
          event.preventDefault();
          setOpen(true);
        }}
        className="flex cursor-pointer items-center gap-3 pt-2"
      >
        <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full border-[1.5px] border-dashed border-[#D8CBBA] text-[#B0A290]">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </span>
        <span className="text-[14.5px] font-extrabold text-[#C5503A]">Vincular otro padre</span>
      </a>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#3F362E]/40 p-10 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="h-fit w-full max-w-[480px] overflow-hidden rounded-[24px] border border-[#ECE0D0] bg-[#FBF4EC] shadow-[0_20px_50px_-24px_rgba(63,54,46,.35)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#ECE0D0] px-[26px] py-5">
              <div>
                <div className="font-display text-[18px] font-semibold text-[#3F362E]">Vincular padre</div>
                <div className="text-[13px] text-[#A89A8B]">a {kidName}</div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Cerrar"
                className="flex h-[34px] w-[34px] cursor-pointer items-center justify-center rounded-[10px] bg-[#F0E6D8] text-[#94887B]"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-[26px] py-[22px]">
              <div className="mb-5 flex gap-[11px] rounded-[14px] bg-[#E3ECFB] p-[13px_16px]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4E72C8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-[1px] flex-none">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4M12 8h.01" />
                </svg>
                <span className="text-[13.5px] leading-[1.45] text-[#3F5694]">
                  Le enviaremos un correo con un código para que active su cuenta. Solo verá el feed de {kidName}.
                </span>
              </div>

              <div className="mb-[18px]">
                <div className={labelClasses}>NOMBRE DEL PADRE/MADRE</div>
                <input
                  placeholder="Ej. Diego Fernández"
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                    setNameError(null);
                  }}
                  onBlur={() => setNameError(validateName(name))}
                  aria-invalid={nameError !== null}
                  className={`${inputClasses} ${nameError ? "!border-[#D9583C]" : ""}`}
                />
                {nameError && <p className="mt-2 text-[12px] font-bold text-[#D9583C]">{nameError}</p>}
              </div>

              <div className="mb-[18px]">
                <div className={labelClasses}>EMAIL</div>
                <input
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setEmailError(null);
                  }}
                  onBlur={() => setEmailError(validateEmail(email))}
                  aria-invalid={emailError !== null}
                  className={`${inputClasses} ${emailError ? "!border-[#D9583C]" : ""}`}
                />
                {emailError && <p className="mt-2 text-[12px] font-bold text-[#D9583C]">{emailError}</p>}
              </div>

              <div className={labelClasses}>PARENTESCO</div>
              <div className="mb-5 flex gap-[9px]">
                {relationships.map((option) => {
                  const isActive = relationship === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setRelationship(option)}
                      className={`flex-1 cursor-pointer rounded-full border-[1.5px] px-2 py-[11px] text-[14px] font-extrabold ${
                        isActive
                          ? "border-[#9FB8EC] bg-[#CCD8F4] text-[#4E72C8]"
                          : "border-[#ECE0D0] bg-[#FFFDF9] text-[#6E6359]"
                      }`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>

              <div className="mb-5 rounded-[16px] border-[1.5px] border-dashed border-[#E6D08A] bg-[#FBF1D6] px-[18px] py-[18px] text-center">
                <div className="mb-2 text-[12px] font-extrabold tracking-[.7px] text-[#A88526]">CÓDIGO DE INVITACIÓN</div>
                <div className="font-display text-[34px] font-semibold tracking-[7px] text-[#8A7234]">
                  {code ?? "·····"}
                </div>
                <div className="mt-[6px] text-[13px] text-[#A88526]">
                  {code
                    ? emailSent
                      ? `Enviamos el código a ${email.trim()} · Vence en 7 días`
                      : "No pudimos enviar el correo; compartí este código directamente · Vence en 7 días"
                    : "El código aparecerá aquí al enviar · Vence en 7 días"}
                </div>
              </div>

              {submitError && <p className="mb-4 text-[13px] font-bold text-[#D9583C]">{submitError}</p>}

              <button
                type="button"
                onClick={handleSend}
                disabled={sending}
                className="flex w-full cursor-pointer items-center justify-center gap-[9px] rounded-[14px] bg-[linear-gradient(180deg,#F4977E,#EE8164)] px-4 py-[14px] text-[15.5px] font-extrabold text-white shadow-[0_10px_22px_-8px_rgba(238,129,100,.7)] disabled:cursor-wait disabled:opacity-70"
              >
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m22 2-7 20-4-9-9-4z" />
                  <path d="M22 2 11 13" />
                </svg>
                {sending ? "Enviando…" : code ? "Reenviar invitación" : "Enviar invitación"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
