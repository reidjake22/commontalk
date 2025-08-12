import { Link } from "react-router-dom";

type Debate = {
  id: number | string;
  title: string;
  summary: string;
  // add whatever else you need (party mix, contributors, date, etc.)
};

export function FeaturedDebates({ debates, big = true }: { debates: Debate[]; big?: boolean }) {
  if (debates.length === 0) return null;

  // If big layout: show 1 big + 4 small (original layout)
  if (big) {
    const top = debates.slice(0, 5);
    const [first, ...rest] = top;

    return (
      <section aria-labelledby="featured-heading" className="space-y-4">
        <div className="brand-gradient h-1 w-10 rounded-full" />
        <h2 id="featured-heading" className="text-2xl md:text-3xl font-serif tracking-tight">
          Featured Debates
        </h2>

        {/* GRID:
            - Mobile: 1 column (stacks 1..5)
            - LG: 4 columns. #1 spans 2 cols × 2 rows; #2-5 auto-fill the right half in a 2×2. */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-4 lg:auto-rows-[minmax(8rem,auto)]">
          {/* #1 — big tile (left), spans two rows & two cols at lg */}
          <FeaturedBig key={first.id} debate={first} rank={1} className="lg:col-span-2 lg:row-span-2" />

          {/* #2-#5 — small tiles (right), naturally fill into a 2×2 next to #1 on lg */}
          {rest.map((d, i) => (
            <FeaturedSmall key={d.id} debate={d} rank={i + 2} />
          ))}
        </div>
      </section>
    );
  }

  // If small layout: show 6 small tiles in a grid
  const top6 = debates.slice(0, 6);

  return (
    <section aria-labelledby="featured-heading" className="space-y-4">
      <div className="brand-gradient h-1 w-10 rounded-full" />
      <h2 id="featured-heading" className="text-2xl md:text-3xl font-serif tracking-tight">
        Featured Debates
      </h2>

      {/* 6 small tiles in a responsive grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {top6.map((d, i) => (
          <FeaturedSmall key={d.id} debate={d} rank={i + 1} />
        ))}
      </div>
    </section>
  );
}

function FeaturedBig({
  debate,
  rank,
  className = "",
}: {
  debate: Debate;
  rank: number;
  className?: string;
}) {
  return (
    <article
      className={
        "relative h-full bg-white rounded-2xl border border-gray-200 p-6 flex flex-col justify-between " +
        "motion-safe:transition-all motion-safe:duration-200 hover:shadow-xl hover:-translate-y-0.5 " +
        className
      }
      aria-label={`Rank ${rank}: ${debate.title}`}
    >
      {/* spark strip */}
      <div className="absolute inset-x-0 top-0 h-1 brand-gradient rounded-t-2xl" />

      <header className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center text-xs font-semibold rounded-full px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200">
            No. {rank}
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-800">
            <span className="brand-text">Hot Debate</span>
          </span>
        </div>
        <h3 className="text-xl md:text-2xl font-semibold leading-snug">{debate.title}</h3>
        <p className="text-sm md:text-base text-gray-700 line-clamp-5">{debate.summary}</p>
      </header>

      <div className="mt-4 flex items-center justify-between">
        {/* room for tiny sparkline/party bar later */}
        <div className="text-xs text-gray-500">Debate ongoing</div>
        <Link
          to={`/debates/${debate.id}`}
          className="text-sm font-medium px-3 py-1 rounded-md border border-transparent motion-safe:transition-colors hover:border-[var(--brand-1)]"
        >
          <span className="brand-text">Join Debate →</span>
        </Link>
      </div>
    </article>
  );
}

function FeaturedSmall({ debate, rank }: { debate: Debate; rank: number }) {
  return (
    <article
      className="relative h-full bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-2
                 motion-safe:transition-all motion-safe:duration-200 hover:shadow-lg hover:-translate-y-0.5"
      aria-label={`Rank ${rank}: ${debate.title}`}
    >
      {/* thin accent line */}
      <div className="absolute inset-x-0 top-0 h-0.5 brand-gradient rounded-t-xl" />
      <div className="flex items-start justify-between gap-3">
        <span className="text-[11px] font-semibold text-gray-700">No. {rank}</span>
        <Link to={`/debates/${debate.id}`} className="text-xs text-blue-700 hover:underline">
          View
        </Link>
      </div>
      <h4 className="text-base font-semibold leading-snug">{debate.title}</h4>
      <p className="text-sm text-gray-700 line-clamp-3">{debate.summary}</p>
    </article>
  );
}
