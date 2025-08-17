import { useEffect, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

export default function SearchPage() {
  const { topicId } = useParams();
  const [search] = useSearchParams();
  const navigate = useNavigate();

  const stopped = useRef(false);
  const navigating = useRef(false);

  useEffect(() => {
    const ctrl = new AbortController();
    let delay = 1000; // start 1s, backoff to 3s max

    const loop = async () => {
      try {
        const res = await fetch(`/api/v1/topics/${topicId}`, {
          signal: ctrl.signal,
          cache: "no-store",
        });

        if (res.status === 200) {
          const d = await res.json();
          if (!navigating.current) {
            navigating.current = true;
            // preserve any ?point=… etc; pass the payload so TopicPage can skip refetch
            const qp = search.toString();
            navigate(`/topics/${topicId}${qp ? `?${qp}` : ""}`, {
              replace: true,
              state: { preloaded: d },
            });
          }
          return;
        }

        // Treat 202 or 404 as "still building"
        if (res.status === 202 || res.status === 404) {
          const retryMs =
            (Number(res.headers.get("Retry-After") || 0) || 0) * 1000 || delay;
          if (!stopped.current) setTimeout(loop, retryMs);
          delay = Math.min(delay + 500, 3000);
          return;
        }

        // Hard error (show an error page if you like)
        console.error("Error loading topic:", res.status);
        if (!stopped.current) setTimeout(loop, delay);
        delay = Math.min(delay + 500, 3000);
      } catch (e: any) {
        if (e?.name !== "AbortError" && !stopped.current) {
          setTimeout(loop, delay);
          delay = Math.min(delay + 500, 3000);
        }
      }
    };

    loop();
    return () => {
      stopped.current = true;
      ctrl.abort();
    };
  }, [topicId, navigate, search]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-2/3 bg-gray-200 rounded" />
        <div className="h-4 w-1/2 bg-gray-200 rounded" />
        <div className="h-32 bg-gray-200 rounded-xl" />
        <div className="text-xs text-gray-500">Building topic…</div>
      </div>
    </main>
  );
}
