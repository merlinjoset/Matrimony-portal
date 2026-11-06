"use client";

import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Pill } from "@/components/admin/admin-ui";
import type { AdminContactRequest, Interest } from "@/lib/types";

/**
 * Admin "Profile flow": pick a listing and see, as a flowchart, every Express Interest, photo
 * request and contact-number request it RECEIVED (left, flowing in) and SENT (right, flowing out),
 * coloured by status. Built only from the two lists the Interests page already loads.
 */

type EdgeType = "Interest" | "Photo" | "Contact";
type Bucket = "pending" | "accepted" | "declined" | "revoked";

interface Party { id: string | null; ref: string | null; name: string; official: boolean }
interface Edge { id: string; type: EdgeType; from: Party; to: Party; status: string; bucket: Bucket; createdAt: string }
interface ProfileNode { ref: string; id: string | null; name: string; official: boolean; count: number }

const TYPE_LABEL: Record<EdgeType, string> = {
  Interest: "💌 Express interest",
  Photo: "📷 Photo request",
  Contact: "📞 Contact request",
};
const BUCKET_LABEL: Record<Bucket, string> = { pending: "Pending", accepted: "Accepted / approved", declined: "Declined", revoked: "Revoked / cancelled" };
const BUCKET_COLOR: Record<Bucket, string> = { pending: "#d97706", accepted: "#16a34a", declined: "#dc2626", revoked: "#9ca3af" };
const BUCKET_TONE = { pending: "amber", accepted: "green", declined: "red", revoked: "grey" } as const;

function bucketOf(status: string): Bucket {
  if (status === "Awaiting" || status === "Pending") return "pending";
  if (status === "Accepted" || status === "Approved") return "accepted";
  if (status === "Declined") return "declined";
  return "revoked";
}

function toEdges(interests: Interest[], requests: AdminContactRequest[]): Edge[] {
  const fromInterests: Edge[] = interests.map((x) => ({
    id: `i-${x.id}`,
    type: "Interest",
    // The sender's typed name is not authoritative; listing names (FullName) win when both exist.
    from: { id: x.fromProfileId, ref: x.fromReferenceId, name: x.fromName, official: false },
    to: { id: x.toProfileId, ref: x.toReferenceId, name: x.toName, official: true },
    status: x.status,
    bucket: bucketOf(x.status),
    createdAt: x.createdAt,
  }));
  const fromRequests: Edge[] = requests.map((r) => ({
    id: `r-${r.id}`,
    type: r.requestType === "Photo" ? "Photo" : "Contact",
    from: { id: r.requesterProfileId, ref: r.requesterReferenceId, name: r.requesterName, official: true },
    to: { id: r.profileId, ref: r.profileReferenceId, name: r.profileName, official: true },
    status: r.status,
    bucket: bucketOf(r.status),
    createdAt: r.createdAt,
  }));
  return [...fromInterests, ...fromRequests].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

const day = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
const normRef = (s: string) => s.toLowerCase().replace(/[\s-]/g, "");
const selectCls = "h-9 rounded-md border border-input bg-white px-2.5 text-sm";

function RefLink({ id, refId }: { id: string | null; refId: string | null }) {
  if (!refId) return <span className="text-muted-foreground">no listing</span>;
  return id ? (
    <Link href={`/admin/members/${id}`} className="font-semibold text-maroon hover:underline">{refId}</Link>
  ) : (
    <span className="font-semibold">{refId}</span>
  );
}

/** One request in the flowchart, showing the OTHER party; registers its box so the line can find it. */
function EdgeCard({ e, other, register }: { e: Edge; other: Party; register: (id: string, el: HTMLDivElement | null) => void }) {
  return (
    <div
      ref={(el) => register(e.id, el)}
      className="relative rounded-lg border border-border bg-white px-3 py-2 shadow-sm"
      style={{ borderLeft: `4px solid ${BUCKET_COLOR[e.bucket]}` }}
    >
      <div className="text-[13px] font-semibold leading-tight">{other.name}</div>
      <div className="text-[12px]"><RefLink id={other.id} refId={other.ref} /></div>
      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11.5px]">
        <span className="rounded bg-muted px-1.5 py-0.5">{TYPE_LABEL[e.type]}</span>
        <Pill tone={BUCKET_TONE[e.bucket]}>{e.status}</Pill>
        <span className="text-muted-foreground">{day(e.createdAt)}</span>
      </div>
    </div>
  );
}

export function ConnectionFlow({ interests, requests }: { interests: Interest[]; requests: AdminContactRequest[] }) {
  const edges = useMemo(() => toEdges(interests, requests), [interests, requests]);

  // Every listing that appears in any interest/request, with its activity count (for search and shortcuts).
  const profiles = useMemo(() => {
    const m = new Map<string, ProfileNode>();
    const add = (p: Party) => {
      if (!p.ref) return;
      const cur = m.get(p.ref);
      if (!cur) { m.set(p.ref, { ref: p.ref, id: p.id, name: p.name, official: p.official, count: 1 }); return; }
      cur.count++;
      if (!cur.id && p.id) cur.id = p.id;
      if (!cur.official && p.official) { cur.name = p.name; cur.official = true; }
    };
    edges.forEach((e) => { add(e.from); add(e.to); });
    return [...m.values()].sort((a, b) => b.count - a.count || a.ref.localeCompare(b.ref));
  }, [edges]);

  const [query, setQuery] = useState("");
  const [selectedRef, setSelectedRef] = useState<string | null>(null);
  const [type, setType] = useState<"all" | EdgeType>("all");
  const [bucket, setBucket] = useState<"all" | Bucket>("all");
  const [direction, setDirection] = useState<"both" | "received" | "sent">("both");

  const selected = useMemo(() => profiles.find((p) => p.ref === selectedRef) ?? null, [profiles, selectedRef]);

  function onQuery(v: string) {
    setQuery(v);
    // Typing or picking a reference (e.g. "CSI2025", "csi 2025", or a "CSI2025 · Name" suggestion) selects it.
    const m = v.match(/csi\s*-?\s*\d+/i);
    if (m) {
      const hit = profiles.find((p) => normRef(p.ref) === normRef(m[0]));
      if (hit) setSelectedRef(hit.ref);
    }
  }
  function pick(p: ProfileNode) {
    setSelectedRef(p.ref);
    setQuery(`${p.ref} · ${p.name}`);
  }

  // Shortcut chips: name/reference matches while typing (references ignore spaces/hyphens, so
  // "csi 9002" finds CSI9002), otherwise - or once a listing is picked - the most active listings.
  const showingMatches = !!query.trim() && !(selected && query === `${selected.ref} · ${selected.name}`);
  const suggestions = useMemo(() => {
    if (!showingMatches) return profiles.slice(0, 8);
    const q = query.trim().toLowerCase();
    return profiles.filter((p) => normRef(p.ref).includes(normRef(q)) || p.name.toLowerCase().includes(q)).slice(0, 8);
  }, [query, profiles, showingMatches]);

  const received = useMemo(() => {
    if (!selected || direction === "sent") return [];
    return edges.filter((e) => e.to.ref === selected.ref && (type === "all" || e.type === type) && (bucket === "all" || e.bucket === bucket));
  }, [edges, selected, type, bucket, direction]);
  const sent = useMemo(() => {
    if (!selected || direction === "received") return [];
    return edges.filter((e) => e.from.ref === selected.ref && (type === "all" || e.type === type) && (bucket === "all" || e.bucket === bucket));
  }, [edges, selected, type, bucket, direction]);

  // ---- connector lines: measured from the rendered cards, redrawn on resize ----
  const wrapRef = useRef<HTMLDivElement>(null);
  const centerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef(new Map<string, HTMLDivElement>());
  const [paths, setPaths] = useState<{ key: string; d: string; bucket: Bucket }[]>([]);

  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    function compute() {
      const center = centerRef.current;
      if (!wrap || !center) { setPaths([]); return; }
      const W = wrap.getBoundingClientRect();
      const C = center.getBoundingClientRect();
      const cy = C.top + C.height / 2 - W.top;
      const out: { key: string; d: string; bucket: Bucket }[] = [];
      for (const e of received) {
        const el = cardRefs.current.get(e.id);
        if (!el) continue;
        const r = el.getBoundingClientRect();
        const x1 = r.right - W.left, y1 = r.top + r.height / 2 - W.top, x2 = C.left - W.left - 6, mx = (x1 + x2) / 2;
        out.push({ key: e.id, bucket: e.bucket, d: `M${x1},${y1} C${mx},${y1} ${mx},${cy} ${x2},${cy}` });
      }
      for (const e of sent) {
        const el = cardRefs.current.get(e.id);
        if (!el) continue;
        const r = el.getBoundingClientRect();
        const x1 = C.right - W.left, x2 = r.left - W.left - 6, y2 = r.top + r.height / 2 - W.top, mx = (x1 + x2) / 2;
        out.push({ key: e.id, bucket: e.bucket, d: `M${x1},${cy} C${mx},${cy} ${mx},${y2} ${x2},${y2}` });
      }
      setPaths(out);
    }
    compute();
    if (!wrap) return;
    const ro = new ResizeObserver(compute);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [received, sent]);

  const register = useCallback((id: string, el: HTMLDivElement | null) => {
    if (el) cardRefs.current.set(id, el);
    else cardRefs.current.delete(id);
  }, []);

  const totals = useMemo(() => {
    const t = { Interest: { all: 0, pending: 0 }, Photo: { all: 0, pending: 0 }, Contact: { all: 0, pending: 0 } };
    edges.forEach((e) => { t[e.type].all++; if (e.bucket === "pending") t[e.type].pending++; });
    return t;
  }, [edges]);

  return (
    <div className="space-y-5">
      {/* At-a-glance totals per request type */}
      <div className="grid gap-3 sm:grid-cols-3">
        {(Object.keys(totals) as EdgeType[]).map((k) => (
          <Card key={k} className="flex flex-row items-center justify-between px-4 py-3">
            <span className="text-sm font-semibold">{TYPE_LABEL[k]}</span>
            <span className="text-sm">
              <b>{totals[k].all}</b>
              <span className="text-muted-foreground"> · {totals[k].pending} pending</span>
            </span>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="space-y-3 p-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="min-w-[260px] flex-1 space-y-1">
            <span className="text-[12px] font-semibold text-muted-foreground">Find a profile (reference or name)</span>
            <Input list="flow-profiles" value={query} onChange={(e) => onQuery(e.target.value)} placeholder="e.g. CSI2025 or Rachel" className="bg-white" />
            <datalist id="flow-profiles">
              {profiles.map((p) => <option key={p.ref} value={`${p.ref} · ${p.name}`} />)}
            </datalist>
          </label>
          <label className="space-y-1">
            <span className="block text-[12px] font-semibold text-muted-foreground">Type</span>
            <select value={type} onChange={(e) => setType(e.target.value as "all" | EdgeType)} className={selectCls}>
              <option value="all">All types</option>
              <option value="Interest">Express interest</option>
              <option value="Photo">Photo request</option>
              <option value="Contact">Contact request</option>
            </select>
          </label>
          <label className="space-y-1">
            <span className="block text-[12px] font-semibold text-muted-foreground">Status</span>
            <select value={bucket} onChange={(e) => setBucket(e.target.value as "all" | Bucket)} className={selectCls}>
              <option value="all">All statuses</option>
              {(Object.keys(BUCKET_LABEL) as Bucket[]).map((b) => <option key={b} value={b}>{BUCKET_LABEL[b]}</option>)}
            </select>
          </label>
          <label className="space-y-1">
            <span className="block text-[12px] font-semibold text-muted-foreground">Direction</span>
            <select value={direction} onChange={(e) => setDirection(e.target.value as "both" | "received" | "sent")} className={selectCls}>
              <option value="both">Received &amp; sent</option>
              <option value="received">Received only</option>
              <option value="sent">Sent only</option>
            </select>
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[12px] text-muted-foreground">{showingMatches ? "Matches:" : "Most active:"}</span>
          {suggestions.length === 0 ? (
            <span className="text-[12px] text-muted-foreground">no listing matches</span>
          ) : (
            suggestions.map((p) => (
              <button
                key={p.ref}
                type="button"
                onClick={() => pick(p)}
                className={`rounded-full border px-2.5 py-1 text-[12px] ${selected?.ref === p.ref ? "border-maroon bg-maroon text-white" : "border-border bg-white hover:bg-muted"}`}
              >
                {p.ref} · {p.name} <span className="opacity-70">({p.count})</span>
              </button>
            ))
          )}
        </div>
        <div className="flex flex-wrap gap-3 text-[11.5px] text-muted-foreground">
          {(Object.keys(BUCKET_LABEL) as Bucket[]).map((b) => (
            <span key={b} className="inline-flex items-center gap-1.5">
              <span className="inline-block h-0.5 w-5 rounded" style={{ background: BUCKET_COLOR[b] }} /> {BUCKET_LABEL[b]}
            </span>
          ))}
        </div>
      </Card>

      {/* Flowchart */}
      {!selected ? (
        <Card className="p-8 text-center text-muted-foreground">
          Pick a profile above to see the interests and requests it received and sent.
        </Card>
      ) : (
        <Card className="p-5">
          <div ref={wrapRef} className="relative grid items-center gap-6 md:grid-cols-[1fr_minmax(190px,230px)_1fr] md:gap-14">
            <svg className="pointer-events-none absolute inset-0 hidden h-full w-full overflow-visible md:block" aria-hidden>
              <defs>
                {(Object.keys(BUCKET_COLOR) as Bucket[]).map((b) => (
                  <marker key={b} id={`flow-arrow-${b}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                    <path d="M0,0 L10,5 L0,10 z" fill={BUCKET_COLOR[b]} />
                  </marker>
                ))}
              </defs>
              {paths.map((p) => (
                <path
                  key={p.key}
                  d={p.d}
                  fill="none"
                  stroke={BUCKET_COLOR[p.bucket]}
                  strokeWidth={2}
                  strokeDasharray={p.bucket === "pending" ? "6 4" : undefined}
                  markerEnd={`url(#flow-arrow-${p.bucket})`}
                />
              ))}
            </svg>

            <div className="space-y-2.5">
              <div className="text-[12px] font-bold uppercase tracking-wide text-muted-foreground">
                Received ({received.length}) <span className="font-normal normal-case">· they asked this profile</span>
              </div>
              {received.length === 0 ? (
                <p className="text-[12.5px] text-muted-foreground">{direction === "sent" ? "Hidden by the direction filter." : "None matching the filters."}</p>
              ) : (
                received.map((e) => <EdgeCard key={e.id} e={e} other={e.from} register={register} />)
              )}
            </div>

            <div ref={centerRef} className="relative rounded-xl border-2 border-maroon bg-maroon/5 px-4 py-4 text-center shadow-sm">
              <div className="text-[11px] font-bold uppercase tracking-wide text-maroon/80">Selected profile</div>
              <div className="mt-1 text-[15px] font-bold leading-tight">{selected.name}</div>
              <div className="text-[13px]"><RefLink id={selected.id} refId={selected.ref} /></div>
              <div className="mt-2 text-[12px] text-muted-foreground">
                {received.length} in · {sent.length} out
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="text-[12px] font-bold uppercase tracking-wide text-muted-foreground">
                Sent ({sent.length}) <span className="font-normal normal-case">· this profile asked</span>
              </div>
              {sent.length === 0 ? (
                <p className="text-[12.5px] text-muted-foreground">{direction === "received" ? "Hidden by the direction filter." : "None matching the filters."}</p>
              ) : (
                sent.map((e) => <EdgeCard key={e.id} e={e} other={e.to} register={register} />)
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
