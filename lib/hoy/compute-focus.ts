// Priorización del foco — especificación exacta del usuario.
// Tests en __tests__/compute-focus.test.ts

export interface EntregableInput {
  id: string;
  title: string;
  type: "sumativo" | "formativo";
  weight: number;
  progress: number;
  days: number;
  grouped?: boolean;
  [key: string]: any;
}

export interface RankedEntregable extends EntregableInput {
  score: number;
  isUrgent: boolean;
}

export interface FocusResult {
  focus: RankedEntregable;
  rankedList: RankedEntregable[];
}

function desempate(a: EntregableInput, b: EntregableInput): number {
  // 1. Tipo (sumativo antes que formativo)
  if (a.type !== b.type) return a.type === "sumativo" ? -1 : 1;
  // 2. Peso (mayor gana entre sumativos)
  if (a.weight !== b.weight) return b.weight - a.weight;
  // 3. Menor progreso gana
  if (a.progress !== b.progress) return a.progress - b.progress;
  // 4. Menor días restantes gana
  if (a.days !== b.days) return a.days - b.days;
  // 5. Alfabético
  return (a.title || a.id).localeCompare(b.title || b.id);
}

export function scoreFor(e: EntregableInput): number {
  const assessmentMultiplier = e.type === "sumativo" ? 10.0 : 1.0;

  const weightFactor =
    e.type === "sumativo" ? Math.max(e.weight / 5, 1) : 1.0;

  let urgencyFactor: number;
  if (e.days <= 7) {
    urgencyFactor = Math.max(8 - e.days, 1);
  } else if (e.days <= 14) {
    urgencyFactor = 1.5;
  } else {
    urgencyFactor = 1.0;
  }

  const inverseProgressFactor = (100 - e.progress) / 50 + 0.5;

  return (
    assessmentMultiplier * weightFactor * urgencyFactor * inverseProgressFactor
  );
}

export function computeFocusSync(
  entregables: EntregableInput[]
): FocusResult | null {
  if (!entregables || entregables.length === 0) return null;

  // Paso 2: detectar urgentes (<=2 días, incluye vencidos)
  const urgentes = entregables.filter((e) => e.days <= 2);

  if (urgentes.length > 0) {
    const sorted = [...urgentes].sort(desempate);
    const nonUrgentesSorted = entregables
      .filter((e) => e.days > 2)
      .map((e) => ({
        ...e,
        score: scoreFor(e),
        isUrgent: false,
      }))
      .sort((a, b) => b.score - a.score);

    const ranked: RankedEntregable[] = [
      ...sorted.map((e) => ({ ...e, score: 9999, isUrgent: true })),
      ...nonUrgentesSorted,
    ];

    return { focus: ranked[0], rankedList: ranked };
  }

  // Paso 3-4: score + sort
  const withScore = entregables.map((e) => ({
    ...e,
    score: scoreFor(e),
    isUrgent: false,
  }));

  const sorted = withScore.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return desempate(a, b);
  });

  return { focus: sorted[0], rankedList: sorted };
}

/**
 * Entry point server-side: carga entregables del usuario y devuelve foco.
 */
export async function computeFocus(
  userId: string,
  supabase: any
): Promise<FocusResult | null> {
  const { data: deliverables } = await supabase
    .from("deliverables")
    .select(
      "id, title, type, weight, due_date, subject_id, fragment_steps(completed)"
    )
    .eq("user_id", userId)
    .neq("status", "completed")
    .neq("status", "archived");

  if (!deliverables || deliverables.length === 0) return null;

  const now = Date.now();
  const inputs: EntregableInput[] = deliverables.map((d: any) => {
    const steps = d.fragment_steps || [];
    const completed = steps.filter((s: any) => s.completed).length;
    const total = steps.length;
    const progress = total > 0 ? (completed / total) * 100 : 0;
    const days = Math.ceil(
      (new Date(d.due_date).getTime() - now) / (1000 * 60 * 60 * 24)
    );

    // Clasificar tipo: informe/ensayo/presentacion/codigo/examen/tarea
    // Heurística: weight > 0 → sumativo, weight === 0 → formativo
    const type: "sumativo" | "formativo" =
      d.weight && d.weight > 0 ? "sumativo" : "formativo";

    return {
      id: d.id,
      title: d.title,
      type,
      weight: d.weight || 0,
      progress,
      days,
      _raw: d,
    };
  });

  const result = computeFocusSync(inputs);

  if (result) {
    console.log(
      `[compute-focus] user=${userId} focus=${result.focus.id} score=${result.focus.score.toFixed(2)} urgent=${result.focus.isUrgent}`
    );
  }

  return result;
}
