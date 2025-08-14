
// =============================================
// File: src/components/Header.tsx
// =============================================
import { Link } from "react-router-dom";
import SearchBar from "./SearchBarWithFilters";
import { Separator } from "./ui/Separator";

const NAV_ITEMS = [
  { to: "/topics", label: "Topics" },
  { to: "/debates", label: "Debates" },
  { to: "/people", label: "People" },
] as const;

function NavItem({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link to={to} className="relative text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors group">
      {children}
      <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 brand-gradient group-hover:w-full transition-all duration-200" />
    </Link>
  );
}

const headerClasses = `
  w-full relative overflow-hidden
  bg-gradient-to-br from-white via-gray-50 to-blue-50
  border-b border-gray-200/50
`;

export function Header() {
  return (
    <header className={headerClasses}>
      {/* Backgrounds */}
      <div className="absolute inset-0 bg-[url('/common-talk-title-bg.png')] bg-no-repeat bg-right bg-contain md:bg-[length:auto_100%] opacity-10" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-100/30 to-transparent rounded-full -translate-y-32 translate-x-32" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-green-100/20 to-transparent rounded-full translate-y-16 -translate-x-16" />

      <div className="relative mx-auto max-w-6xl px-4 pt-8 pb-6">
        <div className="flex items-center justify-between gap-4 mb-8">
          <Link to="/" className="flex items-center gap-4">
            <div className="relative">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-gray-900 to-gray-700 shadow-lg flex items-center justify-center">
                <div className="w-6 h-6 brand-gradient rounded-sm" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />
            </div>
            <div>
              <h1 className="font-serif text-4xl md:text-5xl font-bold leading-none tracking-tight brand-text">Common Talk</h1>
              <p className="text-sm text-gray-600 font-medium mt-1">Where Politics Meets People</p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {NAV_ITEMS.map(({ to, label }) => (
              <NavItem key={to} to={to}>{label}</NavItem>
            ))}
            <Link to="/login" className="px-4 py-2 text-sm font-medium bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all shadow-sm">Sign In</Link>
          </nav>

          <button className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors" aria-label="Open menu">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
        </div>

        <div className="text-center mb-8">
          <h2 className="text-xl md:text-2xl font-semibold text-gray-800 mb-2">Discover What Matters in UK Politics</h2>
          <p className="text-gray-600 max-w-2xl mx-auto mb-6">Search through parliamentary debates, track trending topics, and follow the conversations shaping our democracy.</p>
        </div>

        <div className="max-w-3xl mx-auto">
          <SearchBar onSubmit={(query, filters) => console.log({ query, filters })} />
        </div>

        <div className="flex justify-center items-center gap-8 mt-8 text-sm text-gray-600 flex-wrap">
          <div className="flex items-center gap-2"><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /><span>Live debates tracking</span></div>
          <Separator />
          <div className="hidden sm:flex items-center gap-2"><span className="font-semibold text-gray-800">50k+</span><span>Parliamentary speeches analyzed</span></div>
          <Separator className="hidden md:block" />
          <div className="hidden md:flex items-center gap-2"><span className="font-semibold text-gray-800">Daily</span><span>Updates from Westminster</span></div>
        </div>
      </div>

      <div className="h-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
      <div className="h-[3px] brand-gradient" />
    </header>
  );
}
