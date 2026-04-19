import { createClient } from "@/lib/supabase/server";
import {
  Calendar,
  CheckCircle,
  Circle,
  Crosshair,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

export default async function SchedulePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  // Get all steps (past month + next 3 months)
  const startDate = new Date(today);
  startDate.setMonth(startDate.getMonth() - 1);
  const endDate = new Date(today);
  endDate.setMonth(endDate.getMonth() + 3);

  const { data: steps } = await supabase
    .from("fragment_steps")
    .select("*, deliverable:deliverables(title)")
    .eq("user_id", user!.id)
    .gte("scheduled_date", startDate.toISOString().split("T")[0])
    .lte("scheduled_date", endDate.toISOString().split("T")[0])
    .order("scheduled_date", { ascending: true });

  const items = steps || [];

  // Build step map by date
  const stepsByDate: Record<string, typeof items> = {};
  for (const step of items) {
    const date = step.scheduled_date;
    if (!stepsByDate[date]) stepsByDate[date] = [];
    stepsByDate[date].push(step);
  }

  // Generate calendar weeks for current month
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const firstDay = new Date(currentYear, currentMonth, 1);
  const lastDay = new Date(currentYear, currentMonth + 1, 0);

  const monthName = today.toLocaleDateString("es-CL", {
    month: "long",
    year: "numeric",
  });

  // Build calendar grid
  const startDow = firstDay.getDay(); // 0=Sun
  const totalDays = lastDay.getDate();
  const calendarDays: (number | null)[] = [];

  for (let i = 0; i < startDow; i++) calendarDays.push(null);
  for (let d = 1; d <= totalDays; d++) calendarDays.push(d);
  while (calendarDays.length % 7 !== 0) calendarDays.push(null);

  const weeks: (number | null)[][] = [];
  for (let i = 0; i < calendarDays.length; i += 7) {
    weeks.push(calendarDays.slice(i, i + 7));
  }

  function dateStr(day: number) {
    return `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  // Upcoming steps (from today)
  const upcoming = items.filter(
    (s) => !s.completed && s.scheduled_date >= todayStr
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Agenda</h1>
        <p className="mt-1 text-muted">Vista calendario de tus pasos</p>
      </div>

      {/* Calendar */}
      <div className="rounded-xl border border-border bg-surface p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold capitalize">{monthName}</h2>
          <div className="flex items-center gap-3 text-xs text-muted">
            <span className="flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-accent" />
              Pendiente
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-green-400" />
              Completado
            </span>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-px">
          {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((d) => (
            <div
              key={d}
              className="text-center text-xs font-semibold text-muted py-2"
            >
              {d}
            </div>
          ))}

          {weeks.flat().map((day, i) => {
            if (day === null) {
              return <div key={i} className="p-2 min-h-[72px]" />;
            }

            const ds = dateStr(day);
            const daySteps = stepsByDate[ds] || [];
            const isToday = ds === todayStr;
            const isPast = ds < todayStr;
            const pendingCount = daySteps.filter((s) => !s.completed).length;
            const completedCount = daySteps.filter((s) => s.completed).length;

            return (
              <div
                key={i}
                className={`p-2 min-h-[72px] rounded-lg border transition ${
                  isToday
                    ? "border-accent bg-accent/5"
                    : daySteps.length > 0
                      ? "border-border bg-surface-2"
                      : "border-transparent"
                } ${isPast ? "opacity-50" : ""}`}
              >
                <span
                  className={`text-xs font-medium ${
                    isToday ? "text-accent" : "text-muted"
                  }`}
                >
                  {day}
                </span>
                {daySteps.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {pendingCount > 0 && (
                      <span className="flex items-center gap-0.5 text-[10px] text-accent">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                        {pendingCount}
                      </span>
                    )}
                    {completedCount > 0 && (
                      <span className="flex items-center gap-0.5 text-[10px] text-green-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                        {completedCount}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming steps list */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Próximos Pasos</h2>

        {upcoming.length === 0 ? (
          <div className="rounded-xl border border-border bg-surface p-8 text-center">
            <Calendar className="h-8 w-8 text-muted mx-auto mb-2" />
            <p className="text-muted text-sm">
              Sin pasos pendientes. Ingesta entregables para comenzar.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {upcoming.map((step: any) => {
              const daysLeft = Math.ceil(
                (new Date(step.scheduled_date).getTime() - today.getTime()) /
                  (1000 * 60 * 60 * 24)
              );

              return (
                <div
                  key={step.id}
                  className="flex items-center gap-4 rounded-lg border border-border bg-surface px-4 py-3"
                >
                  <Circle className="h-5 w-5 text-muted shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{step.title}</p>
                    <div className="flex gap-2 text-xs text-muted">
                      {step.deliverable && (
                        <span className="truncate">
                          {step.deliverable.title}
                        </span>
                      )}
                      <span>·</span>
                      <span
                        className={
                          daysLeft <= 2
                            ? "text-red-400 font-medium"
                            : daysLeft <= 5
                              ? "text-yellow-400"
                              : ""
                        }
                      >
                        {daysLeft === 0
                          ? "Hoy"
                          : daysLeft === 1
                            ? "Mañana"
                            : `${daysLeft} días`}
                      </span>
                    </div>
                  </div>
                  <Link
                    href={`/focus/new?stepId=${step.id}`}
                    className="flex items-center gap-1 rounded-lg bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent/20 transition shrink-0"
                  >
                    <Crosshair className="h-3 w-3" />
                    Enfocar
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
