// =============================================
// File: src/lib/types.ts
// =============================================
export type PersonWidget = {
  id: number;
  party_id: number;
  name: string;
};

export type Topic = {
  id: number | string;
  title: string;
  summary: string;
  subTopics?: Topic[];
  /** Array of [partyId, value] pairs; value can be counts or weighted scores */
  proportions: ReadonlyArray<readonly [number, number]>;
  contributors?: PersonWidget[];
};

export type Filters = {
  type: "all" | "topics" | "debates" | "bills";
  range: "24h" | "7d" | "30d";
};

export type FeaturedTopicsResponse =
  | { success: true; data: Topic[] }
  | { success: false; error: string };

export type Debate = {
  id: number | string;
  title: string;
  summary: string;
};

export type Person = {
  id: number | string;
  name: string;
  role?: string;
  avatar?: string;
};