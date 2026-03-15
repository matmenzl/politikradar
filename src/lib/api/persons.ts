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

export interface Person {
  id: number;
  body_key: string;
  fullname: string;
  firstname: string;
  lastname: string;
  party_de?: string;
  party_harmonized_de?: string;
  occupation_de?: string;
  electoral_district_de?: string;
  image_url_external?: string;
  image_url_oparl?: string;
  website_parliament_url_de?: string;
  website_personal?: string;
  email?: string;
  gender?: string;
  active?: boolean;
  parliamentary_group_name_de?: string;
  function_latest_de?: string;
}

export interface Interest {
  id: number;
  person_id: number;
  type_de?: string;
  name_de?: string;
  role_name_de?: string;
  begin_date?: string;
  end_date?: string;
  url?: string;
}

export interface PersonAffair {
  id: number;
  title_de?: string;
  type_de?: string;
  type_harmonized?: string;
  begin_date?: string;
  status_de?: string;
  body_key: string;
}

export interface PersonVote {
  id: number;
  voting_id: number;
  vote: string;
  vote_display_de?: string;
  voting_date?: string;
  voting_title_de?: string;
  voting_affair_title_de?: string;
}

async function fetchApi<T>(url: string): Promise<ApiResponse<T>> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  return response.json();
}

export async function fetchPerson(personId: number): Promise<Person | null> {
  try {
    const res = await fetch(`${BASE_URL}/persons/${personId}?lang=de&lang_format=flat`);
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || json;
  } catch {
    return null;
  }
}

export async function fetchPersonInterests(personId: number): Promise<Interest[]> {
  let all: Interest[] = [];
  let offset = 0;
  const limit = 200;
  let hasMore = true;
  while (hasMore) {
    const res = await fetchApi<Interest>(
      `${BASE_URL}/persons/${personId}/interests?lang=de&lang_format=flat&limit=${limit}&offset=${offset}`
    );
    all = all.concat(res.data);
    hasMore = res.meta.has_more;
    offset += limit;
  }
  return all;
}

export async function fetchPersonAffairs(personId: number, limit = 20): Promise<PersonAffair[]> {
  const res = await fetchApi<PersonAffair>(
    `${BASE_URL}/persons/${personId}/affairs?lang=de&lang_format=flat&limit=${limit}&sort_by=-begin_date`
  );
  return res.data;
}

export async function fetchPersonVotes(personId: number, limit = 50): Promise<PersonVote[]> {
  const res = await fetchApi<PersonVote>(
    `${BASE_URL}/persons/${personId}/votes?lang=de&lang_format=flat&limit=${limit}&sort_by=-id`
  );
  return res.data;
}

export async function searchPersons(query: string, bodyKey: string = "CHE"): Promise<Person[]> {
  const res = await fetchApi<Person>(
    `${BASE_URL}/persons?lang=de&lang_format=flat&body_key=${bodyKey}&active=true&limit=20&search=${encodeURIComponent(query)}`
  );
  return res.data;
}

export function groupInterestsByType(interests: Interest[]): Record<string, Interest[]> {
  const groups: Record<string, Interest[]> = {};
  for (const i of interests) {
    const type = i.type_de || "Weitere";
    if (!groups[type]) groups[type] = [];
    groups[type].push(i);
  }
  return groups;
}
