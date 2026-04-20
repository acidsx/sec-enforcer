import { createClient } from "@/lib/supabase/server";
import type { NextRequest } from "next/server";

interface FaseInput {
  orden: number;
  nombre: string;
  tipo: string;
  steps: { title: string; description: string; estimatedMinutes?: number }[];
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "No autorizado" }, { status: 401 });

  const body = await request.json();
  const { deliverableId, fases } = body as {
    deliverableId: string;
    fases: FaseInput[];
  };

  if (!deliverableId || !fases?.length) {
    return Response.json(
      { error: "deliverableId y fases requeridos" },
      { status: 400 }
    );
  }

  // Get deliverable due date for distributing scheduled_date
  const { data: deliverable } = await supabase
    .from("deliverables")
    .select("due_date")
    .eq("id", deliverableId)
    .single();

  if (!deliverable) {
    return Response.json({ error: "Entregable no encontrado" }, { status: 404 });
  }

  const dueDate = new Date(deliverable.due_date);
  const now = new Date();
  const totalDays = Math.max(
    1,
    Math.floor((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  );

  // Total steps across all fases
  const totalSteps = fases.reduce((acc, f) => acc + (f.steps?.length || 0), 0);
  let stepCounter = 0;

  for (const fase of fases) {
    // Insert fase
    const { data: faseRow, error: faseErr } = await supabase
      .from("fases")
      .insert({
        deliverable_id: deliverableId,
        user_id: user.id,
        orden: fase.orden,
        nombre: fase.nombre,
        tipo: fase.tipo || "general",
      })
      .select()
      .single();

    if (faseErr || !faseRow) {
      return Response.json(
        { error: `Error guardando fase: ${faseErr?.message}` },
        { status: 500 }
      );
    }

    // Insert steps for this fase
    for (let idx = 0; idx < (fase.steps?.length || 0); idx++) {
      const step = fase.steps[idx];
      stepCounter++;

      // Distribute scheduled_date proportionally
      const dayOffset = Math.floor((totalDays * stepCounter) / totalSteps);
      const scheduledDate = new Date(now);
      scheduledDate.setDate(scheduledDate.getDate() + dayOffset);

      await supabase.from("fragment_steps").insert({
        deliverable_id: deliverableId,
        user_id: user.id,
        fase_id: faseRow.id,
        step_number: stepCounter,
        title: step.title,
        description: step.description,
        scheduled_date: scheduledDate.toISOString().split("T")[0],
      });
    }
  }

  // Mark deliverable as in_progress
  await supabase
    .from("deliverables")
    .update({ status: "in_progress" })
    .eq("id", deliverableId);

  return Response.json({ ok: true, fasesCreated: fases.length, stepsCreated: stepCounter });
}
