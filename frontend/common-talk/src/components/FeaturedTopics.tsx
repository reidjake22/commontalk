import { Link } from "react-router-dom";

type PersonWidget = {
  id: number;
  party_id: number;
  name: string;
}

type Topic = {
  id: number | string;
  title: string;
  summary: string;
  subTopics: Topic[] | undefined;
  proportions: [number, number][];
  contributors: PersonWidget[];   
};

// Party configuration - using real API data
const PARTY_CONFIG = {
  1: { name: 'Alliance', shortName: 'APNI', color: '#cdaf2d' },
  4: { name: 'Conservative', shortName: 'Con', color: '#0063ba' },
  7: { name: 'Democratic Unionist Party', shortName: 'DUP', color: '#d46a4c' },
  8: { name: 'Independent', shortName: 'Ind', color: '#909090' },
  15: { name: 'Labour', shortName: 'Lab', color: '#d50000' },
  17: { name: 'Liberal Democrat', shortName: 'LD', color: '#faa01a' },
  22: { name: 'Plaid Cymru', shortName: 'PC', color: '#348837' },
  29: { name: 'Scottish National Party', shortName: 'SNP', color: '#fff685' },
  30: { name: 'Sinn Féin', shortName: 'SF', color: '#02665f' },
  31: { name: 'Social Democratic & Labour Party', shortName: 'SDLP', color: '#4ea268' },
  38: { name: 'Ulster Unionist Party', shortName: 'UUP', color: '#a1cdf0' },
  44: { name: 'Green Party', shortName: 'Green', color: '#78b82a' },
  47: { name: 'Speaker', shortName: 'Spk', color: '#666666' },
  158: { name: 'Traditional Unionist Voice', shortName: 'TUV', color: '#0c3a6a' },
  1036: { name: 'Reform UK', shortName: 'RUK', color: '#12b6cf' },
  0: { name: 'Other', shortName: 'Oth', color: '#999999' }
} as const;

const getPartyInfo = (partyId: number) => {
  return PARTY_CONFIG[partyId] || PARTY_CONFIG[0];
};

// Shared styling constants
const cardBaseClasses = "relative h-full bg-white border border-gray-200 flex flex-col motion-safe:transition-all motion-safe:duration-200";
const cardHoverClasses = "hover:shadow-xl hover:-translate-y-0.5";

export function FeaturedTopics({ topics }: { topics: Topic[] }) {
  const top = topics.slice(0, 5);
  if (top.length === 0) return null;

  const [first, ...rest] = top;

  return (
    <section aria-labelledby="featured-heading" className="space-y-6">
      <div className="brand-gradient h-1 w-10 rounded-full" />
      <h2 id="featured-heading" className="text-2xl md:text-3xl font-serif tracking-tight">
        Featured Topics
      </h2>

      {/* GRID:
          - Mobile: 1 column (stacks 1..5)
          - LG: 4 columns. #1 spans 2 cols × 2 rows; #2-5 auto-fill the right half in a 2×2. */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4 lg:auto-rows-[minmax(8rem,auto)]">
        {/* #1 — big tile (left), spans two rows & two cols at lg */}
        <FeaturedBig key={first.id} topic={first} rank={1} className="lg:col-span-2 lg:row-span-2" />

        {/* #2-#5 — small tiles (right), naturally fill into a 2×2 next to #1 on lg */}
        {rest.map((t, i) => (
          <FeaturedSmall key={t.id} topic={t} rank={i + 2} />
        ))}
      </div>
    </section>
  );
}

function TopicHeader({ rank }: { rank: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="inline-flex items-center justify-center text-xs font-semibold rounded-full px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200">
        No. {rank}
      </span>
      <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-800">
        <span className="brand-text">Trending</span>
      </span>
    </div>
  );
}

function TopicFooter({ topicId }: { topicId: number | string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="text-xs text-gray-500">Updated just now</div>
      <Link
        to={`/topics/${topicId}`}
        className="text-sm font-medium px-3 py-1 rounded-md border border-transparent motion-safe:transition-colors hover:border-[var(--brand-1)]"
      >
        <span className="brand-text">Explore →</span>
      </Link>
    </div>
  );
}

interface ContributionBarProps {
  proportions: [number, number][];
  variant?: 'default' | 'compact';
}

function ContributionBar({ proportions, variant = 'default' }: ContributionBarProps) {
  const total = proportions.reduce((sum, [, value]) => sum + value, 0);
  if (total === 0) return null;

  const isCompact = variant === 'compact';
  const barHeight = isCompact ? 'h-1.5' : 'h-2';
  const dotSize = isCompact ? 'w-1.5 h-1.5' : 'w-2 h-2';
  const spacing = isCompact ? 'space-y-1.5' : 'space-y-2';

  // For compact, show only top 2 parties
  const displayProportions = isCompact 
    ? proportions.sort(([, a], [, b]) => b - a).slice(0, 2)
    : proportions.filter(([, value]) => (value / total) >= 0.1);

  return (
    <div className={spacing}>
      {/* Visual bar */}
      <div className={`flex ${barHeight} rounded-full overflow-hidden bg-gray-100`}>
        {proportions.map(([partyId, value]) => {
          const percentage = (value / total) * 100;
          const party = getPartyInfo(partyId);
          
          return (
            <div
              key={partyId}
              className="transition-all duration-300"
              style={{
                width: `${percentage}%`,
                backgroundColor: party.color
              }}
              title={`${party.name}: ${percentage.toFixed(1)}%`}
            />
          );
        })}
      </div>
      
      {/* Labels */}
      <div className="flex flex-wrap gap-2 text-xs">
        {displayProportions.map(([partyId, value]) => {
          const percentage = (value / total) * 100;
          const party = getPartyInfo(partyId);
          const displayName = isCompact ? party.shortName : party.name;
          
          return (
            <div key={partyId} className="flex items-center gap-1">
              <div 
                className={`${dotSize} rounded-full`}
                style={{ backgroundColor: party.color }}
              />
              <span className="text-gray-700">{displayName}</span>
              <span className="text-gray-500">{percentage.toFixed(0)}%</span>
            </div>
          );
        })}
        {isCompact && proportions.length > 2 && (
          <span className="text-gray-400 text-xs">+{proportions.length - 2}</span>
        )}
      </div>
    </div>
  );
}

function SubTopicBar({ subTopics }: { subTopics: Topic[] }) {
  if (!subTopics || subTopics.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="text-xs text-gray-600 font-medium">Related Topics</div>
      <div className="space-y-1">
        {subTopics.slice(0, 3).map((subTopic, index) => (
          <div key={subTopic.id} className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-gray-800 truncate">
                {subTopic.title}
              </div>
            </div>
            <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-500"
                style={{ 
                  width: `${Math.max(20, 100 - (index * 25))}%` // Decreasing width for visual hierarchy
                }}
              />
            </div>
          </div>
        ))}
        {subTopics.length > 3 && (
          <div className="text-xs text-gray-500 pt-1">
            +{subTopics.length - 3} more topics
          </div>
        )}
      </div>
    </div>
  );
}

function FeaturedBig({
  topic,
  rank,
  className = "",
}: {
  topic: Topic;
  rank: number;
  className?: string;
}) {
  return (
    <article
      className={`${cardBaseClasses} rounded-2xl p-6 justify-between ${cardHoverClasses} ${className}`}
      aria-label={`Rank ${rank}: ${topic.title}`}
    >
      {/* spark strip */}
      <div className="absolute inset-x-0 top-0 h-1 brand-gradient rounded-t-2xl" />

      <header className="space-y-3">
        <TopicHeader rank={rank} />
        <h3 className="text-xl md:text-2xl font-semibold leading-snug">{topic.title}</h3>
        <p className="text-sm md:text-base text-gray-700 line-clamp-4">{topic.summary}</p>
        
        {/* Party Contributions */}
        {topic.proportions && topic.proportions.length > 0 && (
          <div className="pt-1">
            <div className="text-xs text-gray-600 mb-2">Party Contributions</div>
            <ContributionBar proportions={topic.proportions} />
          </div>
        )}
      </header>

      {/* Bottom section with subtopics and action */}
      <div className="space-y-4">
        {/* Subtopics */}
        {topic.subTopics && topic.subTopics.length > 0 && (
          <SubTopicBar subTopics={topic.subTopics} />
        )}
        
        {/* Action row */}
        <TopicFooter topicId={topic.id} />
      </div>
    </article>
  );
}

function FeaturedSmall({ topic, rank }: { topic: Topic; rank: number }) {
  return (
    <article
      className={`${cardBaseClasses} rounded-xl p-4 gap-2 hover:shadow-lg hover:-translate-y-0.5`}
      aria-label={`Rank ${rank}: ${topic.title}`}
    >
      {/* thin accent line */}
      <div className="absolute inset-x-0 top-0 h-0.5 brand-gradient rounded-t-xl" />
      
      <div className="flex items-start justify-between gap-3">
        <span className="text-[11px] font-semibold text-gray-700">No. {rank}</span>
        <Link to={`/topics/${topic.id}`} className="text-xs text-blue-700 hover:underline">
          Open
        </Link>
      </div>
      
      <h4 className="text-base font-semibold leading-snug">{topic.title}</h4>
      <p className="text-sm text-gray-700 line-clamp-3">{topic.summary}</p>
      
      {/* Party Contributions - Compact Version */}
      {topic.proportions && topic.proportions.length > 0 && (
        <div className="mt-auto pt-2">
          <ContributionBar proportions={topic.proportions} variant="compact" />
        </div>
      )}
    </article>
  );
}