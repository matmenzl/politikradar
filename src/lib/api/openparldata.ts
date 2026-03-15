const BASE_URL = "https://api.openparldata.ch/v1";

interface ApiResponse<T> {
  meta: {
    offset: number;
    limit: number;
    total_records: number;
    total_pages: number;
    current_page: number;
    has_more: boolean;
  };
  data: T[];
}

export interface Body {
  id: number;
  key: string;
  name_de?: string;
  name_fr?: string;
  name_it?: string;
  name_en?: string;
  level?: string;
  type?: string; // API field: "country", "canton", "city", "municipality"
  canton?: string;
  canton_key?: string;
  url_external?: string;
  indexed?: boolean;
}

// Fallback for national parliament (not returned by paginated /bodies endpoint)
const CHE_BODY: Body = {
  id: 42,
  key: "CHE",
  name_de: "Schweiz",
  name_fr: "Suisse",
  name_it: "Svizzera",
  name_en: "Switzerland",
  type: "country",
  indexed: true,
};

export interface Voting {
  id: number;
  body_key: string;
  date: string;
  affair_id: number;
  results_yes: number;
  results_no: number;
  results_abstention: number;
  results_absent: number;
  decision: string;
  title_de?: string;
  meaning_of_yes_de?: string;
  meaning_of_no_de?: string;
  affair_title_de?: string;
  affair_title_fr?: string;
  url_external_de?: string;
  meeting_id?: number;
  group_external_id?: string;
}

export function isVotingAccepted(v: Pick<Voting, 'decision' | 'results_yes' | 'results_no'>): boolean {
  if (v.decision) {
    const d = v.decision.toLowerCase();
    return d === "ja" || d === "accepted" || d === "angenommen" || d === "yes";
  }
  return v.results_yes > v.results_no;
}

export interface Affair {
  id: number;
  body_key: string;
  external_id?: string;
  title_de?: string;
  title_fr?: string;
  begin_date?: string;
  end_date?: string;
  status_de?: string;
  type_de?: string;
  type_harmonized?: string;
  updated_at?: string;
  url_external_de?: string;
}

export interface Meeting {
  id: number;
  body_key: string;
  name_de?: string;
  begin_date?: string;
  end_date?: string;
  state?: string;
  location?: string;
  type?: string;
  group_external_id?: string;
}

async function fetchApi<T>(endpoint: string, params: Record<string, string> = {}): Promise<ApiResponse<T>> {
  const defaultParams: Record<string, string> = {
    lang: "de",
    lang_format: "flat",
  };
  const allParams = { ...defaultParams, ...params };
  const queryString = new URLSearchParams(allParams).toString();
  const url = `${BASE_URL}${endpoint}?${queryString}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

// Cache bodies to avoid refetching
let bodiesCache: Body[] | null = null;

export async function fetchBodies(): Promise<Body[]> {
  if (bodiesCache) return bodiesCache;
  // Fetch all bodies by paginating through results
  let allBodies: Body[] = [];
  let offset = 0;
  const limit = 200;
  let hasMore = true;
  while (hasMore) {
    const res = await fetchApi<any>("/bodies", { limit: String(limit), offset: String(offset) });
    // Map API fields: body_key → key
    const mapped: Body[] = res.data.map((b: any) => ({
      ...b,
      key: b.body_key || b.key,
    }));
    allBodies = allBodies.concat(mapped);
    hasMore = res.meta.has_more;
    offset += limit;
  }

  // Only keep indexed bodies (those with actual parliamentary data)
  allBodies = allBodies.filter((b) => b.indexed === true);

  // Ensure CHE (national parliament) is present
  if (!allBodies.find((b) => b.key === "CHE")) {
    allBodies.unshift(CHE_BODY);
  }

  bodiesCache = allBodies;
  return bodiesCache;
}

export function getBodyLabel(body: Body): string {
  return body.name_de || body.key;
}

// Map API type to our level categories
function typeToLevel(type?: string): string {
  if (!type) return "other";
  switch (type) {
    case "country": return "national";
    case "canton": return "cantonal";
    case "city":
    case "municipality": return "communal";
    default: return "other";
  }
}

export function groupBodiesByLevel(bodies: Body[]): Record<string, Body[]> {
  const groups: Record<string, Body[]> = {};
  for (const b of bodies) {
    const level = b.level || typeToLevel(b.type) || "other";
    if (!groups[level]) groups[level] = [];
    groups[level].push(b);
  }
  return groups;
}

export const LEVEL_LABELS: Record<string, string> = {
  national: "National",
  cantonal: "Kantonal",
  communal: "Kommunal",
  other: "Weitere",
};

export function getWeekDateRange(year: number, week: number): { from: string; to: string } {
  const jan4 = new Date(year, 0, 4);
  const dayOfWeek = jan4.getDay() || 7;
  const mondayOfWeek1 = new Date(jan4);
  mondayOfWeek1.setDate(jan4.getDate() - dayOfWeek + 1);

  const monday = new Date(mondayOfWeek1);
  monday.setDate(mondayOfWeek1.getDate() + (week - 1) * 7);

  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);

  const format = (d: Date) => d.toISOString().split("T")[0];
  return { from: format(monday), to: format(friday) };
}

export function formatDateRange(from: string, to: string): string {
  const fromDate = new Date(from + "T00:00:00");
  const toDate = new Date(to + "T00:00:00");
  const fromDay = fromDate.getDate();
  const toDay = toDate.getDate();
  const months = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
  const toMonth = months[toDate.getMonth()];
  const year = toDate.getFullYear();

  if (fromDate.getMonth() === toDate.getMonth()) {
    return `${fromDay}.–${toDay}. ${toMonth} ${year}`;
  }
  const fromMonth = months[fromDate.getMonth()];
  return `${fromDay}. ${fromMonth} – ${toDay}. ${toMonth} ${year}`;
}

export function getCurrentISOWeek(): { year: number; week: number } {
  const now = new Date();
  const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return { year: d.getUTCFullYear(), week: weekNo };
}

export async function fetchVotingsForWeek(from: string, to: string, bodyKey: string = "CHE") {
  const res = await fetchApi<Voting>("/votings", {
    body_key: bodyKey,
    sort_by: "-date",
    limit: "500",
  });
  const fromDate = new Date(from + "T00:00:00");
  const toDate = new Date(to + "T23:59:59");
  const filtered = res.data.filter((v) => {
    const d = new Date(v.date);
    return d >= fromDate && d <= toDate;
  });
  return { data: filtered, total: filtered.length };
}

export async function fetchAffairById(id: number | string): Promise<Affair | null> {
  try {
    const res = await fetchApi<Affair>(`/affairs/${id}`);
    return res.data?.[0] ?? null;
  } catch {
    return null;
  }
}

export async function fetchAffairsForWeek(from: string, to: string, bodyKey: string = "CHE") {
  const res = await fetchApi<Affair>("/affairs", {
    body_key: bodyKey,
    sort_by: "-begin_date",
    limit: "500",
    exclude_null: "begin_date",
  });
  const fromDate = new Date(from + "T00:00:00");
  const toDate = new Date(to + "T23:59:59");
  const filtered = res.data.filter((a) => {
    if (!a.begin_date) return false;
    const d = new Date(a.begin_date);
    return d >= fromDate && d <= toDate;
  });
  return { data: filtered, total: filtered.length };
}

export async function fetchMeetingsForWeek(from: string, to: string, bodyKey: string = "CHE") {
  const res = await fetchApi<Meeting>("/meetings", {
    body_key: bodyKey,
    sort_by: "-begin_date",
    limit: "200",
    exclude_null: "begin_date",
  });
  const fromDate = new Date(from + "T00:00:00");
  const toDate = new Date(to + "T23:59:59");
  const filtered = res.data.filter((m) => {
    if (!m.begin_date) return false;
    const d = new Date(m.begin_date);
    return d >= fromDate && d <= toDate;
  });
  return { data: filtered, total: filtered.length };
}

export function findClosestVoting(votings: Voting[]): Voting | null {
  if (votings.length === 0) return null;
  return votings.reduce((closest, v) => {
    const margin = Math.abs(v.results_yes - v.results_no);
    const closestMargin = Math.abs(closest.results_yes - closest.results_no);
    return margin < closestMargin ? v : closest;
  });
}

// Individual vote per person per voting
export interface Vote {
  id: number;
  voting_id: number;
  person_id: number;
  vote: string; // "yes" | "no" | "abstention" | "absent" | etc.
  vote_display_de?: string;
  person_fullname: string;
  person_party_de?: string;
  person_parliamentary_group_name_de?: string;
}

export async function fetchVotesForVoting(votingId: number): Promise<Vote[]> {
  let allVotes: Vote[] = [];
  let offset = 0;
  const limit = 200;
  let hasMore = true;
  while (hasMore) {
    const res = await fetchApi<Vote>(`/votings/${votingId}/votes`, { limit: String(limit), offset: String(offset) });
    allVotes = allVotes.concat(res.data);
    hasMore = res.meta.has_more;
    offset += limit;
  }
  return allVotes;
}

export interface PartyWeeklyStats {
  party: string;
  totalYes: number;
  totalNo: number;
  totalAbstention: number;
  totalAbsent: number;
  totalVotes: number;
  cohesion: number; // 0-100, how unified the party voted
  deviators: { name: string; votingTitle: string; vote: string; majorityVote: string }[];
}

export async function fetchPartyWeeklyStats(votings: Voting[]): Promise<PartyWeeklyStats[]> {
  if (votings.length === 0) return [];

  // Fetch votes for all votings in parallel (max 10 at a time to avoid overload)
  const batchSize = 10;
  const allVotesPerVoting: { voting: Voting; votes: Vote[] }[] = [];
  
  for (let i = 0; i < votings.length; i += batchSize) {
    const batch = votings.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map(async (v) => ({ voting: v, votes: await fetchVotesForVoting(v.id) }))
    );
    allVotesPerVoting.push(...results);
  }

  // Aggregate by party
  const partyMap = new Map<string, {
    yes: number; no: number; abstention: number; absent: number;
    votingResults: { votingTitle: string; personVotes: { name: string; vote: string }[] }[];
  }>();

  for (const { voting, votes } of allVotesPerVoting) {
    // Group votes by party for this voting
    const partyVotesInVoting = new Map<string, { name: string; vote: string }[]>();
    
    for (const v of votes) {
      const party = v.person_party_de || v.person_parliamentary_group_name_de || "Unbekannt";
      if (!partyVotesInVoting.has(party)) partyVotesInVoting.set(party, []);
      partyVotesInVoting.get(party)!.push({ name: v.person_fullname, vote: v.vote });

      if (!partyMap.has(party)) {
        partyMap.set(party, { yes: 0, no: 0, abstention: 0, absent: 0, votingResults: [] });
      }
      const stats = partyMap.get(party)!;
      if (v.vote === "yes") stats.yes++;
      else if (v.vote === "no") stats.no++;
      else if (v.vote === "abstention") stats.abstention++;
      else stats.absent++;
    }

    // Store per-voting results for deviator detection
    for (const [party, personVotes] of partyVotesInVoting) {
      const stats = partyMap.get(party)!;
      stats.votingResults.push({
        votingTitle: voting.affair_title_de || voting.title_de || `#${voting.id}`,
        personVotes,
      });
    }
  }

  // Calculate cohesion and find deviators
  const results: PartyWeeklyStats[] = [];
  for (const [party, stats] of partyMap) {
    const total = stats.yes + stats.no + stats.abstention;
    const deviators: PartyWeeklyStats["deviators"] = [];

    // For each voting, find the majority vote and flag deviators
    for (const vr of stats.votingResults) {
      const castVotes = vr.personVotes.filter((pv) => pv.vote === "yes" || pv.vote === "no");
      if (castVotes.length < 2) continue;
      const yesCount = castVotes.filter((pv) => pv.vote === "yes").length;
      const noCount = castVotes.filter((pv) => pv.vote === "no").length;
      const majorityVote = yesCount >= noCount ? "yes" : "no";
      
      for (const pv of castVotes) {
        if (pv.vote !== majorityVote) {
          deviators.push({
            name: pv.name,
            votingTitle: vr.votingTitle,
            vote: pv.vote === "yes" ? "Ja" : "Nein",
            majorityVote: majorityVote === "yes" ? "Ja" : "Nein",
          });
        }
      }
    }

    // Cohesion: across all votings, what % voted with the majority?
    let totalCast = 0;
    let totalWithMajority = 0;
    for (const vr of stats.votingResults) {
      const castVotes = vr.personVotes.filter((pv) => pv.vote === "yes" || pv.vote === "no");
      if (castVotes.length < 2) continue;
      const yesCount = castVotes.filter((pv) => pv.vote === "yes").length;
      const noCount = castVotes.filter((pv) => pv.vote === "no").length;
      const majorityCount = Math.max(yesCount, noCount);
      totalCast += castVotes.length;
      totalWithMajority += majorityCount;
    }

    const cohesion = totalCast > 0 ? Math.round((totalWithMajority / totalCast) * 100) : 100;

    results.push({
      party,
      totalYes: stats.yes,
      totalNo: stats.no,
      totalAbstention: stats.abstention,
      totalAbsent: stats.absent,
      totalVotes: total,
      cohesion,
      deviators,
    });
  }

  // Sort by total votes descending
  results.sort((a, b) => b.totalVotes - a.totalVotes);
  return results;
}

export interface WeeklyStats {
  totalAffairs: number;
  totalVotings: number;
  totalMeetings: number;
  closestVoting: Voting | null;
  recentAffairs: Affair[];
  votings: Voting[];
}

export async function fetchWeeklyData(year: number, week: number, bodyKey: string = "CHE"): Promise<WeeklyStats> {
  const { from, to } = getWeekDateRange(year, week);

  const [votingsRes, affairsRes, meetingsRes] = await Promise.all([
    fetchVotingsForWeek(from, to, bodyKey),
    fetchAffairsForWeek(from, to, bodyKey),
    fetchMeetingsForWeek(from, to, bodyKey),
  ]);

  return {
    totalAffairs: affairsRes.total,
    totalVotings: votingsRes.total,
    totalMeetings: meetingsRes.total,
    closestVoting: findClosestVoting(votingsRes.data),
    recentAffairs: affairsRes.data.slice(0, 8),
    votings: votingsRes.data,
  };
}
