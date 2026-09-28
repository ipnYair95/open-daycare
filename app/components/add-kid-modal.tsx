"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

interface RoomOption {
  id: string;
  name: string;
}

const inputClasses =
  "w-full rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white px-4 py-[13px] text-[15px] text-[#3F362E] placeholder:text-[#B6A99B]";
const labelClasses =
  "mb-2 text-[12px] font-extrabold tracking-[.7px] text-[#94887B]";
const DATE_FORMAT = /^(\d{2})\/(\d{2})\/(\d{4})$/;
const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

function isValidDate(value: string) {
  const match = value.match(DATE_FORMAT);
  if (!match) {
    return false;
  }
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const isLeapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const maxDay = DAYS_IN_MONTH[month - 1] + (month === 2 && isLeapYear ? 1 : 0);
  return day >= 1 && day <= maxDay;
}

function formatDateInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length > 4) {
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  }
  if (digits.length > 2) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }
  return digits;
}

export default function AddKidModal({ rooms }: { rooms: RoomOption[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [nameError, setNameError] = useState(false);
  const [birthDate, setBirthDate] = useState("");
  const [dateError, setDateError] = useState(false);
  const [roomId, setRoomId] = useState(
    () => rooms.find((room) => room.name === "Soles")?.id ?? rooms[0]?.id ?? "",
  );
  const [allergies, setAllergies] = useState("");
  const [medicalNotes, setMedicalNotes] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave() {
    const validName = fullName.trim().length > 0;
    const dateMatch = birthDate.match(DATE_FORMAT);
    const validDate = isValidDate(birthDate);
    setNameError(!validName);
    setDateError(!validDate);
    if (!validName || !validDate || !dateMatch) {
      return;
    }
    setIsSaving(true);
    setSaveError(null);
    const allergyTags = allergies
      .split(",")
      .map((tag) => tag.trim().toLowerCase())
      .filter((tag) => tag.length > 0);
    const supabase = createClient();
    const { error } = await supabase.from("children").insert({
      full_name: fullName.trim(),
      birth_date: `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`,
      room_id: roomId || null,
      allergy_tags: allergyTags,
      medical_notes: medicalNotes.trim() || null,
    });
    setIsSaving(false);
    if (error) {
      setSaveError("No se pudo guardar. Intentá de nuevo.");
      return;
    }
    setFullName("");
    setBirthDate("");
    setAllergies("");
    setMedicalNotes("");
    setNameError(false);
    setDateError(false);
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex cursor-pointer items-center gap-2 rounded-[14px] bg-[linear-gradient(180deg,#F4977E,#EE8164)] px-[18px] py-[11px] text-[14.5px] font-extrabold text-white shadow-[0_8px_18px_-8px_rgba(238,129,100,.7)]"
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
        Agregar niño
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#3F362E]/40 p-10 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="h-fit w-full max-w-[520px] overflow-hidden rounded-[24px] border border-[#ECE0D0] bg-[#FBF4EC] shadow-[0_20px_50px_-24px_rgba(63,54,46,.35)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#ECE0D0] px-[26px] py-5">
              <button type="button" onClick={() => setOpen(false)} className="cursor-pointer text-[15px] font-bold text-[#94887B]">
                Cancelar
              </button>
              <span className="font-display text-[18px] font-semibold text-[#3F362E]">Agregar niño</span>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="cursor-pointer text-[15px] font-extrabold text-[#D9583C] disabled:opacity-50"
              >
                {isSaving ? "Guardando…" : "Guardar"}
              </button>
            </div>

            <div className="px-[26px] py-6">
              <div className={labelClasses}>NOMBRE COMPLETO</div>
              <input
                placeholder="Ej. Martina López"
                value={fullName}
                onChange={(event) => {
                  setFullName(event.target.value);
                  setNameError(false);
                }}
                aria-invalid={nameError}
                className={`${inputClasses} mb-[18px] ${nameError ? "!border-[#D9583C]" : ""}`}
              />
              {nameError && (
                <p className="-mt-[10px] mb-[18px] text-[12px] font-bold text-[#D9583C]">Ingresá el nombre del niño</p>
              )}

              <div className="mb-[18px] flex items-start gap-[14px]">
                <div className="flex-1">
                  <div className={labelClasses}>FECHA DE NACIMIENTO</div>
                  <input
                    placeholder="dd/mm/aaaa"
                    value={birthDate}
                    onChange={(event) => {
                      setBirthDate(formatDateInput(event.target.value));
                      setDateError(false);
                    }}
                    onBlur={() => setDateError(birthDate.length > 0 && !isValidDate(birthDate))}
                    aria-invalid={dateError}
                    className={`${inputClasses} ${dateError ? "!border-[#D9583C]" : ""}`}
                  />
                  {dateError && (
                    <p className="mt-2 text-[12px] font-bold text-[#D9583C]">Fecha inválida: usa dd/mm/aaaa</p>
                  )}
                </div>
                <div className="flex-1">
                  <div className={labelClasses}>SALA</div>
                  <div className="relative">
                    <select
                      value={roomId}
                      onChange={(event) => setRoomId(event.target.value)}
                      className="w-full cursor-pointer appearance-none rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white px-4 py-[13px] text-[15px] font-bold text-[#3F362E]"
                    >
                      {rooms.map((room) => (
                        <option key={room.id} value={room.id}>
                          {room.name}
                        </option>
                      ))}
                    </select>
                    <svg
                      className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#B0A290"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className={labelClasses}>ALERGIAS (ETIQUETAS)</div>
              <input
                placeholder="Ej. Maní, Lactosa"
                value={allergies}
                onChange={(event) => setAllergies(event.target.value)}
                className={`${inputClasses} mb-[18px]`}
              />

              <div className={labelClasses}>NOTAS MÉDICAS</div>
              <textarea
                placeholder="Indicaciones, medicación, contactos…"
                value={medicalNotes}
                onChange={(event) => setMedicalNotes(event.target.value)}
                className={`${inputClasses} min-h-[90px] resize-y leading-[1.5]`}
              />

              {saveError && (
                <p className="mt-4 text-[13px] font-bold text-[#D9583C]">{saveError}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
