import { login } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

/** Best-effort client IP from proxy headers (Render/Cloudflare set x-forwarded-for). */
function clientIp(req: Request): string | null {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") || req.headers.get("cf-connecting-ip") || null;
}

export async function POST(req: Request) {
  const body = (await req.json()) as { username?: string; password?: string };
  const result = await login(body.username ?? "", body.password ?? "", clientIp(req), req.headers.get("user-agent"));
  if (!result.ok) return new Response(result.message, { status: result.status });
  return Response.json(result.session);
}
