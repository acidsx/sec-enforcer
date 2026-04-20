import { createClient } from "@/lib/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { NextRequest } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "No autorizado" }, { status: 401 });

  const body = await request.json();
  const { title, description, type } = body;

  if (!title) {
    return Response.json({ error: "title requerido" }, { status: 400 });
  }

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `Eres YLEOS, analista académico. Genera un plan de fases para este entregable universitario.

ENTREGABLE
- Título: ${title}
- Tipo: ${type || "tarea"}
- Descripción: ${description || "(sin descripción adicional)"}

INSTRUCCIONES
- Genera 3-5 fases apropiadas al TIPO específico de este entregable.
- Cada fase debe tener un nombre concreto y específico al contenido (NO uses nombres genéricos como "Investigación" / "Redacción" / "Revisión" si el tipo de entregable no lo justifica).
- Por ejemplo:
  * Para metodología SPRINT/Crazy 8: "Comprensión del desafío", "Ideación Crazy 8", "Mezcla y mejora", "Propuesta de valor"
  * Para análisis de datos en Excel: "Limpieza del dataset", "Tablas dinámicas", "Análisis de tendencias", "Informe ejecutivo"
  * Para ensayo teórico: "Búsqueda bibliográfica", "Estructura argumentativa", "Redacción", "Revisión APA"
  * Para examen: "Revisión de materia", "Ejercicios prácticos", "Resumen final"
- Cada paso dentro de una fase debe ser CONCRETO y EJECUTABLE en una sesión de 25 minutos.
- NO uses pasos genéricos. Adapta a lo específico del entregable.

Responde SOLO con JSON válido (sin markdown, sin explicación):
{
  "fases": [
    {
      "orden": 1,
      "nombre": "...",
      "tipo": "research|draft|review|practice|analysis|delivery|general",
      "steps": [
        {
          "title": "...",
          "description": "...",
          "estimatedMinutes": 25
        }
      ]
    }
  ]
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  let parsed;
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found");
    parsed = JSON.parse(jsonMatch[0]);
  } catch {
    return Response.json(
      {
        error:
          "No pudimos generar el plan automáticamente. Edita manualmente.",
        raw: text,
      },
      { status: 500 }
    );
  }

  if (!parsed.fases || !Array.isArray(parsed.fases) || parsed.fases.length === 0) {
    return Response.json(
      { error: "El plan generado no tiene fases válidas. Edita manualmente." },
      { status: 500 }
    );
  }

  return Response.json({ fases: parsed.fases });
}
