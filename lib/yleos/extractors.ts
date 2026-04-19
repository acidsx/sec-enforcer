export interface Checkpoint {
  concept: string;
  student_articulation: string;
}

export interface ReviewMetadata {
  verdict: "ready" | "needs_work" | "critical";
  estimated_hours_to_ready: number | null;
  rubric_items_at_risk: string[];
}

export function extractCheckpoints(text: string): {
  checkpoints: Checkpoint[];
  cleanText: string;
} {
  const checkpoints: Checkpoint[] = [];
  const cleanText = text.replace(
    /<checkpoint>([\s\S]*?)<\/checkpoint>/g,
    (_, json) => {
      try {
        const parsed = JSON.parse(json);
        if (parsed.concept && parsed.student_articulation) {
          checkpoints.push(parsed);
        }
      } catch {}
      return "";
    }
  );
  return { checkpoints, cleanText: cleanText.trim() };
}

export function extractSessionSummary(text: string): {
  summary: string | null;
  cleanText: string;
} {
  let summary: string | null = null;
  const cleanText = text.replace(
    /<session_summary>([\s\S]*?)<\/session_summary>/g,
    (_, content) => {
      summary = content.trim();
      return "";
    }
  );
  return { summary, cleanText: cleanText.trim() };
}

export function extractReviewMetadata(text: string): {
  metadata: ReviewMetadata | null;
  cleanText: string;
} {
  let metadata: ReviewMetadata | null = null;
  const cleanText = text.replace(
    /<review_metadata>([\s\S]*?)<\/review_metadata>/g,
    (_, json) => {
      try {
        metadata = JSON.parse(json);
      } catch {}
      return "";
    }
  );
  return { metadata, cleanText: cleanText.trim() };
}
