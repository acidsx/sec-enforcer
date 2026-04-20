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
      text: `Eres YLEOS, analista académico. Analiza este documento de evaluación universitaria y genera un PLAN DE TRABAJO operativo.

═══════════════════════════════════════════════════════════════
DEFINICIONES (CRÍTICO — RESPETAR)
═══════════════════════════════════════════════════════════════

ENTREGABLE = el ARCHIVO FÍSICO que el alumno sube/entrega al profesor.
Ejemplos de entregables:
- Un informe en PDF/Word (UN archivo)
- Una presentación en PowerPoint (UN archivo)
- Un dataset Excel (UN archivo)
- Un examen presencial (UNA evaluación)
- Un código fuente comprimido (UN archivo .zip)

NO son entregables las SECCIONES dentro de un documento. Si el PDF dice
"PRODUCTO ESPERADO: Análisis del desafío, 8 ideas, Mezcla, Selección,
Propuesta de valor" — eso es UN entregable (un informe) con 5 secciones,
NO son 5 entregables separados.

FASE = una etapa de trabajo dentro de un entregable. Agrupa pasos relacionados.
Ejemplos: "Investigación", "Redacción de borrador", "Revisión final".
Las secciones de un documento generalmente se mapean a fases.

PASO = una acción concreta y ejecutable en una sesión de 25 minutos.

═══════════════════════════════════════════════════════════════
REGLA CRÍTICA SOBRE CANTIDAD
═══════════════════════════════════════════════════════════════

La mayoría de evaluaciones universitarias son **UN solo entregable**.
Solo crea MÚLTIPLES entregables si el PDF explícitamente pide entregar
ARCHIVOS SEPARADOS distintos (ej: "Entregar: archivo Excel CON archivo
Word de informe ejecutivo" → 2 entregables).

Por entregable: 3-5 fases. Por fase: 2-4 pasos. Total: 8-15 pasos máximo.
Pasos demasiado pequeños o repetitivos = mal diseño.

═══════════════════════════════════════════════════════════════
EJEMPLOS CONCRETOS
═══════════════════════════════════════════════════════════════

Ejemplo 1: PDF "Laboratorio SPRINT" pide informe de 6 páginas con secciones:
1. Comprensión del desafío
2. Crazy 8
3. Mezcla y mejora
4. Selección de idea
5. Propuesta de valor

→ 1 entregable (Informe Laboratorio SPRINT), 4 fases:
  - Fase 1 "Comprensión y análisis": 2 pasos (analizar problema, definir usuarios/contexto)
  - Fase 2 "Ideación Crazy 8": 2 pasos (generar 8 ideas, refinar las más prometedoras)
  - Fase 3 "Mezcla, selección y propuesta": 3 pasos (combinar 3 ideas, seleccionar la mejor, formular propuesta de valor)
  - Fase 4 "Revisión final": 2 pasos (revisar APA + formato Arial 12, validar nombre archivo y extensión)

Total: 1 entregable, 4 fases, 9 pasos.

Ejemplo 2: PDF "Análisis de datos" pide:
- Archivo Excel con tablas dinámicas
- Informe ejecutivo en Word

→ 2 entregables (porque son 2 archivos distintos físicos):
  Entregable 1 "Archivo Excel con análisis": 3 fases (limpiar dataset, crear tablas dinámicas, validar resultados)
  Entregable 2 "Informe ejecutivo": 3 fases (estructurar hallazgos, redactar conclusiones, formato APA)

═══════════════════════════════════════════════════════════════
FORMATO DE RESPUESTA
═══════════════════════════════════════════════════════════════

Responde SOLO con este JSON (sin markdown ni explicación adicional):

{
  "assignment": {
    "title": "nombre de la evaluación tal como aparece en el PDF",
    "subject": "asignatura si se menciona",
    "weight": 0,
    "summary": "resumen en 2-3 líneas de qué pide la evaluación"
  },
  "deliverables": [
    {
      "title": "nombre del archivo/entregable físico que se entrega",
      "type": "informe|presentacion|codigo|ensayo|examen|tarea",
      "weight": 0,
      "description": "descripción clara de qué debe contener el archivo final",
      "fases": [
        {
          "nombre": "nombre conciso de la fase",
          "tipo": "research|draft|review|practice|analysis|delivery|general",
          "orden": 1,
          "steps": [
            {
              "title": "título del paso (verbo + objeto)",
              "description": "qué hacer concretamente, una sesión de 25 min"
            }
          ]
        }
      ]
    }
  ],
  "format_requirements": "requisitos de formato extraídos del PDF (extensión, fuente, márgenes, APA, nombre archivo, etc.)",
  "evaluation_criteria": ["criterio 1 con peso", "criterio 2 con peso"]
}

REGLAS FINALES:
- "type" exacto: informe, presentacion, codigo, ensayo, examen, tarea
- "tipo" de fase exacto: research, draft, review, practice, analysis, delivery, general
- NO inventes contenido que no esté en el PDF
- NO crees entregables separados por cada sección de un documento — son fases dentro de UN entregable
- Pasos accionables (verbo + objeto), no genéricos`,
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
