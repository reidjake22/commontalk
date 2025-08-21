// File: src/components/ContributionBar.tsx
// =============================================
import { memo, useMemo } from "react";
import { type LightPartyOut } from "../lib/types";

export interface ContributionBarProps {
  proportions: Array<[LightPartyOut, number]>;
  variant?: "default" | "compact";
}

export const ContributionBar = memo(function ContributionBar({ proportions, variant = "default" }: ContributionBarProps) {
  const { total, filtered, barSegments } = useMemo(() => {
    const total = proportions.reduce((s, [, v]) => s + v, 0);
    const compact = variant === "compact";

    const filtered = compact
      ? [...proportions].sort(([, a], [, b]) => b - a).slice(0, 2)
      : proportions.filter(([, v]) => total > 0 && v / total >= 0.1);

    const barSegments = proportions.map(([party, value]) => {
      const pct = total > 0 ? (value / total) * 100 : 0;
      return {
        partyId: party.party_id,
        pct,
        color: party.background_colour || "#ccc",
        name: party.name,
        shortName: party.abbreviation || party.name,
      };
    });

    return { total, filtered, barSegments };
  }, [proportions, variant]);

  if (total === 0) return null;

  const barHeight = variant === "compact" ? "h-1.5" : "h-2";
  const dot = variant === "compact" ? "w-1.5 h-1.5" : "w-2 h-2";

  return (
    <div className={variant === "compact" ? "space-y-1.5" : "space-y-2"}>
      <div className={`flex ${barHeight} rounded-full overflow-hidden bg-gray-100`}>
        {barSegments.map((seg) => (
          <div
            key={seg.partyId}
            className="transition-all duration-300"
            style={{ width: `${seg.pct}%`, backgroundColor: seg.color }}
            title={`${seg.name}: ${seg.pct.toFixed(1)}%`}
          />
        ))}
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        {filtered.map(([party, value]) => {
          const pct = total > 0 ? (value / total) * 100 : 0;
          const name = variant === "compact" ? (party.abbreviation || party.name) : party.name;
          return (
            <div key={party.party_id} className="flex items-center gap-1">
              <div className={`${dot} rounded-full`} style={{ backgroundColor: party.background_colour || "#ccc" }} />
              <span className="text-gray-700">{name}</span>
              <span className="text-gray-500">{pct.toFixed(0)}%</span>
            </div>
          );
        })}
        {variant === "compact" && proportions.length > 2 && (
          <span className="text-gray-400 text-xs">+{proportions.length - 2}</span>
        )}
      </div>
    </div>
  );
});