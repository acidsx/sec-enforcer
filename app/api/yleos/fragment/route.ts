import { createClient } from "@/lib/supabase/server";
import { fragmentDeliverable } from "@/lib/yleos/fragment";
import type { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const { deliverableId, title, dueDate } = body;

  if (!deliverableId || !title || !dueDate) {
    return Response.json(
      { error: "deliverableId, title y dueDate son requeridos" },
      { status: 400 }
    );
  }

  const result = await fragmentDeliverable(title, dueDate);

  // Save steps to database
  const steps = result.steps.map((s) => ({
    deliverable_id: deliverableId,
    user_id: user.id,
    step_number: s.stepNumber,
    title: s.title,
    description: s.description,
    scheduled_date: s.scheduledDate,
  }));

  const { data, error } = await supabase
    .from("fragment_steps")
    .insert(steps)
    .select();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  // Update deliverable status to in_progress
  await supabase
    .from("deliverables")
    .update({ status: "in_progress" })
    .eq("id", deliverableId);

  return Response.json({ steps: data });
}
