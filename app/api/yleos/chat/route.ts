import { createClient } from "@/lib/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  buildYleosSystemPrompt,
  type YleosMode,
  type TutorContext,
  type AnalystContext,
  type ReviewerContext,
} from "@/lib/yleos/prompts/system";
import { extractCheckpoints, extractSessionSummary, extractReviewMetadata } from "@/lib/yleos/extractors";
import { isAdmin } from "@/lib/auth/roles";
import type { NextRequest } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "No autorizado" }, { status: 401 });

  const body = await request.json();
  const { messages, sessionId, tutorContext, analystContext, reviewerContext, isReview } = body;

  if (!messages?.length) {
    return Response.json({ error: "messages requerido" }, { status: 400 });
  }

  // Detect mode
  let mode: YleosMode;
  if (isReview || reviewerContext) mode = "reviewer";
  else if (sessionId && tutorContext) mode = "tutor";
  else mode = "analyst";

  // Check accelerated (server-side only, admin only)
  let accelerated = false;
  if (mode === "tutor") {
    const adminUser = await isAdmin(user.id);
    if (adminUser) {
      const { data: prefs } = await supabase
        .from("user_preferences")
        .select("yleos_accelerated_on")
        .eq("user_id", user.id)
        .single();
      accelerated = prefs?.yleos_accelerated_on === true;
    }
  }

  // Build system prompt
  let ctx: TutorContext | AnalystContext | ReviewerContext;
  if (mode === "tutor" && tutorContext) {
    // Load session summaries for memory
    let sessionSummaries: { summary: string; session_date: string }[] = [];
    if (tutorContext.deliverableId) {
      const { data: sessions } = await supabase
        .from("focus_blocks")
        .select("summary, started_at")
        .eq("user_id", user.id)
        .not("summary", "is", null)
        .order("started_at", { ascending: false })
        .limit(5);
      sessionSummaries = (sessions || []).map((s: any) => ({
        summary: s.summary,
        session_date: s.started_at?.split("T")[0] || "",
      }));
    }
    ctx = { ...tutorContext, sessionSummaries } as TutorContext;
  } else if (mode === "reviewer" && reviewerContext) {
    ctx = reviewerContext as ReviewerContext;
  } else {
    ctx = (analystContext || {}) as AnalystContext;
  }

  const systemPrompt = buildYleosSystemPrompt(mode, ctx, { accelerated });

  // Save student message
  const lastMessage = messages[messages.length - 1];
  if (sessionId && lastMessage.role === "user") {
    await supabase.from("yleos_messages").insert({
      session_id: sessionId,
      user_id: user.id,
      content: lastMessage.content,
      message_role: "student",
    });
  }

  // Count existing assistant messages for role classification
  let isFirstAssistantMessage = true;
  if (sessionId) {
    const { count } = await supabase
      .from("yleos_messages")
      .select("*", { count: "exact", head: true })
      .eq("session_id", sessionId)
      .neq("message_role", "student");
    isFirstAssistantMessage = (count || 0) === 0;
  }

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: systemPrompt,
  });

  const history = messages.slice(0, -1).map((m: any) => ({
    role: m.role,
    parts: [{ text: m.content }],
  }));

  const chat = model.startChat({ history });
  const result = await chat.sendMessageStream(lastMessage.content);

  const encoder = new TextEncoder();
  let accumulated = "";

  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) {
            // Strip special blocks from streamed output
            const clean = text
              .replace(/<checkpoint>[\s\S]*?<\/checkpoint>/g, "")
              .replace(/<session_summary>[\s\S]*?<\/session_summary>/g, "")
              .replace(/<review_metadata>[\s\S]*?<\/review_metadata>/g, "");
            if (clean) controller.enqueue(encoder.encode(clean));
            accumulated += text;
          }
        }
      } catch (err: any) {
        controller.enqueue(encoder.encode(`\n\n[Error: ${err.message}]`));
      } finally {
        controller.close();

        // Post-process
        if (sessionId) {
          // Extract checkpoints
          const { checkpoints } = extractCheckpoints(accumulated);
          for (const cp of checkpoints) {
            await supabase.from("comprehension_checkpoints").insert({
              session_id: sessionId,
              user_id: user.id,
              concept: cp.concept,
              student_articulation: cp.student_articulation,
            });
          }

          // Extract session summary
          const { summary } = extractSessionSummary(accumulated);
          if (summary) {
            await supabase
              .from("focus_blocks")
              .update({ summary })
              .eq("id", sessionId);
          }

          // Clean content for storage
          const { cleanText } = extractCheckpoints(accumulated);
          const { cleanText: finalClean } = extractSessionSummary(cleanText);

          // Classify message role
          let messageRole = "scaffolding";
          if (isFirstAssistantMessage) messageRole = "tutor_opening";
          else if (finalClean.includes("?") && finalClean.length < 500) messageRole = "socratic_question";

          await supabase.from("yleos_messages").insert({
            session_id: sessionId,
            user_id: user.id,
            content: finalClean,
            message_role: messageRole,
          });
        }

        // Log usage
        await supabase.from("yleos_usage").insert({
          user_id: user.id,
          session_id: sessionId || null,
          tokens_in: lastMessage.content.length,
          tokens_out: accumulated.length,
          mode,
          accelerated,
        });
      }
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache" },
  });
}
