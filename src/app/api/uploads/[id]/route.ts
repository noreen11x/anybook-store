import { db } from "@/lib/db";

/** Serves uploaded cover images stored in the database. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const up = await db.upload.findUnique({ where: { id } });
  if (!up) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(up.data), {
    headers: {
      "Content-Type": up.mime,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
