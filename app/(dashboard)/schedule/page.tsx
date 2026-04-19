import { createClient } from "@/lib/supabase/server";
import { Calendar, CheckCircle, Circle, Crosshair } from "lucide-react";
import Link from "next/link";

export default async function SchedulePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const today = new Date().toISOString().split("T")[0];

  // Get all incomplete steps ordered by date
  const { data: steps } = await supabase
    .from("fragment_steps")
    .select("*, deliverable:deliverables(title)")
    .eq("user_id", user!.id)
    .gte("scheduled_date", today)
    .order("scheduled_date", { ascending: true })
    .limit(30);

  const items = steps || [];

  // Group by date
  const grouped: Record<string, typeof items> = {};
  for (const step of items) {
    const date = step.scheduled_date;
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(step);
  }

  const dateEntries = Object.entries(grouped);

  function formatDate(dateStr: string) {
    const d = new Date(dateStr + "T12:00:00");
    return d.toLocaleDateString("es-CL", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Agenda</h1>
        <p className="mt-1 text-muted">
          Próximos pasos organizados por fecha
        </p>
      </div>

      {dateEntries.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-12 text-center">
          <Calendar className="h-10 w-10 text-muted mx-auto mb-3" />
          <p className="text-muted">
            Sin pasos programados. Ingesta un syllabus y fragmenta tus
            entregables.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {dateEntries.map(([date, dateSteps]) => (
            <div key={date}>
              <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-2">
                {formatDate(date)}
              </h3>
              <div className="space-y-2">
                {dateSteps.map((step: any) => (
                  <div
                    key={step.id}
                    className="flex items-center gap-4 rounded-lg border border-border bg-surface px-4 py-3"
                  >
                    {step.completed ? (
                      <CheckCircle className="h-5 w-5 text-green-400 shrink-0" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p
                        className={`font-medium text-sm truncate ${step.completed ? "line-through text-muted" : ""}`}
                      >
                        {step.title}
                      </p>
                      {step.deliverable && (
                        <p className="text-xs text-muted truncate">
                          {step.deliverable.title}
                        </p>
                      )}
                    </div>
                    {!step.completed && (
                      <Link
                        href={`/focus/new?stepId=${step.id}`}
                        className="flex items-center gap-1 rounded-lg bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent/20 transition shrink-0"
                      >
                        <Crosshair className="h-3 w-3" />
                        Enfocar
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
