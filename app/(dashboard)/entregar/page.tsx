import { createClient } from "@/lib/supabase/server";
import { subjectColors } from "@/lib/subject-color";
import { Send, FileText } from "lucide-react";
import Link from "next/link";

export default async function EntregarListPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Deliverables eligible for "entregar": those with a document or close to deadline
  const { data: deliverables } = await supabase
    .from("deliverables")
    .select(`
      *,
      subject:subjects(name, color),
      fragment_steps(id, completed),
      documentos:entregables_documentos(id, status, file_name)
    `)
    .eq("user_id", user!.id)
    .neq("status", "completed")
    .order("due_date", { ascending: true });

  const items = deliverables || [];

  return (
    <div className="space-y-10">
      <div className="riseup">
        <p className="label">Momento entregar</p>
        <h1 className="mt-2" style={{ fontSize: "36px" }}>
          Listo para enviar a tu profe
        </h1>
        <p className="caption mt-2">
          Revisa tu documento final con YLEOS antes de subirlo.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="card text-center riseup delay-300" style={{ padding: "var(--space-16) var(--space-8)" }}>
          <Send size={32} style={{ margin: "0 auto", color: "var(--text-tertiary)" }} />
          <p className="mt-4 caption">
            Sin entregables pendientes. Cuando tengas un documento listo, vuelve aquí para revisar.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 riseup delay-200">
          {items.map((d: any) => (
            <EntregarRow key={d.id} deliverable={d} />
          ))}
        </div>
      )}
    </div>
  );
}

function EntregarRow({ deliverable }: { deliverable: any }) {
  const colors = subjectColors(deliverable.subject?.color);
  const hasDoc = deliverable.documentos && deliverable.documentos.length > 0;
  const daysLeft = Math.ceil(
    (new Date(deliverable.due_date).getTime() - Date.now()) /
      (1000 * 60 * 60 * 24)
  );

  return (
    <Link
      href={`/entregar/${deliverable.id}`}
      className="card card--clickable card__banded"
      style={{
        ["--subject-color" as any]: colors.main,
        padding: "var(--space-5) var(--space-6) var(--space-5) var(--space-8)",
      }}
    >
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="subject-dot" style={{ ["--subject-color" as any]: colors.main }} />
            <span className="label" style={{ color: colors.fg }}>
              {deliverable.subject?.name}
            </span>
          </div>
          <p style={{ fontSize: "var(--fs-h3)", fontWeight: 500 }}>
            {deliverable.title}
          </p>
          <div className="flex gap-2 mt-2 caption">
            <span className="mono">{deliverable.due_date}</span>
            <span style={{ color: daysLeft <= 3 ? "var(--urgent)" : "var(--text-tertiary)" }}>
              · {daysLeft <= 0 ? "vencido" : `${daysLeft} días`}
            </span>
          </div>
        </div>
        <div>
          {hasDoc ? (
            <span className="chip chip--info">
              <FileText size={10} />
              Documento subido
            </span>
          ) : (
            <span className="chip">Sin documento</span>
          )}
        </div>
      </div>
    </Link>
  );
}
