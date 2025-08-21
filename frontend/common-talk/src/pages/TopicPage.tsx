// File: src/pages/TopicPage.tsx
// =============================================
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import {
  getTopicDetail,
  type SingleTopicOut,
  type RichPointOut,
  type LightPartyOut,
  type PartyProportionOut,
} from "../lib/topic-api";

import {
    type PageMeta,
} from "../lib/types";
import { PartyProportionsBar } from "../components/PartyProportionsBar";
import { ContributorRow, PointsList, ContributionPreview, DebatePills } from "./TopicPage.parts";

/* ===== Env base for pagination endpoint ===== */
const API_BASE = (import.meta as any).env?.VITE_API_BASE ?? "http://127.0.0.1:5000";

/* ===== Small utils ===== */
function normalizeProportionsToTuples(
  p: PartyProportionOut[] | Array<[LightPartyOut, number]>
): Array<[LightPartyOut, number]> {
  if (!p || p.length === 0) return [];
  const first: any = p[0];
  if (Array.isArray(first) && first.length === 2 && typeof first[1] === "number") {
    return p as Array<[LightPartyOut, number]>;
  }
  return (p as PartyProportionOut[]).map(({ party, count }) => [party, count]);
}

/* ===== Pagination client (normalizes prev_cursor → previous_cursor) ===== */
function normalizeMeta(meta: any): PageMeta {
  return {
    next_cursor: meta?.next_cursor ?? null,
    previous_cursor: meta?.previous_cursor ?? meta?.prev_cursor ?? null,
    total_count: typeof meta?.total_count === "number" ? meta.total_count : undefined,
  };
}


async function fetchClusterRichPoints(opts: {
  clusterId: number | string;
  limit?: number;
  after_point_id?: number | string | null;
  signal?: AbortSignal;
}) {
  const { clusterId, limit, after_point_id, signal } = opts;
  const url = new URL(`${API_BASE}/api/v1/topics/${clusterId}/points`, window.location.origin);
  if (limit != null) url.searchParams.set("limit", String(limit));
  if (after_point_id != null) url.searchParams.set("after_point_id", String(after_point_id));
  const res = await fetch(url.toString(), { signal, cache: "no-store" });
  if (!res.ok) throw new Error(`fetchClusterRichPoints ${res.status}`);
  const json = await res.json();
  return { data: json.data as RichPointOut[], meta: normalizeMeta(json.meta) };
}

/* ===== Tiny components ===== */
function SubtopicCardButton({
  title,
  onClick,
  active = false,
}: {
  title: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "group w-full text-left rounded-2xl border p-4 md:p-5 transition-all focus:outline-none",
        "focus-visible:ring-2 focus-visible:ring-gray-900/70",
        active
          ? "border-blue-300 ring-1 ring-blue-200 bg-blue-50/60"
          : "border-gray-200/80 bg-white hover:shadow-sm hover:-translate-y-0.5 hover:ring-1 hover:ring-gray-200",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-medium text-base md:text-lg leading-snug">
          <span className={active ? "text-blue-700" : ""}>{title}</span>
        </h3>
        <span
          className={[
            "shrink-0 inline-flex items-center justify-center rounded-full border w-8 h-8 md:w-9 md:h-9",
            active ? "border-blue-300 bg-blue-100" : "border-gray-200 group-hover:bg-gray-50",
          ].join(" ")}
          aria-hidden
        >
          <svg width="16" height="16" viewBox="0 0 24 24">
            <path fill="currentColor" d="M13 5l7 7l-7 7v-4H4v-6h9z" />
          </svg>
        </span>
      </div>
    </button>
  );
}

function SelectedSubtopicChip({
  title,
  onClear,
}: {
  title: string;
  onClear: () => void;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-blue-600 text-white px-3 py-1 text-xs">
      <span className="font-medium">{title}</span>
      <button
        type="button"
        onClick={onClear}
        className="rounded-full bg-white/20 hover:bg-white/30 transition-colors p-0.5 leading-none"
        aria-label="Clear selected subtopic"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden>
          <path fill="currentColor" d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

/* ===== Main page ===== */
export default function TopicPage() {
  const { topicId } = useParams();
  const [search, setSearch] = useSearchParams();
  const selectedPointId = search.get("point");
  const selectedSubId = search.get("sub"); // in-place drilldown

  // Root topic
  const [rootData, setRootData] = useState<SingleTopicOut | null>(null);
  const [loadingRoot, setLoadingRoot] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Subtopic cache
  const [loadedSubs, setLoadedSubs] = useState<Record<string, SingleTopicOut>>({});
  const [loadingSubId, setLoadingSubId] = useState<string | null>(null);

  // The currently visible (paged) points, updated by TopicPointsPane
  const [visiblePoints, setVisiblePoints] = useState<RichPointOut[]>([]);

  // Fetch root on topicId change
  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      try {
        setLoadingRoot(true);
        setError(null);
        const d = await getTopicDetail(String(topicId), ctrl.signal);
        setRootData(d);
        setLoadedSubs({});
        setVisiblePoints([]);
        setSearch(
          (prev) => {
            const next = new URLSearchParams(prev);
            next.delete("sub");
            next.delete("point");
            return next;
          },
          { replace: true }
        );
      } catch (e: any) {
        if (e?.name !== "AbortError") setError(e.message || "Failed to load topic");
      } finally {
        setLoadingRoot(false);
      }
    })();
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicId]);

  // Determine active topic (root or selected sub)
  const activeTopic: SingleTopicOut | null = useMemo(() => {
    if (!rootData) return null;
    if (!selectedSubId) return rootData;
    return (
      loadedSubs[selectedSubId] ||
      rootData.sub_topics?.find((st) => String(st.topic_id) === String(selectedSubId)) ||
      null
    );
  }, [rootData, selectedSubId, loadedSubs]);

  // Load full subtopic if needed
  useEffect(() => {
    if (!selectedSubId || !rootData) return;
    if (loadedSubs[selectedSubId]) return;

    const minimal = rootData.sub_topics?.find(
      (st) => String(st.topic_id) === String(selectedSubId)
    );
    if (!minimal) return;

    const ctrl = new AbortController();
    (async () => {
      try {
        setLoadingSubId(selectedSubId);
        const full = await getTopicDetail(String(selectedSubId), ctrl.signal);
        setLoadedSubs((prev) => ({ ...prev, [String(selectedSubId)]: full }));
      } catch {
        // fall back to minimal
      } finally {
        setLoadingSubId(null);
      }
    })();

    return () => ctrl.abort();
  }, [selectedSubId, rootData, loadedSubs]);

  // URL helpers
  const selectSub = (id: string) => {
    setSearch((prev) => {
      const next = new URLSearchParams(prev);
      next.set("sub", String(id));
      next.delete("point");
      return next;
    }, { replace: true });
  };
  const clearSub = () => {
    setSearch((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("sub");
      next.delete("point");
      return next;
    }, { replace: true });
  };
  const onSelectPoint = (id: string | number) => {
    setSearch((prev) => {
      const next = new URLSearchParams(prev);
      next.set("point", String(id));
      return next;
    }, { replace: true });
  };

  // Active cluster + seed from API’s first page
  const activeClusterId = activeTopic?.topic_id;
  const seedData = activeTopic?.points?.data ?? [];
  const seedMeta = (activeTopic?.points?.meta as PageMeta | undefined) ?? null;

  // Selected point should come from the *visible (paged)* list
  const selectedPoint: RichPointOut | undefined = useMemo(() => {
    if (!selectedPointId) return undefined;
    return visiblePoints.find((p) => String(p.point.point_id) === String(selectedPointId));
  }, [visiblePoints, selectedPointId]);

  const stats = useMemo(() => {
    const debatesCount = new Set(visiblePoints.map((p) => p.debate.ext_id)).size;
    const contributorsCount = activeTopic?.contributors?.length ?? 0;
    const pointsShown = visiblePoints.length;
    const totalCount =
      typeof activeTopic?.points?.meta?.total_count === "number"
        ? activeTopic.points.meta.total_count
        : undefined;
    return { debatesCount, contributorsCount, pointsShown, totalCount };
  }, [visiblePoints, activeTopic?.contributors, activeTopic?.points?.meta?.total_count]);

  /* ========== Loading skeleton ========== */
  if (loadingRoot) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8 space-y-8">
        {/* HERO SKELETON */}
        <section className="relative overflow-hidden rounded-3xl border border-gray-200/70 bg-white/70 backdrop-blur-sm">
          <div className="p-4 md:p-10">
            <div className="animate-pulse space-y-4">
              <div className="brand-gradient h-1 w-12 rounded-full" />
              <div className="h-8 w-2/3 bg-gray-200 rounded" />
              <div className="h-4 w-1/2 bg-gray-200 rounded" />
            </div>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-3 animate-pulse">
                <div className="h-4 w-5/6 bg-gray-200 rounded" />
                <div className="h-4 w-4/6 bg-gray-200 rounded" />
                <div className="h-24 bg-gray-100 rounded-xl" />
              </div>
              <div className="space-y-3 animate-pulse">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-100 rounded-2xl border border-gray-200" />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* POINTS + READER SKELETON */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 rounded-2xl border border-gray-200 bg-white p-4 animate-pulse">
            <div className="h-5 w-24 bg-gray-200 rounded mb-3" />
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-100 rounded mb-2" />
            ))}
          </div>
          <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white p-5 animate-pulse">
            <div className="h-5 w-40 bg-gray-200 rounded mb-3" />
            <div className="h-40 bg-gray-100 rounded-xl" />
            <div className="mt-3 h-24 bg-gray-100 rounded-xl" />
          </div>
        </section>

        <div className="text-xs text-gray-500 px-1">Loading topic…</div>
      </main>
    );
  }

  /* ========== Error ========== */
  if (error || !rootData || !activeTopic) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error ?? "Not found"}
        </div>
      </main>
    );
  }

  // Hero subtopics (root’s or selected sub’s children)
  //const heroSubtopics = selectedSubId ? (activeTopic.sub_topics ?? []) : (rootData.sub_topics ?? []);
  const selectedSub =
    selectedSubId
      ? (loadedSubs[selectedSubId] ||
         rootData.sub_topics?.find((st) => String(st.topic_id) === String(selectedSubId)) ||
         null)
      : null;

  return (
    <main className="mx-auto max-w-6xl px-4 py-5 space-y-12">
      {/* HERO */}
      <section className="relative overflow-hidden rounded-3xl">
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(1200px 500px at 100% 0%, rgba(59,130,246,0.08), transparent 60%), radial-gradient(900px 400px at 0% 100%, rgba(16,185,129,0.08), transparent 60%)",
          }}
        />
        <div className="relative p-4 md:p-10 bg-white/70 backdrop-blur-sm border border-gray-200/70 rounded-3xl">
          {/* Breadcrumbs + Title */}
          <div className="mb-4 md:mb-6">
            {rootData && (
              <nav className="mb-4 flex items-center gap-2 text-sm text-gray-500">
                <button
                  type="button"
                  onClick={clearSub}
                  disabled={!selectedSub}
                  className={selectedSub ? "hover:underline focus:outline-none" : "cursor-default text-gray-400"}
                >
                  {rootData.title}
                </button>
                {selectedSub && (
                  <>
                    <span aria-hidden>→</span>
                    <span className="text-gray-700 font-medium">
                      {selectedSub.title || String(selectedSub.topic_id)}
                    </span>
                  </>
                )}
              </nav>
            )}

            <h1 className="font-serif tracking-tight font-bold text-[clamp(1.8rem,3.2vw,2.8rem)]">
              {activeTopic.title || rootData.title}
            </h1>
          </div>

          {/* Top grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Left: summary + stats + proportions */}
            <div className="md:col-span-2">
              {activeTopic.summary && (
                <p className="text-gray-700 leading-relaxed max-w-3xl">
                  {activeTopic.summary}
                </p>
              )}

              {selectedSub && (
                <div className="mt-3">
                  <SelectedSubtopicChip
                    title={selectedSub.title || String(selectedSub.topic_id)}
                    onClear={clearSub}
                  />
                </div>
              )}

              {/* Stats */}
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-700">
                  <svg width="14" height="14" viewBox="0 0 24 24" className="opacity-70" aria-hidden>
                    <path fill="currentColor" d="M4 4h16v2H4zm0 7h16v2H4zm0 7h10v2H4z" />
                  </svg>
                  {typeof stats.totalCount === "number" ? `${stats.totalCount} points` : `${stats.pointsShown} points`}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-700">
                  <svg width="14" height="14" viewBox="0 0 24 24" className="opacity-70" aria-hidden>
                    <path fill="currentColor" d="M12 12a5 5 0 1 0-5-5a5 5 0 0 0 5 5m0 2c-5.33 0-8 2.67-8 4v2h16v-2c0-1.33-2.67-4-8-4" />
                  </svg>
                  {stats.contributorsCount} contributors
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-700">
                  <svg width="14" height="14" viewBox="0 0 24 24" className="opacity-70" aria-hidden>
                    <path fill="currentColor" d="M3 5h18v2H3zm0 6h12v2H3zm0 6h18v2H3z" />
                  </svg>
                  {stats.debatesCount} debates
                </span>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(window.location.href)}
                  className="ml-auto inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900/70"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden>
                    <path fill="currentColor" d="M3 12a5 5 0 0 1 5-5h3v2H8a3 3 0 1 0 0 6h3v2H8a5 5 0 0 1-5-5m8-1h2v2h-2zm5-4h-3v2h3a3 3 0 1 1 0 6h-3v2h3a5 5 0 1 0 0-10" />
                  </svg>
                  Copy link
                </button>
              </div>

              {!!activeTopic.proportions?.length && (
                <div className="mt-6">
                  <div className="text-xs text-gray-500 mb-2">Party contributions</div>
                  <PartyProportionsBar proportions={normalizeProportionsToTuples(activeTopic.proportions)} />
                </div>
              )}
              {/* NEW: debate pills beneath the contribution bars */}
<DebatePills debates={(activeTopic as any).debates} limit={12} />
            </div>

            {/* Right: subtopics + contributors */}
            <div className="md:col-span-1 space-y-6">
              <div>
                <div className="flex items-baseline justify-between">
                  <h2 className="text-base md:text-lg font-semibold tracking-tight">
                    {selectedSub ? "Subdivisions" : "Related subtopics"}
                  </h2>
                  <span className="text-xs text-gray-500">
                    { (selectedSub ? (activeTopic.sub_topics ?? []) : (rootData.sub_topics ?? [])).length }
                  </span>
                </div>

                {selectedSub && (
                  <div className="mt-2 md:hidden">
                    <SelectedSubtopicChip
                      title={selectedSub.title || String(selectedSub.topic_id)}
                      onClear={clearSub}
                    />
                  </div>
                )}

                <div className="mt-3 grid grid-cols-1 gap-3">
                  {(selectedSub ? (activeTopic.sub_topics ?? []) : (rootData.sub_topics ?? [])).length === 0 ? (
                    <div />
                  ) : (
                    (selectedSub ? (activeTopic.sub_topics ?? []) : (rootData.sub_topics ?? [])).map((st) => (
                      <SubtopicCardButton
                        key={st.topic_id}
                        title={st.title || String(st.topic_id)}
                        active={String(st.topic_id) === String(selectedSubId)}
                        onClick={() => selectSub(String(st.topic_id))}
                      />
                    ))
                  )}
                </div>
                {loadingSubId && (
                  <div className="mt-3 text-xs text-gray-500">Loading subdivision…</div>
                )}
              </div>

              {activeTopic.contributors?.length ? (
                <div className="rounded-2xl border border-gray-200/80 bg-white p-4 md:p-5 shadow-sm">
                  <h2 className="text-base md:text-lg font-semibold tracking-tight">Top contributors</h2>
                  <div className="mt-3 space-y-3">
                    {activeTopic.contributors.slice(0, 6).map((m) => (
                      <ContributorRow key={m.member_id} m={m} />
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {/* POINTS + READER */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: Points (⅓) */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl bg-gradient-to-br from-gray-100 to-white p-[1px]">
            <div className="rounded-2xl bg-white">
              <div className="flex items-baseline justify-between px-5 pt-5">
                <h2 className="text-xl font-semibold tracking-tight">Points</h2>
                <span aria-live="polite" className="text-xs text-gray-500">
                  Showing {visiblePoints.length}
                  {typeof activeTopic.points?.meta?.total_count === "number" ? ` of ${activeTopic.points.meta.total_count}` : ""}
                </span>
              </div>

              <TopicPointsPane
                clusterId={activeClusterId}
                seedData={seedData}
                seedMeta={seedMeta}
                onSelect={(id) => onSelectPoint(id)}
                selectedId={selectedPointId ?? undefined}
                pageSize={50}
                onItemsChange={setVisiblePoints}
              />
            </div>
          </div>
        </div>

        {/* RIGHT: Reader (⅔) */}
        <div className="lg:col-span-2 self-start lg:sticky lg:top-6">
          <div className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm">
            <div className="mt-3 prose max-w-none">
              {selectedPoint ? (
                <ContributionPreview
                  data={selectedPoint}
                  fromTopicId={activeTopic.topic_id}
                  fromTitle={activeTopic.title}
                />
              ) : (
                <div className="text-sm text-gray-600">
                  Select a point from the list to preview the source contribution here.
                </div>
              )}
            </div>

          </div>
        </div>
      </section>
    </main>
  );
}
function TopicPointsPane({
  clusterId,
  seedData,
  seedMeta,
  onSelect,
  selectedId,
  pageSize = 50,
  onItemsChange,
}: {
  clusterId: number | string | undefined;
  seedData?: RichPointOut[] | undefined;
  seedMeta?: Partial<PageMeta> | null | undefined;
  onSelect: (pid: string | number) => void;
  selectedId?: string | number;
  pageSize?: number;
  onItemsChange?: (items: RichPointOut[]) => void;
}) {
  const [items, setItems] = useState<RichPointOut[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null); // append only
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const seen = useRef<Set<string>>(new Set());

  // Reset + seed
  useEffect(() => {
    const fresh: RichPointOut[] = [];
    const s = new Set<string>();
    for (const r of seedData ?? []) {
      const k = String(r.point.point_id);
      if (!s.has(k)) {
        s.add(k);
        fresh.push(r);
      }
    }
    seen.current = s;
    setItems(fresh);
    onItemsChange?.(fresh);

    const m = seedMeta as any;
    setNextCursor(m?.next_cursor ?? m?.previous_cursor ?? m?.prev_cursor ?? null);
    setErr(null);
    setLoading(false);
  }, [clusterId, seedData, seedMeta, onItemsChange]);

  const loadOlder = useCallback(async () => {
    if (!clusterId || loading || nextCursor === null) return;
    setLoading(true);
    setErr(null);
    try {
      const page = await fetchClusterRichPoints({
        clusterId,
        limit: pageSize,
        after_point_id: nextCursor,
      });
      const fresh: RichPointOut[] = [];
      for (const r of page.data) {
        const k = String(r.point.point_id);
        if (!seen.current.has(k)) {
          seen.current.add(k);
          fresh.push(r);
        }
      }
      if (fresh.length) {
        setItems((prev) => {
          const next = prev.concat(fresh);
          onItemsChange?.(next);
          return next;
        });
      }
      setNextCursor(page.meta.next_cursor ?? null);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load more");
    } finally {
      setLoading(false);
    }
  }, [clusterId, nextCursor, pageSize, loading, onItemsChange]);

  // Only load more when a point is selected AND it's the last item
  useEffect(() => {
    if (!selectedId || items.length === 0) return;
    const idx = items.findIndex((p) => String(p.point.point_id) === String(selectedId));
    if (idx === -1) return;
    const atBottom = idx === items.length - 1;
    if (atBottom && nextCursor !== null && !loading) {
      void loadOlder();
    }
  }, [selectedId, items, nextCursor, loading, loadOlder]);

  return (
    <div className="max-h-[70vh] overflow-auto px-0 py-0">
      {err && (
        <div className="p-3 text-xs text-red-700 bg-red-50 border-t border-red-100">{err}</div>
      )}

      {items.length ? (
        <PointsList points={items} onSelect={onSelect} selectedId={selectedId} />
      ) : (
        <div className="p-4 text-sm text-gray-500">No points yet.</div>
      )}

      <div className="border-t border-gray-100 p-3">
        <button
          type="button"
          onClick={loadOlder}
          disabled={loading || nextCursor === null}
          className={[
            "w-full inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium transition",
            loading
              ? "bg-gray-100 text-gray-500 cursor-wait"
              : nextCursor === null
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-white border border-gray-200 hover:bg-gray-50 text-gray-700",
          ].join(" ")}
        >
          {loading ? "Loading…" : nextCursor === null ? "No more points" : `Load older (${pageSize})`}
        </button>
      </div>
    </div>
  );
}
