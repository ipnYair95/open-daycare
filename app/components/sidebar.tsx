import Link from "next/link";

export type SidebarSection = "feed" | "kids";

const navItems = [
  {
    id: "feed" as const,
    label: "Feed",
    href: "/",
    icon: (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
      </svg>
    ),
  },
  {
    id: "kids" as const,
    label: "Niños",
    href: "/kids",
    icon: (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="7" r="3" />
        <circle cx="17" cy="9" r="2.4" />
        <path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 20a5 5 0 0 1 5.5-4.9" />
      </svg>
    ),
  },
  {
    id: "avisos" as const,
    label: "Avisos",
    href: "#",
    icon: (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" />
      </svg>
    ),
  },
  {
    id: "account" as const,
    label: "Mi cuenta",
    href: "#",
    icon: (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
];

export default function Sidebar({ active }: { active: SidebarSection }) {
  return (
    <aside className="sticky top-0 hidden h-screen w-[248px] flex-none flex-col border-r border-[#ECE0D0] bg-[#FFFDF9] p-4 px-4 py-6 lg:flex">
      <a href="#" className="flex items-center gap-[11px] pb-[22px] pl-2 pr-2 pt-1">
        <div className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-xl bg-[linear-gradient(155deg,#F8C3A8,#F2937A)]">
          <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
          </svg>
        </div>
        <div>
          <div className="font-display text-[17px] font-semibold leading-none text-[#3F362E]">OpenDayCare</div>
          <div className="mt-0.5 text-[11.5px] text-[#A89A8B]">Sala Soles</div>
        </div>
      </a>

      <a
        href="#"
        className="mb-[18px] flex w-full items-center justify-center gap-2 rounded-[14px] bg-[linear-gradient(180deg,#F4977E,#EE8164)] px-4 py-3 font-extrabold text-[14.5px] text-white shadow-[0_8px_18px_-8px_rgba(238,129,100,.75)]"
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
        Nueva publicación
      </a>

      <nav className="flex flex-1 flex-col gap-1">
        {navItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={`flex items-center gap-3 rounded-xl px-3 py-[11px] text-[14.5px] ${
              item.id === active
                ? "bg-[#FBE3D8] font-extrabold text-[#D9583C]"
                : "bg-transparent font-semibold text-[#6E6359]"
            }`}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="mt-[10px] border-t border-[#ECE0D0] pt-[14px]">
        <div className="flex items-center gap-[11px] px-2 py-1.5">
          <div className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-full bg-[#F2937A] font-display text-[16px] font-semibold text-white">C</div>
          <div className="min-w-0 flex-1">
            <div className="text-[14px] font-extrabold text-[#3F362E]">Caro Giménez</div>
            <div className="text-[12px] text-[#A89A8B]">Maestra · Soles</div>
          </div>
          <a href="#" title="Cerrar sesión" className="flex h-8 w-8 flex-none items-center justify-center rounded-[10px] bg-[#F6ECDF] text-[#94887B]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
          </a>
        </div>
      </div>
    </aside>
  );
}