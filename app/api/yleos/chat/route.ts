import { createClient } from "@/lib/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  buildTutorSystemPrompt,
  type TutorContext,
} from "@/lib/yleos/prompts/tutor-system";
import type { NextRequest } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

interface ChatMessage {
  role: "user" | "model";
  content: string;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const { messages, tutorContext, sessionId } = body as {
    messages: ChatMessage[];
    tutorContext: TutorContext;
    sessionId?: string;
  };

  if (!messages?.length || !tutorContext) {
    return Response.json(
      { error: "messages y tutorContext son requeridos" },
      { status: 400 }
    );
  }

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

  // Count existing assistant messages to determine if this is the opening
  let isFirstAssistantMessage = true;
  if (sessionId) {
    const { count } = await supabase
      .from("yleos_messages")
      .select("*", { count: "exact", head: true })
      .eq("session_id", sessionId)
      .neq("message_role", "student");
    isFirstAssistantMessage = (count || 0) === 0;
  }

  const systemPrompt = buildTutorSystemPrompt(tutorContext);

  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: systemPrompt,
  });

  const history = messages.slice(0, -1).map((m) => ({
    role: m.role,
    parts: [{ text: m.content }],
  }));

  const chat = model.startChat({ history });
  const result = await chat.sendMessageStream(lastMessage.content);

  // Stream response and accumulate for post-processing
  const encoder = new TextEncoder();
  let accumulated = "";

  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) {
            // Strip checkpoint blocks from streamed output
            const clean = text.replace(/<checkpoint>[\s\S]*?<\/checkpoint>/g, "");
            if (clean) {
              controller.enqueue(encoder.encode(clean));
            }
            accumulated += text;
          }
        }
      } catch (err: any) {
        controller.enqueue(encoder.encode(`\n\n[Error: ${err.message}]`));
      } finally {
        controller.close();

        // Post-process: extract checkpoints, save message, log usage
        if (sessionId) {
          // Extract checkpoints
          const checkpointRegex = /<checkpoint>([\s\S]*?)<\/checkpoint>/g;
          let match;
          while ((match = checkpointRegex.exec(accumulated)) !== null) {
            try {
              const parsed = JSON.parse(match[1]);
              if (parsed.concept && parsed.student_articulation) {
                await supabase.from("comprehension_checkpoints").insert({
                  session_id: sessionId,
                  user_id: user.id,
                  concept: parsed.concept,
                  student_articulation: parsed.student_articulation,
                });
              }
            } catch {
              // Silently discard malformed checkpoints
            }
          }

          // Clean content (remove checkpoint blocks)
          const cleanContent = accumulated
            .replace(/<checkpoint>[\s\S]*?<\/checkpoint>/g, "")
            .trim();

          // Classify message role
          let messageRole = "scaffolding";
          if (isFirstAssistantMessage) {
            messageRole = "tutor_opening";
          } else if (
            cleanContent.includes("?") &&
            cleanContent.length < 500
          ) {
            messageRole = "socratic_question";
          }

          // Save assistant message
          await supabase.from("yleos_messages").insert({
            session_id: sessionId,
            user_id: user.id,
            content: cleanContent,
            message_role: messageRole,
          });

          // Log usage
          await supabase.from("yleos_usage").insert({
            user_id: user.id,
            session_id: sessionId,
            tokens_in: lastMessage.content.length,
            tokens_out: accumulated.length,
          });
        }
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
