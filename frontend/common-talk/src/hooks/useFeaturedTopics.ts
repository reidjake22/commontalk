// src/hooks/useFeaturedTopics.ts
import { useEffect, useRef, useState } from "react";
import type { FeaturedTopicOut } from "../lib/types";
import { pollFeaturedJob, getFeaturedTopicsByJob } from "../lib/api";

type State = {
  topics: FeaturedTopicOut[];
  loading: boolean;
  error: string | null;
};

const SESSION_KEY = "featured_job_id";

export function useFeaturedTopics() {
  const [state, setState] = useState<State>({ topics: [], loading: true, error: null });
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    (async () => {
      try {
        setState(s => ({ ...s, loading: true, error: null }));

        // Try to continue an existing job if we have one
        let jobId = sessionStorage.getItem(SESSION_KEY) ?? undefined;

        // Poll with exponential backoff up to a cap (e.g., 2s)
        let delay = 800; // ms
        const maxDelay = 2000; // ms

        while (true) {
          if (document.hidden) {
            await sleep(1200);
            continue;
          }

          const { job_id, status, error } = await pollFeaturedJob(jobId, ctrl.signal);
          if (!jobId && job_id) {
            jobId = job_id;
            sessionStorage.setItem(SESSION_KEY, jobId);
          }

          if (status === "complete" && jobId) {
            const data = await getFeaturedTopicsByJob(jobId, ctrl.signal);
            const topics: FeaturedTopicOut[] = Array.isArray(data?.topics)
              ? data.topics
              : Array.isArray(data?.sub_topics)
              ? data.sub_topics
              : [];
            setState({ topics, loading: false, error: null });
            break;
          }

          if (status === "error") {
            setState({ topics: [], loading: false, error: error ?? "Job failed" });
            break;
          }

          // queued | running | starting (etc.)
          await sleep(delay);
          delay = Math.min(maxDelay, Math.round(delay * 1.6));
        }
      } catch (e: any) {
        if (e?.name !== "AbortError") {
          setState({ topics: [], loading: false, error: e?.message ?? "Failed to fetch topics" });
        }
      }
    })();

    return () => {
      ctrl.abort();
    };
  }, []);

  return {
    topics: state.topics,
    loading: state.loading,
    error: state.error,
    refetch: () => {
      sessionStorage.removeItem(SESSION_KEY);
      // simplest: reload the page to restart the effect cleanly
      window.location.reload();
    },
  };
}

function sleep(ms: number) {
  return new Promise(res => setTimeout(res, ms));
}
