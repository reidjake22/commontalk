import { useCallback, useEffect, useRef, useState } from "react";
import { fetchClusterRichPoints } from "../lib/points-api";
import type { RichPointOut } from "../lib/topic-api";
import type { PagedResponse, PageMeta } from "../lib/types";

type Seed = {
  data?: RichPointOut[];
  meta?: Partial<PageMeta> | null;
};

export function useInfiniteRichPoints(
  clusterId: number | string | undefined,
  pageSize = 50,
  seed?: Seed
) {
  const [items, setItems] = useState<RichPointOut[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);     // older
  const [prevCursor, setPrevCursor] = useState<string | null>(null);     // newer
  const [loadingDown, setLoadingDown] = useState(false);
  const [loadingUp, setLoadingUp] = useState(false);
  const [doneDown, setDoneDown] = useState(false);
  const [doneUp, setDoneUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const seen = useRef<Set<string>>(new Set());
  const started = useRef(false);

  // Seed once when cluster changes
  useEffect(() => {
    // reset all
    setItems([]);
    setNextCursor(null);
    setPrevCursor(null);
    setLoadingDown(false);
    setLoadingUp(false);
    setDoneDown(false);
    setDoneUp(false);
    setError(null);
    seen.current = new Set();
    started.current = false;

    if (!clusterId) return;

    // apply seed if provided
    if (seed?.data && seed.data.length) {
      const fresh: RichPointOut[] = [];
      for (const r of seed.data) {
        const key = String(r.point.point_id);
        if (!seen.current.has(key)) { seen.current.add(key); fresh.push(r); }
      }
      setItems(fresh);
      // normalize meta.props possibly using prev_cursor
      const m = seed.meta || {};
      setNextCursor((m as any).next_cursor ?? null);
      setPrevCursor((m as any).previous_cursor ?? (m as any).prev_cursor ?? null);
      // If the first response already had no next_cursor, we’re done for down
      if (!((m as any).next_cursor)) setDoneDown(true);
      if (!((m as any).previous_cursor)) setDoneUp(true);
      started.current = true; // we already have first page
    }
  }, [clusterId, pageSize, seed?.data, seed?.meta]);

  const loadMore = useCallback(async () => {
    if (!clusterId || loadingDown || doneDown) return;
    setLoadingDown(true);
    setError(null);
    try {
      const page: PagedResponse<RichPointOut> = await fetchClusterRichPoints({
        clusterId,
        limit: pageSize,
        after_point_id: started.current ? nextCursor : null, // older
      });
      started.current = true;

      const fresh: RichPointOut[] = [];
      for (const r of page.data) {
        const key = String(r.point.point_id);
        if (!seen.current.has(key)) { seen.current.add(key); fresh.push(r); }
      }
      setItems(prev => prev.concat(fresh));
      setNextCursor(page.meta.next_cursor ?? null);
      setPrevCursor(page.meta.previous_cursor ?? null);

      if (!page.meta.next_cursor || page.data.length === 0) setDoneDown(true);
      if (!page.meta.previous_cursor) setDoneUp(true);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load points");
    } finally {
      setLoadingDown(false);
    }
  }, [clusterId, pageSize, loadingDown, doneDown, nextCursor]);

  const loadNewer = useCallback(async () => {
    if (!clusterId || loadingUp || doneUp || !prevCursor) return;
    setLoadingUp(true);
    setError(null);
    try {
      const page = await fetchClusterRichPoints({
        clusterId,
        limit: pageSize,
        before_point_id: prevCursor, // newer
      });

      const fresh: RichPointOut[] = [];
      for (const r of page.data) {
        const key = String(r.point.point_id);
        if (!seen.current.has(key)) { seen.current.add(key); fresh.push(r); }
      }
      setItems(prev => fresh.concat(prev)); // prepend newer
      setPrevCursor(page.meta.previous_cursor ?? null);
      if (!page.meta.previous_cursor || page.data.length === 0) setDoneUp(true);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load newer points");
    } finally {
      setLoadingUp(false);
    }
  }, [clusterId, pageSize, loadingUp, doneUp, prevCursor]);

  return { items, error, loadMore, loadNewer, loadingDown, loadingUp, doneDown, doneUp };
}
