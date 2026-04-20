// @deprecated — Use /api/yleos/generate-plan + /api/fases/bulk instead.
// This endpoint is kept for backward compatibility but returns 410 Gone.
export async function POST() {
  return Response.json(
    {
      error:
        "Endpoint deprecado. Usa /api/yleos/generate-plan para generar fases reales con Gemini.",
    },
    { status: 410 }
  );
}
