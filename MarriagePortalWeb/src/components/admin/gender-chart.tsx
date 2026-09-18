"use client";

const BRIDE = "#8a2a38"; // maroon
const GROOM = "#3f6b54"; // brand green
const TRACK = "#ece3d6";

/** Small donut showing Brides (Female) vs Grooms (Male) with a legend. */
export function GenderChart({ brides, grooms }: { brides: number; grooms: number }) {
  const total = brides + grooms;
  const r = 54;
  const c = 2 * Math.PI * r;
  const gLen = total ? (grooms / total) * c : 0;
  const bLen = total ? (brides / total) * c : 0;
  const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0);

  return (
    <div className="flex flex-wrap items-center gap-8">
      <div className="relative shrink-0" style={{ width: 150, height: 150 }}>
        <svg viewBox="0 0 150 150" className="-rotate-90">
          <circle cx="75" cy="75" r={r} fill="none" stroke={TRACK} strokeWidth="18" />
          {total > 0 && (
            <>
              <circle cx="75" cy="75" r={r} fill="none" stroke={GROOM} strokeWidth="18"
                strokeDasharray={`${gLen} ${c - gLen}`} strokeLinecap="butt" />
              <circle cx="75" cy="75" r={r} fill="none" stroke={BRIDE} strokeWidth="18"
                strokeDasharray={`${bLen} ${c - bLen}`} strokeDashoffset={-gLen} strokeLinecap="butt" />
            </>
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-2xl font-extrabold text-foreground">{total}</div>
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">profiles</div>
        </div>
      </div>

      <div className="space-y-3">
        <Legend color={BRIDE} label="Brides" n={brides} pct={pct(brides)} />
        <Legend color={GROOM} label="Grooms" n={grooms} pct={pct(grooms)} />
        {total === 0 && <p className="text-sm text-muted-foreground">No profiles yet.</p>}
      </div>
    </div>
  );
}

function Legend({ color, label, n, pct }: { color: string; label: string; n: number; pct: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="size-3.5 shrink-0 rounded-sm" style={{ background: color }} />
      <span className="w-16 text-sm font-semibold">{label}</span>
      <span className="text-lg font-bold">{n}</span>
      <span className="text-[12.5px] text-muted-foreground">{pct}%</span>
    </div>
  );
}
