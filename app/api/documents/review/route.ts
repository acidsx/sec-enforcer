import { createClient } from "@/lib/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { buildYleosSystemPrompt } from "@/lib/yleos/prompts/system";
import { extractReviewMetadata } from "@/lib/yleos/extractors";
import { createNotification } from "@/lib/notifications/dispatcher";
import type { NextRequest } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "No autorizado" }, { status: 401 });

  const { documentoId } = await request.json();
  if (!documentoId) return Response.json({ error: "documentoId requerido" }, { status: 400 });

  // Load document
  const { data: doc } = await supabase
    .from("entregables_documentos")
    .select("*, deliverable:deliverables(title, description, rubric_text, due_date, subject:subjects(name))")
    .eq("id", documentoId)
    .eq("user_id", user.id)
    .single();

  if (!doc) return Response.json({ error: "Documento no encontrado" }, { status: 404 });

  // If text not extracted yet, try extracting from storage
  if (doc.extraction_status === "pending") {
    // For now, mark as needing extraction
    return Response.json({ error: "El texto del documento aún no fue extraído. Intenta de nuevo en unos segundos." }, { status: 422 });
  }

  if (doc.extraction_status !== "success" || !doc.extracted_text) {
    return Response.json({ error: "No se pudo extraer texto del documento." }, { status: 422 });
  }

  const rubric = doc.deliverable?.rubric_text || doc.deliverable?.description || "";
  if (!rubric) {
    return Response.json({ error: "REQUIRES_RUBRIC" }, { status: 422 });
  }

  const daysToDeadline = Math.ceil(
    (new Date(doc.deliverable.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  const systemPrompt = buildYleosSystemPrompt("reviewer", {
    subjectName: doc.deliverable?.subject?.name || "",
    deliverableTitle: doc.deliverable?.title || "",
    fullRubric: rubric,
    daysToDeadline,
  });

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: systemPrompt,
  });

  const result = await model.generateContent(
    `Revisa el siguiente draft del alumno:\n\n${doc.extracted_text.substring(0, 15000)}`
  );

  const responseText = result.response.text();
  const { metadata, cleanText } = extractReviewMetadata(responseText);

  // Save review
  const { data: review } = await supabase
    .from("yleos_reviews")
    .insert({
      documento_id: documentoId,
      user_id: user.id,
      content: cleanText,
      metadata: metadata || {},
      tokens_in: doc.extracted_text.length,
      tokens_out: responseText.length,
    })
    .select()
    .single();

  // Update document status
  await supabase
    .from("entregables_documentos")
    .update({
      status: "revisado",
      last_review_id: review?.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", documentoId);

  // Notify
  await createNotification({
    userId: user.id,
    kind: "revisor_listo",
    title: "Revisión lista",
    body: `YLEOS terminó de revisar ${doc.deliverable?.title || "tu documento"}`,
    refId: documentoId,
    refTable: "entregables_documentos",
    priority: "high",
  });

  return Response.json({ review });
}
