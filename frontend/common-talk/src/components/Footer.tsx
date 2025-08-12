

export function Footer() {
  return (
    <footer className="mt-auto border-t bg-white">
      <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-gray-600 flex flex-wrap items-center justify-between gap-4">
        <span>&copy; {new Date().getFullYear()} Common Talk</span>
        <nav className="flex items-center gap-4">
          <a href="#" className="hover:underline">About</a>
          <a href="#" className="hover:underline">API</a>
          <a href="#" className="hover:underline">GitHub</a>
          <a href="#" className="hover:underline">Contact</a>
        </nav>
      </div>
    </footer>
  );
}
