import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "./db";

const COOKIE = "ab_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days
const sha = (t: string) => createHash("sha256").update(t).digest("hex");

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  await db.session.create({ data: { id: sha(token), userId, expiresAt: new Date(Date.now() + MAX_AGE * 1000) } });
  (await cookies()).set(COOKIE, token, {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: MAX_AGE,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await db.session.deleteMany({ where: { id: sha(token) } });
  jar.delete(COOKIE);
}

/** The signed-in user (or null). Cached per request. Blocked users are treated as signed out. */
export const getUser = cache(async () => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const s = await db.session.findUnique({ where: { id: sha(token) }, include: { user: true } });
  if (!s || s.expiresAt < new Date() || s.user.status === "Blocked") return null;
  return s.user;
});

export async function requireUser() {
  const u = await getUser();
  if (!u) throw new Error("Please sign in first.");
  return u;
}

/** Staff and admins may use the store admin. */
export async function requireStaff() {
  const u = await getUser();
  if (!u || u.role === "Customer") throw new Error("Not authorised.");
  return u;
}

export async function requireStaffPage(next = "/admin") {
  const u = await getUser();
  if (!u) redirect(`/account?next=${encodeURIComponent(next)}`);
  if (u.role === "Customer") redirect("/account?denied=1");
  return u;
}
