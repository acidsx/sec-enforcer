import { mockFragmentDeliverable } from "./mock";
import type { YleosFragmentResponse } from "@/types/yleos";

/**
 * Break a deliverable into executable steps.
 * Currently uses mock data — swap to real YLEOS API when available.
 */
export async function fragmentDeliverable(
  title: string,
  dueDate: string
): Promise<YleosFragmentResponse> {
  // TODO: Replace with real YLEOS API call
  return mockFragmentDeliverable(title, dueDate);
}
