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

// Niño real de Supabase (SPEC 10). El listado /kids y el perfil usan este tipo;
// el arreglo estático `kids` solo alimenta el fallback del perfil y compose hasta sus specs.
export interface ChildDisplay extends Omit<Kid, "id"> {
  id: string;
}

// Fila de public.children tal como la lee la UI.
export interface ChildRow {
  id: string;
  room_id: string | null;
  full_name: string;
  birth_date: string;
  allergy_tags: string[] | null;
}

const avatarPairs = [
  { bg: "#A9D9E8", color: "#1F7A93" },
  { bg: "#F4B8CC", color: "#C44A7A" },
  { bg: "#B9DEC4", color: "#3E8B62" },
  { bg: "#F4DC8E", color: "#9A7B1E" },
  { bg: "#C9B6E8", color: "#7B5FC0" },
];

const MONTHS_SHORT = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

export function ageFromBirthDate(birthDate: string) {
  const birth = new Date(birthDate);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const hadBirthday =
    now.getMonth() > birth.getMonth() ||
    (now.getMonth() === birth.getMonth() && now.getDate() >= birth.getDate());
  if (!hadBirthday) {
    age -= 1;
  }
  return Math.max(age, 0);
}

// Fecha de BD (yyyy-mm-dd) a etiqueta visible ("12 mar 2022").
export function formatBirthDateLabel(isoDate: string) {
  const [year, month, day] = isoDate.split("-").map(Number);
  return `${day} ${MONTHS_SHORT[month - 1]} ${year}`;
}

// Fecha de BD (yyyy-mm-dd) a etiqueta de ingreso ("feb 2025").
export function formatEnrolledLabel(isoDate: string) {
  const [year, month] = isoDate.split("-").map(Number);
  return `${MONTHS_SHORT[month - 1]} ${year}`;
}

export function toDisplay(row: ChildRow): ChildDisplay {
  const parts = row.full_name.trim().split(/\s+/);
  const firstName = parts[0] || row.full_name;
  const tags = row.allergy_tags ?? [];
  const hash = [...row.full_name].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  const avatar = avatarPairs[hash % avatarPairs.length];
  const display: ChildDisplay = {
    id: row.id,
    slug: row.id,
    firstName,
    lastName: parts.slice(1).join(" "),
    age: ageFromBirthDate(row.birth_date),
    initial: (firstName.charAt(0) || "?").toUpperCase(),
    avatarBg: avatar.bg,
    avatarColor: avatar.color,
    linkedParentsCount: 0,
  };
  if (tags.includes("peanut")) {
    display.badge = "peanut";
  } else if (tags.includes("lactose")) {
    display.badge = "lactose";
  }
  return display;
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