import Link from "next/link";
import type { Kid, KidBadge } from "@/app/data/kids";

const badgeStyles: Record<KidBadge, { label: string; bg: string; text: string }> = {
  peanut: { label: "MANÍ", bg: "#FBD8CC", text: "#D9684A" },
  lactose: { label: "LACTOSA", bg: "#FBD8CC", text: "#D9684A" },
  link: { label: "VINCULAR", bg: "#F9D2DE", text: "#C56486" },
};

function parentText(count: number) {
  if (count === 0) return "sin padres vinculados";
  if (count === 1) return "1 padre vinculado";
  return `${count} padres vinculados`;
}

export default function KidCard({ kid }: { kid: Kid }) {
  return (
    <Link
      href={`/kids/${kid.slug}`}
      className="flex min-w-0 items-center gap-[14px] rounded-[18px] border border-[#ECE0D0] bg-[#FFFDF9] p-4 shadow-[0_4px_14px_-12px_rgba(120,90,60,.5)] transition duration-150 hover:-translate-y-0.5 hover:border-[#F2A78E]"
    >
      <div
        className="flex h-12 w-12 flex-none items-center justify-center rounded-full font-display text-[19px] font-semibold"
        style={{ background: kid.avatarBg, color: kid.avatarColor }}
      >
        {kid.initial}
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-display text-[16px] font-semibold text-[#3F362E]">
          {kid.firstName} {kid.lastName}
        </div>
        <div className="text-[13px] text-[#A89A8B]">
          {kid.age} años · {parentText(kid.linkedParentsCount)}
        </div>
      </div>
      {kid.badge ? (
        <span
          className="flex-none rounded-full px-[9px] py-[5px] text-[11px] font-extrabold"
          style={{ background: badgeStyles[kid.badge].bg, color: badgeStyles[kid.badge].text }}
        >
          {badgeStyles[kid.badge].label}
        </span>
      ) : (
        <svg className="flex-none" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#CBB89F" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m9 18 6-6-6-6" />
        </svg>
      )}
    </Link>
  );
}