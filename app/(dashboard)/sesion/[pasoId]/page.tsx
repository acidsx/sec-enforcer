import { redirect } from "next/navigation";

// /sesion/[pasoId] redirige al flujo v4.2 de /focus/new que crea el focus_block.
// Sprint 3 futuro reemplazará esta ruta con el layout v5 split 50/50.
export default async function SesionPage({
  params,
}: {
  params: Promise<{ pasoId: string }>;
}) {
  const { pasoId } = await params;
  redirect(`/focus/new?stepId=${pasoId}`);
}
