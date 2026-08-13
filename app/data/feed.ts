export type PostKind = "achievement" | "activity" | "announcement";

export interface FeedPost {
  id: number;
  kind: PostKind;
  authorInitial: string;
  authorBg: string;
  authorColor: string;
  authorName: string;
  time: string;
  audience: string;
  body: string;
  likes: number;
  comments: number;
  photoLabel?: string;
}

export const posts: FeedPost[] = [
  {
    id: 1,
    kind: "achievement",
    authorInitial: "M",
    authorBg: "#A9D9E8",
    authorColor: "#1F7A93",
    authorName: "Mateo",
    time: "14:20 · publicado por vos",
    audience: "Para: familia de Mateo",
    body: "¡Usó el orinal solito por primera vez! Estaba feliz de contárselo a todos. Un gran paso.",
    likes: 3,
    comments: 1,
  },
  {
    id: 2,
    kind: "activity",
    authorInitial: "M",
    authorBg: "#A9D9E8",
    authorColor: "#1F7A93",
    authorName: "Mateo",
    time: "09:40 · publicado por vos",
    audience: "Para: familia de Mateo",
    body: "Pintamos con témperas esta mañana. Mateo eligió el azul para todo y se concentró un montón mezclando colores.",
    likes: 5,
    comments: 2,
    photoLabel: "Foto · pintando con témperas",
  },
  {
    id: 3,
    kind: "announcement",
    authorInitial: "",
    authorBg: "#CCD8F4",
    authorColor: "#4E72C8",
    authorName: "Anuncio general",
    time: "07:50 · publicado por vos",
    audience: "Para: toda la sala",
    body: "El viernes salimos al parque por la mañana. Recuerden mandar gorra y una botellita de agua.",
    likes: 8,
    comments: 0,
  },
];