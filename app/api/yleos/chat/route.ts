import { createClient } from "@/lib/supabase/server";
import { streamYleosResponse } from "@/lib/yleos/gemini";
import type { ChatMessage, SessionContext } from "@/lib/yleos/gemini";
import type { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const { messages, sessionContext } = body as {
    messages: ChatMessage[];
    sessionContext: SessionContext;
  };

  if (!messages?.length || !sessionContext) {
    return Response.json(
      { error: "messages y sessionContext son requeridos" },
      { status: 400 }
    );
  }

  const stream = await streamYleosResponse(messages, sessionContext);

  // Convert Gemini stream to ReadableStream for the client
  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const text = chunk.text();
          if (text) {
            controller.enqueue(encoder.encode(text));
          }
        }
      } catch (err: any) {
        controller.enqueue(
          encoder.encode(`\n\n[Error: ${err.message}]`)
        );
      } finally {
        controller.close();
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
