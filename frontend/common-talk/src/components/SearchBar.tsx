import { useState, type FormEvent } from "react";

type Filters = {
  type: "all" | "topics" | "debates" | "bills";
  range: "24h" | "7d" | "30d";
};

export default function SearchBarWithFilters({
  onSubmit,
  initialQuery = "",
  initialFilters = { type: "all", range: "7d" } as Filters,
}: {
  onSubmit?: (query: string, filters: Filters) => void;
  initialQuery?: string;
  initialFilters?: Filters;
}) {
  const [q, setQ] = useState(initialQuery);
  const [filters, setFilters] = useState<Filters>(initialFilters);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit?.(q.trim(), filters);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      {/* Desktop / tablet: filters embedded on the right INSIDE the bar */}
      <div className="relative hidden sm:block">
        {/* Search icon (left) */}
        <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M13.5 13.5l4 4" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" />
            <circle cx="8.5" cy="8.5" r="6" stroke="#6b7280" strokeWidth="2" />
          </svg>
        </div>

        {/* The input reserves space on the right for the filters group */}
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search topics, debates, bills…"
          aria-label="Search"
          className="w-full h-12 rounded-xl border border-gray-300 bg-white pl-10 pr-[280px] text-base
                     focus:outline-none focus:ring-2 focus:ring-gray-900"
        />

        {/* Embedded filters group (right inside the bar) */}
        <div className="absolute right-1 top-1 bottom-1 flex items-center gap-2 p-1 bg-white/90 rounded-lg">
          <select
            aria-label="Type"
            value={filters.type}
            onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value as Filters["type"] }))}
            className="h-9 rounded-md border border-gray-300 bg-white px-3 text-sm"
          >
            <option value="all">All</option>
            <option value="topics">Topics</option>
            <option value="debates">Debates</option>
            <option value="bills">Bills</option>
          </select>

          <select
            aria-label="Date range"
            value={filters.range}
            onChange={(e) => setFilters((f) => ({ ...f, range: e.target.value as Filters["range"] }))}
            className="h-9 rounded-md border border-gray-300 bg-white px-3 text-sm"
          >
            <option value="24h">Last 24h</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </select>

          <button
            type="submit"
            className="h-9 px-4 rounded-md border border-transparent text-sm font-medium
                       motion-safe:transition-colors hover:border-[var(--brand-1)]"
          >
            <span className="brand-text">Search</span>
          </button>
        </div>
      </div>

      {/* Mobile: input first, filters stacked underneath */}
      <div className="sm:hidden space-y-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search…"
          aria-label="Search"
          className="w-full h-12 rounded-xl border border-gray-300 bg-white px-3 text-base
                     focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
        <div className="grid grid-cols-2 gap-2">
          <select
            aria-label="Type"
            value={filters.type}
            onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value as Filters["type"] }))}
            className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm"
          >
            <option value="all">All</option>
            <option value="topics">Topics</option>
            <option value="debates">Debates</option>
            <option value="bills">Bills</option>
          </select>
          <select
            aria-label="Date range"
            value={filters.range}
            onChange={(e) => setFilters((f) => ({ ...f, range: e.target.value as Filters["range"] }))}
            className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm"
          >
            <option value="24h">Last 24h</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </select>
        </div>
        <button
          type="submit"
          className="w-full h-10 rounded-md border border-transparent text-sm font-medium
                     motion-safe:transition-colors hover:border-[var(--brand-1)]"
        >
          <span className="brand-text">Search</span>
        </button>
      </div>
    </form>
  );
}
