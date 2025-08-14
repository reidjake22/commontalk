// File: src/components/FeaturedTopics.tsx
// =============================================
import type { Topic } from "../lib/types";
import { Tile } from "./ui/Tile";
import { ContributionBar } from "./ContributionBar";
import { TopicFooter, TopicHeader } from "./topics/TopicMeta";
import { SubTopicBar } from "./topics/SubTopicBar";

export function FeaturedTopics({ topics }: { topics: Topic[] }) {
  const top = topics.slice(0, 5);
  if (top.length === 0) return null;
  const [first, ...rest] = top;

  return (
    <section aria-labelledby="featured-heading" className="space-y-6">
      <div className="brand-gradient h-1 w-10 rounded-full" />
      <h2 id="featured-heading" className="text-2xl md:text-3xl font-serif tracking-tight">Featured Topics</h2>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4 lg:auto-rows-[minmax(8rem,auto)]">
        <FeaturedBig key={first.id} topic={first} rank={1} className="lg:col-span-2 lg:row-span-2" />
        {rest.map((t, i) => (
          <FeaturedSmall key={t.id} topic={t} rank={i + 2} />
        ))}
      </div>
    </section>
  );
}

export function FeaturedBig({ topic, rank, className = "" }: { topic: Topic; rank: number; className?: string }) {
  return (
    <Tile className={`rounded-2xl p-6 justify-between ${className}`}>
      <div className="absolute inset-x-0 top-0 h-1 brand-gradient rounded-t-2xl" />
      <header className="space-y-3">
        <TopicHeader rank={rank} />
        <h3 className="text-xl md:text-2xl font-semibold leading-snug">{topic.title}</h3>
        <p className="text-sm md:text-base text-gray-700 line-clamp-4">{topic.summary}</p>
        {topic.proportions?.length ? (
          <div className="pt-1">
            <div className="text-xs text-gray-600 mb-2">Party Contributions</div>
            <ContributionBar proportions={topic.proportions} />
          </div>
        ) : null}
      </header>
      <div className="space-y-4">
        {topic.subTopics?.length ? <SubTopicBar subTopics={topic.subTopics} /> : null}
        <TopicFooter topicId={topic.id} />
      </div>
    </Tile>
  );
}

export function FeaturedSmall({ topic, rank }: { topic: Topic; rank: number }) {
  return (
    <Tile className="rounded-xl p-4 gap-2 aspect-[4/3]">
      <div className="absolute inset-x-0 top-0 h-0.5 brand-gradient rounded-t-xl" />
      <div className="flex items-start justify-between gap-3">
        <span className="text-[11px] font-semibold text-gray-700">No. {rank}</span>
        <a href={`/topics/${topic.id}`} className="text-xs text-blue-700 hover:underline">Open</a>
      </div>
      <h4 className="text-base font-semibold leading-snug">{topic.title}</h4>
      <p className="text-sm text-gray-700 line-clamp-3">{topic.summary}</p>
      {topic.proportions?.length ? (
        <div className="mt-auto pt-2">
          <ContributionBar proportions={topic.proportions} variant="compact" />
        </div>
      ) : null}
    </Tile>
  );
}