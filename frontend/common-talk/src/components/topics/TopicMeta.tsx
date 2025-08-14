// File: src/components/topics/TopicMeta.tsx
// =============================================
export function TopicHeader({ rank }: { rank: number }) {
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

export function TopicFooter({ topicId }: { topicId: number | string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="text-xs text-gray-500">Updated just now</div>
      <a
        href={`/topics/${topicId}`}
        className="text-sm font-medium px-3 py-1 rounded-md border border-transparent motion-safe:transition-colors hover:border-[var(--brand-1)]"
      >
        <span className="brand-text">Explore →</span>
      </a>
    </div>
  );
}

