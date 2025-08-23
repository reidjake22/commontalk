import { useEffect, useMemo, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

export default function SearchPage() {
  const { jobId } = useParams();
  const [search] = useSearchParams();
  const navigate = useNavigate();

  const stopped = useRef(false);
  const navigating = useRef(false);

  // Stable query-string for deps; avoids effect restarts from object identity churn
  const qp = useMemo(() => search.toString(), [search]);

  useEffect(() => {
    stopped.current = false;             // ✅ reset on (re)run
    let delay = 1000;                    // backoff: 1s → 3s
    let timer: ReturnType<typeof setTimeout> | null = null;
    let inFlight: AbortController | null = null;

    const loop = async () => {
      if (stopped.current) return;

      // Ensure only one request at a time (optional but robust)
      inFlight?.abort();
      const ctrl = new AbortController();
      inFlight = ctrl;

      try {
        const res = await fetch(`https://api.commontalk.co.uk/api/v1/polling/${jobId}`, {
          signal: ctrl.signal,
          cache: "no-store",
        });

        if (res.status === 200) {
          const d = await res.json();

          if (d.status === "complete" && d.root_cluster_id && !navigating.current) {
            navigating.current = true;
            navigate(`/topics/${d.root_cluster_id}${qp ? `?${qp}` : ""}`, {
              replace: true,
              state: { preloaded: d },
            });
            return; // stop polling after navigation
          }

          // still building → schedule next tick
          if (!stopped.current) {
            timer = setTimeout(loop, delay);
            delay = Math.min(delay + 500, 3000);
          }
          return;
        }

        // 202/404 → still building
        if (res.status === 202 || res.status === 404) {
          const retryMs =
            (Number(res.headers.get("Retry-After") || 0) || 0) * 1000 || delay;
          if (!stopped.current) {
            timer = setTimeout(loop, retryMs);
            delay = Math.min(delay + 500, 3000);
          }
          return;
        }

        // Hard error → backoff and retry
        console.error("Error loading topic:", res.status);
        if (!stopped.current) {
          timer = setTimeout(loop, delay);
          delay = Math.min(delay + 500, 3000);
        }
      } catch (e: any) {
        if (e?.name !== "AbortError" && !stopped.current) {
          timer = setTimeout(loop, delay);
          delay = Math.min(delay + 500, 3000);
        }
      }
    };

    loop();

    return () => {
      stopped.current = true;       // ✅ prevents rescheduling
      inFlight?.abort();            // cancel any in-flight request
      if (timer) clearTimeout(timer); // ✅ prevent stray timer firing after cleanup
    };
  }, [jobId, navigate, qp]);        // ❌ don’t depend on raw `search`

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
