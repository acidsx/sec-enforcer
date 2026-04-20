import { createClient } from "@/lib/supabase/server";
import { otorgarLogroIdempotente } from "@/lib/actions/logros";
import type { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "No autorizado" }, { status: 401 });

  const { documentoId } = await request.json();

  // Get document and entregable
  const { data: doc } = await supabase
    .from("entregables_documentos")
    .select("*, deliverable:deliverables(id, title)")
    .eq("id", documentoId)
    .eq("user_id", user.id)
    .single();

  if (!doc) return Response.json({ error: "Documento no encontrado" }, { status: 404 });

  // Mark as delivered
  await supabase
    .from("entregables_documentos")
    .update({ status: "entregado", updated_at: new Date().toISOString() })
    .eq("id", documentoId);

  // Mark deliverable as completed
  if (doc.deliverable?.id) {
    await supabase
      .from("deliverables")
      .update({ status: "completed" })
      .eq("id", doc.deliverable.id);

    await otorgarLogroIdempotente({
      userId: user.id,
      tipo: "entregable_completado",
      refId: doc.deliverable.id,
      refTable: "deliverables",
      titulo: `Entregable completado: ${doc.deliverable.title}`,
    });
  }

  return Response.json({ ok: true });
}
