// File: src/components/SearchBarWithFilters.tsx
// =============================================
import { useEffect, useRef, useState, type FormEvent } from "react";
import type { Filters } from "../lib/types";

const DEFAULT_FILTERS: Filters = { range: "inf" };

export default function SearchBarWithFilters({
  onSubmit,
  initialQuery = "",
  initialFilters = DEFAULT_FILTERS,
}: {
  onSubmit?: (query: string, filters: Filters) => void;
  initialQuery?: string;
  initialFilters?: Filters;
}) {
  const [q, setQ] = useState(initialQuery);
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit?.(q.trim(), filters);
  };

  // "/" focuses the input globally; "Esc" clears when focused
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
        if (tag !== "input" && tag !== "textarea") {
          e.preventDefault();
          inputRef.current?.focus();
        }
      }
      if (e.key === "Escape" && document.activeElement === inputRef.current) setQ("");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <form onSubmit={handleSubmit} role="search" className="w-full">
      {/* Desktop */}
      <div className="hidden sm:flex items-center gap-2 h-12 rounded-xl border border-gray-300 bg-white px-2">
        <div className="pl-1" aria-hidden>
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
            <path d="M13.5 13.5l4 4" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" />
            <circle cx="8.5" cy="8.5" r="6" stroke="#6b7280" strokeWidth="2" />
          </svg>
        </div>

        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search…"
          aria-label="Search"
          className="flex-1 h-11 bg-transparent outline-none text-base px-2 min-w-0"
        />

        {q && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => { setQ(""); inputRef.current?.focus(); }}
            className="rounded-md p-1 hover:bg-gray-100"
          >
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M5 5l10 10M15 5L5 15" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        )}

        <div className="h-6 w-px bg-gray-200 mx-1" />

        <label className="sr-only" htmlFor="filter-range">Date range</label>
        <select
          id="filter-range"
          value={filters.range}
          onChange={(e) => setFilters((f) => ({ ...f, range: e.target.value as Filters["range"] }))}
          className="h-9 rounded-md border border-gray-300 bg-white px-3 text-sm"
        >
          <option value="24h">Last 24h</option>
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
        </select>

        <button type="submit" className="h-9 px-4 rounded-md border border-transparent text-sm font-medium motion-safe:transition-colors hover:border-[var(--brand-1)]">
          <span className="brand-text">Search</span>
        </button>
      </div>

      {/* Mobile */}
      <div className="sm:hidden space-y-2">
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search…"
          aria-label="Search"
          className="w-full h-12 rounded-xl border border-gray-300 bg-white px-3 text-base focus:outline-none focus:ring-2 focus:ring-gray-900"
        />

        <div>
          <label className="sr-only" htmlFor="m-filter-range">Date range</label>
          <select
            id="m-filter-range"
            value={filters.range}
            onChange={(e) => setFilters((f) => ({ ...f, range: e.target.value as Filters["range"] }))}
            className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 text-sm"
          >
            <option value="24h">Last 24h</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="inf">All time</option>
          </select>
        </div>

        <button type="submit" className="w-full h-10 rounded-md border border-transparent text-sm font-medium motion-safe:transition-colors hover:border-[var(--brand-1)]">
          <span className="brand-text">Search</span>
        </button>
      </div>
    </form>
  );
}
