/**
 * Server-side validation for the public newsletter deeplinks (/g/:id and /s/:id).
 * A link only counts as valid when the target row exists and is publicly readable.
 */

export const SITE_URL = "https://politikradar.org";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type DeeplinkKind = "event" | "story";

export interface DeeplinkTarget {
  /** Event the newsletter entry belongs to (always present). */
  eventId: string;
  /** Published story the entry should link to, if one exists. */
  storyId?: string | null;
}

export type BrokenReason =
  | "invalid_id"
  | "event_missing"
  | "event_rejected"
  | "story_missing"
  | "story_not_published";

export interface BrokenLink {
  kind: DeeplinkKind;
  id: string;
  eventId: string;
  url: string;
  reason: BrokenReason;
  detail: string;
}

export interface LinkCheckResult {
  /** Event ids that are safe to link to /g/:id. */
  validEvents: Set<string>;
  /** Story ids that are safe to link to /s/:id. */
  validStories: Set<string>;
  broken: BrokenLink[];
}

export const eventUrl = (id: string) => `${SITE_URL}/g/${id}`;
export const storyUrl = (id: string) => `${SITE_URL}/s/${id}`;

export const REASON_LABELS: Record<BrokenReason, string> = {
  invalid_id: "Keine gültige ID",
  event_missing: "Geschäft existiert nicht mehr",
  event_rejected: "Geschäft wurde aussortiert",
  story_missing: "Story existiert nicht mehr",
  story_not_published: "Story ist nicht veröffentlicht",
};

/** Checks all event/story targets in one round trip and reports every broken id. */
export const checkDeeplinks = async (
  supabase: any,
  targets: DeeplinkTarget[],
): Promise<LinkCheckResult> => {
  const broken: BrokenLink[] = [];
  const validEvents = new Set<string>();
  const validStories = new Set<string>();

  const eventIds = new Set<string>();
  const storyIds = new Set<string>();
  const storyOwner: Record<string, string> = {};

  for (const t of targets) {
    if (!t.eventId || !UUID_RE.test(t.eventId)) {
      broken.push({
        kind: "event",
        id: String(t.eventId ?? ""),
        eventId: String(t.eventId ?? ""),
        url: eventUrl(String(t.eventId ?? "")),
        reason: "invalid_id",
        detail: REASON_LABELS.invalid_id,
      });
      continue;
    }
    eventIds.add(t.eventId);
    if (t.storyId) {
      if (!UUID_RE.test(t.storyId)) {
        broken.push({
          kind: "story",
          id: t.storyId,
          eventId: t.eventId,
          url: storyUrl(t.storyId),
          reason: "invalid_id",
          detail: REASON_LABELS.invalid_id,
        });
        continue;
      }
      storyIds.add(t.storyId);
      storyOwner[t.storyId] = t.eventId;
    }
  }

  if (eventIds.size) {
    const { data, error } = await supabase
      .from("events")
      .select("id, selection_status")
      .in("id", [...eventIds]);
    if (error) throw new Error(`Link-Check (events): ${error.message}`);
    const found = new Map<string, string | null>((data || []).map((r: any) => [r.id, r.selection_status]));
    for (const id of eventIds) {
      if (!found.has(id)) {
        broken.push({ kind: "event", id, eventId: id, url: eventUrl(id), reason: "event_missing", detail: REASON_LABELS.event_missing });
      } else if (found.get(id) === "rejected") {
        broken.push({ kind: "event", id, eventId: id, url: eventUrl(id), reason: "event_rejected", detail: REASON_LABELS.event_rejected });
      } else {
        validEvents.add(id);
      }
    }
  }

  if (storyIds.size) {
    const { data, error } = await supabase.from("stories").select("id, status").in("id", [...storyIds]);
    if (error) throw new Error(`Link-Check (stories): ${error.message}`);
    const found = new Map<string, string | null>((data || []).map((r: any) => [r.id, r.status]));
    for (const id of storyIds) {
      const eventId = storyOwner[id] ?? "";
      if (!found.has(id)) {
        broken.push({ kind: "story", id, eventId, url: storyUrl(id), reason: "story_missing", detail: REASON_LABELS.story_missing });
      } else if (found.get(id) !== "published") {
        broken.push({ kind: "story", id, eventId, url: storyUrl(id), reason: "story_not_published", detail: REASON_LABELS.story_not_published });
      } else {
        validStories.add(id);
      }
    }
  }

  return { validEvents, validStories, broken };
};

/** Picks the best working link for an entry: story if valid, else event, else none. */
export const resolveLink = (
  target: DeeplinkTarget,
  check: LinkCheckResult,
): { url: string; hasStory: boolean } | null => {
  if (target.storyId && check.validStories.has(target.storyId)) {
    return { url: storyUrl(target.storyId), hasStory: true };
  }
  if (check.validEvents.has(target.eventId)) {
    return { url: eventUrl(target.eventId), hasStory: false };
  }
  return null;
};
