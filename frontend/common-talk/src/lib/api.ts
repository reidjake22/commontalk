// File: src/lib/api.ts
// =============================================
import type { FeaturedTopicOut } from "./topic-api";

const API_BASE =
  (import.meta as any)?.env?.VITE_API_BASE ||
  "http://127.0.0.1:1000/"; // same-origin in dev when using a proxy

async function fetchJSON<T>(url: string, init?: RequestInit, retry = 1): Promise<T> {
  try {
    const res = await fetch(url, init);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as T;
  } catch (err) {
    if (retry > 0) {
      await new Promise((r) => setTimeout(r, 300));
      return fetchJSON<T>(url, init, retry - 1);
    }
    throw err;
  }
}

export function getFeaturedTopics(signal?: AbortSignal) {
  const url = `${API_BASE}/api/v1/topics/featured`;
  return fetchJSON<FeaturedTopicOut>(url, {
    signal,
    headers: { Accept: "application/json" },
  });
}
