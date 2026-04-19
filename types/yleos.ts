// ── YLEOS API Types ──

// Ingest: enviar PDF para extraer deliverables
export interface YleosIngestRequest {
  fileBase64: string;
  fileName: string;
  contextId: string;
}

export interface YleosDeliverable {
  title: string;
  type: "informe" | "presentacion" | "codigo" | "ensayo" | "examen" | "tarea";
  dueDate: string; // ISO 8601
  weight: number; // porcentaje sobre nota final (0-100)
  description: string;
}

export interface YleosIngestResponse {
  deliverables: YleosDeliverable[];
}

// Fragment: descomponer un deliverable en pasos ejecutables
export interface YleosFragmentRequest {
  deliverableId: string;
  dueDate: string; // ISO 8601
  title: string;
}

export interface YleosFragmentStep {
  stepNumber: number;
  title: string;
  description: string;
  scheduledDate: string; // ISO 8601
}

export interface YleosFragmentResponse {
  steps: YleosFragmentStep[];
}
