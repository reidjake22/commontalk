import type { PartyKey } from "../lib/parties";

export const topics = [
  {
    id: 47,
    title: "NHS Workforce Crisis",
    summary: "Staff shortages and burnout dominate; calls for retention bonuses and training expansion.",
    partyMix: { lab: 0.38, con: 0.44, lib: 0.18 },
    contributors: [
      { name: "Jane Doe", party: "lab" as PartyKey, avatar: "https://i.pravatar.cc/40?u=1" },
      { name: "Tom Smith", party: "con" as PartyKey, avatar: "https://i.pravatar.cc/40?u=2" },
      { name: "Alex Rayner", party: "lib" as PartyKey, avatar: "https://i.pravatar.cc/40?u=3" },
    ],
  },
  {
    id: 48,
    title: "Economic Development Policies",
    summary: "Infrastructure for left-behind regions, small-business support, and Green Book reform.",
    partyMix: { con: 0.52, lab: 0.36, oth: 0.12 },
    contributors: [
      { name: "R. Davies", party: "con" as PartyKey, avatar: "https://i.pravatar.cc/40?u=4" },
      { name: "H. Khan", party: "lab" as PartyKey, avatar: "https://i.pravatar.cc/40?u=5" },
    ],
  },
  {
    id: 49,
    title: "Online Safety Bill",
    summary: "Cross-party push to tighten controls on harmful content; liability debate continues.",
    partyMix: { lab: 0.4, con: 0.4, lib: 0.2 },
    contributors: [{ name: "M. Lewis", party: "con" as PartyKey, avatar: "https://i.pravatar.cc/40?u=6" }],
  },
];
