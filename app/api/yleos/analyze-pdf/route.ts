import { createClient } from "@/lib/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { NextRequest } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const { fileBase64, fileName, mimeType } = body;

  if (!fileBase64 || !fileName) {
    return Response.json(
      { error: "fileBase64 y fileName son requeridos" },
      { status: 400 }
    );
  }

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const result = await model.generateContent([
    {
      inlineData: {
        mimeType: mimeType || "application/pdf",
        data: fileBase64,
      },
    },
    {
      text: `Eres un analista académico táctico. Analiza este documento de evaluación/tarea universitaria y genera un PLAN DE TRABAJO completo para que un alumno lo resuelva paso a paso.

Tu trabajo es:
1. COMPRENDER qué pide la evaluación (qué hay que entregar, con qué formato, qué criterios de evaluación tiene)
2. IDENTIFICAR cada entregable concreto que debe producir el alumno
3. Para CADA entregable, proponer los PASOS DE TRABAJO necesarios para completarlo con calidad "Excelente" según la rúbrica

Responde con este JSON exacto:
{
  "assignment": {
    "title": "nombre de la evaluación/tarea",
    "subject": "asignatura si se menciona",
    "weight": 0,
    "summary": "resumen ejecutivo de qué se pide en 2-3 líneas"
  },
  "deliverables": [
    {
      "title": "nombre del entregable concreto que debe producirse",
      "type": "informe|presentacion|codigo|ensayo|examen|tarea",
      "weight": 0,
      "description": "descripción clara de qué debe contener este entregable según las instrucciones y la rúbrica",
      "steps": [
        {
          "title": "título del paso",
          "description": "qué hacer concretamente en este paso para avanzar hacia el entregable"
        }
      ]
    }
  ],
  "format_requirements": "requisitos de formato (tipo de archivo, fuente, márgenes, extensión, normas de citación, nombre del archivo, etc.)",
  "evaluation_criteria": ["lista de los criterios de evaluación principales con su peso"]
}

Reglas:
- "type" debe ser exactamente uno de: informe, presentacion, codigo, ensayo, examen, tarea
- "weight" es el porcentaje sobre la nota final (0 si no se especifica)
- Los "steps" deben ser acciones CONCRETAS y EJECUTABLES, no genéricas. Cada paso es algo que el alumno puede hacer en una sesión de 25 minutos
- Analiza la RÚBRICA si existe y usa los criterios para diseñar los pasos de forma que el alumno apunte a la nota máxima
- NO inventes información que no esté en el documento
- Responde SOLO con el JSON, sin texto adicional ni markdown`,
    },
  ]);

  const text = result.response.text();

  let parsed;
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found");
    parsed = JSON.parse(jsonMatch[0]);
  } catch {
    return Response.json(
      { error: "YLEOS no pudo analizar el PDF", raw: text },
      { status: 422 }
    );
  }

  return Response.json(parsed);
}
