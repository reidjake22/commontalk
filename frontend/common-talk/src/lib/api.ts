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

export async function startFeaturedTopicsJob(signal?: AbortSignal) {
  const res = await fetch(`/api/v1/polling/featured`, {
    method: "GET",
    signal,
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Failed to start/ensure job: ${res.status}`);
  return res.json() as Promise<{ job_id: string }>;
}


export async function pollJob(jobId: string, signal?: AbortSignal): Promise<{
  job_id: string; status: "queued" | "running" | "complete" | "error";
  root_cluster_id?: string | null; error?: string | null;
}> {
  const res = await fetch(`/api/v1/polling/${jobId}`, { signal, cache: "no-store" });
  if (!res.ok) throw new Error(`Polling failed: ${res.status}`);
  return res.json();
}

export async function getFeaturedTopicsByJob(jobId: string, signal?: AbortSignal): Promise<any> {
  const res = await fetch(`/api/v1/topics/featured/${jobId}`, { signal, cache: "no-store" });
  if (!res.ok) throw new Error(`Fetching topics failed: ${res.status}`);
  return res.json(); // expect FeaturedTopicsOut shape
}
