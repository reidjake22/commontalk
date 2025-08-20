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

export type PageMeta = {
  next_cursor: string | null;
  previous_cursor: string | null;
  total_count: number;
}

export type PagedResponse<T> = {
  data: T[];
  meta: PageMeta;
};


export type PagedRichPoints = PagedResponse<RichPoint>;

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

export type Point = {
  id: number;
  contribution_item_id?: number;
  point_value?: string;
}
export type Contribution = {
  item_id: string;
  ext_id?: string;
  contribution_type?: string;
  debate_ext_id?: string;
  member_id?: string;
  attributed_to?: string;
  contribution_value?: string;
  order_in_section?: number;
  timecode?: string;
  hrs_tag?: string;
  created_at?: string;
}

export type RichPoint = {
  point: Point;
  debate: Debate;
  contribution: Contribution;
  member: LightMemberOut;
}

// src/lib/types.ts
export type DateRange = "24h" | "7d" | "30d" | "inf";

export type Filters = {
  // keep your UI “range”; we’ll derive dates from it
  range: DateRange;

  // optional: keep UI “type” if you still use it client-side
  type?: "all" | "topics" | "debates" | "bills";

  // if you plan to add these controls later, leave them optional for now
  member?: string | null;
  party?: number | null;
};

export type SearchTerms = {
  member?: string | null;
  party?: number | null;
  start_date?: string | null; // "YYYY-MM-DD"
  end_date?: string | null;   // "YYYY-MM-DD"
  query?: string | null;
};
