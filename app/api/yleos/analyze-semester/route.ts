import { createClient } from "@/lib/supabase/server";
import { computeFocus } from "@/lib/hoy/compute-focus";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const CACHE = new Map<string, { observation: string | null; expiresAt: number }>();
const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  const cached = CACHE.get(user.id);
  if (cached && cached.expiresAt > Date.now()) {
    return Response.json({ observation: cached.observation, cached: true });
  }

  const focusResult = await computeFocus(user.id, supabase);

  if (!focusResult || focusResult.rankedList.length < 2) {
    CACHE.set(user.id, { observation: null, expiresAt: Date.now() + SIX_HOURS_MS });
    return Response.json({ observation: null });
  }

  const { data: items } = await supabase
    .from("deliverables")
    .select("title, due_date, weight, fragment_steps(completed)")
    .eq("user_id", user.id)
    .neq("status", "completed")
    .order("due_date", { ascending: true })
    .limit(20);

  const today = new Date();
  const weeksInfo = (items || [])
    .map((d: any) => {
      const days = Math.ceil(
        (new Date(d.due_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );
      const week = Math.max(1, Math.ceil(days / 7));
      return { title: d.title, week, days, weight: d.weight };
    })
    .filter((d) => d.days <= 56 && d.days >= -7);

  const rankedSummary = focusResult.rankedList
    .slice(0, 8)
    .map(
      (r, i) =>
        `  ${i + 1}. "${r.title}" (${r.type}, peso=${r.weight}%, progreso=${Math.round(r.progress)}%, días=${r.days})`
    )
    .join("\n");

  const weeklyLoad: Record<number, { weight: number; titles: string[] }> = {};
  for (const d of weeksInfo) {
    if (!weeklyLoad[d.week]) weeklyLoad[d.week] = { weight: 0, titles: [] };
    weeklyLoad[d.week].weight += d.weight || 5;
    weeklyLoad[d.week].titles.push(d.title);
  }
  const weeklyLoadText = Object.entries(weeklyLoad)
    .map(
      ([w, info]) =>
        `  Semana ${w}: peso total ${info.weight}% (${info.titles.length} entregables)`
    )
    .join("\n");

  const prompt = `Eres YLEOS, analista estratégico académico. Analiza el semestre del alumno y devuelve UNA observación estratégica breve (2-3 frases) si detectas algo relevante. Si no hay nada destacable, devuelve null.

RANKING DE ENTREGABLES POR PRIORIDAD:
${rankedSummary}

CARGA POR SEMANA (próximas 8):
${weeklyLoadText || "  (sin entregables en las próximas 8 semanas)"}

Detecta UNA de estas situaciones (la más crítica):
- Pico de carga peligroso en próximas 2 semanas
- Entregable sin iniciar con deadline crítico (<5 días)
- Distribución desbalanceada (una semana muy cargada vs otras vacías)
- Oportunidad de reacomodo: empezar X antes alivia Y

Responde SOLO con JSON válido:
{"observation": "texto 2-3 frases" | null}

Si nada amerita alerta real, devuelve {"observation": null}. NO inventes urgencias.`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const match = text.match(/\{[\s\S]*\}/);
    let observation: string | null = null;
    if (match) {
      try {
        const parsed = JSON.parse(match[0]);
        observation =
          typeof parsed.observation === "string" && parsed.observation.length > 5
            ? parsed.observation
            : null;
      } catch {}
    }

    CACHE.set(user.id, {
      observation,
      expiresAt: Date.now() + SIX_HOURS_MS,
    });

    return Response.json({ observation });
  } catch (err: any) {
    console.error("[analyze-semester] error:", err.message);
    return Response.json(
      { observation: null, error: err.message },
      { status: 500 }
    );
  }
}
