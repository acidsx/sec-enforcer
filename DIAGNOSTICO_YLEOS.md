# Diagnóstico: análisis genérico de YLEOS

Fecha: 2026-04-19

## Resumen ejecutivo

La causa raíz son **dos bugs encadenados**:

1. **Bug de mapping (intake page línea 165)**: Cuando el analyze-pdf devuelve el resultado con la estructura `{ fases: [{ steps: [...] }] }`, el intake page lee `d.steps` (no existe) en vez de `d.fases[].steps`. Resultado: `steps` queda como array vacío `[]`.

2. **Bug de fallback (intake page líneas 271-279)**: Cuando `pdfSteps` está vacío (por el bug 1), el código hace fallback a `/api/yleos/fragment`, que llama a `mockFragmentDeliverable()` en `lib/yleos/mock.ts`. Esta función **siempre** devuelve los mismos 4 pasos hardcodeados ("Investigación y recopilación de fuentes", "Estructura y borrador inicial", "Desarrollo del contenido principal", "Revisión final y entrega") sin importar el contenido del PDF.

**Cadena**: PDF → Gemini analiza correctamente con fases → intake page pierde los datos de fases → fallback a mock → mock genera plantilla genérica de ensayo.

## Hipótesis 1 — extracted_text no llega al prompt
- Resultado: **DESCARTADO**
- Evidencia: El route `app/api/yleos/analyze-pdf/route.ts` envía el PDF como `inlineData` directamente a Gemini (líneas 29-35). El PDF llega completo como base64. Gemini sí lee el contenido — el problema está después, en cómo se procesa el resultado.

## Hipótesis 2 — prompt viejo en uso
- Resultado: **PARCIALMENTE CONFIRMADO**
- Evidencia: El analyze-pdf usa un prompt inline propio (no el sistema v4 de `lib/yleos/prompts/system.ts`). Este prompt inline SÍ pide fases, pero el problema no es el prompt sino el procesamiento del resultado. Archivos de prompt encontrados:
  - `lib/yleos/prompt.ts` — prompt corporativo táctico original (v1, no se usa en analyze-pdf)
  - `lib/yleos/prompts/tutor-system.ts` — prompt tutor v2 (no se usa en analyze-pdf)
  - `lib/yleos/prompts/system.ts` — prompt v4 con 3 modos (no se usa en analyze-pdf)
  - `lib/yleos/prompts/triage.ts` — prompt de triaje correo
  - El analyze-pdf route tiene su propio prompt inline que NO es ninguno de estos.

## Hipótesis 3 — parser rígido del output
- Resultado: **CONFIRMADO — CAUSA RAÍZ**
- Evidencia:

**Bug 1 — Mapping incorrecto en intake page (línea 165)**:
```ts
// El analyze-pdf devuelve:
// { deliverables: [{ fases: [{ steps: [...] }] }] }
//
// Pero el intake page lee:
steps: d.steps || [],  // ← d.steps NO EXISTE, es d.fases[].steps
```
`d.steps` es `undefined`, así que `steps` se setea como `[]`.

**Bug 2 — Fallback a mock (líneas 242-279)**:
```ts
const pdfSteps = deliverables[i]?.steps;  // ← siempre []
if (pdfSteps && pdfSteps.length > 0) {
  // NUNCA entra aquí porque steps está vacío
} else {
  // SIEMPRE cae aquí → llama a mockFragmentDeliverable()
}
```

**Bug 3 — mockFragmentDeliverable() es hardcoded (mock.ts líneas 73-101)**:
```ts
const steps = [
  { title: "Investigación y recopilación de fuentes", ... },
  { title: "Estructura y borrador inicial", ... },
  { title: "Desarrollo del contenido principal", ... },
  { title: "Revisión final y entrega", ... },
];
```
Estos 4 pasos se generan siempre iguales, sin importar el PDF.

**Bug 4 — Las fases no se crean en DB**: El save flow nunca crea registros en la tabla `fases`. Solo crea `fragment_steps` directamente. Las fases del analyze-pdf se pierden completamente.

## Hipótesis 4 — extracción del PDF falló
- Resultado: **DESCARTADO**
- Evidencia: El analyze-pdf NO usa extracción de texto. Envía el PDF como `inlineData` (base64) directamente a Gemini, que tiene capacidad multimodal para leer PDFs. Si Gemini devuelve un JSON con entregables con nombres correctos del PDF, es porque leyó el contenido. El problema es posterior.

## Prueba controlada
No ejecutada (diagnóstico del código es concluyente).

## Causa raíz

**Hipótesis 3 confirmada**: 4 bugs encadenados.

1. `intake/page.tsx` línea 165: lee `d.steps` en vez de extraer steps de `d.fases`
2. `intake/page.tsx` línea 240: `pdfSteps` siempre vacío → fallback
3. `lib/yleos/mock.ts`: mock hardcoded con plantilla genérica de ensayo
4. Las fases del analyze-pdf nunca se persisten en la tabla `fases`

## Fix propuesto

1. **Mapping correcto**: Al recibir resultado de analyze-pdf, extraer steps de las fases:
```ts
setDeliverables(
  data.deliverables.map((d: any) => ({
    title: d.title || "",
    type: d.type || "tarea",
    dueDate: "",
    weight: d.weight || 0,
    description: d.description || "",
    fases: d.fases || [],  // ← preservar fases completas
    steps: (d.fases || []).flatMap((f: any) => f.steps || []),  // ← flatten para compat
    expanded: false,
  }))
);
```

2. **Persistir fases**: Al guardar, crear registros en tabla `fases` por cada fase del análisis, y asignar `fase_id` a cada `fragment_step`.

3. **Eliminar fallback a mock**: Si el analyze-pdf devolvió fases con steps, usarlos directamente. Solo usar mock si es entrada manual sin PDF.

4. **Considerar eliminar `mockFragmentDeliverable`** completamente o reemplazarla con una llamada a Gemini que genere pasos reales basados en el título y descripción del entregable.
