import type {
  YleosIngestResponse,
  YleosFragmentResponse,
} from "@/types/yleos";

/**
 * Simula la respuesta de YLEOS al procesar un PDF de syllabus.
 * Retorna deliverables realistas de una asignatura universitaria chilena.
 */
export async function mockIngestPDF(
  fileName: string
): Promise<YleosIngestResponse> {
  // Simular latencia de procesamiento
  await new Promise((r) => setTimeout(r, 1500));

  const subject = fileName.replace(/\.pdf$/i, "").replace(/[-_]/g, " ");

  return {
    deliverables: [
      {
        title: `Informe de Investigación — ${subject}`,
        type: "informe",
        dueDate: getDateFromNow(21),
        weight: 30,
        description:
          "Informe escrito de 3000 palabras sobre un tema asignado. Debe incluir introducción, marco teórico, desarrollo, conclusiones y bibliografía en formato APA 7.",
      },
      {
        title: `Presentación Grupal — ${subject}`,
        type: "presentacion",
        dueDate: getDateFromNow(35),
        weight: 20,
        description:
          "Presentación oral de 15 minutos en grupos de 3-4 personas. Incluye slide deck y rúbrica de autoevaluación.",
      },
      {
        title: `Tarea Práctica N°1 — ${subject}`,
        type: "tarea",
        dueDate: getDateFromNow(10),
        weight: 15,
        description:
          "Resolución de ejercicios prácticos del capítulo 3 y 4 del texto guía. Entrega individual vía plataforma.",
      },
      {
        title: `Examen Parcial — ${subject}`,
        type: "examen",
        dueDate: getDateFromNow(45),
        weight: 35,
        description:
          "Evaluación escrita presencial. Contenidos: unidades 1 a 3. Duración: 90 minutos. Sin material de apoyo.",
      },
    ],
  };
}

/**
 * Simula la fragmentación de un deliverable en pasos ejecutables
 * distribuidos uniformemente hasta la fecha de entrega.
 */
export async function mockFragmentDeliverable(
  title: string,
  dueDate: string
): Promise<YleosFragmentResponse> {
  await new Promise((r) => setTimeout(r, 1000));

  const due = new Date(dueDate);
  const now = new Date();
  const totalDays = Math.max(
    1,
    Math.floor((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  );

  const steps = [
    {
      stepNumber: 1,
      title: "Investigación y recopilación de fuentes",
      description: `Buscar mínimo 5 fuentes académicas relevantes para "${title}". Revisar bibliografía del curso y bases de datos (Scielo, Google Scholar). Crear documento con fichas bibliográficas.`,
      scheduledDate: getDateFromNowDays(Math.floor(totalDays * 0.1)),
    },
    {
      stepNumber: 2,
      title: "Estructura y borrador inicial",
      description:
        "Definir estructura del entregable. Redactar índice tentativo, introducción y esquema de cada sección. Validar enfoque con los objetivos del syllabus.",
      scheduledDate: getDateFromNowDays(Math.floor(totalDays * 0.35)),
    },
    {
      stepNumber: 3,
      title: "Desarrollo del contenido principal",
      description:
        "Redactar el cuerpo principal del trabajo. Integrar citas y referencias. Completar análisis, argumentación o resolución según corresponda.",
      scheduledDate: getDateFromNowDays(Math.floor(totalDays * 0.65)),
    },
    {
      stepNumber: 4,
      title: "Revisión final y entrega",
      description:
        "Revisar ortografía, formato APA, coherencia y completitud. Generar PDF final. Subir a plataforma antes del plazo.",
      scheduledDate: dueDate,
    },
  ];

  return { steps };
}

// ── Helpers ──

function getDateFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function getDateFromNowDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}
