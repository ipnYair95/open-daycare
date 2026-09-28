import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import LinkParentModal from "@/app/components/link-parent-modal";
import Sidebar from "@/app/components/sidebar";
import { createClient } from "@/utils/supabase/server";
import {
  kids,
  formatBirthDateLabel,
  formatEnrolledLabel,
  toDisplay,
  type LinkedParent,
} from "@/app/data/kids";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface ProfileView {
  firstName: string;
  lastName: string;
  age: number;
  initial: string;
  avatarBg: string;
  avatarColor: string;
  room: string;
  birthDateLabel?: string;
  enrolledLabel?: string;
  allergyNote?: string;
  linkedParents?: LinkedParent[];
}

export function generateStaticParams() {
  return kids.map((kid) => ({ slug: kid.slug }));
}

export function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  return params.then(async ({ slug }) => {
    if (UUID_PATTERN.test(slug)) {
      const supabase = createClient(await cookies());
      const { data } = await supabase
        .from("children")
        .select("full_name")
        .eq("id", slug)
        .single();
      const fullName = (data as { full_name?: string } | null)?.full_name;
      return { title: fullName ? `${fullName} · OpenDayCare` : "Niño · OpenDayCare" };
    }
    const kid = kids.find((k) => k.slug === slug);
    return { title: kid ? `${kid.firstName} ${kid.lastName} · OpenDayCare` : "Niño · OpenDayCare" };
  });
}

const parentPalette = ["#C9B6E8", "#A9C7E8", "#F4B8CC", "#B9DEC4", "#A9D9E8", "#F4DC8E"];

// Etiquetas UI del enum public.relationship_type.
const relationshipLabels: Record<string, string> = {
  mother: "Mamá",
  father: "Papá",
  guardian: "Tutor/a",
};

const parentStatus = {
  active: { label: "ACTIVA", bg: "#CFEBD8", color: "#3E9B6C" },
  pending: { label: "PENDIENTE", bg: "#F7E7A6", color: "#9A7B1E" },
} as const;

function parentSubtitle(parent: LinkedParent) {
  return parent.status === "active" ? `${parent.role} · activa` : `${parent.role} · invitación enviada`;
}

async function loadProfile(slug: string): Promise<ProfileView | null> {
  if (UUID_PATTERN.test(slug)) {
    const supabase = createClient(await cookies());
    const { data } = await supabase
      .from("children")
      .select("id, room_id, full_name, birth_date, enrolled_at, medical_notes, allergy_tags, rooms ( name )")
      .eq("id", slug)
      .single();
    if (!data) {
      return null;
    }
    const row = data as {
      id: string;
      room_id: string | null;
      full_name: string;
      birth_date: string;
      enrolled_at: string | null;
      medical_notes: string | null;
      allergy_tags: string[] | null;
      rooms: { name: string } | { name: string }[] | null;
    };
    const tags = row.allergy_tags ?? [];
    const roomName = Array.isArray(row.rooms) ? row.rooms[0]?.name : row.rooms?.name;
    const display = toDisplay({
      id: row.id,
      room_id: row.room_id,
      full_name: row.full_name,
      birth_date: row.birth_date,
      allergy_tags: tags,
    });
    // Vínculos reales: padres activos + invitaciones pendientes vigentes.
    const [{ data: links }, { data: pending }] = await Promise.all([
      supabase
        .from("parent_children")
        .select("relationship, parent:users!parent_children_parent_id_fkey(full_name)")
        .eq("child_id", slug),
      supabase
        .from("invitations")
        .select("full_name, relationship")
        .eq("child_id", slug)
        .eq("status", "pending")
        .gt("expires_at", new Date().toISOString()),
    ]);
    const activeParents = ((links ?? []) as {
      relationship: string;
      parent: { full_name: string } | { full_name: string }[] | null;
    }[]).map((link) => {
      const parent = Array.isArray(link.parent) ? link.parent[0] : link.parent;
      return {
        name: parent?.full_name ?? "Padre/madre",
        role: relationshipLabels[link.relationship] ?? link.relationship,
        status: "active" as const,
      };
    });
    const pendingParents = ((pending ?? []) as {
      full_name: string;
      relationship: string;
    }[]).map((invitation) => ({
      name: invitation.full_name,
      role: relationshipLabels[invitation.relationship] ?? invitation.relationship,
      status: "pending" as const,
    }));
    return {
      ...display,
      room: roomName ?? "Sin sala",
      birthDateLabel: formatBirthDateLabel(row.birth_date),
      enrolledLabel: row.enrolled_at ? formatEnrolledLabel(row.enrolled_at) : undefined,
      allergyNote:
        [
          row.medical_notes?.trim(),
          tags.length > 0 ? `Etiquetas: ${tags.join(", ").toUpperCase()}` : undefined,
        ]
          .filter(Boolean)
          .join("\n") || undefined,
      linkedParents: [...activeParents, ...pendingParents],
    };
  }
  const kid = kids.find((k) => k.slug === slug);
  if (!kid) {
    return null;
  }
  return {
    firstName: kid.firstName,
    lastName: kid.lastName,
    age: kid.age,
    initial: kid.initial,
    avatarBg: kid.avatarBg,
    avatarColor: kid.avatarColor,
    room: kid.room,
    birthDateLabel: kid.birthDate,
    enrolledLabel: kid.joinedAt,
    allergyNote: kid.allergyNote,
    linkedParents: kid.linkedParents ?? [],
  };
}

export default async function KidProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const view = await loadProfile(slug);
  if (!view) notFound();

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
                  style={{ background: view.avatarBg, color: view.avatarColor }}
                >
                  {view.initial}
                </div>
                <div className="flex-1">
                  <h1 className="m-0 font-display text-[28px] font-semibold text-[#3F362E]">
                    {view.firstName} {view.lastName}
                  </h1>
                  <p className="m-0 mt-[3px] text-[15px] text-[#94887B]">
                    {view.age} años · Sala {view.room}
                  </p>
                </div>
                <a
                  href="#"
                  className="rounded-xl border-[1.5px] border-[#ECE0D0] bg-[#FFFDF9] px-4 py-[9px] text-[14px] font-bold text-[#6E6359]"
                >
                  Editar
                </a>
              </div>

              {view.allergyNote && (
                <div className="flex gap-[14px] rounded-[16px] bg-[#FBDAD6] p-[16px_18px]">
                  <div className="flex h-10 w-10 flex-none items-center justify-center rounded-[11px] bg-[#F4A8A0]">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
                      <path d="M12 9v4M12 17h.01" />
                    </svg>
                  </div>
                  <div>
                    <div className="mb-0.5 text-[15px] font-extrabold text-[#C5413A]">Alergias y notas</div>
                    <div className="whitespace-pre-line text-[14.5px] leading-normal text-[#B25249]">{view.allergyNote}</div>
                  </div>
                </div>
              )}

              {view.birthDateLabel && (
                <div className="overflow-hidden rounded-[16px] border border-[#ECE0D0] bg-[#FFFDF9]">
                  <div className="flex justify-between border-b border-[#F0E6D8] px-[18px] py-[15px]">
                    <span className="text-[14.5px] text-[#94887B]">Fecha de nacimiento</span>
                    <span className="text-[14.5px] font-extrabold text-[#3F362E]">{view.birthDateLabel}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#F0E6D8] px-[18px] py-[15px]">
                    <span className="text-[14.5px] text-[#94887B]">Sala</span>
                    <span className="text-[14.5px] font-extrabold text-[#3F362E]">{view.room}</span>
                  </div>
                  <div className="flex justify-between px-[18px] py-[15px]">
                    <span className="text-[14.5px] text-[#94887B]">Ingreso</span>
                    <span className="text-[14.5px] font-extrabold text-[#3F362E]">{view.enrolledLabel}</span>
                  </div>
                </div>
              )}
            </div>

            {view.linkedParents && (
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
                    {view.linkedParents.map((parent, i) => (
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
                    <LinkParentModal kidName={`${view.firstName} ${view.lastName}`} childId={UUID_PATTERN.test(slug) ? slug : null} />
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
