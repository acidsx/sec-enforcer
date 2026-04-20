// @deprecated — kept for type imports only.
// Real plan generation moved to:
//  - /api/yleos/analyze-pdf (PDF flow)
//  - /api/yleos/generate-plan (manual flow)
import type { YleosFragmentResponse } from "@/types/yleos";

export async function fragmentDeliverable(
  _title: string,
  _dueDate: string
): Promise<YleosFragmentResponse> {
  throw new Error(
    "fragmentDeliverable() está deprecada. Usa /api/yleos/generate-plan."
  );
}
