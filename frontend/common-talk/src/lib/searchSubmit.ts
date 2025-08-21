// src/lib/searchSubmit.ts
import type { Filters, SearchTerms } from "./types";

/** Map UI range -> ISO dates (YYYY-MM-DD) */
export function rangeToDates(range: Filters["range"]) {
  const now = new Date();
  const end_date = now.toISOString().slice(0, 10);
  const days = range === "24h" ? 1 : range === "7d" ? 7 : range === "30d" ? 30 : range === "inf" ? 10000 : 30; ///// REPLACE THIS
  const start = new Date(now);
  start.setDate(now.getDate() - days);
  const start_date = start.toISOString().slice(0, 10);
  return { start_date, end_date };
}

async function postSearch(apiBase: string, body: SearchTerms) {
  console.log("search url", apiBase,"/api/v1/search/" );
  const res = await fetch(`${apiBase}/api/v1/search/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Search failed (${res.status}): ${text || res.statusText}`);
  }
  return res.json() as Promise<{ job_id?: string } & Record<string, unknown>>;
}

/**
 * Factory that returns the exact `onSubmit` handler your SearchBar expects.
 * It posts, reads `job_id`, then redirects to the Flask polling endpoint.
 */
export function makeSearchSubmit(navigate: (path: string) => void,apiBase: string) {
  return async (q: string, filters: Filters) => {
    const { start_date, end_date } = rangeToDates(filters.range);
    const payload: SearchTerms = {
      query: q || null,
      member: null, // not using yet
      party: null,
      start_date,
      end_date,
    };

    const json = await postSearch(apiBase, payload);
    console.log("Search job response:", json);
    const jobId = json.job_id;
    console.log(jobId)
    if (!jobId) throw new Error("No job_id in response");

    // Full redirect to Flask polling route
    navigate(`/search/${jobId}`);
  };
}
