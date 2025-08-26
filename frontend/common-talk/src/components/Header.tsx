// src/components/Header.tsx
// =============================================
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useMemo } from "react";
import SearchBar from "./SearchBarWithFilters";
import { Separator } from "./ui/Separator";
import { makeSearchSubmit } from "../lib/searchSubmit";

const NAV_ITEMS = [
] as const;

// Read from env if you like (Vite example), else fallback to localhost
const API_BASE = (import.meta as any).env?.VITE_API_BASE ?? "http://127.0.0.1:7000";

function NavItem({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="relative text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors group
                 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900/70 rounded"
    >
      {children}
      <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 brand-gradient group-hover:w-full transition-all duration-200" />
    </Link>
  );
}

export function Header() {
  const navigate = useNavigate();
  const onSubmit = useMemo(() => makeSearchSubmit(navigate, API_BASE), [navigate]);
  const { pathname } = useLocation();
  const isHome = pathname === "/";

  return (
    <header
      className={[
        "w-full border-b border-gray-200/50",
        isHome ? "relative overflow-hidden bg-gradient-to-br from-white via-gray-50 to-blue-50" : "bg-white",
      ].join(" ")}
    >
      {/* Decorative backgrounds only on home */}
      {isHome && (
        <>
          <div
            className="absolute inset-0 bg-[url('/common-talk-title-bg.png')] bg-no-repeat bg-right opacity-10
                       bg-[length:220px_auto] sm:bg-[length:320px_auto] md:bg-[length:auto_100%]"
            aria-hidden
          />
          <div className="absolute top-0 right-0 w-80 h-80 md:w-96 md:h-96 bg-gradient-to-bl from-blue-100/30 to-transparent rounded-full -translate-y-24 md:-translate-y-32 translate-x-24 md:translate-x-32" />
          <div className="absolute bottom-0 left-0 w-56 h-56 md:w-64 md:h-64 bg-gradient-to-tr from-green-100/20 to-transparent rounded-full translate-y-12 md:translate-y-16 -translate-x-12 md:-translate-x-16" />
        </>
      )}

      <div
        className={[
          "relative mx-auto max-w-6xl px-4",
          isHome ? "pt-8 pb-6" : "py-4 pb-6",
        ].join(" ")}
      >
        {/* Top row: logo + nav + auth */}
        <div className={["flex items-center justify-between gap-4", isHome ? "mb-8" : "mb-0"].join(" ")}>
          <Link to="/" className="flex items-center gap-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900/70 rounded">
            <div className="relative">
              <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-gradient-to-br from-gray-900 to-gray-700 shadow-lg flex items-center justify-center">
                <div className="w-5 h-5 md:w-6 md:h-6 brand-gradient rounded-sm" />
              </div>
              {isHome && (
                <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white animate-pulse" />
              )}
            </div>
            <div>
              <h1 className={["font-serif font-bold leading-none tracking-tight brand-text", isHome ? "text-4xl md:text-5xl" : "text-2xl"].join(" ")}>
                Common Talk
              </h1>
              {isHome && <p className="text-sm text-gray-600 font-medium mt-1">Where Politics Meets People</p>}
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {NAV_ITEMS.map(({ to, label }) => (
              <NavItem key={to} to={to}>{label}</NavItem>
            ))}

          </nav>

          <button className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors" aria-label="Open menu">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Hero (home only): tagline + search + metrics */}
        {isHome && (
          <>
            <div className="text-center mb-8 max-w-3xl mx-auto">
              <h2 className="text-xl md:text-2xl font-semibold text-gray-800 mb-2">
                Discover what matters in UK politics
              </h2>
              <p className="text-gray-600">
                Experimental site to search parliamentary debates, track topics, and follow the conversations shaping our democracy.
              </p>
            </div>

            <div className="max-w-3xl mx-auto">
              <SearchBar onSubmit={onSubmit} />
            </div>

            <div className="flex justify-center items-center gap-6 md:gap-8 mt-8 text-sm text-gray-600 flex-wrap">
              <Separator />
              <div className="hidden sm:flex items-center gap-2">
                <span className="font-semibold text-gray-800">50k+</span>
                <span>Speeches analysed</span>
              </div>
              <Separator className="hidden md:block" />
              <div className="hidden md:flex items-center gap-2">
                <span className="font-semibold text-gray-800">Daily</span>
                <span>Updates from Westminster</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Bottom accents only on home */}
      {isHome && (
        <>
          <div className="h-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent" aria-hidden />
          <div className="h-[3px] brand-gradient" aria-hidden />
        </>
      )}
    </header>
  );
}
