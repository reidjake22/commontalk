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

type PollResp = { job_id: string; status: "queued" | "running" | "complete" | "error"; error?: string };

export async function pollFeaturedJob(jobId?: string, signal?: AbortSignal): Promise<PollResp> {
  const url = new URL(`${API_BASE}/api/v1/polling/featured`);
  if (jobId) url.searchParams.set("job_id", jobId);
  const res = await fetch(url.toString(), { method: "GET", signal, cache: "no-store" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Polling failed (${res.status}): ${text || res.statusText}`);
  }
  return res.json();
}

export async function getFeaturedTopicsByJob(jobId: string, signal?: AbortSignal) {
  const res = await fetch(`${API_BASE}/api/v1/topics/featured/${jobId}`, {
    method: "GET",
    signal,
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Fetching topics failed (${res.status}): ${text || res.statusText}`);
  }
  return res.json();
}
