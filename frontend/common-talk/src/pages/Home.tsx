// File: src/pages/Home.tsx
// =============================================

import { FeaturedTopics } from "../components/FeaturedTopics";
import { useFeaturedTopics } from "../hooks/useFeaturedTopics";
import type { FeaturedTopicOut } from "../lib/types";


export default function Home() {
  const { topics, loading, error } = useFeaturedTopics();


  if (loading) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="flex items-end justify-between"><div className="h-7 w-40 bg-gray-200 rounded" /><div className="h-4 w-64 bg-gray-200 rounded" /></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{[...Array(6)].map((_, i) => (<div key={i} className="h-32 bg-gray-200 rounded-xl" />))}</div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 space-y-12">
      <section>
        <div className="flex items-end justify-between">
          <h1 className="text-2xl font-bold font-serif tracking-tight">Trending</h1>
          <p className="text-sm text-gray-600">Live snapshot of what's hot right now</p>
        </div>

        {error ? (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <p className="font-medium">Couldn’t load topics.</p>
            <p className="mt-1 opacity-90">{error}</p>
          </div>
        ) : topics.length === 0 ? (
          <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-800">No trending topics right now. Check back shortly.</div>
        ) : (
          <div className="mt-6">
            <FeaturedTopics topics={topics as FeaturedTopicOut[]} />
          </div>
        )}

        {/* Placeholders for other featured sections (keep components decoupled) */}
        {/* <div className="mt-6"><FeaturedDebates debates={debates} big={false} /></div> */}
        {/* <div className="mt-6"><FeaturedPeople members={people} big={false} /></div> */}
      </section>
    </main>
  );
}
