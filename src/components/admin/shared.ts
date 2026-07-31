import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { fetchBodies, type Affair, type Voting } from "@/lib/api/openparldata";
import type { StorySlide } from "@/components/StoryPreviewModal";

export const BASE_URL = "https://api.openparldata.ch/v1";

export interface StoryPost {
  id: string;
  title: string;
  body_key: string | null;
  affair_id: string | null;
  voting_id: string | null;
  slides: StorySlide[];
  status: string;
  show_on_home: boolean;
  created_at: string;
  published_at: string | null;
}

export interface SearchResult {
  id: number;
  title: string;
  bodyKey: string;
  bodyName?: string;
  type: "affair" | "voting";
  date?: string;
  status?: string;
  results_yes?: number;
  results_no?: number;
}

export interface AffairWithBody extends Affair {
  bodyName: string;
}

export interface VotingWithBody extends Voting {
  bodyName: string;
}

/**
 * Generates a story draft for an affair or voting and stores it in the database.
 * Throws on failure so callers can surface their own state.
 */
export async function createStoryDraft(result: SearchResult): Promise<void> {
  let parliamentName = result.bodyName;
  if (!parliamentName && result.bodyKey) {
    try {
      const bodies = await fetchBodies();
      const body = bodies.find((b) => b.key === result.bodyKey);
      parliamentName = body ? body.name_de || body.key : result.bodyKey;
    } catch {
      parliamentName = result.bodyKey;
    }
  }

  const body: Record<string, unknown> = { title: result.title, parliament: parliamentName };
  if (result.type === "voting" && result.results_yes != null) {
    body.votingResults = { yes: result.results_yes, no: result.results_no };
  }

  const { data, error } = await supabase.functions.invoke("generate-story", { body });
  if (error) throw error;
  if (!data?.slides) throw new Error("Keine Slides generiert");

  const { error: insertErr } = await supabase.from("story_posts").insert({
    title: result.title,
    body_key: result.bodyKey,
    affair_id: result.type === "affair" ? String(result.id) : null,
    voting_id: result.type === "voting" ? String(result.id) : null,
    slides: data.slides,
    status: "draft",
  });
  if (insertErr) throw insertErr;

  toast.success("Story erstellt (Entwurf) – in der Redaktion sichtbar");
}
