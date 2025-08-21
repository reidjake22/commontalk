import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { PARTY_CONFIG } from "../lib/party";
import { resolvePartyByString } from "../lib/party-resolver";

/* ================= Env bases ================= */
const MEMBERS_BASE = (import.meta as any).env?.VITE_MEMBERS_BASE ?? "/members";

/* ================= Types (minimum needed) ================= */
type MemberCore = {
  value?: {
    id: number;
    nameDisplayAs: string;
    latestParty?: { name: string } | null;
    latestHouseMembership?: {
      house?: string | null;
      membershipFrom?: string | null;     // constituency name
      membershipFromId?: number | null;   // constituency id if present
    } | null;
  } | null;
};
type Synopsis = { value?: string | null };
type LatestElection = {
  value?: {
    constituencyName?: string;
    electionDate?: string;
    majority?: number | null;
    winningParty?: { name?: string; backgroundColour?: string } | null;
    candidates?: Array<{
      name?: string;
      voteShare?: number; // 0..1
      party?: { name?: string; abbreviation?: string; backgroundColour?: string } | null;
    }>;
  } | null;
};
type GeometryEnvelope = { value?: string | null }; // stringified GeoJSON

/* ================= Fetchers ================= */
async function getMember(id: string, signal?: AbortSignal): Promise<MemberCore> {
  const r = await fetch(`${MEMBERS_BASE}/api/Members/${id}`, { signal, cache: "no-store" });
  if (!r.ok) throw new Error(`Member ${id} failed: ${r.status}`);
  return r.json();
}
async function getSynopsis(id: string, signal?: AbortSignal): Promise<Synopsis> {
  const r = await fetch(`${MEMBERS_BASE}/api/Members/${id}/Synopsis`, { signal, cache: "no-store" });
  if (!r.ok) return { value: null };
  return r.json();
}
async function getPortraitUrl(id: string, signal?: AbortSignal): Promise<string | null> {
  try {
    const r = await fetch(`${MEMBERS_BASE}/api/Members/${id}/PortraitUrl`, { signal, cache: "no-store" });
    if (!r.ok) return null;
    const j = await r.json();
    return typeof j?.value === "string" ? j.value : null;
  } catch { return null; }
}
function portraitDirect(id: string | number) {
  return `${MEMBERS_BASE}/api/Members/${id}/Portrait?cropType=FullSize&webVersion=true`;
}
function thumbUrl(id: string | number, size: 225 | 80 = 225) {
  return `${MEMBERS_BASE}/api/Members/${id}/Thumbnail?size=${size}`;
}
async function getLatestElection(id: string, signal?: AbortSignal): Promise<LatestElection | null> {
  const r = await fetch(`${MEMBERS_BASE}/api/Members/${id}/LatestElectionResult`, { signal, cache: "no-store" });
  if (!r.ok) return null;
  return r.json();
}
async function getConstituencyGeometry(id: number, signal?: AbortSignal) {
  const r = await fetch(`${MEMBERS_BASE}/api/Location/Constituency/${id}/Geometry`, { signal, cache: "no-store" });
  if (!r.ok) return null;
  const j: GeometryEnvelope = await r.json();
  if (!j?.value) return null;
  try { return JSON.parse(j.value); } catch { return null; }
}
function houseLabel(h?: string | number | null): string | null {
  if (h == null) return null;
  // Accept numeric or string; API varies.
  const n = typeof h === "string" ? Number(h) : h;
  if (n === 1) return "House of Commons";
  if (n === 2) return "House of Lords";
  // Fall back to strings the API might already provide
  if (typeof h === "string") return h;
  return null;
}

/* ================= Tiny helpers ================= */
function partyKeyFromName(s?: string | null) {
  if (!s) return undefined as keyof typeof PARTY_CONFIG | undefined;
  return resolvePartyByString(s) as unknown as keyof typeof PARTY_CONFIG | undefined;
}
function partyColorHexFromName(s?: string | null): string | null {
  const pk = partyKeyFromName(s);
  return pk ? PARTY_CONFIG[pk]?.color : null;
}
function ensureHex(h?: string | null) {
  if (!h) return null;
  const v = h.startsWith("#") ? h : `#${h}`;
  return /^#([0-9a-f]{6}|[0-9a-f]{3})$/i.test(v) ? v : null;
}
function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

/** Strip HTML → plain text (no XSS; no innerHTML usage). */
function stripHtml(html?: string | null): string {
  if (!html) return "";
  // DOMParser is safe in the browser; falls back to a minimal regex if needed
  try {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return (doc?.body?.textContent || "").trim();
  } catch {
    return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  }
}

/** GeoJSON -> { pathD, box } normalized to ~200x200 */
function geoToPath(geo: any, size = 200) {
  const polys: number[][][] =
    geo?.type === "Polygon"
      ? geo.coordinates
      : geo?.type === "MultiPolygon"
      ? geo.coordinates.flat()
      : null;
  if (!polys || !polys.length) return { d: null as string | null, box: { size } };

  const all = polys.flat();
  const lons = all.map((c) => c[0]);
  const lats = all.map((c) => c[1]);
  const minLon = Math.min(...lons), maxLon = Math.max(...lons);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);

  const w = maxLon - minLon || 1;
  const h = maxLat - minLat || 1;
  const scale = 0.9 * Math.min(size / w, size / h);
  const cx = (minLon + maxLon) / 2;
  const cy = (minLat + maxLat) / 2;

  const toXY = (lon: number, lat: number) => {
    const x = (lon - cx) * scale + size / 2;
    const y = (cy - lat) * scale + size / 2;
    return [x, y];
  };

  const parts = polys.map((ring) =>
    ring.map(([lon, lat], i) => {
      const [x, y] = toXY(lon, lat);
      return (i === 0 ? "M" : "L") + x.toFixed(1) + " " + y.toFixed(1);
    }).join(" ") + " Z"
  );
  return { d: parts.join(" "), box: { size } };
}

/** Build stripe segments from candidates (sorted desc voteShare) */
function toStripes(cands: Array<{
  name?: string;
  voteShare?: number;
  party?: { name?: string; abbreviation?: string; backgroundColour?: string } | null;
}> | undefined) {
  if (!cands || !cands.length) return [] as Array<{ w: number; color: string; title: string }>;
  const sum = cands.reduce((a, b) => a + (b.voteShare || 0), 0) || 1;
  const sorted = [...cands].sort((a, b) => (b.voteShare || 0) - (a.voteShare || 0));
  return sorted.map((c) => {
    const apiHex = ensureHex(c.party?.backgroundColour);
    const fallback = partyColorHexFromName(c.party?.name) || "#9ca3af";
    return {
      w: (c.voteShare || 0) / sum,
      color: apiHex || fallback,
      title: `${c.party?.abbreviation || c.party?.name || "Other"} ${Math.round((c.voteShare || 0) * 100)}%`,
    };
  });
}

/* ================= Component ================= */
export default function MemberHero() {
  const { id = "" } = useParams();
  const [core, setCore] = useState<MemberCore | null>(null);
  const [synopsis, setSynopsis] = useState<Synopsis | null>(null);
  const [portrait, setPortrait] = useState<string | null>(null);

  const [latest, setLatest] = useState<LatestElection | null>(null);
  const [geo, setGeo] = useState<any | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load everything
  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      try {
        setLoading(true);
        setErr(null);

        const [c, syn, href, le] = await Promise.all([
          getMember(id, ctrl.signal),
          getSynopsis(id, ctrl.signal),
          getPortraitUrl(id, ctrl.signal),
          getLatestElection(id, ctrl.signal),
        ]);
        setCore(c);
        setSynopsis(syn);
        setPortrait(href || portraitDirect(id));
        setLatest(le);

        const consId = c?.value?.latestHouseMembership?.membershipFromId ?? null;
        if (typeof consId === "number") {
          const g = await getConstituencyGeometry(consId, ctrl.signal);
          setGeo(g);
        } else {
          setGeo(null);
        }
      } catch (e: any) {
        if (e?.name !== "AbortError") setErr(e?.message ?? "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
    return () => ctrl.abort();
  }, [id]);

  const m = core?.value || null;
  const partyName = m?.latestParty?.name || latest?.value?.winningParty?.name || null;
  const chipColor =
    ensureHex(latest?.value?.winningParty?.backgroundColour) ||
    partyColorHexFromName(partyName) ||
    "#111827";

  const cons = latest?.value?.constituencyName || m?.latestHouseMembership?.membershipFrom || "—";
  const synPlain = useMemo(() => stripHtml(synopsis?.value || ""), [synopsis]); // ← strip HTML

  const { d: geoPath } = useMemo(() => geoToPath(geo), [geo]);
  const stripes = useMemo(() => toStripes(latest?.value?.candidates), [latest]);

  if (loading) {
    return (
      <section className="relative overflow-hidden rounded-3xl border border-gray-200/70 bg-white/70 backdrop-blur-sm p-4 md:p-10">
        <div className="animate-pulse space-y-6">
          <div className="h-1 w-12 brand-gradient rounded-full" />
          <div className="h-8 w-1/2 bg-gray-200 rounded" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="h-[360px] bg-gray-200 rounded-2xl" />
            <div className="md:col-span-2 space-y-3">
              <div className="h-4 w-5/6 bg-gray-200 rounded" />
              <div className="h-4 w-3/4 bg-gray-200 rounded" />
              <div className="h-40 bg-gray-100 rounded-2xl border border-gray-200" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (err || !m) {
    return (
      <section className="rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        {err ?? "Not found"}
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden rounded-3xl">
      {/* soft tint bg */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(1200px 500px at 100% 0%, rgba(59,130,246,0.08), transparent 60%), radial-gradient(900px 400px at 0% 100%, rgba(16,185,129,0.08), transparent 60%)",
        }}
      />
      <div className="relative p-4 md:p-10 bg-white/80 backdrop-blur-sm border border-gray-200/70 rounded-3xl shadow-sm">
        {/* Top accent in party colour */}
        <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-3xl" style={{ background: chipColor }} />

        {/* Title */}
        <div className="mb-6">
          <div className="brand-gradient h-1 w-12 rounded-full" />
          <h1 className="mt-2 font-serif font-bold tracking-tight text-[clamp(1.8rem,3.2vw,2.8rem)]">
            {m.nameDisplayAs}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            <span className="inline-flex items-center rounded px-2 py-1 text-white" style={{ background: chipColor }}>
              {partyName || "Party"}
            </span>
            {(m.latestHouseMembership?.house != null) && (
            <span className="inline-flex items-center rounded px-2 py-1 bg-gray-900/90 text-white">
                {houseLabel(m.latestHouseMembership.house)}
            </span>
            )}
            {cons && (
              <span className="inline-flex items-center rounded px-2 py-1 border border-gray-200 bg-white text-gray-700">
                {cons}
              </span>
            )}
          </div>
        </div>

        {/* Main row: Portrait (left) + Constituency (right) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {/* Portrait */}
          <div className="md:col-span-1">
            <figure className="relative rounded-2xl overflow-hidden ring-1 ring-gray-200 shadow-sm">
              <img
                src={portrait || portraitDirect(m.id)}
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = thumbUrl(m.id); }}
                alt={m.nameDisplayAs}
                className="block w-full object-cover"
              />
            </figure>
          </div>

          {/* Text + Constituency */}
          <div className="md:col-span-2 space-y-5">
            {/* Synopsis */}
            {synPlain && (
              <p className="text-gray-700 leading-relaxed max-w-3xl">{synPlain}</p>
            )}

            {/* Constituency visual */}
            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-base md:text-lg font-semibold tracking-tight">Constituency</h2>
                {latest?.value?.electionDate && (
                  <div className="text-xs text-gray-600">
                    Last election: <span className="font-medium text-gray-800">{fmtDate(latest.value.electionDate)}</span>
                    {typeof latest?.value?.majority === "number" && (
                      <> · Majority <span className="font-medium text-gray-800">{latest.value.majority.toLocaleString()}</span></>
                    )}
                  </div>
                )}
              </div>

              {/* === CHANGED LAYOUT: flex so SVG expands and legend stays narrow === */}
              <div className="mt-3 md:flex md:items-stretch md:gap-4">
                {/* Map + stripes */}
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 flex-1 min-w-0">
                  {geoPath ? (
                    <div className="w-full">
                      <svg
                        viewBox="-5 -5 210 210"
                        className="w-full h-64 md:h-72"  /* responsive height; fills width */
                        role="img"
                        aria-label="Constituency map with vote shares"
                        preserveAspectRatio="xMidYMid meet"
                      >
                        <defs>
                          <clipPath id="consClip">
                            <path d={geoPath} />
                          </clipPath>
                        </defs>
                        {/* Base */}
                        <rect x="-5" y="-5" width="210" height="210" rx="16" fill="transparent" />
                        {/* Clipped stripes */}
                        <g clipPath="url(#consClip)">
                          {(() => {
                            let x = 0;
                            const total = 200;
                            return stripes.map((s, i) => {
                              const w = Math.max(1, s.w * total);
                              const rect = (
                                <g key={s.title + i}>
                                  <rect x={x} y={0} width={w} height={200} fill={s.color}>
                                    <title>{s.title}</title>
                                  </rect>
                                  {/* subtle divider */}
                                  <rect x={x + w - 1} y={0} width={1} height={200} fill="rgba(17,24,39,0.06)" />
                                </g>
                              );
                              x += w;
                              return rect;
                            });
                          })()}
                        </g>
                        {/* Boundary */}
                        <path d={geoPath} fill="none" stroke="#111827" strokeOpacity="0.2" strokeWidth="1.5" />
                      </svg>
                    </div>
                  ) : (
                    <div className="text-xs text-gray-600">No boundary available.</div>
                  )}
                </div>

                {/* Legend (fixed width so map gets the rest) */}
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 mt-3 md:mt-0 md:w-60 shrink-0">
                  <div className="text-xs text-gray-600 mb-2">Vote share</div>
                  {stripes.length ? (
                    <div className="space-y-1">
                      {stripes.slice(0, 6).map((s, i) => (
                        <div key={s.title + i} className="flex items-center gap-2 text-xs">
                          <span className="inline-block h-2.5 w-2.5 rounded" style={{ background: s.color }} />
                          <span className="truncate">{s.title}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-600">No breakdown available.</div>
                  )}
                </div>
              </div>
              {/* === /changed layout === */}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
