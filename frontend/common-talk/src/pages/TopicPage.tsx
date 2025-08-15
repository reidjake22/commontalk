import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { getTopicDetail, type SingleTopicOut, type RichPointOut } from "../lib/topic-api";
import { Tile } from "../components/ui/Tile";
import { PartyProportionsBar } from "../components/PartyProportionsBar";
import { ContributorRow, PointsList, ContributionPreview } from "./TopicPage.parts";

export default function TopicPage() {
  const { topicId } = useParams();
  console.log("TopicPage", topicId);
  const [search, setSearch] = useSearchParams();
  const selectedPointId = search.get("point");

  const [data, setData] = useState<SingleTopicOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const d = await getTopicDetail(String(topicId), ctrl.signal);
        setData(d);
      } catch (e: any) {
        if (e?.name !== "AbortError") setError(e.message || "Failed to load topic");
      } finally {
        setLoading(false);
      }
    })();
    return () => ctrl.abort();
  }, [topicId]);

  const onSelectPoint = (id: string | number) => {
    setSearch((prev) => { prev.set("point", String(id)); return prev; }, { replace: true });
  };

  const selected: RichPointOut | undefined = useMemo(() => {
    if (!data || !selectedPointId) return undefined;
    return data.points_slice.find(p => String(p.point.point_id) === String(selectedPointId));
  }, [data, selectedPointId]);

  const topDebates = useMemo(() => {
    if (!data) return [];
    const m = new Map<string, { id: string; title: string; date?: string; summary: string; count: number }>();
    for (const rp of data.points_slice) {
      const id = rp.debate.ext_id;
      const cur = m.get(id) || { id, title: rp.debate.title, date: rp.debate.date, summary: rp.contribution.contribution_value || "", count: 0 };
      cur.count += 1;
      if (!cur.summary && rp.contribution.contribution_value) cur.summary = rp.contribution.contribution_value;
      m.set(id, cur);
    }
    return Array.from(m.values()).sort((a, b) => b.count - a.count).slice(0, 6);
  }, [data]);

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-2/3 bg-gray-200 rounded" />
          <div className="h-4 w-1/2 bg-gray-200 rounded" />
          <div className="h-32 bg-gray-200 rounded-xl" />
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error ?? "Not found"}
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 space-y-8">
      {/* Hero */}
      <header className="space-y-4">
        <div className="brand-gradient h-1 w-12 rounded-full" />
        <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight">{data.title}</h1>
        {data.summary && <div className="text-gray-700 max-w-3xl">{data.summary}</div>}
        {!!data.proportions?.length && (
          <div className="pt-1">
            <div className="text-xs text-gray-600 mb-2">Party Contributions</div>
            <PartyProportionsBar proportions={data.proportions} />
          </div>
        )}
      </header>

      {/* Debates & Contributors */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Tile className="rounded-2xl p-5 lg:col-span-2">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-semibold tracking-tight">Top Debates</h2>
            <span className="text-xs text-gray-500">by number of points</span>
          </div>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {topDebates.map((d) => (
              <Link key={d.id} to={`/debates/${d.id}`} className="block rounded-xl border border-gray-200 p-4 hover:shadow-sm motion-safe:transition-all">
                <div className="text-sm text-gray-500">{d.date ?? "—"}</div>
                <h3 className="font-medium mt-1 line-clamp-2">{d.title}</h3>
                <p className="text-sm text-gray-700 line-clamp-3 mt-1">{d.summary}</p>
              </Link>
            ))}
          </div>
        </Tile>

        <Tile className="rounded-2xl p-5">
          <h2 className="text-lg font-semibold tracking-tight">Top Contributors</h2>
          <div className="mt-4 space-y-3">
            {data.contributors.map((m) => (
              <ContributorRow key={m.member_id} m={m} />
            ))}
          </div>
        </Tile>
      </section>

      {/* Subtopics */}
      {data.sub_topics?.length ? (
        <Tile className="rounded-2xl p-5">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-semibold tracking-tight">Related Subtopics</h2>
            <span className="text-xs text-gray-500">{data.sub_topics.length}</span>
          </div>
          <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {data.sub_topics.map((st) => (
              <li key={st.topic_id}><Link className="text-sm hover:underline" to={`/topics/${st.topic_id}`}>{st.title}</Link></li>
            ))}
          </ul>
        </Tile>
      ) : null}

      {/* Points master/detail */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Tile className="rounded-2xl p-5 lg:col-span-2">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-semibold tracking-tight">Points</h2>
            <span className="text-xs text-gray-500">Showing {data.points_returned}{data.points_total ? ` of ${data.points_total}` : ""}</span>
          </div>
          <PointsList
            points={data.points_slice.map((p) => ({ id: p.point.point_id, title: p.point.point_value || "(no text)" }))}
            onSelect={(id) => onSelectPoint(id)}
            selectedId={selectedPointId ?? undefined}
          />
        </Tile>

        <Tile className="rounded-2xl p-5 min-h-[320px]">
          <h2 className="text-lg font-semibold tracking-tight">Original Contribution</h2>
          <div className="mt-3 prose max-w-none">
            {selected ? (
              <ContributionPreview data={selected} />
            ) : (
              <div className="text-sm text-gray-600">Select a point to preview.</div>
            )}
          </div>
        </Tile>
      </section>
    </main>
  );
}
