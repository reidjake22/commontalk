import { Link } from "react-router-dom";

type Member = {
  id: number | string;
  name: string;
  role: string;
  avatar: string;
  // add whatever else you need (party, constituency, etc.)
};

export function FeaturedPeople({ members, big = true }: { members: Member[]; big?: boolean }) {
  if (members.length === 0) return null;

  // If big layout: show 1 big + 4 small (original layout)
  if (big) {
    const top = members.slice(0, 7);
    const [first, ...rest] = top;

    return (
      <section aria-labelledby="featured-people-heading" className="space-y-4">
        <div className="brand-gradient h-1 w-10 rounded-full" />
        <h2 id="featured-people-heading" className="text-2xl md:text-3xl font-serif tracking-tight">
          Featured People
        </h2>

        {/* GRID:
            - Mobile: 1 column (stacks 1..5)
            - LG: 4 columns. #1 spans 2 cols × 2 rows; #2-5 auto-fill the right half in a 2×2. */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-4 lg:auto-rows-[minmax(8rem,auto)]">
          {/* #1 — big tile (left), spans two rows & two cols at lg */}
          <FeaturedBig key={first.id} member={first} rank={1} className="lg:col-span-2 lg:row-span-2" />

          {/* #2-#5 — small tiles (right), naturally fill into a 2×2 next to #1 on lg */}
          {rest.map((m, i) => (
            <FeaturedSmall key={m.id} member={m} rank={i + 2} />
          ))}
        </div>
      </section>
    );
  }

  // If small layout: show 6 small tiles in a grid
  const top6 = members.slice(0, 8);

  return (
    <section aria-labelledby="featured-people-heading" className="space-y-4">
      <div className="brand-gradient h-1 w-10 rounded-full" />
      <h2 id="featured-people-heading" className="text-2xl md:text-3xl font-serif tracking-tight">
        Featured People
      </h2>

      {/* 6 small tiles in a responsive grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {top6.map((m, i) => (
          <FeaturedSmall key={m.id} member={m} rank={i + 1} />
        ))}
      </div>
    </section>
  );
}

function FeaturedBig({
  member,
  rank,
  className = "",
}: {
  member: Member;
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
      aria-label={`Rank ${rank}: ${member.name}`}
    >
      {/* spark strip */}
      <div className="absolute inset-x-0 top-0 h-1 brand-gradient rounded-t-2xl" />

      <header className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center text-xs font-semibold rounded-full px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200">
            No. {rank}
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-800">
            <span className="brand-text">Active</span>
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
            {member.avatar && member.avatar !== "…" ? (
              <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-bold text-gray-600">
                {member.name.split(' ').map(n => n[0]).join('')}
              </span>
            )}
          </div>
          <div>
            <h3 className="text-xl md:text-2xl font-semibold leading-snug">{member.name}</h3>
            <p className="text-sm text-gray-600 font-medium">{member.role}</p>
          </div>
        </div>
      </header>

      <div className="mt-4 flex items-center justify-between">
        <div className="text-xs text-gray-500">Currently active</div>
        <Link
          to={`/people/${member.id}`}
          className="text-sm font-medium px-3 py-1 rounded-md border border-transparent motion-safe:transition-colors hover:border-[var(--brand-1)]"
        >
          <span className="brand-text">View Profile →</span>
        </Link>
      </div>
    </article>
  );
}

function FeaturedSmall({ member, rank }: { member: Member; rank: number }) {
  return (
    <article
      className="relative h-full bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-3
                 motion-safe:transition-all motion-safe:duration-200 hover:shadow-lg hover:-translate-y-0.5"
      aria-label={`Rank ${rank}: ${member.name}`}
    >
      {/* thin accent line */}
      <div className="absolute inset-x-0 top-0 h-0.5 brand-gradient rounded-t-xl" />
      
      <div className="flex items-start justify-between gap-3">
        <span className="text-[11px] font-semibold text-gray-700">No. {rank}</span>
        <Link to={`/people/${member.id}`} className="text-xs text-blue-700 hover:underline">
          View
        </Link>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
          {member.avatar && member.avatar !== "…" ? (
            <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-sm font-bold text-gray-600">
              {member.name.split(' ').map(n => n[0]).join('')}
            </span>
          )}
        </div>
        <div className="min-w-0">
          <h4 className="text-base font-semibold leading-snug truncate">{member.name}</h4>
          <p className="text-sm text-gray-600 truncate">{member.role}</p>
        </div>
      </div>
    </article>
  );
}