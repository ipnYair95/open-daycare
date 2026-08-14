"use client";

import { useState } from "react";
import { kids } from "@/app/data/kids";

const sectionLabelClasses =
  "mb-[10px] text-[12px] font-extrabold tracking-[.7px] text-[#94887B]";

const postTypes = [
  { id: "Comida", className: "bg-[#9A7B1E] text-white" },
  { id: "Siesta", className: "bg-[#E7DCF6] text-[#7B5FC0]" },
  { id: "Actividad", className: "bg-[#2E89A6] text-white" },
  { id: "Logro", className: "bg-[#CFEBD8] text-[#3E9B6C]" },
  { id: "Ánimo", className: "bg-[#F9D2DE] text-[#C56486]" },
  { id: "Foto", className: "bg-[#FBD8CC] text-[#D9684A]" },
  { id: "Anuncio", className: "bg-[#CCD8F4] text-[#4E72C8]" },
] as const;

type PostType = (typeof postTypes)[number]["id"];

const chipInactiveClasses =
  "border-[#ECE0D0] bg-[#FFFDF9] text-[#6E6359]";
const chipActiveClasses = "border-[#3F362E] bg-[#3F362E] text-white";

export default function ComposePostModal() {
  const [open, setOpen] = useState(false);
  const [audience, setAudience] = useState<number[]>([]);
  const [wholeRoom, setWholeRoom] = useState(false);
  const [type, setType] = useState<PostType>("Comida");
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);

  const toggleKid = (id: number) => {
    setWholeRoom(false);
    setAudience((current) =>
      current.includes(id) ? current.filter((kidId) => kidId !== id) : [...current, id],
    );
  };

  const toggleWholeRoom = () => {
    setAudience([]);
    setWholeRoom((current) => !current);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }
    if (photo) {
      URL.revokeObjectURL(photo);
    }
    setPhoto(URL.createObjectURL(file));
  };

  const closeModal = () => {
    setOpen(false);
    if (photo) {
      URL.revokeObjectURL(photo);
    }
    setAudience([]);
    setWholeRoom(false);
    setType("Comida");
    setDescription("");
    setPhoto(null);
  };

  return (
    <>
      <a
        href="#"
        onClick={(event) => {
          event.preventDefault();
          setOpen(true);
        }}
        className="mb-[18px] flex w-full cursor-pointer items-center justify-center gap-2 rounded-[14px] bg-[linear-gradient(180deg,#F4977E,#EE8164)] px-4 py-3 font-extrabold text-[14.5px] text-white shadow-[0_8px_18px_-8px_rgba(238,129,100,.75)]"
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
        Nueva publicación
      </a>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#3F362E]/40 p-10 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            className="h-fit w-full max-w-[580px] overflow-hidden rounded-[24px] border border-[#ECE0D0] bg-[#FBF4EC] shadow-[0_20px_50px_-24px_rgba(63,54,46,.35)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#ECE0D0] px-[26px] py-5">
              <button type="button" onClick={closeModal} className="cursor-pointer text-[15px] font-bold text-[#94887B]">
                Cancelar
              </button>
              <span className="font-display text-[18px] font-semibold text-[#3F362E]">Nueva publicación</span>
              <a href="#" className="text-[15px] font-extrabold text-[#D9583C]">
                Publicar
              </a>
            </div>

            <div className="px-[26px] py-6">
              <div className={sectionLabelClasses}>PARA</div>
              <div className="mb-[22px] flex flex-wrap gap-[9px]">
                {kids.map((kid) => {
                  const selected = audience.includes(kid.id);
                  return (
                    <button
                      key={kid.id}
                      type="button"
                      onClick={() => toggleKid(kid.id)}
                      className={`flex cursor-pointer items-center gap-2 rounded-full border-[1.5px] py-[6px] pl-[6px] pr-[14px] text-[14px] font-bold ${
                        selected ? chipActiveClasses : chipInactiveClasses
                      }`}
                    >
                      <span
                        className="flex h-[26px] w-[26px] items-center justify-center rounded-full font-display text-[13px] font-semibold"
                        style={{ backgroundColor: kid.avatarBg, color: kid.avatarColor }}
                      >
                        {kid.initial}
                      </span>
                      {kid.firstName}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={toggleWholeRoom}
                  className={`cursor-pointer rounded-full border-[1.5px] px-4 py-[6px] text-[14px] font-bold ${
                    wholeRoom ? chipActiveClasses : chipInactiveClasses
                  }`}
                >
                  Toda la sala
                </button>
              </div>

              <div className={sectionLabelClasses}>TIPO</div>
              <div className="mb-[22px] flex flex-wrap gap-[9px]">
                {postTypes.map((option) => {
                  const active = type === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setType(option.id)}
                      className={`cursor-pointer rounded-full px-4 py-2 text-[13.5px] font-extrabold ${
                        active ? option.className : "bg-[#F6ECDF] text-[#B0A290]"
                      }`}
                    >
                      {option.id}
                    </button>
                  );
                })}
              </div>

              <div className={sectionLabelClasses}>DESCRIPCIÓN</div>
              <textarea
                placeholder="Contá cómo le fue hoy…"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="mb-[22px] min-h-[120px] w-full resize-y rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white px-4 py-[14px] text-[15px] leading-[1.5] text-[#3F362E] placeholder:text-[#B6A99B]"
              />

              <div className={sectionLabelClasses}>FOTOS</div>
              <div className="flex gap-[12px]">
                {photo && (
                  <div className="h-[96px] w-[96px] overflow-hidden rounded-[14px]">
                    <img src={photo} alt="Foto de la publicación" className="h-full w-full object-cover" />
                  </div>
                )}
                <label className="flex h-[96px] w-[96px] cursor-pointer flex-col items-center justify-center gap-[6px] rounded-[14px] border-[1.5px] border-dashed border-[#DBCDBA] bg-[#F4ECE1] text-[#B0A290]">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C5503A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  <span className="text-[12px]">Agregar</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </label>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
