import { mockIngestPDF } from "./mock";
import type { YleosIngestResponse } from "@/types/yleos";

/**
 * Process a PDF syllabus and extract deliverables.
 * Currently uses mock data — swap to real YLEOS API when available.
 */
export async function ingestPDF(
  fileName: string,
  _fileBase64: string
): Promise<YleosIngestResponse> {
  // TODO: Replace with real YLEOS API call
  return mockIngestPDF(fileName);
}
