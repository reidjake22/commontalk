import { type RichPointOut } from "./topic-api";
import { type PageMeta, type PagedResponse} from "./types.ts"

const API_BASE = (import.meta as any).env?.VITE_API_BASE ?? "http://127.0.0.1:5000";

function normalizeMeta(meta: any): PageMeta {
  return {
    next_cursor: meta?.next_cursor ?? null,
    previous_cursor: meta?.previous_cursor ?? meta?.prev_cursor ?? null, // ← normalize here
    total_count: typeof meta?.total_count === "number" ? meta.total_count : undefined,
  };
}

export async function fetchClusterRichPoints(opts: {
  clusterId: number | string;
  limit?: number;
  after_point_id?: number | string | null;   // older
  before_point_id?: number | string | null;  // newer
  signal?: AbortSignal;
}): Promise<PagedResponse<RichPointOut>> {
  const { clusterId, limit, after_point_id, before_point_id, signal } = opts;
  const url = new URL(`${API_BASE}/api/v1/topics/${clusterId}/points`, window.location.origin);
  if (limit != null) url.searchParams.set("limit", String(limit));
  if (after_point_id != null) url.searchParams.set("after_point_id", String(after_point_id));
  if (before_point_id != null) url.searchParams.set("before_point_id", String(before_point_id));

  const res = await fetch(url.toString(), { signal, cache: "no-store" });
  if (!res.ok) throw new Error(`fetchClusterRichPoints ${res.status}`);
  const json = await res.json();

  return {
    data: json.data as RichPointOut[],
    meta: normalizeMeta(json.meta),
  };
};

