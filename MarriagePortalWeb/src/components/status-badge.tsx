import { Badge } from "@/components/ui/badge";
import type { ProfileStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const styles: Record<ProfileStatus, string> = {
  Verified: "bg-brand-green/12 text-brand-green border-brand-green/30",
  Active: "bg-brand-green/12 text-brand-green border-brand-green/30",
  Pending: "bg-gold/15 text-[#9a6b00] border-gold/40",
  Suspended: "bg-destructive/10 text-destructive border-destructive/30",
  Rejected: "bg-destructive/10 text-destructive border-destructive/30",
};

const labels: Record<ProfileStatus, string> = {
  Verified: "✓ Verified",
  Active: "● Active",
  Pending: "Pending",
  Suspended: "Suspended",
  Rejected: "✕ Rejected",
};

export function StatusBadge({ status }: { status: ProfileStatus }) {
  return (
    <Badge variant="outline" className={cn("font-semibold", styles[status])}>
      {labels[status]}
    </Badge>
  );
}
