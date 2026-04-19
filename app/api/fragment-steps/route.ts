import { createClient } from "@/lib/supabase/server";
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
  const { steps, deliverableId } = body;

  if (!steps?.length || !deliverableId) {
    return Response.json(
      { error: "steps y deliverableId son requeridos" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("fragment_steps")
    .insert(steps)
    .select();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  // Update deliverable status
  await supabase
    .from("deliverables")
    .update({ status: "in_progress" })
    .eq("id", deliverableId);

  return Response.json({ steps: data }, { status: 201 });
}
