import { createClient } from "@/lib/supabase/server";
import { ingestPDF } from "@/lib/yleos/ingest";
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
  const { fileName, fileBase64, subjectId } = body;

  if (!fileName || !fileBase64 || !subjectId) {
    return Response.json(
      { error: "fileName, fileBase64 y subjectId son requeridos" },
      { status: 400 }
    );
  }

  const result = await ingestPDF(fileName, fileBase64);

  // Save deliverables to database
  const deliverables = result.deliverables.map((d) => ({
    subject_id: subjectId,
    user_id: user.id,
    title: d.title,
    type: d.type,
    due_date: d.dueDate,
    weight: d.weight,
    description: d.description,
    status: "pending" as const,
  }));

  const { data, error } = await supabase
    .from("deliverables")
    .insert(deliverables)
    .select();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ deliverables: data });
}
