export const PARTY = {
  con: "var(--party-con)",
  lab: "var(--party-lab)",
  lib: "var(--party-lib)",
  snp: "var(--party-snp)",
  grn: "var(--party-grn)",
  oth: "var(--party-oth)",
} as const;

export type PartyKey = keyof typeof PARTY;