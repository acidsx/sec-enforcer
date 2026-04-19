"use client";

import { useEffect, useState, use } from "react";
import { QuarantineScreen } from "@/components/focus/QuarantineScreen";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import type { FocusBlock, FragmentStep } from "@/types/database";
import type { SessionContext } from "@/lib/yleos/gemini";

export default function FocusBlockPage({
  params,
}: {
  params: Promise<{ blockId: string }>;
}) {
  const { blockId } = use(params);
  const router = useRouter();
  const [block, setBlock] = useState<FocusBlock | null>(null);
  const [step, setStep] = useState<FragmentStep | null>(null);
  const [sessionContext, setSessionContext] = useState<SessionContext | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      // Start the block
      const startRes = await fetch(`/api/focus-blocks/${blockId}/start`, {
        method: "POST",
      });
      const startData = await startRes.json();
      if (startRes.ok) {
        setBlock(startData.block);

        // Load associated step and deliverable context
        if (startData.block.step_id) {
          const blocksRes = await fetch("/api/focus-blocks");
          const blocksData = await blocksRes.json();
          const fullBlock = blocksData.blocks?.find(
            (b: any) => b.id === blockId
          );
          if (fullBlock?.fragment_step) {
            setStep(fullBlock.fragment_step);

            // Fetch deliverable info for YLEOS context
            const delRes = await fetch("/api/deliverables");
            const delData = await delRes.json();
            const deliverable = delData.deliverables?.find(
              (d: any) => d.id === fullBlock.fragment_step.deliverable_id
            );

            if (deliverable) {
              // Calculate progress
              const totalSteps = deliverable.fragment_steps?.length || 1;
              const completedSteps =
                deliverable.fragment_steps?.filter(
                  (s: any) => s.completed
                ).length || 0;
              const progress = Math.round(
                (completedSteps / totalSteps) * 100
              );

              setSessionContext({
                stepTitle: fullBlock.fragment_step.title,
                stepDescription:
                  fullBlock.fragment_step.description || null,
                deliverableTitle: deliverable.title,
                deliverableType: deliverable.type,
                dueDate: deliverable.due_date,
                progress,
                subjectName: deliverable.subject?.name || "Sin asignatura",
              });
            }
          }
        }
      }
      setLoading(false);
    }
    load();
  }, [blockId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-3rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-muted" />
      </div>
    );
  }

  return (
    <QuarantineScreen
      blockId={blockId}
      step={step}
      durationMinutes={block?.planned_minutes || 25}
      onEnd={() => router.push("/")}
      sessionContext={sessionContext}
    />
  );
}
