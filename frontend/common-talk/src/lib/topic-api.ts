export type LightMemberOut = {
  member_id: string;
  name_display_as: string;
  name_full_title?: string | null;
  thumbnail_url?: string | null;
  latest_party_membership?: string | null;
};

export type LightPartyOut = {
  party_id: string;
  name: string;
  abbreviation?: string | null;
  background_colour?: string | null;
  foreground_colour?: string | null;
};

export type FeaturedTopicOut = {
  topic_id: string;
  title?: string | null;
  summary?: string | null;
  contributors: LightMemberOut[];
  proportions: Array<[LightPartyOut, number]>;
  sub_topics?: FeaturedTopicOut[] | null;
};

export type PointOut = {
  point_id: number;
  contribution_item_id?: string | null;
  point_value?: string | null;
};

export type ContributionOut = {
  item_id: string;
  ext_id?: string | null;
  contribution_type?: string | null;
  member_id?: string | null;
  contribution_value?: string | null;
};

export type DebateOut = {
  ext_id: string;
  title: string;
  date: string; // ISO
  house?: string | null;
  location?: string | null;
};

export type RichPointOut = {
  point: PointOut;
  debate: DebateOut;
  contribution: ContributionOut;
  member: LightMemberOut;
};

export type SingleTopicOut = {
  topic_id: string;
  title?: string | null;
  summary?: string | null;
  points_slice: RichPointOut[];
  contributors: LightMemberOut[];
  proportions: Array<[LightPartyOut, number]>;
  sub_topics?: FeaturedTopicOut[] | null;
  points_total?: number | null;
  points_returned: number;
};

const API_BASE = "http://127.0.0.1:5000/";

async function j<T>(u: string, init?: RequestInit) {
  const r = await fetch(u, { headers: { Accept: "application/json" }, ...init });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return (await r.json()) as T;
}

export const getTopicDetail = (id: string | number, signal?: AbortSignal) =>
  j<SingleTopicOut>(`${API_BASE}/api/v1/topics/${id}`, { signal });

