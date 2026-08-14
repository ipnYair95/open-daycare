import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import LinkParentModal from "@/app/components/link-parent-modal";
import Sidebar from "@/app/components/sidebar";
import { kids, type LinkedParent } from "@/app/data/kids";

export function generateStaticParams() {
  return kids.map((kid) => ({ slug: kid.slug }));
}

export function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  return params.then(({ slug }) => {
    const kid = kids.find((k) => k.slug === slug);
    return { title: kid ? `${kid.firstName} ${kid.lastName} · OpenDayCare` : "Niño · OpenDayCare" };
  });
}

const parentPalette = ["#C9B6E8", "#A9C7E8", "#F4B8CC", "#B9DEC4", "#A9D9E8", "#F4DC8E"];

const parentStatus = {
  active: { label: "ACTIVA", bg: "#CFEBD8", color: "#3E9B6C" },
  pending: { label: "PENDIENTE", bg: "#F7E7A6", color: "#9A7B1E" },
} as const;

function parentSubtitle(parent: LinkedParent) {
  return parent.status === "active" ? `${parent.role} · activa` : `${parent.role} · invitación enviada`;
}

export default async function KidProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const kid = kids.find((k) => k.slug === slug);
  if (!kid) notFound();

  return (
    <div className="flex min-h-screen bg-[#F6ECDF]">
      <Sidebar active="kids" />

      <main className="h-screen min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[820px] px-10 pb-20 pt-[34px]">
          <Link href="/kids" className="mb-5 flex items-center gap-[7px] text-[14px] font-bold text-[#94887B]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
            Volver a Niños
          </Link>

          <div className="flex flex-wrap items-start gap-[26px]">
            <div className="flex min-w-[300px] flex-1 flex-col gap-[18px]">
              <div className="flex items-center gap-[18px]">
                <div
                  className="flex h-[84px] w-[84px] flex-none items-center justify-center rounded-full font-display text-[34px] font-semibold"
                  style={{ background: kid.avatarBg, color: kid.avatarColor }}
                >
                  {kid.initial}
                </div>
                <div className="flex-1">
                  <h1 className="m-0 font-display text-[28px] font-semibold text-[#3F362E]">
                    {kid.firstName} {kid.lastName}
                  </h1>
                  <p className="m-0 mt-[3px] text-[15px] text-[#94887B]">
                    {kid.age} años · Sala {kid.room}
                  </p>
                </div>
                <a
                  href="#"
                  className="rounded-xl border-[1.5px] border-[#ECE0D0] bg-[#FFFDF9] px-4 py-[9px] text-[14px] font-bold text-[#6E6359]"
                >
                  Editar
                </a>
              </div>

              {kid.allergyNote && (
                <div className="flex gap-[14px] rounded-[16px] bg-[#FBDAD6] p-[16px_18px]">
                  <div className="flex h-10 w-10 flex-none items-center justify-center rounded-[11px] bg-[#F4A8A0]">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
                      <path d="M12 9v4M12 17h.01" />
                    </svg>
                  </div>
                  <div>
                    <div className="mb-0.5 text-[15px] font-extrabold text-[#C5413A]">Alergias y notas</div>
                    <div className="text-[14.5px] leading-normal text-[#B25249]">{kid.allergyNote}</div>
                  </div>
                </div>
              )}

              {kid.birthDate && (
                <div className="overflow-hidden rounded-[16px] border border-[#ECE0D0] bg-[#FFFDF9]">
                  <div className="flex justify-between border-b border-[#F0E6D8] px-[18px] py-[15px]">
                    <span className="text-[14.5px] text-[#94887B]">Fecha de nacimiento</span>
                    <span className="text-[14.5px] font-extrabold text-[#3F362E]">{kid.birthDate}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#F0E6D8] px-[18px] py-[15px]">
                    <span className="text-[14.5px] text-[#94887B]">Sala</span>
                    <span className="text-[14.5px] font-extrabold text-[#3F362E]">{kid.room}</span>
                  </div>
                  <div className="flex justify-between px-[18px] py-[15px]">
                    <span className="text-[14.5px] text-[#94887B]">Ingreso</span>
                    <span className="text-[14.5px] font-extrabold text-[#3F362E]">{kid.joinedAt}</span>
                  </div>
                </div>
              )}
            </div>

            {kid.linkedParents && (
              <div className="flex w-[300px] flex-none flex-col gap-[14px]">
                <a
                  href="#"
                  className="flex w-full items-center justify-center gap-[9px] rounded-[14px] bg-[#3F362E] px-4 py-[13px] text-[15px] font-extrabold text-white"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
                  </svg>
                  Resumen del día
                </a>

                <div className="rounded-[16px] border border-[#ECE0D0] bg-[#FFFDF9] p-[16px_18px]">
                  <div className="mb-[14px] text-[12.5px] font-extrabold tracking-[.8px] text-[#8A7C6D]">
                    PADRES VINCULADOS
                  </div>
                  <div className="flex flex-col gap-[14px]">
                    {kid.linkedParents.map((parent, i) => (
                      <div key={parent.name} className="flex items-center gap-3">
                        <div
                          className="flex h-10 w-10 flex-none items-center justify-center rounded-full font-display text-[16px] font-semibold text-white"
                          style={{ background: parentPalette[i % parentPalette.length] }}
                        >
                          {parent.name.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[14.5px] font-extrabold text-[#3F362E]">{parent.name}</div>
                          <div className="text-[12.5px] text-[#A89A8B]">{parentSubtitle(parent)}</div>
                        </div>
                        <span
                          className="flex-none rounded-full px-[9px] py-1 text-[10.5px] font-extrabold"
                          style={{ background: parentStatus[parent.status].bg, color: parentStatus[parent.status].color }}
                        >
                          {parentStatus[parent.status].label}
                        </span>
                      </div>
                    ))}
                    <LinkParentModal kidName={`${kid.firstName} ${kid.lastName}`} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}