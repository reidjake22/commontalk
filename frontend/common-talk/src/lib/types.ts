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

export type LightMemberOut = {
  member_id: string;
  name_display_as: string;
  name_full_title?: string;
  thumbnail_url?: string;
  latest_party_membership?: string;
};

export type LightPartyOut = {
  party_id: string;
  name: string;
  abbreviation?: string;
  background_colour?: string;
  foreground_colour?: string;
};

export type FeaturedTopicOut = {
  topic_id: string;
  title?: string;
  summary?: string;
  contributors: LightMemberOut[];
  proportions: Array<[LightPartyOut, number]>;
  sub_topics?: FeaturedTopicOut[];
};

export type FeaturedTopicsOut = {
  topics: FeaturedTopicOut[];
  total_count: number;
  date_range?: string;
};

export type Filters = {
  type: "all" | "topics" | "debates" | "bills";
  range: "24h" | "7d" | "30d";
};

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