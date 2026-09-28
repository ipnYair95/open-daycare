import { cookies } from "next/headers";
import Sidebar from "@/app/components/sidebar";
import KidCard from "@/app/components/kid-card";
import AddKidModal from "@/app/components/add-kid-modal";
import { createClient } from "@/utils/supabase/server";
import { toDisplay, type ChildRow } from "@/app/data/kids";

interface RoomRow {
  id: string;
  name: string;
}

export default async function KidsPage() {
  const supabase = createClient(await cookies());
  const { data: roomsData } = await supabase.from("rooms").select("id, name").order("name");
  const { data: childrenData } = await supabase
    .from("children")
    .select("id, room_id, full_name, birth_date, allergy_tags")
    .order("full_name");
  const roomList: RoomRow[] = roomsData ?? [];
  const childList: ChildRow[] = childrenData ?? [];
  const unassigned = childList.filter((child) => !child.room_id);

  return (
    <div className="flex min-h-screen bg-[#F6ECDF]">
      <Sidebar active="kids" />

      <main className="h-screen min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[880px] px-10 pb-20 pt-[34px]">
          <div className="mb-[22px] flex items-end justify-between gap-4">
            <div>
              <div className="mb-1 text-[12.5px] font-extrabold tracking-[.8px] text-[#D9583C]">GESTIÓN</div>
              <h1 className="m-0 font-display text-[30px] font-semibold text-[#3F362E]">Niños</h1>
            </div>
            <AddKidModal rooms={roomList} />
          </div>

          <div className="mb-[22px] flex items-center gap-[11px] rounded-[14px] border border-[#ECE0D0] bg-[#FFFDF9] px-4 py-3">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#B0A290" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              placeholder="Buscar niño…"
              className="flex-1 border-none bg-transparent text-[15px] text-[#3F362E]"
            />
          </div>

          <div className="flex flex-col gap-[26px]">
            {roomList.map((room) => {
              const roomKids = childList
                .filter((child) => child.room_id === room.id)
                .map(toDisplay);
              return (
                <section key={room.id}>
                  <div className="mb-[14px] flex items-center gap-3">
                    <span className="text-[12.5px] font-extrabold tracking-[.8px] text-[#3F362E]">SALA {room.name.toUpperCase()}</span>
                    <span className="text-[13px] text-[#A89A8B]">{roomKids.length} niños</span>
                    <span className="h-px flex-1 bg-[#E7DAC8]" />
                  </div>

                  <div className="grid grid-cols-2 gap-[14px]">
                    {roomKids.map((kid) => (
                      <KidCard key={kid.id} kid={kid} />
                    ))}
                  </div>
                </section>
              );
            })}

            {unassigned.length > 0 && (
              <section>
                <div className="mb-[14px] flex items-center gap-3">
                  <span className="text-[12.5px] font-extrabold tracking-[.8px] text-[#3F362E]">SIN SALA</span>
                  <span className="text-[13px] text-[#A89A8B]">{unassigned.length} niños</span>
                  <span className="h-px flex-1 bg-[#E7DAC8]" />
                </div>

                <div className="grid grid-cols-2 gap-[14px]">
                  {unassigned.map(toDisplay).map((kid) => (
                    <KidCard key={kid.id} kid={kid} />
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
