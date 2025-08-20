// File: src/pages/DebatePage.tsx
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";

/** ===== Helpers ===== */
function cleanText(s?: string | null): string {
  if (!s) return "";
  return s.replace(/<\/?[^>]+>/g, "").replace(/\s+\n/g, "\n").trim();
}
function capFirst(s?: string | null): string {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function fmtDate(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}
function initials(name?: string | null) {
  if (!name) return "—";
  const parts = name.replace(/\(.*?\)/g, "").trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")).toUpperCase();
}
function truncate(s: string, n = 48) {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}
/** Parliament Members API thumbnail helper (no CORS issues for <img>) */
function mpThumb(id?: number | string | null, size: 40 | 80 | 225 = 80) {
  if (!id) return null;
  return `https://members-api.parliament.uk/api/Members/${id}/Thumbnail?size=${size}`;
}

/** ===== Types (minimal) ===== */
type HansardDebate = {
  Overview: {
    ExtId: string;
    Title: string;
    Date: string;
    Location: string;
    House: string;
  };
  Items: Array<{
    ItemType: string;            // "Contribution"
    MemberId?: number | null;
    AttributedTo?: string | null;
    Value: string;
    ItemId?: number | null;      // used for exact highlight
    ExternalId?: string | null;  // used for exact highlight
  }>;
};

/** Dev uses Vite proxy (/hansard → hansard-api.parliament.uk). In prod, point to your backend proxy. */
const HANSARD_BASE = (import.meta as any).env?.VITE_HANSARD_BASE ?? "/hansard";
const debateUrl = (extId: string) => `${HANSARD_BASE}/debates/debate/${extId}.json`;

export default function DebatePage() {
  const { id: extId } = useParams(); // /debates/:id  (Hansard Overview.ExtId)
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const loc = useLocation() as {
    state?: {
      fromTopicId?: string | number;
      fromTitle?: string | null;
      fromMemberId?: string | number | null;
      itemId?: string | number | null;
      extId?: string | null;
    };
  };

  // Back-to-topic hints (prefer router state; fallback to query)
  const fromTopicId = loc.state?.fromTopicId ?? (search.get("from") || undefined);
  const fromTitle = loc.state?.fromTitle ?? (search.get("fromTitle") || undefined);

  // Highlight hints (member + exact contribution by ItemId or ExternalId)
  const highlightMemberId =
    (loc.state?.fromMemberId != null ? String(loc.state.fromMemberId) : null) ||
    (search.get("member") ? String(search.get("member")) : null);

  const wantedItemId =
    (loc.state?.itemId != null ? String(loc.state.itemId) : null) ||
    (search.get("item") ? String(search.get("item")) : null);

  const wantedExtId =
    (loc.state?.extId ? String(loc.state.extId) : null) ||
    (search.get("ext") ? String(search.get("ext")) : null);

  const [data, setData] = useState<HansardDebate | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // Robust fetch with latest-only guard + timeout; ignore harmless AbortError
  useEffect(() => {
    if (!extId) return;

    let active = true;
    const ctrl = new AbortController();
    const timeout = setTimeout(() => {
      try {
        
        ctrl.abort("timeout");
      } catch {
        ctrl.abort();
      }
    }, 15000);

    (async () => {
      try {
        setLoading(true);
        setErr(null);

        const res = await fetch(debateUrl(extId), { signal: ctrl.signal, cache: "no-store" });
        if (!res.ok) throw new Error(`Hansard fetch failed: ${res.status} ${res.statusText}`);
        const json = (await res.json()) as HansardDebate;

        if (!active) return;
        setData(json);
      } catch (e: any) {
        if (e?.name === "AbortError") return;
        if (e === "timeout" || e?.message === "timeout") {
          if (!active) return;
          setErr("Hansard took too long to respond. Please try again.");
          return;
        }
        if (!active) return;
        setErr(e?.message ?? "Failed to load debate");
      } finally {
        clearTimeout(timeout);
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
      try {
        
        ctrl.abort("cleanup");
      } catch {
        ctrl.abort();
      }
      clearTimeout(timeout);
    };
  }, [extId]);

  /** Parse contributions */
  const contributions = useMemo(() => {
    const raw = data?.Items ?? [];
    return raw
      .filter((it) => it.ItemType === "Contribution" && it.Value)
      .map((it) => {
        const text = capFirst(cleanText(it.Value));
        return {
          who: it.AttributedTo ?? "Unknown",
          text,
          memberId: it.MemberId ?? null,
          itemId: it.ItemId != null ? String(it.ItemId) : null,
          externalId: it.ExternalId ? String(it.ExternalId) : null,
        };
      })
      .filter((r) => r.text && r.text.length > 1);
  }, [data]);

  /** Auto-scroll to exact match (by item or external id) */
  useEffect(() => {
    const id = wantedItemId ? `item-${wantedItemId}` : wantedExtId ? `ext-${wantedExtId}` : null;
    if (!id) return;
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("ring-2", "ring-green-500");
      const t = setTimeout(() => el.classList.remove("ring-2", "ring-green-500"), 1200);
      return () => clearTimeout(t);
    }
  }, [wantedItemId, wantedExtId, contributions.length]);

  /** Back strip */
  const BackBar = () => (
    <div className="flex items-center gap-3 text-sm">
      {fromTopicId ? (
        <Link
          to={`/topics/${fromTopicId}`}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900/70"
        >
          <span aria-hidden>←</span>
          <span>Back to {fromTitle ? truncate(fromTitle, 48) : "topic"}</span>
        </Link>
      ) : (
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900/70"
        >
          <span aria-hidden>←</span>
          <span>Back</span>
        </button>
      )}
      <span className="text-gray-500">/</span>
      <Link to="/debates" className="text-gray-600 hover:underline">
        Debates
      </Link>
    </div>
  );

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="animate-pulse space-y-6">
          <div className="h-6 w-56 bg-gray-200 rounded" />
          <div className="h-9 w-3/4 bg-gray-200 rounded" />
          <div className="h-24 bg-gray-200 rounded-2xl" />
        </div>
      </main>
    );
  }

  if (err || !data) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10 space-y-4">
        <BackBar />
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {err ?? "Not found"}
        </div>
      </main>
    );
  }

  const { Overview: ov } = data;

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 space-y-10">
      {/* Hero */}
      <header className="space-y-4">
        <BackBar />
        <div className="brand-gradient h-1 w-12 rounded-full" />
        <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight">
          {ov.Title}
        </h1>
        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
          <time dateTime={ov.Date}>{fmtDate(ov.Date)}</time>
          <span aria-hidden>•</span>
          <span>{ov.Location} — {ov.House}</span>
          <a
            href={`https://hansard.parliament.uk/debates/${ov.ExtId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto hover:underline"
            style={{ color: "var(--brand-2)" }}
          >
            View on Hansard ↗
          </a>
        </div>
        {/* No previous/next links per your request */}
      </header>

      {/* Reader */}
      <section className="space-y-4">
        {contributions.map((c, i) => {
          const src = mpThumb(c.memberId, 80);
          const isMemberHit =
            !!(highlightMemberId && c.memberId && String(c.memberId) === String(highlightMemberId));
          const isExactHit =
            (!!wantedItemId && c.itemId && String(c.itemId) === String(wantedItemId)) ||
            (!!wantedExtId  && c.externalId && String(c.externalId) === String(wantedExtId));

          const base = "rounded-2xl border bg-white p-4 md:p-5 transition-shadow";
          const memberGlow = isMemberHit
            ? "border-green-300 shadow-[0_6px_30px_-10px_rgba(59,130,246,0.45)] bg-gradient-to-r from-green-50/40 to-transparent"
            : "border-gray-200";
          const exactGlow = isExactHit
            ? "ring-2 ring-green-500 bg-gradient-to-r from-green-100 to-transparent animate-[pulse_1.6s_ease-out_1]"
            : "";

          const anchorId =
            c.itemId ? `item-${c.itemId}` : c.externalId ? `ext-${c.externalId}` : undefined;

          return (
            <article
              key={c.itemId ?? c.externalId ?? i}
              className={`${base} ${memberGlow} ${exactGlow}`}
              id={anchorId}
              data-highlight-member={isMemberHit || undefined}
              data-highlight-exact={isExactHit || undefined}
            >
              <header className="flex items-start gap-3">
                {/* Avatar */}
                {src ? (
                  <img
                    src={src}
                    alt={c.who}
                    className={`h-9 w-9 rounded-full object-cover ring-1 ${isMemberHit ? "ring-green-300" : "ring-gray-200"}`}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className={`h-9 w-9 rounded-full ${isMemberHit ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-700"} flex items-center justify-center text-xs font-semibold`}>
                    {initials(c.who)}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  {/* Speaker → member page */}
                  {c.memberId ? (
                    <Link
                      to={`/people/${c.memberId}`}
                      className={`text-sm font-semibold ${isMemberHit ? "text-green-800 underline-offset-2 hover:underline" : "text-gray-900 hover:underline underline-offset-2"}`}
                    >
                      {c.who}
                    </Link>
                  ) : (
                    <h3 className="text-sm font-semibold text-gray-900">{c.who}</h3>
                  )}
                </div>
              </header>

              <div className="mt-3 text-[15px] leading-relaxed whitespace-pre-wrap">
                {c.text}
              </div>
            </article>
          );
        })}

        {contributions.length === 0 && (
          <div className="text-sm text-gray-600">No previewable contributions for this debate.</div>
        )}
      </section>
    </main>
  );
}
