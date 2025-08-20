// File: src/components/PartyProportionsBar.tsx
// =============================================
import { memo, useMemo } from "react";
import type { LightPartyOut } from "../lib/topic-api";
import { resolvePartyStyle } from "../lib/party-resolver";

export const PartyProportionsBar = memo(function PartyProportionsBar({ proportions, variant = "default" }: { proportions: Array<[LightPartyOut, number]>; variant?: "default" | "compact"; }) {
  const { total, segments, labels } = useMemo(() => {
    const total = proportions.reduce((s, [, v]) => s + v, 0);
    const sorted = [...proportions].sort(([, a], [, b]) => b - a);
    const top = variant === "compact" ? sorted.slice(0, 2) : sorted.filter(([, v]) => total > 0 && v / total >= 0.1);
    const segments = proportions.map(([party, value]) => {
      const pct = total > 0 ? (value / total) * 100 : 0;
      const style = resolvePartyStyle(party);
      console.log(style)
      return { key: party.party_id, pct, color: "#" + style.color, name: style.label };
    });
    const labels = top.map(([party, value]) => {
      const style = resolvePartyStyle(party);
      const pct = total > 0 ? (value / total) * 100 : 0;
      return { key: party.party_id, name: style.label, color: "#" + style.color, pct };
    });
    return { total, segments, labels };
  }, [proportions, variant]);

  if (total === 0) return null;
  const barHeight = variant === "compact" ? "h-1.5" : "h-2";
  const dot = variant === "compact" ? "w-1.5 h-1.5" : "w-2 h-2";

  return (
    <div className={variant === "compact" ? "space-y-1.5" : "space-y-2"}>
      <div className={`flex ${barHeight} rounded-full overflow-hidden bg-gray-100`}>
        {segments.map((seg) => (
          <div key={seg.key} className="transition-all duration-300" style={{ width: `${seg.pct}%`, backgroundColor: seg.color }} title={`${seg.name}: ${seg.pct.toFixed(1)}%`} />
        ))}
      </div>
      <div className="flex flex-wrap gap-2 text-xs">
        {labels.map((l) => (
          <div key={l.key} className="flex items-center gap-1">
            <div className={`${dot} rounded-full`} style={{ backgroundColor: l.color }} />
            <span className="text-gray-700">{l.name}</span>
            <span className="text-gray-500">{l.pct.toFixed(0)}%</span>
          </div>
        ))}
        {variant === "compact" && proportions.length > 2 && (
          <span className="text-gray-400 text-xs">+{proportions.length - 2}</span>
        )}
      </div>
    </div>
  );
});
