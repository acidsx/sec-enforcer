"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useFocusBlock } from "@/hooks/useFocusBlock";
import { Loader2 } from "lucide-react";

function NewFocusContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const stepId = searchParams.get("stepId") || undefined;
  const minutes = Number(searchParams.get("minutes")) || 25;
  const { create } = useFocusBlock();
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (creating) return;
    setCreating(true);

    create(stepId, minutes).then((block) => {
      if (block) {
        router.replace(`/focus/${block.id}`);
      } else {
        router.push("/");
      }
    });
  }, []);

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-3rem)]">
      <div className="flex items-center gap-3 text-muted">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span>Creando bloque de enfoque...</span>
      </div>
    </div>
  );
}

export default function NewFocusPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[calc(100vh-3rem)]">
          <Loader2 className="h-6 w-6 animate-spin text-muted" />
        </div>
      }
    >
      <NewFocusContent />
    </Suspense>
  );
}
