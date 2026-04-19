import { createClient } from "@/lib/supabase/server";

export async function otorgarLogroIdempotente(params: {
  userId: string;
  tipo: string;
  refId?: string;
  refTable?: string;
  titulo: string;
  subtitulo?: string;
  metadata?: Record<string, unknown>;
}) {
  const supabase = await createClient();

  // Upsert with on conflict do nothing (unique: user_id, tipo, ref_id)
  await supabase.from("logros").upsert(
    {
      user_id: params.userId,
      tipo: params.tipo,
      ref_id: params.refId || null,
      ref_table: params.refTable || null,
      titulo: params.titulo,
      subtitulo: params.subtitulo || null,
      metadata: params.metadata || {},
    },
    { onConflict: "user_id,tipo,ref_id", ignoreDuplicates: true }
  );
}

export async function verificarYOtorgarLogrosTrasCierrePaso(
  userId: string,
  pasoId: string
) {
  const supabase = await createClient();

  // Get the paso and its fase
  const { data: paso } = await supabase
    .from("fragment_steps")
    .select("*, fase:fases(*)")
    .eq("id", pasoId)
    .single();

  if (!paso || !paso.fase_id) return;

  // Check if all steps in the fase are completed
  const { data: faseSteps } = await supabase
    .from("fragment_steps")
    .select("completed")
    .eq("fase_id", paso.fase_id);

  const allCompleted = faseSteps?.every((s: any) => s.completed);

  if (allCompleted && paso.fase) {
    // Mark fase as completed
    await supabase
      .from("fases")
      .update({ completada_at: new Date().toISOString() })
      .eq("id", paso.fase_id);

    await otorgarLogroIdempotente({
      userId,
      tipo: "fase_completada",
      refId: paso.fase_id,
      refTable: "fases",
      titulo: `Fase completada: ${paso.fase.nombre}`,
    });

    // Check if all fases in the deliverable are completed
    const { data: deliverableFases } = await supabase
      .from("fases")
      .select("completada_at")
      .eq("deliverable_id", paso.fase.deliverable_id);

    const allFasesCompleted = deliverableFases?.every(
      (f: any) => f.completada_at
    );

    if (allFasesCompleted) {
      // Mark deliverable as completed
      await supabase
        .from("deliverables")
        .update({ status: "completed" })
        .eq("id", paso.fase.deliverable_id);

      // Get deliverable title
      const { data: deliverable } = await supabase
        .from("deliverables")
        .select("title")
        .eq("id", paso.fase.deliverable_id)
        .single();

      await otorgarLogroIdempotente({
        userId,
        tipo: "entregable_completado",
        refId: paso.fase.deliverable_id,
        refTable: "deliverables",
        titulo: `Entregable completado: ${deliverable?.title || ""}`,
      });

      // Check if this is the first entregable
      const { count } = await supabase
        .from("logros")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("tipo", "entregable_completado");

      if ((count || 0) <= 1) {
        await otorgarLogroIdempotente({
          userId,
          tipo: "primer_entregable",
          titulo: "Primer entregable completado",
        });
      }
    }
  }
}

export async function verificarYOtorgarLogrosTrasCrearAsignatura(
  userId: string,
  asignaturaId: string
) {
  const { count } = (await (await createClient())
    .from("subjects")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)) as { count: number | null };

  if ((count || 0) <= 1) {
    await otorgarLogroIdempotente({
      userId,
      tipo: "primera_asignatura",
      refId: asignaturaId,
      refTable: "subjects",
      titulo: "Primera asignatura creada",
    });
  }
}
