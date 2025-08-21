// =============================================
// File: src/hooks/useFeaturedTopics.ts
// =============================================
import { useEffect, useRef, useState } from "react";
import type { FeaturedTopicOut } from "../lib/types";
import { getFeaturedTopics } from "../lib/api";

export function useFeaturedTopics() {
  const [topics, setTopics] = useState<FeaturedTopicOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getFeaturedTopics(controller.signal);
        // If API returns { topics: [...] }
        if (data && Array.isArray(data.sub_topics)) {
          setTopics(
            data.sub_topics.map((topic: any) => ({
              ...topic,
              title: topic.title ?? "",
            }))
          );
        } else {
          setTopics([]);
          setError("Unexpected API shape");
        }
      } catch (e: any) {
        if (e?.name !== "AbortError") setError(e?.message ?? "Failed to fetch topics");
        setTopics([]);
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, []);

  return { topics, loading, error, refetch: () => {} };
}
