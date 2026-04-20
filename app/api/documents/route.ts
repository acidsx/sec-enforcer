import { createClient } from "@/lib/supabase/server";
import type { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "No autorizado" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file") as File;
  const entregableId = formData.get("entregableId") as string;

  if (!file || !entregableId) {
    return Response.json({ error: "file y entregableId requeridos" }, { status: 400 });
  }

  if (file.size > 10 * 1024 * 1024) {
    return Response.json({ error: "Archivo excede 10 MB" }, { status: 400 });
  }

  // Upload to storage
  const storagePath = `${user.id}/${entregableId}/${crypto.randomUUID()}-${file.name}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from("drafts-finales")
    .upload(storagePath, buffer, { contentType: file.type });

  if (uploadError) {
    return Response.json({ error: uploadError.message }, { status: 500 });
  }

  // Determine extraction status
  const supportedTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
    "text/markdown",
  ];
  const extractionStatus = supportedTypes.includes(file.type) ? "pending" : "unsupported";

  // Upsert document record (1:1 with entregable)
  const { data, error } = await supabase
    .from("entregables_documentos")
    .upsert(
      {
        entregable_id: entregableId,
        user_id: user.id,
        storage_path: storagePath,
        file_name: file.name,
        file_size_bytes: file.size,
        mime_type: file.type,
        extraction_status: extractionStatus,
        status: "en_progreso",
        uploaded_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "entregable_id" }
    )
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  // TODO: trigger text extraction job asynchronously
  // For now, mark as pending — extraction happens on review request

  return Response.json({ documento: data }, { status: 201 });
}
