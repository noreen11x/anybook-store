/* Seeds the database with the handoff's sample catalogue plus ~60 days of sample orders.
   Run: npm run db:seed   (WIPES existing data in the target database) */
import { PrismaClient, Condition, OrderStatus } from "@prisma/client";
import {
  CITIES, REVIEW_POOL, SEED_BOOKS, SEED_COLLECTIONS, SEED_PROMOS, SEED_REVIEWS, SEED_SETTINGS, SEED_USERS,
} from "../src/lib/data";
import { hashPassword } from "../src/lib/password";

const db = new PrismaClient();

let seed = 20261117;
const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
const pick = <T,>(a: T[]) => a[Math.floor(rnd() * a.length)];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const parseJoined = (s: string) => {
  const [m, y] = s.split(" ");
  return new Date(+y, MONTHS.indexOf(m), 10);
};

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD in .env before seeding.");

  console.log("Clearing existing data…");
  await db.$transaction([
    db.orderLine.deleteMany(), db.order.deleteMany(), db.review.deleteMany(), db.collectionBook.deleteMany(),
    db.collection.deleteMany(), db.session.deleteMany(), db.user.deleteMany(), db.book.deleteMany(),
    db.promoCode.deleteMany(), db.settings.deleteMany(), db.subscriber.deleteMany(), db.upload.deleteMany(),
  ]);

  const s = SEED_SETTINGS;
  await db.settings.create({
    data: {
      id: 1, storeName: s.storeName, email: s.email, phone: s.phone, address: s.address, std: s.std, exp: s.exp,
      freeOver: s.freeOver, lowAt: s.lowAt, payCard: s.payments.card, payCod: s.payments.cod, payWallet: s.payments.wallet,
    },
  });

  const now = new Date();
  await db.book.createMany({
    data: SEED_BOOKS.map((b, i) => ({ ...b, createdAt: new Date(now.getTime() - (SEED_BOOKS.length - i) * 86400000 * 7) })),
  });

  for (const c of SEED_COLLECTIONS) {
    await db.collection.create({
      data: {
        id: c.id, name: c.name, description: c.description, status: c.status, showOnHome: c.showOnHome,
        books: { create: c.bookIds.map((bookId, position) => ({ bookId, position })) },
      },
    });
  }

  const adminHash = await hashPassword(adminPassword);
  for (const u of SEED_USERS) {
    const isOwner = u.role === "Admin";
    await db.user.create({
      data: {
        id: u.id, name: u.name, email: isOwner ? adminEmail.toLowerCase() : u.email, role: u.role, status: u.status,
        city: u.city, createdAt: parseJoined(u.joined), passwordHash: isOwner ? adminHash : null,
        ...(isOwner ? { phone: "+20 100 123 4567", street: "14 Shagaret El Dor St., Zamalek", zip: "11211" } : {}),
      },
    });
  }

  await db.promoCode.createMany({ data: SEED_PROMOS.map((p) => ({ code: p.code, type: p.type, value: p.value, uses: p.uses, active: p.active })) });

  // Reviews: moderation queue from the prototype + a few published reviews per book.
  const ago = (d: number) => new Date(now.getTime() - d * 86400000);
  const queueAge: Record<string, number> = { Today: 0, Yesterday: 1, "3 days ago": 3, "4 days ago": 4 };
  await db.review.createMany({
    data: SEED_REVIEWS.map((r) => ({ bookId: r.bookId, author: r.author, stars: r.stars, text: r.text, status: r.status, createdAt: ago(queueAge[r.date] ?? 2) })),
  });
  await db.review.createMany({
    data: SEED_BOOKS.flatMap((b, i) =>
      [0, 1, 2].map((j) => {
        const p = REVIEW_POOL[(i + j) % REVIEW_POOL.length];
        return {
          bookId: b.id, author: p.who, text: p.txt, stars: j === 1 ? 4 : 5, status: "Published" as const,
          copy: j === 2 ? "Bought used" : "Verified purchase", createdAt: ago([21, 60, 150][j] + i),
        };
      }),
    ),
  });

  // Sample orders over the last 60 days (newest ones still to fulfil).
  const customers = SEED_USERS.filter((u) => u.role === "Customer" || u.role === "Admin");
  const N = 170;
  for (let k = 0; k < N; k++) {
    const daysAgo = Math.floor((1 - k / N) * 60 + rnd() * 1.5);
    const created = new Date(now.getTime() - daysAgo * 86400000 - Math.floor(rnd() * 10) * 3600000);
    const u = pick(customers);
    const nLines = 1 + Math.floor(rnd() * 3);
    const lines = Array.from({ length: nLines }, () => {
      const b = pick(SEED_BOOKS);
      const cond: Condition = rnd() < 0.62 ? "new" : rnd() < 0.6 ? "vg" : "good";
      const unit = cond === "new" ? b.priceNew : cond === "vg" ? b.priceVG : b.priceGood;
      return { bookId: b.id, title: b.title, author: b.author, cond, qty: rnd() < 0.85 ? 1 : 2, unit };
    });
    const subtotal = lines.reduce((t, l) => t + l.unit * l.qty, 0);
    const discount = rnd() < 0.12 ? Math.round(subtotal * 0.1) : 0;
    const ship = rnd() < 0.2 ? "exp" : "std";
    const shipping = ship === "exp" ? s.exp : subtotal - discount >= s.freeOver ? 0 : s.std;
    const status: OrderStatus =
      daysAgo <= 1 ? "Processing" : daysAgo <= 4 ? (rnd() < 0.6 ? "Shipped" : "Processing") : rnd() < 0.04 ? "Cancelled" : "Delivered";
    await db.order.create({
      data: {
        no: `AB-${20001 + k}`, createdAt: created, userId: u.id, customerName: u.name,
        customerEmail: u.role === "Admin" ? adminEmail.toLowerCase() : u.email, phone: "+20 100 000 0000",
        street: "—", city: u.city || pick(CITIES), zip: "", shipMethod: ship, payment: pick(["card", "card", "cod", "wallet"]),
        subtotal, discount, shipping, total: subtotal - discount + shipping, promoCode: discount ? "READ10" : null, status,
        lines: { create: lines },
      },
    });
  }

  const counts = await Promise.all([db.book.count(), db.order.count(), db.user.count(), db.review.count()]);
  console.log(`Seeded ${counts[0]} books, ${counts[1]} orders, ${counts[2]} users, ${counts[3]} reviews.`);
  console.log(`Store owner: ${adminEmail} (password is ADMIN_PASSWORD in .env)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
