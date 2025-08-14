// File: src/lib/party.ts
// =============================================
export const PARTY_CONFIG = {
  1: { name: 'Alliance', shortName: 'APNI', color: '#cdaf2d' },
  4: { name: 'Conservative', shortName: 'Con', color: '#0063ba' },
  7: { name: 'Democratic Unionist Party', shortName: 'DUP', color: '#d46a4c' },
  8: { name: 'Independent', shortName: 'Ind', color: '#909090' },
  15: { name: 'Labour', shortName: 'Lab', color: '#d50000' },
  17: { name: 'Liberal Democrat', shortName: 'LD', color: '#faa01a' },
  22: { name: 'Plaid Cymru', shortName: 'PC', color: '#348837' },
  29: { name: 'Scottish National Party', shortName: 'SNP', color: '#fff685' },
  30: { name: 'Sinn Féin', shortName: 'SF', color: '#02665f' },
  31: { name: 'Social Democratic & Labour Party', shortName: 'SDLP', color: '#4ea268' },
  38: { name: 'Ulster Unionist Party', shortName: 'UUP', color: '#a1cdf0' },
  44: { name: 'Green Party', shortName: 'Green', color: '#78b82a' },
  47: { name: 'Speaker', shortName: 'Spk', color: '#666666' },
  158: { name: 'Traditional Unionist Voice', shortName: 'TUV', color: '#0c3a6a' },
  1036: { name: 'Reform UK', shortName: 'RUK', color: '#12b6cf' },
  0: { name: 'Other', shortName: 'Oth', color: '#999999' },
} as const;

export type PartyId = keyof typeof PARTY_CONFIG;

export const getPartyInfo = (partyId: number | PartyId) =>
  PARTY_CONFIG[(partyId as PartyId) in PARTY_CONFIG ? (partyId as PartyId) : 0];
