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
      text: `Analiza este syllabus/programa académico y extrae TODOS los entregables, evaluaciones, tareas, informes, presentaciones y exámenes.

Para cada uno devuelve un JSON con esta estructura exacta:
{
  "deliverables": [
    {
      "title": "nombre del entregable",
      "type": "informe|presentacion|codigo|ensayo|examen|tarea",
      "weight": 0,
      "description": "descripción breve de qué se debe hacer"
    }
  ]
}

Reglas:
- "type" debe ser exactamente uno de: informe, presentacion, codigo, ensayo, examen, tarea
- "weight" es el porcentaje sobre la nota final (0 si no se especifica)
- NO inventes entregables que no estén en el documento
- Responde SOLO con el JSON, sin texto adicional ni markdown`,
    },
  ]);

  const text = result.response.text();

  // Parse JSON from response (handle possible markdown wrapping)
  let parsed;
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found");
    parsed = JSON.parse(jsonMatch[0]);
  } catch {
    return Response.json(
      { error: "YLEOS no pudo extraer entregables del PDF", raw: text },
      { status: 422 }
    );
  }

  return Response.json(parsed);
}
