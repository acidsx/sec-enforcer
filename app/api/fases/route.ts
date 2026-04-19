import { createClient } from "@/lib/supabase/server";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "No autorizado" }, { status: 401 });

  const deliverableId = request.nextUrl.searchParams.get("deliverableId");
  if (!deliverableId) return Response.json({ error: "deliverableId requerido" }, { status: 400 });

  const { data, error } = await supabase
    .from("fases")
    .select("*, fragment_steps(*)")
    .eq("deliverable_id", deliverableId)
    .eq("user_id", user.id)
    .order("orden", { ascending: true });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ fases: data });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "No autorizado" }, { status: 401 });

  const body = await request.json();
  const { deliverableId, nombre, tipo, orden } = body;

  const { data, error } = await supabase
    .from("fases")
    .insert({
      deliverable_id: deliverableId,
      user_id: user.id,
      nombre,
      tipo: tipo || "general",
      orden: orden || 1,
    })
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ fase: data }, { status: 201 });
}
