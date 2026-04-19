import { GoogleGenerativeAI } from "@google/generative-ai";
import { YLEOS_SYSTEM_PROMPT, buildSessionContext } from "./prompt";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface SessionContext {
  stepTitle: string;
  stepDescription: string | null;
  deliverableTitle: string;
  deliverableType: string;
  dueDate: string;
  progress: number;
  subjectName: string;
}

export interface ChatMessage {
  role: "user" | "model";
  content: string;
}

/**
 * Stream a response from YLEOS (Gemini) with session context.
 */
export async function streamYleosResponse(
  messages: ChatMessage[],
  sessionContext: SessionContext
) {
  const systemInstruction =
    YLEOS_SYSTEM_PROMPT + buildSessionContext(sessionContext);

  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction,
  });

  const history = messages.slice(0, -1).map((m) => ({
    role: m.role,
    parts: [{ text: m.content }],
  }));

  const chat = model.startChat({ history });

  const lastMessage = messages[messages.length - 1];
  const result = await chat.sendMessageStream(lastMessage.content);

  return result.stream;
}
