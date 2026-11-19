// Seed data + types. Mirrors the prototype's logic block (Bookstore.dc.html).
// Sample data is placeholder — swap for a real backend (Postgres/Prisma, Shopify, Medusa…).

export type Condition = "new" | "vg" | "good";
export type BookStatus = "Published" | "Draft";

export interface Book {
  id: string;
  title: string;
  author: string;
  category: string;
  isbn: string;
  year: number;
  pages: number;
  description: string;
  priceNew: number;
  priceVG: number;
  priceGood: number;
  stockNew: number;
  stockVG: number;
  stockGood: number;
  coverImageUrl: string | null;
  coverTone: number;
  status: BookStatus;
  rating: number;
  reviewCount: number;
}

export interface Collection {
  id: string;
  name: string;
  description: string;
  bookIds: string[];
  status: "Live" | "Hidden";
  showOnHome: boolean;
}

export type OrderStatus = "Processing" | "Shipped" | "Delivered" | "Cancelled";
export interface OrderLine { bookId: string | null; title: string; cond: Condition; qty: number; unit: number }
export interface Order {
  no: string;
  createdAt: string; // ISO
  date: string; // "15 Nov 2026"
  userId: string | null;
  customer: string;
  email: string;
  items: number;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  payment: string; // label
  shipMethod: string;
  status: OrderStatus;
  lines: OrderLine[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  city: string;
  joined: string;
  role: "Customer" | "Staff" | "Admin";
  status: "Active" | "Blocked";
  orders: number;
  spent: number;
}

export interface PromoCode { code: string; type: "pct" | "abs"; value: number; uses: number; active: boolean }

export interface Review {
  id: string;
  bookId: string;
  author: string;
  stars: number;
  text: string;
  date: string;
  status: "Pending" | "Published" | "Hidden";
  copy?: string;
  createdAt?: string;
}

export interface Settings {
  storeName: string;
  email: string;
  phone: string;
  address: string;
  std: number;
  exp: number;
  freeOver: number;
  lowAt: number;
  payments: { card: boolean; cod: boolean; wallet: boolean };
}

export interface CartLine { key: string; bookId: string; cond: Condition; qty: number }

export interface Profile { name: string; phone: string; email: string; street: string; city: string; zip: string }

/** The signed-in shopper, as exposed to the browser. */
export interface Me extends Profile { id: string; role: "Customer" | "Staff" | "Admin" }

/** Cloth-colour pairs [background, ink] for typographic covers. */
export const TONES: [string, string][] = [
  ["var(--color-accent-200)", "var(--color-accent-900)"],
  ["var(--color-neutral-800)", "var(--color-accent-300)"],
  ["var(--color-neutral-200)", "var(--color-neutral-900)"],
  ["var(--color-accent-700)", "var(--color-accent-100)"],
  ["var(--color-neutral-900)", "var(--color-neutral-200)"],
  ["var(--color-accent-100)", "var(--color-accent-800)"],
];

export const CONDS: { k: Condition; label: string; note: string }[] = [
  { k: "new", label: "New", note: "Brand-new copy, shipped in protective wrap." },
  { k: "vg", label: "Used · Very good", note: "Minimal wear. Clean pages, intact spine, no markings." },
  { k: "good", label: "Used · Good", note: "Visible wear to cover or edges. Text complete and fully readable." },
];

export const CATS = ["Fiction", "History", "Philosophy", "Poetry", "Art & Design", "Science", "Arabic Literature", "Children's"];
export const CITIES = ["Cairo", "Giza", "Alexandria", "Mansoura", "Luxor", "Aswan"];

export const round5 = (n: number) => Math.round(n / 5) * 5;

type Raw = [string, string, string, string, number, number, number, number, number, number, [number, number], string];
const RAW: Raw[] = [
  ["b1", "The Quiet Archive", "Helena Marsh", "Fiction", 420, 4.6, 212, 2025, 384, 0, [2, 1], "A conservator in Alexandria finds a letter folded inside a ledger that should not exist, and begins to read the city backwards. A patient, intricate novel about what we keep and why."],
  ["b2", "Salt & Cedar", "Karim Haddad", "Arabic Literature", 360, 4.8, 540, 2024, 296, 3, [3, 2], "Three generations of a Beirut family, told through the recipes they refused to write down. Translated from the Arabic with an afterword by the author."],
  ["b3", "A Short History of Ink", "Margaret Lowell", "History", 510, 4.4, 98, 2023, 448, 1, [1, 0], "From oak-gall to toner: how the stuff we write with shaped what we were able to say. Illustrated with forty manuscript details."],
  ["b4", "On Slowness", "Tomas Reyes", "Philosophy", 290, 4.3, 176, 2022, 212, 4, [4, 3], "Twelve essays arguing that attention, not time, is the thing we are always running out of — and that it can be won back."],
  ["b5", "Lanterns at Low Tide", "Amira Soliman", "Poetry", 240, 4.9, 87, 2025, 128, 2, [0, 0], "A debut collection of poems about the Nile delta, written in the hour between the fishing boats leaving and the light arriving."],
  ["b6", "The Grammar of Rooms", "Julien Faure", "Art & Design", 780, 4.5, 64, 2024, 320, 5, [1, 0], "A tour of twenty interiors and the quiet decisions that make a space feel inhabited. Clothbound, with tipped-in plates."],
  ["b7", "Small Gods of the Cell", "Priya Natarajan", "Science", 450, 4.7, 301, 2025, 352, 1, [0, 2], "An unhurried, witty guide to the molecular machinery running inside every living thing, for readers who left biology at school."],
  ["b8", "The Fox Who Kept Time", "Laila Mansour", "Children's", 190, 4.8, 420, 2023, 48, 0, [2, 4], "A clockmaker's fox learns why the town's bells ring a minute late. A picture book for ages 5 to 8."],
  ["b9", "Winter in the Library", "Helena Marsh", "Fiction", 380, 4.2, 133, 2021, 402, 4, [5, 3], "Snowed into a college library for a week, five strangers discover the catalogue has been lying to them for a century."],
  ["b10", "The Cartographer's Daughter", "Yasmin El-Sayed", "Fiction", 440, 4.6, 256, 2025, 368, 3, [0, 1], "In 1920s Cairo, a young woman inherits her father's unfinished map of the city — and the enemies who wanted it unfinished."],
  ["b11", "Empires of Paper", "Daniel Okafor", "History", 560, 4.5, 142, 2024, 512, 2, [2, 1], "How bureaucracies, from Pharaonic scribes to colonial clerks, held empires together one form at a time."],
  ["b12", "Letters to a Young Reader", "Tomas Reyes", "Philosophy", 270, 4.7, 188, 2022, 176, 5, [3, 2], "Short letters on why we read, how to choose, and what to do when a book defeats you."],
];
const STOCK_NEW = [12, 8, 2, 15, 3, 6, 9, 20, 4, 11, 7, 10];

export const SEED_BOOKS: Book[] = RAW.map(([id, title, author, category, p, rating, reviewCount, year, pages, tone, u, description], i) => ({
  id, title, author, category, year, pages, description, rating, reviewCount,
  priceNew: p, priceVG: round5(p * 0.6), priceGood: round5(p * 0.45),
  stockNew: STOCK_NEW[i], stockVG: u[0], stockGood: u[1],
  isbn: `978-1-${84000 + i * 317}-${10 + i}-${i % 9}`,
  coverImageUrl: null, coverTone: tone, status: "Published",
}));

export const BIOS: Record<string, string> = {
  "Helena Marsh": "Helena Marsh spent fifteen years as an archivist before turning to fiction. Her slow, intricate mysteries are about the secret lives of objects. She lives between Alexandria and Edinburgh.",
  "Karim Haddad": "Karim Haddad is a Lebanese novelist and food writer. Salt & Cedar won the 2024 Naguib Mahfouz Medal and has been translated into eleven languages.",
  "Margaret Lowell": "Margaret Lowell is a historian of the book at the University of Leeds and a former conservator at the British Library.",
  "Tomas Reyes": "Tomas Reyes writes essays on attention, reading and the ethics of everyday life. He teaches philosophy in Seville.",
  "Amira Soliman": "Amira Soliman is a poet from Damietta. Lanterns at Low Tide is her first collection.",
  "Julien Faure": "Julien Faure is an interior architect based in Lyon whose work has been exhibited across Europe.",
  "Priya Natarajan": "Priya Natarajan is a cell biologist and science writer whose columns appear in several international magazines.",
  "Laila Mansour": "Laila Mansour writes and illustrates picture books from her studio in Heliopolis.",
  "Yasmin El-Sayed": "Yasmin El-Sayed is a Cairo-born novelist and screenwriter. This is her third novel.",
  "Daniel Okafor": "Daniel Okafor is a historian of administration and empire at SOAS, London.",
};

/** Seeded reviews shown alongside published customer reviews. */
export const REVIEW_POOL = [
  { who: "Nour A.", txt: "Read it in two long evenings and immediately wanted to start again. The kind of book you press on friends." },
  { who: "Omar K.", txt: "Beautifully written, if slow in the middle third. The ending earns everything." },
  { who: "Sara M.", txt: "Bought the Very good copy — arrived exactly as described, barely a crease. Lovely read." },
  { who: "Youssef H.", txt: "Thoughtful and precise. Not a page wasted. I underlined half of it." },
  { who: "Mariam F.", txt: "A gift for my mother, who has now lent it to three people. High praise in our house." },
];

export const SEED_COLLECTIONS: Collection[] = [
  { id: "c1", name: "Staff picks", description: "The books our booksellers keep pressing into customers’ hands this month.", bookIds: ["b2", "b5", "b7", "b12"], status: "Live", showOnHome: true },
  { id: "c2", name: "Cairo stories", description: "Novels and histories set in and around the city.", bookIds: ["b10", "b1", "b11"], status: "Live", showOnHome: false },
  { id: "c3", name: "Under EGP 300", description: "Good books, small prices.", bookIds: ["b4", "b5", "b8", "b12"], status: "Hidden", showOnHome: false },
];

export const SEED_USERS: User[] = ([
  ["u1", "Nour Adel", "nour@example.com", "Cairo", "Mar 2026", "Admin", "Active", 2, 1540],
  ["u2", "Hana Saleh", "hana.s@example.com", "Giza", "Jan 2026", "Customer", "Active", 4, 2310],
  ["u3", "Omar Khalil", "omar.k@example.com", "Alexandria", "Aug 2025", "Customer", "Active", 9, 5420],
  ["u4", "Sara Mostafa", "sara.m@example.com", "Cairo", "May 2026", "Customer", "Active", 2, 640],
  ["u5", "Youssef Hamdy", "youssef@anybook.eg", "Cairo", "Feb 2025", "Staff", "Active", 0, 0],
  ["u6", "Mariam Fouad", "mariam.f@example.com", "Mansoura", "Oct 2025", "Customer", "Active", 6, 3180],
  ["u7", "Ahmed Tarek", "ahmed.t@example.com", "Luxor", "Jul 2026", "Customer", "Blocked", 1, 190],
  ["u8", "Laila Nabil", "laila.n@example.com", "Cairo", "Sep 2026", "Customer", "Active", 1, 450],
] as const).map(([id, name, email, city, joined, role, status, orders, spent]) => ({ id, name, email, city, joined, role, status, orders, spent }));

export const SEED_PROMOS: PromoCode[] = [
  { code: "READ10", type: "pct", value: 10, uses: 34, active: true },
  { code: "WELCOME50", type: "abs", value: 50, uses: 112, active: true },
  { code: "SUMMER25", type: "pct", value: 25, uses: 208, active: false },
];

export const SEED_REVIEWS: Review[] = [
  { id: "r1", bookId: "b10", author: "Dina R.", text: "Couldn’t put it down. The map chapters are extraordinary.", stars: 5, date: "Today", status: "Pending" },
  { id: "r2", bookId: "b6", author: "Karim S.", text: "Gorgeous photographs, though the text is thinner than I hoped.", stars: 3, date: "Yesterday", status: "Pending" },
  { id: "r3", bookId: "b2", author: "Hana S.", text: "My favourite book this year. The recipes made me cry.", stars: 5, date: "3 days ago", status: "Published" },
  { id: "r4", bookId: "b4", author: "Anonymous", text: "Buy cheap followers at …", stars: 1, date: "4 days ago", status: "Hidden" },
];

export const SEED_SETTINGS: Settings = {
  storeName: "AnyBook", email: "hello@anybook.eg", phone: "+20 2 2735 0000", address: "26 July St., Zamalek, Cairo",
  std: 60, exp: 120, freeOver: 1000, lowAt: 3, payments: { card: true, cod: true, wallet: true },
};

export const SEED_PROFILE: Profile = {
  name: "Nour Adel", phone: "+20 100 123 4567", email: "nour@example.com",
  street: "14 Shagaret El Dor St., Zamalek", city: "Cairo", zip: "11211",
};

export const PAY_NAMES = { card: "Credit / debit card", cod: "Cash on delivery", wallet: "Mobile wallet" } as const;
export type PayMethod = keyof typeof PAY_NAMES;
export type ShipMethod = "std" | "exp";
