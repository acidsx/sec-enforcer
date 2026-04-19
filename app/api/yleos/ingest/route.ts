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
  const { subjectId, manualDeliverables, fileName, fileBase64 } = body;

  if (!subjectId) {
    return Response.json({ error: "subjectId es requerido" }, { status: 400 });
  }

  let deliverablesToSave;

  if (manualDeliverables && manualDeliverables.length > 0) {
    // Manual entry — dates defined by the user
    deliverablesToSave = manualDeliverables.map(
      (d: {
        title: string;
        type: string;
        dueDate: string;
        weight: number;
        description: string;
      }) => ({
        subject_id: subjectId,
        user_id: user.id,
        title: d.title,
        type: d.type,
        due_date: d.dueDate,
        weight: d.weight || 0,
        description: d.description || null,
        status: "pending" as const,
      })
    );
  } else if (fileName && fileBase64) {
    // PDF ingestion via mock/YLEOS
    const result = await ingestPDF(fileName, fileBase64);
    deliverablesToSave = result.deliverables.map((d) => ({
      subject_id: subjectId,
      user_id: user.id,
      title: d.title,
      type: d.type,
      due_date: d.dueDate,
      weight: d.weight,
      description: d.description,
      status: "pending" as const,
    }));
  } else {
    return Response.json(
      { error: "manualDeliverables o fileName/fileBase64 son requeridos" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("deliverables")
    .insert(deliverablesToSave)
    .select();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ deliverables: data });
}
