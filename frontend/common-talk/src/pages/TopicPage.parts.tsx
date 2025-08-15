// Page atoms: src/pages/TopicPage.parts.tsx
// =============================================
import { Link } from "react-router-dom";
import type { LightMemberOut, RichPointOut } from "../lib/topic-api";
import { resolvePartyByString } from "../lib/party-resolver";

export function ContributorRow({ m }: { m: LightMemberOut }) {
  const { label, color } = resolvePartyByString(m.latest_party_membership);
  return (
    <Link to={`/people/${m.member_id}`} className="flex items-center gap-3 group">
      <div className="h-8 w-8 rounded-full bg-gray-200 overflow-hidden">
        {/* optional <img src={m.thumbnail_url || ''} alt="" /> */}
      </div>
      <div className="min-w-0">
        <div className="text-sm font-medium truncate">{m.name_display_as}</div>
        <div className="text-[11px] text-gray-600">{label}</div>
      </div>
      <div className="ml-auto h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
    </Link>
  );
}

export function PointsList({ points, onSelect, selectedId }: { points: Array<{ id: number | string; title: string }>; onSelect: (id: string | number) => void; selectedId?: string; }) {
  return (
    <div className="mt-3 border border-gray-200 rounded-xl divide-y max-h-[420px] overflow-auto">
      {points.map((p) => {
        const active = String(p.id) === selectedId;
        const base = "flex items-start gap-3 p-3 text-sm cursor-pointer";
        return (
          <button key={p.id} onClick={() => onSelect(p.id)} className={`${base} w-full text-left ${active ? "bg-blue-50" : "hover:bg-gray-50"}`}>
            <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-gray-400" />
            <span className="flex-1 min-w-0 line-clamp-2">{p.title}</span>
          </button>
        );
      })}
    </div>
  );
}

export function ContributionPreview({ data }: { data: RichPointOut }) {
  return (
    <article>
      <h3 className="text-sm font-semibold">{data.point.point_value || "(no title)"}</h3>
      <div className="mt-2 text-xs text-gray-600">Debate {data.debate.title} · {data.debate.date}</div>
      <div className="mt-3 rounded-lg border border-gray-200 bg-white p-3 text-sm leading-relaxed">
        {data.contribution.contribution_value ? (
          <p className="whitespace-pre-wrap">{data.contribution.contribution_value}</p>
        ) : (
          <p className="text-gray-500">No text available.</p>
        )}
      </div>
    </article>
  );
}
