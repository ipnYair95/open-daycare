import Sidebar from "@/app/components/sidebar";
import FeedPost from "@/app/components/feed-post";
import { posts } from "@/app/data/feed";

export default function Home() {
  return (
    <div className="flex min-h-screen bg-[#F6ECDF]">
      <Sidebar active="feed" />

      <main className="h-screen flex-1 overflow-y-auto min-w-0">
        <div className="mx-auto w-full max-w-[760px] px-10 pb-20 pt-[34px]">
          <div className="mb-6">
            <div className="mb-1 text-[12.5px] font-extrabold tracking-[.8px] text-[#D9583C]">
              GUARDERÍA · SALA SOLES
            </div>
            <h1 className="m-0 font-display text-[30px] font-semibold text-[#3F362E]">Buenas, Caro</h1>
            <p className="mt-1.5 text-[14.5px] text-[#94887B]">12 niños · martes 17 jun</p>
          </div>

          <a
            href="#"
            className="mb-6 flex items-center gap-[14px] rounded-[18px] border border-[#ECE0D0] bg-[#FFFDF9] px-[18px] py-[14px] shadow-[0_4px_14px_-10px_rgba(120,90,60,.4)]"
          >
            <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-[#F2937A] font-display text-[16px] font-semibold text-white">C</div>
            <span className="flex-1 text-[15px] text-[#A89A8B]">Compartí un momento…</span>
            <span className="flex h-[38px] w-[38px] items-center justify-center rounded-xl bg-[#FBE3D8] text-[#E0654A]">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </span>
          </a>

          <div className="mb-3.5 flex items-center gap-[14px]">
            <span className="text-[12.5px] font-extrabold tracking-[.8px] text-[#8A7C6D]">PUBLICADO HOY</span>
            <span className="h-px flex-1 bg-[#E7DAC8]" />
          </div>

          <div className="flex flex-col gap-4">
            {posts.map((post) => (
              <FeedPost key={post.id} post={post} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}