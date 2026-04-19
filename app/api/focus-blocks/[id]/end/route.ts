import { createClient } from "@/lib/supabase/server";
import type { NextRequest } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const { status = "completed", notes } = body;

  const updateData: Record<string, unknown> = {
    status,
    ended_at: new Date().toISOString(),
  };
  if (notes) updateData.notes = notes;

  const { data, error } = await supabase
    .from("focus_blocks")
    .update(updateData)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ block: data });
}
