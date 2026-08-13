export type KidBadge = "peanut" | "lactose" | "link";

export interface Kid {
  id: number;
  slug: string;
  firstName: string;
  lastName: string;
  age: number;
  initial: string;
  avatarBg: string;
  avatarColor: string;
  linkedParentsCount: number;
  badge?: KidBadge;
}

export interface LinkedParent {
  name: string;
  role: string;
  status: "active" | "pending";
}

export interface KidProfile extends Kid {
  room: string;
  birthDate?: string;
  joinedAt?: string;
  allergyNote?: string;
  linkedParents?: LinkedParent[];
}

export const kids: KidProfile[] = [
  {
    id: 1,
    slug: "mateo-fernandez",
    firstName: "Mateo",
    lastName: "Fernández",
    age: 3,
    initial: "M",
    avatarBg: "#A9D9E8",
    avatarColor: "#1F7A93",
    linkedParentsCount: 2,
    badge: "peanut",
    room: "Soles",
    birthDate: "12 mar 2022",
    joinedAt: "feb 2025",
    allergyNote: "Alergia al maní. Evitar frutos secos. Lleva inhalador en la mochila.",
    linkedParents: [
      { name: "Lucía Fernández", role: "Mamá", status: "active" },
      { name: "Diego Fernández", role: "Papá", status: "pending" },
    ],
  },
  {
    id: 2,
    slug: "sofia-mendez",
    firstName: "Sofía",
    lastName: "Méndez",
    age: 2,
    initial: "S",
    avatarBg: "#F4B8CC",
    avatarColor: "#C44A7A",
    linkedParentsCount: 1,
    room: "Soles",
  },
  {
    id: 3,
    slug: "benjamin-ruiz",
    firstName: "Benjamín",
    lastName: "Ruiz",
    age: 3,
    initial: "B",
    avatarBg: "#B9DEC4",
    avatarColor: "#3E8B62",
    linkedParentsCount: 2,
    room: "Soles",
  },
  {
    id: 4,
    slug: "valentina-soto",
    firstName: "Valentina",
    lastName: "Soto",
    age: 2,
    initial: "V",
    avatarBg: "#F4DC8E",
    avatarColor: "#9A7B1E",
    linkedParentsCount: 0,
    badge: "link",
    room: "Soles",
  },
  {
    id: 5,
    slug: "tomas-diaz",
    firstName: "Tomás",
    lastName: "Díaz",
    age: 3,
    initial: "T",
    avatarBg: "#C9B6E8",
    avatarColor: "#7B5FC0",
    linkedParentsCount: 1,
    badge: "lactose",
    room: "Soles",
  },
  {
    id: 6,
    slug: "emma-castro",
    firstName: "Emma",
    lastName: "Castro",
    age: 2,
    initial: "E",
    avatarBg: "#F4B8CC",
    avatarColor: "#C44A7A",
    linkedParentsCount: 1,
    room: "Soles",
  },
  {
    id: 7,
    slug: "lucas-romero",
    firstName: "Lucas",
    lastName: "Romero",
    age: 3,
    initial: "L",
    avatarBg: "#A9D9E8",
    avatarColor: "#1F7A93",
    linkedParentsCount: 1,
    room: "Soles",
  },
  {
    id: 8,
    slug: "olivia-vega",
    firstName: "Olivia",
    lastName: "Vega",
    age: 2,
    initial: "O",
    avatarBg: "#B9DEC4",
    avatarColor: "#3E8B62",
    linkedParentsCount: 1,
    room: "Soles",
  },
];