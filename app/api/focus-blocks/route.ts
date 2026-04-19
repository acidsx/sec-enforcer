import { createClient } from "@/lib/supabase/server";
import type { NextRequest } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("focus_blocks")
    .select("*, fragment_step:fragment_steps(*), checkins(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ blocks: data });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const { stepId, plannedMinutes = 25 } = body;

  const { data, error } = await supabase
    .from("focus_blocks")
    .insert({
      user_id: user.id,
      step_id: stepId || null,
      planned_minutes: plannedMinutes,
      status: "planned",
    })
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ block: data }, { status: 201 });
}
