import type {
  YleosIngestResponse,
  YleosFragmentResponse,
} from "@/types/yleos";

/**
 * Simula la respuesta de YLEOS al procesar un PDF de syllabus.
 * Solo se usa para entregables de prueba. En producción, analyze-pdf usa Gemini directo.
 */
export async function mockIngestPDF(
  fileName: string
): Promise<YleosIngestResponse> {
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
          "Informe escrito de 3000 palabras sobre un tema asignado.",
      },
    ],
  };
}

/**
 * @deprecated NO USAR.
 *
 * Esta función devolvía un plan genérico hardcoded que no reflejaba el contenido
 * real del entregable. Reemplazada por:
 *  - /api/yleos/analyze-pdf (modo Analista) para PDFs subidos
 *  - /api/yleos/generate-plan para entradas manuales
 */
export async function mockFragmentDeliverable(
  _title: string,
  _dueDate: string
): Promise<YleosFragmentResponse> {
  throw new Error(
    "mockFragmentDeliverable() está deprecada. Usa /api/yleos/generate-plan o analyze-pdf."
  );
}

function getDateFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}
