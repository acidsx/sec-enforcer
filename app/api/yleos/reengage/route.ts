import { createClient } from "@/lib/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { NextRequest } from "next/server";

// Reengage: triggered by client when student is inactive for 4+ minutes.
// Only by absence of messages in conversation — never by tab focus or system input.
// Max 2 reengages per session.

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
  const { sessionId } = body;

  if (!sessionId) {
    return Response.json({ error: "sessionId requerido" }, { status: 400 });
  }

  // Check how many micro_breaks already sent this session
  const { count: breakCount } = await supabase
    .from("yleos_messages")
    .select("*", { count: "exact", head: true })
    .eq("session_id", sessionId)
    .eq("message_role", "micro_break");

  if ((breakCount || 0) >= 2) {
    return Response.json({ skipped: true, reason: "max reengages reached" });
  }

  // Verify last student message was 4+ minutes ago
  const { data: lastStudentMsg } = await supabase
    .from("yleos_messages")
    .select("created_at")
    .eq("session_id", sessionId)
    .eq("message_role", "student")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (lastStudentMsg) {
    const elapsed =
      (Date.now() - new Date(lastStudentMsg.created_at).getTime()) / 1000 / 60;
    if (elapsed < 4) {
      return Response.json({ skipped: true, reason: "too soon" });
    }
  }

  // Get last assistant message for context
  const { data: lastAssistantMsg } = await supabase
    .from("yleos_messages")
    .select("content")
    .eq("session_id", sessionId)
    .neq("message_role", "student")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `El alumno lleva más de 4 minutos sin responder en la sesión de trabajo. Tu último mensaje fue: "${lastAssistantMsg?.content || "(sin mensaje previo)"}"

Reformula tu última pregunta con un ejemplo concreto diferente, o propone un micro-break de 2–3 minutos para que descanse y vuelva. Sé breve (2-3 frases). No reclames, no presiones, no uses urgencia artificial. Tono paciente y cercano.`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  // Save as micro_break message
  await supabase.from("yleos_messages").insert({
    session_id: sessionId,
    user_id: user.id,
    content: text,
    message_role: "micro_break",
  });

  return Response.json({ message: text, role: "micro_break" });
}
