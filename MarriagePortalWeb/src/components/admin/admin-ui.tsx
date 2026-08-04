import { cn } from "@/lib/utils";

export function AdminHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="sticky top-0 z-10 flex items-center gap-4 border-b border-border bg-white px-7 py-4">
      <div>
        <h1 className="text-xl font-bold">{title}</h1>
        {subtitle && <p className="text-[13px] text-muted-foreground">{subtitle}</p>}
      </div>
      {action && <div className="ml-auto">{action}</div>}
    </div>
  );
}

const colors = ["#6b1f2a", "#8a2a38", "#3f6b54", "#9c6b1f", "#4a5d7a", "#7a3f6b"];

export function Avatar({ name, photo, i = 0 }: { name: string; photo?: string | null; i?: number }) {
  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-full text-[13px] font-bold text-white"
      style={{ background: `linear-gradient(135deg, ${colors[i % colors.length]}, ${colors[(i + 2) % colors.length]})` }}>
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photo} alt="" className="h-full w-full object-cover" />
      ) : (
        initials
      )}
    </div>
  );
}

export function Pill({ tone, children }: { tone: "green" | "amber" | "red" | "grey"; children: React.ReactNode }) {
  const map = {
    green: "bg-brand-green/12 text-brand-green",
    amber: "bg-gold/20 text-[#9a6b00]",
    red: "bg-destructive/10 text-destructive",
    grey: "bg-muted text-muted-foreground",
  };
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-[11.5px] font-bold", map[tone])}>{children}</span>;
}

export function statusTone(status: string): "green" | "amber" | "red" | "grey" {
  switch (status) {
    case "Verified":
    case "Active":
      return "green";
    case "Pending":
      return "amber";
    case "Suspended":
    case "Rejected":
      return "red";
    default:
      return "grey";
  }
}
