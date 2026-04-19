"use server";

import { createClient } from "@/lib/supabase/server";
import { msGraphFetch } from "@/lib/msgraph";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { buildTriagePrompt } from "@/lib/yleos/prompts/triage";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function syncOutlookInbox(): Promise<{
  scanned: number;
  drafted: number;
  skipped: number;
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { scanned: 0, drafted: 0, skipped: 0, error: "No autorizado" };

  let res;
  try {
    res = await msGraphFetch(
      user.id,
      "/me/messages?$top=25&$filter=isRead eq false&$select=id,subject,from,bodyPreview,receivedDateTime,conversationId"
    );
  } catch (err: any) {
    return { scanned: 0, drafted: 0, skipped: 0, error: err.message };
  }

  if (!res.ok) {
    return { scanned: 0, drafted: 0, skipped: 0, error: `MS Graph error: ${res.status}` };
  }

  const data = await res.json();
  const messages = data.value || [];

  // Get existing draft message IDs to skip
  const { data: existingDrafts } = await supabase
    .from("outlook_drafts")
    .select("source_message_id")
    .eq("user_id", user.id);

  const existingIds = new Set(
    (existingDrafts || []).map((d: any) => d.source_message_id)
  );

  // Get work contexts for matching
  const { data: contexts } = await supabase
    .from("work_contexts")
    .select("*")
    .eq("user_id", user.id);

  const contextMap = new Map(
    (contexts || []).map((c: any) => [c.name, c.id])
  );

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  let drafted = 0;
  let skipped = 0;

  for (const msg of messages) {
    if (existingIds.has(msg.id)) {
      skipped++;
      continue;
    }

    const fromEmail = msg.from?.emailAddress?.address || "desconocido";
    const fromName = msg.from?.emailAddress?.name || fromEmail;
    const prompt = buildTriagePrompt({
      subject: msg.subject || "(sin asunto)",
      from: `${fromName} <${fromEmail}>`,
      body: msg.bodyPreview || "",
    });

    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();

      // Parse JSON, handling markdown fences
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.log(`Triage: could not parse response for ${msg.id}`);
        skipped++;
        continue;
      }

      const parsed = JSON.parse(jsonMatch[0]);

      if (parsed.work_context === "ignorar") {
        skipped++;
        continue;
      }

      const contextId = contextMap.get(parsed.work_context) || null;

      await supabase.from("outlook_drafts").insert({
        user_id: user.id,
        work_context_id: contextId,
        source_message_id: msg.id,
        source_subject: msg.subject,
        source_from: `${fromName} <${fromEmail}>`,
        source_snippet: msg.bodyPreview,
        source_received_at: msg.receivedDateTime,
        draft_body: parsed.draft_body,
        status: "pending",
      });

      // Log usage
      await supabase.from("yleos_usage").insert({
        user_id: user.id,
        session_id: `triage-${msg.id}`,
        tokens_in: prompt.length,
        tokens_out: text.length,
      });

      drafted++;
    } catch (err) {
      console.log(`Triage: error processing ${msg.id}:`, err);
      skipped++;
    }
  }

  return { scanned: messages.length, drafted, skipped };
}

export async function approveAndSend(draftId: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: "No autorizado" };

  const { data: draft, error } = await supabase
    .from("outlook_drafts")
    .select("*")
    .eq("id", draftId)
    .eq("user_id", user.id)
    .single();

  if (error || !draft) return { ok: false, error: "Draft no encontrado" };

  try {
    // Send via MS Graph — reply to original message
    const res = await msGraphFetch(
      user.id,
      `/me/messages/${draft.source_message_id}/reply`,
      {
        method: "POST",
        body: JSON.stringify({
          comment: draft.draft_body,
        }),
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      return { ok: false, error: `Error enviando: ${res.status} ${errText}` };
    }

    await supabase
      .from("outlook_drafts")
      .update({ status: "sent", sent_at: new Date().toISOString() })
      .eq("id", draftId);

    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message };
  }
}

export async function discardDraft(draftId: string): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false };

  await supabase
    .from("outlook_drafts")
    .update({ status: "discarded" })
    .eq("id", draftId)
    .eq("user_id", user.id);

  return { ok: true };
}
