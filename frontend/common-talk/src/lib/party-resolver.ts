// File: src/lib/party-resolver.ts
// =============================================
import type { LightPartyOut } from "./topic-api";
import { PARTY_CONFIG } from "./party";

type PartyStyle = { label: string; color: string };

export function resolvePartyStyle(p?: LightPartyOut | null, fallbackLabel?: string | null): PartyStyle {
  if (p?.background_colour) {
    return { label: p.abbreviation || p.name || fallbackLabel || "Party", color: p.background_colour };
  }
  if (p?.abbreviation) {
    const found = Object.values(PARTY_CONFIG).find(cfg => cfg.shortName.toLowerCase() === p.abbreviation!.toLowerCase());
    if (found) return { label: found.shortName, color: found.color };
  }
  if (p?.name) {
    const found = Object.values(PARTY_CONFIG).find(cfg => cfg.name.toLowerCase() === p.name.toLowerCase());
    if (found) return { label: found.shortName, color: found.color };
  }
  return { label: fallbackLabel || "Other", color: PARTY_CONFIG[0].color };
}

export function resolvePartyByString(s?: string | null): PartyStyle {
  if (!s) return { label: "Ind", color: PARTY_CONFIG[8].color };
  const lower = s.toLowerCase();
  const found = Object.values(PARTY_CONFIG).find(cfg => cfg.shortName.toLowerCase() === lower || cfg.name.toLowerCase() === lower);
  return found ? { label: found.shortName, color: found.color } : { label: s, color: PARTY_CONFIG[0].color };
}