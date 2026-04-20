import { createClient } from "@/lib/supabase/server";
import { subjectColors } from "@/lib/subject-color";
import { ArrowLeft, Bot, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { DocumentoFinalSection } from "@/components/entregable/DocumentoFinalSection";

export default async function EntregarDetailPage({
  params,
}: {
  params: Promise<{ entregableId: string }>;
}) {
  const { entregableId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: deliverable } = await supabase
    .from("deliverables")
    .select("*, subject:subjects(name, color), fases(id, nombre, orden, completada_at, fragment_steps(id, completed))")
    .eq("id", entregableId)
    .eq("user_id", user!.id)
    .single();

  if (!deliverable) {
    return (
      <div className="card text-center" style={{ padding: "var(--space-16)" }}>
        <p>Entregable no encontrado.</p>
        <Link href="/" className="btn btn-secondary mt-4">Volver a Hoy</Link>
      </div>
    );
  }

  const colors = subjectColors(deliverable.subject?.color);
  const daysLeft = Math.ceil(
    (new Date(deliverable.due_date).getTime() - Date.now()) /
      (1000 * 60 * 60 * 24)
  );

  const { data: documento } = await supabase
    .from("entregables_documentos")
    .select("*, last_review:yleos_reviews(*)")
    .eq("entregable_id", entregableId)
    .maybeSingle();

  const lastReview = documento?.last_review?.[0] || null;

  const verdict = lastReview?.metadata?.verdict;
  const verdictColors: Record<string, string> = {
    ready: "var(--accent-success)",
    needs_work: "var(--accent-warning)",
    critical: "var(--accent-urgent)",
  };
  const verdictLabels: Record<string, string> = {
    ready: "Listo para entregar",
    needs_work: "Necesita trabajo",
    critical: "Crítico",
  };

  return (
    <div className="space-y-8">
      {/* Ribbon */}
      <div
        style={{
          height: "2px",
          background:
            "linear-gradient(90deg, var(--subject-1), var(--subject-4), var(--subject-3))",
          borderRadius: "var(--r-pill)",
          marginBottom: "var(--space-8)",
        }}
      />

      {/* Header */}
      <div className="riseup flex items-start justify-between gap-6">
        <div>
          <Link
            href="/entregar"
            className="inline-flex items-center gap-1 caption mb-3"
            style={{ color: "var(--text-tertiary)" }}
          >
            <ArrowLeft size={14} />
            Volver
          </Link>
          <p className="label">Momento entregar</p>
          <h1 className="mt-2" style={{ fontSize: "34px" }}>
            {deliverable.title}
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <span className="subject-dot" style={{ ["--subject-color" as any]: colors.main }} />
            <span className="caption" style={{ color: colors.fg }}>
              {deliverable.subject?.name}
            </span>
            <span className="caption mono" style={{ color: "var(--text-tertiary)" }}>
              · {deliverable.due_date} · {daysLeft <= 0 ? "vencido" : `${daysLeft} días`}
            </span>
          </div>
        </div>

        {verdict && (
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-full"
            style={{
              background: verdictColors[verdict] + "20",
              color: verdictColors[verdict],
            }}
          >
            <span className="subject-dot subject-dot--pulse" style={{ ["--subject-color" as any]: verdictColors[verdict] }} />
            <div>
              <p className="label" style={{ color: verdictColors[verdict] }}>Veredicto YLEOS</p>
              <p style={{ fontSize: "var(--fs-caption)", fontWeight: 500 }}>
                {verdictLabels[verdict] || verdict}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Document final section */}
      <div className="riseup delay-300">
        <DocumentoFinalSection
          entregableId={entregableId}
          documento={documento}
          lastReview={lastReview}
        />
      </div>
    </div>
  );
}
