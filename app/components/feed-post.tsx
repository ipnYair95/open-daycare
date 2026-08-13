import type { FeedPost } from "@/app/data/feed";

const badgeByKind: Record<FeedPost["kind"], { label: string; bg: string; dot: string; text: string }> = {
  achievement: { label: "LOGRO", bg: "#CFEBD8", dot: "#3E9B6C", text: "#3E9B6C" },
  activity: { label: "ACTIVIDAD", bg: "#C7E7F1", dot: "#2E89A6", text: "#2E89A6" },
  announcement: { label: "ANUNCIO", bg: "#CCD8F4", dot: "#4E72C8", text: "#4E72C8" },
};

function AnnouncementIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 11 18-5v12L3 14v-3zM11.6 16.8a3 3 0 1 1-5.8-1.6" />
    </svg>
  );
}

function LikeIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="#E0654A" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21.2l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8z" />
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.6-3.6a2 2 0 0 0-2.8 0L6 21" />
    </svg>
  );
}

export default function FeedPost({ post }: { post: FeedPost }) {
  const badge = badgeByKind[post.kind];

  return (
    <div className="rounded-[20px] border border-[#ECE0D0] bg-[#FFFDF9] px-[22px] py-5 shadow-[0_4px_16px_-12px_rgba(120,90,60,.5)]">
      <div className="mb-3.5 flex items-center gap-3">
        {post.kind === "announcement" ? (
          <div className="flex h-[44px] w-[44px] flex-none items-center justify-center rounded-full bg-[#CCD8F4] text-[#4E72C8]">
            <AnnouncementIcon />
          </div>
        ) : (
          <div
            className="flex h-[44px] w-[44px] flex-none items-center justify-center rounded-full font-display text-[17px] font-semibold"
            style={{ backgroundColor: post.authorBg, color: post.authorColor }}
          >
            {post.authorInitial}
          </div>
        )}
        <div className="flex-1">
          <div className="font-display text-[16.5px] font-semibold text-[#3F362E]">{post.authorName}</div>
          <div className="text-[12.5px] text-[#A89A8B]">{post.time}</div>
        </div>
        <div className="flex items-center gap-[7px] rounded-full px-3 py-1.5" style={{ backgroundColor: badge.bg }}>
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: badge.dot }} />
          <span className="text-[12px] font-extrabold tracking-[.5px]" style={{ color: badge.text }}>
            {badge.label}
          </span>
        </div>
      </div>

      <div className="mb-2.5 text-[12.5px] text-[#A89A8B]">{post.audience}</div>
      <p className="m-0 text-[15.5px] leading-[1.55] text-[#4A4038]">{post.body}</p>

      {post.photoLabel && (
        <a href="#" className="mt-3.5 flex h-[200px] flex-col items-center justify-center gap-2 rounded-2xl border-[1.5px] border-dashed border-[#DBCDBA] bg-[#F4ECE1] text-[#B0A290]">
          <CameraIcon />
          <span className="text-[13.5px]">{post.photoLabel}</span>
        </a>
      )}

      <div className="mt-4 flex items-center gap-[18px] border-t border-[#F0E6D8] pt-[14px]">
        <span className="flex items-center gap-[7px] text-[14px] font-bold text-[#E0654A]">
          <LikeIcon />
          {post.likes}
        </span>
        <a href="#" className="flex items-center gap-[7px] text-[14px] font-bold text-[#94887B]">
          <CommentIcon />
          {post.comments}
        </a>
        <span className="flex-1" />
        <a href="#" className="text-[14px] font-extrabold text-[#C5503A]">Editar</a>
      </div>
    </div>
  );
}