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
  const { mood, progress, note } = body;

  if (mood == null || progress == null) {
    return Response.json(
      { error: "mood y progress son requeridos" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("checkins")
    .insert({
      focus_block_id: id,
      user_id: user.id,
      mood,
      progress,
      note: note || null,
    })
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ checkin: data }, { status: 201 });
}
