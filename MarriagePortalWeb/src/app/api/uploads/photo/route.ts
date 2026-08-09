import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ALLOWED = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return new Response("Expected a multipart form upload.", { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return new Response("No file was uploaded.", { status: 400 });
  if (file.size > MAX_BYTES) return new Response("Image is too large (max 5 MB).", { status: 400 });
  if (!file.type.toLowerCase().startsWith("image/")) return new Response("Only image files are allowed.", { status: 400 });

  let ext = path.extname(file.name).toLowerCase();
  if (!ALLOWED.has(ext)) ext = ".jpg";

  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  const fileName = `${randomUUID().replace(/-/g, "")}${ext}`;
  await writeFile(path.join(dir, fileName), Buffer.from(await file.arrayBuffer()));

  // Relative URL resolves against the app's own origin.
  return Response.json({ url: `/uploads/${fileName}` });
}
