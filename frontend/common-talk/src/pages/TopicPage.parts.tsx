// Page atoms: src/pages/TopicPage.parts.tsx
// =============================================
import { Link } from "react-router-dom";
import type { LightMemberOut, RichPointOut } from "../lib/topic-api";
import { PARTY_CONFIG } from "../lib/party";

/** Remove any angle-bracket tags, return clean text */
function cleanContributionText(text?: string | null): string {
  if (!text) return "";
  return text.replace(/<\/?[^>]+>/g, "").trim();
}

/** Capitalise first letter of a point */
function capitalisePoint(text?: string | null): string {
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1);
}


export function ContributorRow({ m }: { m: LightMemberOut }) {
  const partyMembership = m.latest_party_membership;
  const { name, color } =
    partyMembership != null && PARTY_CONFIG.hasOwnProperty(partyMembership)
      ? PARTY_CONFIG[partyMembership as unknown as keyof typeof PARTY_CONFIG]
      : { name: "Unknown", color: "#ccc" };
  return (
    <Link to={`/people/${m.member_id}`} className="flex items-center gap-3 group">
      {/* Member name with party color background */}
      <div className="min-w-0">
        <div className="text-sm font-medium truncate">{m.name_display_as}</div>
        <div className="text-[11px] text-gray-600">{name}</div>
      </div>
      <div className="ml-auto h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
    </Link>
  );
}
export function PointsList({
  points,
  onSelect,
  selectedId,
}: {
  points: RichPointOut[];
  onSelect: (id: string | number) => void;
  selectedId?: string | number;
}) {
  // Keyboard navigation on the list container
  const onKeyDown: React.KeyboardEventHandler<HTMLUListElement> = (e) => {
    if (!points.length) return;
    const idx = Math.max(
      0,
      points.findIndex((p) => String(p.point.point_id) === String(selectedId))
    );
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = points[Math.min(idx + 1, points.length - 1)];
      onSelect(next.point.point_id);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prev = points[Math.max(idx - 1, 0)];
      onSelect(prev.point.point_id);
    } else if (e.key === "Home") {
      e.preventDefault();
      onSelect(points[0].point.point_id);
    } else if (e.key === "End") {
      e.preventDefault();
      onSelect(points[points.length - 1].point.point_id);
    }
  };

  return (
    <ul
      className="divide-y divide-gray-100 outline-none"
      role="listbox"
      aria-label="Points"
      tabIndex={0}
      onKeyDown={onKeyDown}
    >
      {points.map((p) => {
        const party = p.member.latest_party_membership as keyof typeof PARTY_CONFIG | undefined;
        const partyColour = party ? PARTY_CONFIG[party]?.color : undefined;
        const isSelected = String(selectedId) === String(p.point.point_id);

        return (
          <li
            key={p.point.point_id}
            role="option"
            aria-selected={isSelected}
            className={[
              "group cursor-pointer",
              "hover:bg-gray-50 focus:bg-gray-50",
              isSelected ? "bg-blue-50/60 ring-1 ring-blue-200" : "",
            ].join(" ")}
            onClick={() => onSelect(p.point.point_id)}
          >
            <div className="flex items-start gap-3 px-3 py-3">
              {/* Avatar / party dot */}
              <div className="mt-0.5 shrink-0 relative">
                {p.member.thumbnail_url ? (
                  <img
                    src={p.member.thumbnail_url}
                    alt=""
                    className="h-8 w-8 rounded-full object-cover border border-gray-200"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-gray-200" aria-hidden />
                )}
                {partyColour && (
                  <span
                    className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-white"
                    style={{ background: partyColour }}
                    aria-hidden
                  />
                )}
              </div>

              {/* Main text (point) */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium text-gray-900">
                    {p.member.name_display_as}
                  </span>
                  {partyColour && (
                    <span
                      className="inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium text-white"
                      style={{ background: partyColour }}
                    >
                      {PARTY_CONFIG[party!]?.shortName ?? "Party"}
                    </span>
                  )}
                </div>

                <p
                  className={[
                    "text-sm text-gray-800 mt-1",
                    "line-clamp-2 group-hover:line-clamp-3",
                  ].join(" ")}
                  title={capitalisePoint(p.point.point_value) || undefined}
                >
                  {capitalisePoint(p.point.point_value) || "(no text)"}
                </p>

                <div className="mt-1 flex items-center gap-2 text-[11px] text-gray-500">
                  <span className="truncate">{p.debate.title}</span>
                  <span aria-hidden>•</span>
                  <span>{p.debate.date ?? "—"}</span>
                </div>
              </div>

              {/* Chevron / affordance */}
              <div className="hidden sm:block shrink-0 self-center opacity-0 group-hover:opacity-100 transition-opacity">
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
                  <path fill="currentColor" d="m9 18l6-6l-6-6v12z" />
                </svg>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function ContributionPreview({
  data,
  fromTopicId,
  fromTitle,
}: {
  data: RichPointOut;
  fromTopicId?: string | number;
  fromTitle?: string | null;
}) {
  const party = data.member.latest_party_membership as keyof typeof PARTY_CONFIG | undefined;
  const partyColour = party ? PARTY_CONFIG[party]?.color : undefined;

  const debatePath = `/debates/${data.debate.ext_id}`;
  const memberId = data.member.member_id;
  const itemId = data.contribution?.item_id ? String(data.contribution.item_id) : undefined;
  const extId  = data.contribution?.ext_id  ? String(data.contribution.ext_id)  : undefined;

  // Build shareable query: prefer exact IDs (item/ext) + member for soft highlight
  const qs = new URLSearchParams();
  if (itemId) qs.set("item", itemId);
  if (extId)  qs.set("ext", extId);
  if (memberId != null) qs.set("member", String(memberId));
  if (fromTopicId != null) qs.set("from", String(fromTopicId));
  if (fromTitle) qs.set("fromTitle", fromTitle);

  const shareUrl = `${window.location.origin}${debatePath}?${qs.toString()}`;

  return (
    <article className="space-y-3">
      <header className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          {data.member.thumbnail_url ? (
            <img
              src={data.member.thumbnail_url}
              alt=""
              className="h-8 w-8 rounded-full object-cover border border-gray-200"
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-gray-200" aria-hidden />
          )}
          <div className="flex items-center gap-2">
            {memberId != null ? (
              <Link
                to={`/people/${memberId}`}
                className="text-sm font-semibold text-gray-900 underline-offset-2 hover:underline"
              >
                {data.member.name_display_as}
              </Link>
            ) : (
              <h3 className="text-sm font-semibold text-gray-900">{data.member.name_display_as}</h3>
            )}
            {partyColour && (
              <span
                className="inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium text-white"
                style={{ background: partyColour }}
              >
                {PARTY_CONFIG[party!]?.shortName ?? "Party"}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-600">
          <span aria-hidden>•</span>
          <Link
            to={{ pathname: debatePath, search: `?${qs.toString()}` }}
            state={{
              fromTopicId,
              fromTitle,
              fromMemberId: memberId ?? undefined,
              // also pass via state, in case you prefer state over query in the future
              itemId,
              extId,
            }}
            className="underline-offset-2 hover:underline"
          >
            {data.debate.title}
          </Link>
          <span aria-hidden>•</span>
          <span>{data.debate.date ?? "—"}</span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            title="Copy deep link (with highlight)"
            className="rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-xs hover:bg-gray-50"
            onClick={() => navigator.clipboard.writeText(shareUrl)}
          >
            Copy link
          </button>
          <Link
            to={{ pathname: debatePath, search: `?${qs.toString()}` }}
            state={{ fromTopicId, fromTitle, fromMemberId: memberId ?? undefined, itemId, extId }}
            className="rounded-lg border border-gray-900/10 bg-gray-900/90 text-white px-2.5 py-1 text-xs hover:bg-gray-900"
          >
            Open debate
          </Link>
        </div>
      </header>

      <p className="text-base font-medium text-gray-900 leading-snug">
        {capitalisePoint(data.point.point_value) || "(no title)"}
      </p>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 text-[15px] leading-relaxed">
        {data.contribution.contribution_value ? (
          <p className="whitespace-pre-wrap">
            {cleanContributionText(data.contribution.contribution_value)}
          </p>
        ) : (
          <p className="text-gray-500">No text available.</p>
        )}
      </div>
    </article>
  );
}

export function DebatePills({
  debates,
  limit = 10,
}: {
  debates?: Array<{ ext_id: string; title: string; date?: string | null; house?: string | null; location?: string | null }>;
  limit?: number;
}) {
  if (!debates || debates.length === 0) return null;
  return (
    <div className="mt-6">
      <div className="text-xs text-gray-500 mb-2">Related debates</div>
      <div className="flex flex-wrap gap-2">
        {debates.slice(0, limit).map((d) => (
          <a
            key={d.ext_id}
            href={`/debates/${d.ext_id}`}
            className="inline-flex max-w-full items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-700 hover:bg-gray-50"
            title={d.title}
          >
            <span className="truncate">{d.title}</span>
            {d.date && (
              <>
                <span aria-hidden>·</span>
                <time className="text-gray-500">{d.date}</time>
              </>
            )}
          </a>
        ))}
      </div>
    </div>
  );
}
