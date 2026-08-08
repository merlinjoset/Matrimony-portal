import { listLoginLogs } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(await listLoginLogs(200));
}
