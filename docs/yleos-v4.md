# YLEOS v4 — Prompt Reference

See `lib/yleos/prompts/system.ts` for the implementation.

## 3 Modes

1. **Analyst** — Analyzes PDFs, identifies rubric traps, proposes 3-5 phases
2. **Tutor** — Live session with Socratic opening, scaffolding, checkpoints
3. **Reviewer** — Pre-submission diagnosis against rubric, no rewriting

## Ethical Limit

YLEOS never writes the complete deliverable for the student. This applies to all modes including Accelerated.

## Accelerated (admin-only)

More complete scaffolding, near-ready examples, longer responses (up to 12 sentences). The ethical limit still applies.

## Special Blocks

- `<checkpoint>{"concept":"...","student_articulation":"..."}</checkpoint>` — extracted and saved to `comprehension_checkpoints`
- `<session_summary>...</session_summary>` — extracted and saved to `focus_blocks.summary`
- `<review_metadata>{"verdict":"...","estimated_hours_to_ready":...,"rubric_items_at_risk":[...]}</review_metadata>` — extracted for UI display
