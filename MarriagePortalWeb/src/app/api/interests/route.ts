import { createInterest, getProfile, getProfileOwnerEmail, listInterests, markInterestReminded } from "@/lib/server/queries";
import { sendInterestReminder } from "@/lib/server/notifications";
import { requireAdmin, requireMember } from "@/lib/server/guard";
import type { CreateInterestInput } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  // Admin-only: the interest list carries the sender's name and mobile number.
  // Only the parish office (admin/interests page) reads it; keep it off the public API.
  const g = await requireAdmin();
  if (!g.ok) return g.response;
  return Response.json(await listInterests());
}

export async function POST(req: Request) {
  // The sender is the signed-in member (from the session), so every interest is tied to a real
  // member account and listing, and cannot be sent anonymously or in someone else's name.
  const g = await requireMember();
  if (!g.ok) return g.response;
  const dto = (await req.json()) as CreateInterestInput;
  if (!dto.fromName || !dto.fromName.trim()) return new Response("Your name is required.", { status: 400 });
  if (!dto.fromMobile || !dto.fromMobile.trim()) return new Response("A contact number is required.", { status: 400 });
  try {
    const res = await createInterest(dto, g.memberId);
    if (!res) return new Response("Profile not found.", { status: 404 });
    // Tell the family straight away (a new interest only, not a repeat). Logged in the office's
    // reminder history so they can see the family was told. Never blocks or fails the request.
    if (res.created) {
      try {
        const i = res.interest;
        const [target, to] = await Promise.all([getProfile(i.toProfileId), getProfileOwnerEmail(i.toProfileId)]);
        if (target && to) {
          const enquirer = i.fromProfileId ? await getProfile(i.fromProfileId).catch(() => null) : null;
          if (await sendInterestReminder(i, to, target, enquirer)) {
            await markInterestReminded(i.id, { id: "system", name: "Automatic email (new interest)" }, to);
          }
        }
      } catch (err) {
        console.error("[interests] new-interest email failed:", err);
      }
    }
    return Response.json(res.interest);
  } catch (e) {
    const err = e as Error & { status?: number };
    return new Response(err.message, { status: err.status ?? 500 });
  }
}
