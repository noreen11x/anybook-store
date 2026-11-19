import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;

/** scrypt hash, stored as `scrypt$<salt b64>$<hash b64>`. */
export async function hashPassword(pw: string) {
  const salt = randomBytes(16);
  const hash = await scrypt(pw, salt, 64);
  return `scrypt$${salt.toString("base64")}$${hash.toString("base64")}`;
}

export async function verifyPassword(pw: string, stored: string | null | undefined) {
  if (!stored) return false;
  const [algo, s, h] = stored.split("$");
  if (algo !== "scrypt" || !s || !h) return false;
  const expected = Buffer.from(h, "base64");
  const actual = await scrypt(pw, Buffer.from(s, "base64"), expected.length);
  return timingSafeEqual(actual, expected);
}
