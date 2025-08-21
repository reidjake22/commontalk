// src/hooks/useFeaturedTopics.ts
import { useEffect, useRef, useState } from "react";
import type { FeaturedTopicOut } from "../lib/types";
import { startFeaturedTopicsJob, pollJob, getFeaturedTopicsByJob } from "../lib/api";

type State = {
  topics: FeaturedTopicOut[];
  loading: boolean;
  error: string | null;
};

const SESSION_KEY = "featured_job_id";

export function useFeaturedTopics() {
  const [state, setState] = useState<State>({ topics: [], loading: true, error: null });
  const abortRef = useRef<AbortController | null>(null);
  const runningRef = useRef(false);
  const unmountedRef = useRef(false);

  useEffect(() => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    runningRef.current = false;
    unmountedRef.current = false;

    (async () => {
      try {
        setState(s => ({ ...s, loading: true, error: null }));

        // Reuse an in-flight job if present
        let jobId = sessionStorage.getItem(SESSION_KEY) ?? null;
        if (!jobId) {
          const { job_id } = await startFeaturedTopicsJob(ctrl.signal);
          jobId = job_id;
          sessionStorage.setItem(SESSION_KEY, jobId);
        }

        // Poll with exponential backoff up to a cap (e.g., 5s)
        runningRef.current = true;
        let delay = 800; // ms
        const maxDelay = 5000; // ms

        while (runningRef.current && !unmountedRef.current) {
          // Pause polling when tab is hidden to avoid waste
          if (document.hidden) {
            await sleep(1500);
            continue;
          }

          const statusResp = await pollJob(jobId!, ctrl.signal);

          if (statusResp.status === "complete") {
            const data = await getFeaturedTopicsByJob(jobId!, ctrl.signal);
            // Expect { topics: FeaturedTopicOut[] } or { sub_topics: ... } — normalise
            const topics = Array.isArray(data?.topics)
              ? (data.topics as FeaturedTopicOut[])
              : Array.isArray(data?.sub_topics)
                ? (data.sub_topics as FeaturedTopicOut[])
                : [];
            setState({ topics, loading: false, error: null });
            runningRef.current = false;
            break;
          }

          if (statusResp.status === "error") {
            setState({ topics: [], loading: false, error: statusResp.error ?? "Unknown job error" });
            runningRef.current = false;
            break;
          }

          // queued | running
          await sleep(delay);
          delay = Math.min(maxDelay, Math.round(delay * 1.6));
        }
      } catch (e: any) {
        if (e?.name !== "AbortError") {
          setState({ topics: [], loading: false, error: e?.message ?? "Failed to fetch topics" });
        }
      } finally {
        // If we stopped due to unmount/abort, keep loading=false only if we actually have data
        setState(s => ({ ...s, loading: false }));
      }
    })();

    const onVis = () => {
      // No-op; loop checks document.hidden itself
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      unmountedRef.current = true;
      runningRef.current = false;
      document.removeEventListener("visibilitychange", onVis);
      ctrl.abort();
    };
  }, []);

  return {
    topics: state.topics,
    loading: state.loading,
    error: state.error,
    refetch: () => {
      // Optional: clear session + restart the effect by forcing a remount in caller, or
      // implement an internal restart: clear key, then repeat the logic above.
      sessionStorage.removeItem(SESSION_KEY);
      window.location.reload();
    },
  };
}

function sleep(ms: number) {
  return new Promise(res => setTimeout(res, ms));
}
