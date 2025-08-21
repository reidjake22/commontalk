// File: src/pages/MemberPage.tsx
import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import MemberHero from "./MemberHero"; // ⬅️ our new hero+constituency component
import { PointsList, ContributionPreview } from "./TopicPage.parts";
import { getTopicDetail, type SingleTopicOut, type RichPointOut } from "../lib/topic-api";

/* ===== Env bases (no Members base needed here) ===== */
const API_BASE = (import.meta as any).env?.VITE_API_BASE ?? "http://127.0.0.1:7200";
const HANSARD_BASE = (import.meta as any).env?.VITE_HANSARD_BASE ?? "/hansard";

/* ===== Small helpers (only what we use here) ===== */
function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

// function rangeToDates(days = 30) {
//   const now = new Date();
//   const end_date = now.toISOString().slice(0, 10);
//   const start = new Date(now);
//   start.setDate(now.getDate() - days);
//   const start_date = start.toISOString().slice(0, 10);
//   return { start_date, end_date };
// }

/* ===== Minimal types used on this page ===== */
type DebateCard = { extId: string; title: string; date?: string | null; house?: string | null };

/* ===== Fetchers (Hansard — Debates) ===== */
async function getRecentDebatesForMember(memberId: string, signal?: AbortSignal): Promise<DebateCard[]> {
  const url = new URL(`${HANSARD_BASE}/search/debates.json`, window.location.origin);
  url.searchParams.set("queryParameters.memberId", memberId);
  url.searchParams.set("queryParameters.orderBy", "SittingDateDesc");
  url.searchParams.set("queryParameters.take", "8");
  const r = await fetch(url.toString(), { signal, cache: "no-store" });
  if (!r.ok) return [];
  const j = await r.json();
  const arr = j?.Results ?? j?.Items ?? [];
  return arr
    .map((it: any) => ({
      extId: it?.DebateSectionExtId || it?.ExtId || "",
      title: it?.Title || "Untitled debate",
      date: it?.SittingDate || it?.Date || null,
      house: it?.House || null,
    }))
    .filter((d: DebateCard) => d.extId);
}

/* ===== Search job (member “interests” topic) ===== */
async function postMemberSearch(memberId: string, signal?: AbortSignal) {
  // If you want an open-ended query, just set to "inf"

  const res = await fetch(`${API_BASE}/api/v1/search/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: null,
      member: memberId,
      member_ids: [memberId],
      party: null,
    }),
    signal,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Search failed (${res.status}): ${text || res.statusText}`);
  }
  return res.json() as Promise<{ job_id?: string }>;
}
async function pollJob(jobId: string, signal?: AbortSignal) {
  const res = await fetch(`${API_BASE}/api/v1/polling/${jobId}`, { signal, cache: "no-store" });
  if (!res.ok) throw new Error(`Polling ${res.status}`);
  return res.json() as Promise<{ status: string; root_cluster_id?: string }>;
}

/* ===== Page ===== */
export default function MemberPage() {
  const { id = "" } = useParams();
  const [query, setQuery] = useSearchParams();
  const selectedPointId = query.get("point") || undefined;

  // recent debates
  const [debates, setDebates] = useState<DebateCard[]>([]);
  const [debErr, setDebErr] = useState<string | null>(null);

  // interests (topic-like)
  const [interestsLoading, setInterestsLoading] = useState(true);
  const [interestsErr, setInterestsErr] = useState<string | null>(null);
  const [interestsTopic, setInterestsTopic] = useState<SingleTopicOut | null>(null);

  // --- Load recent debates (Hansard search) ---
  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      try {
        setDebErr(null);
        const arr = await getRecentDebatesForMember(id, ctrl.signal);
        setDebates(arr);
      } catch (e: any) {
        if (e?.name !== "AbortError") setDebErr(e?.message ?? "Failed to load debates");
      }
    })();
    return () => ctrl.abort();
  }, [id]);

  // --- Interests: run background search job filtered by member ---
  useEffect(() => {
    const ctrl = new AbortController();
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let inFlight: AbortController | null = null;
    let delay = 1000;

    setInterestsLoading(true);
    setInterestsErr(null);
    setInterestsTopic(null);

    (async () => {
      try {
        const job = await postMemberSearch(id, ctrl.signal);
        if (!job.job_id) throw new Error("No job_id from search");
        const jobId = job.job_id;

        const loop = async () => {
          if (stopped) return;
          inFlight?.abort();
          const tick = new AbortController();
          inFlight = tick;
          try {
            const d = await pollJob(jobId, tick.signal);
            if (d.status === "complete" && d.root_cluster_id) {
              const topic = await getTopicDetail(String(d.root_cluster_id), tick.signal);
              if (!stopped) {
                setInterestsTopic(topic);
                setInterestsLoading(false);
              }
              return;
            }
            if (!stopped) {
              timer = setTimeout(loop, delay);
              delay = Math.min(delay + 500, 3000);
            }
          } catch (e: any) {
            if (e?.name !== "AbortError" && !stopped) {
              timer = setTimeout(loop, delay);
              delay = Math.min(delay + 500, 3000);
            }
          }
        };

        loop();
      } catch (e: any) {
        if (!stopped) {
          setInterestsErr(e?.message ?? "Failed to start search");
          setInterestsLoading(false);
        }
      }
    })();

    return () => {
      stopped = true;
      ctrl.abort();
      inFlight?.abort();
      if (timer) clearTimeout(timer);
    };
  }, [id]);

  // derived
  const [pointsData, totalCount] = useMemo(() => {
    const pts: RichPointOut[] = interestsTopic?.points?.data ?? [];
    const total =
      typeof interestsTopic?.points?.meta?.total_count === "number"
        ? interestsTopic.points.meta.total_count
        : undefined;
    return [pts, total] as const;
  }, [interestsTopic]);

  const selectedPoint = useMemo(() => {
    if (!selectedPointId) return undefined;
    return pointsData.find((p) => String(p.point.point_id) === String(selectedPointId));
  }, [pointsData, selectedPointId]);

  const onSelectPoint = (pid: string | number) => {
    const next = new URLSearchParams(query);
    next.set("point", String(pid));
    setQuery(next, { replace: true });
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 space-y-10">
      {/* HERO + constituency visual lives entirely in this component */}
      <MemberHero />

      {/* RECENT DEBATES */}
      <section className="rounded-2xl border border-gray-200 bg-white p-5">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Recent debates</h2>
          <span className="text-xs text-gray-500">{debates.length}</span>
        </div>

        {debErr ? (
          <div className="mt-4 text-sm text-red-700 bg-red-50 border border-red-100 rounded p-3">{debErr}</div>
        ) : debates.length === 0 ? (
          <div className="mt-4 text-sm text-gray-600">No recent debates available.</div>
        ) : (
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {debates.map((d) => (
              <Link
                key={d.extId}
                to={{ pathname: `/debates/${d.extId}`, search: `?member=${id}` }}
                className="block rounded-xl border border-gray-200 p-4 hover:shadow-sm motion-safe:transition-all"
              >
                <div className="text-sm text-gray-500">{fmtDate(d.date)}</div>
                <h3 className="font-medium mt-1 line-clamp-2">{d.title}</h3>
                <div className="mt-2 text-xs text-gray-500">View debate ↗</div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* INTERESTS (Topic-like, member-filtered job) */}
      <section className="relative grid grid-cols-1 lg:grid-cols-3 gap-6">
        {interestsLoading && (
          <div className="absolute inset-0 z-10 bg-white/70 backdrop-blur-sm flex items-center justify-center rounded-2xl border border-gray-200">
            <div className="animate-pulse space-y-3 text-center">
              <div className="h-5 w-40 bg-gray-200 rounded mx-auto" />
              <div className="h-24 w-64 bg-gray-100 rounded-xl mx-auto" />
              <div className="text-xs text-gray-500">Building interests…</div>
            </div>
          </div>
        )}

        {/* LEFT: Points (⅓) */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl bg-gradient-to-br from-gray-100 to-white p-[1px]">
            <div className="rounded-2xl bg-white">
              <div className="flex items-baseline justify-between px-5 pt-5">
                <h2 className="text-xl font-semibold tracking-tight">Interests</h2>
                <span className="text-xs text-gray-500">
                  {interestsTopic
                    ? `Showing ${pointsData.length}${typeof totalCount === "number" ? ` of ${totalCount}` : ""}`
                    : "—"}
                </span>
              </div>
              <div className="mt-3 border-t border-gray-100 max-h-[70vh] overflow-auto px-0 py-0">
                {interestsErr ? (
                  <div className="p-4 text-xs text-red-700 bg-red-50 border-t border-red-100">
                    {interestsErr}
                  </div>
                ) : interestsTopic ? (
                  <PointsList
                    points={pointsData}
                    onSelect={(pid) => onSelectPoint(pid)}
                    selectedId={selectedPointId ?? undefined}
                  />
                ) : (
                  <div className="p-4 text-sm text-gray-500">Waiting for results…</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Reader (⅔) */}
        <div className="lg:col-span-2 self-start lg:sticky lg:top-6">
          <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold tracking-tight">Original contribution</h2>
            <div className="mt-3 prose max-w-none">
              {interestsErr ? (
                <div className="text-sm text-red-700 bg-red-50 border border-red-100 rounded p-3">
                  {interestsErr}
                </div>
              ) : selectedPoint ? (
                <ContributionPreview
                  data={selectedPoint}
                  fromTopicId={interestsTopic?.topic_id}
                  fromTitle={"Member interests"}
                />
              ) : interestsTopic ? (
                <div className="text-sm text-gray-600">
                  Select a point from the list to preview the source contribution here.
                </div>
              ) : (
                <div className="text-sm text-gray-600">Waiting for results…</div>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
