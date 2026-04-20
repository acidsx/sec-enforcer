"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { SessionHeader } from "@/components/session/SessionHeader";
import { ChatTutor } from "@/components/session/ChatTutor";
import { StepPanel } from "@/components/session/StepPanel";
import { AmbientTimer } from "@/components/session/AmbientTimer";
import { ProgressPanel } from "@/components/session/ProgressPanel";
import type { TutorContext } from "@/lib/yleos/prompts/tutor-system";

export default function SessionPage({
  params,
}: {
  params: Promise<{ blockId: string }>;
}) {
  const { blockId } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [plannedMinutes, setPlannedMinutes] = useState(25);
  const [tutorContext, setTutorContext] = useState<TutorContext | null>(null);
  const [stepTitle, setStepTitle] = useState("");
  const [stepDescription, setStepDescription] = useState<string | null>(null);
  const [rubricSummary, setRubricSummary] = useState<string | null>(null);
  const [deliverableTitle, setDeliverableTitle] = useState("");
  const [stepOrder, setStepOrder] = useState(1);
  const [stepsTotal, setStepsTotal] = useState(1);

  useEffect(() => {
    async function load() {
      // Start the session
      const startRes = await fetch(`/api/focus-blocks/${blockId}/start`, {
        method: "POST",
      });
      const startData = await startRes.json();

      if (!startRes.ok) {
        router.push("/");
        return;
      }

      setStartedAt(startData.block.started_at);
      setPlannedMinutes(startData.block.planned_minutes || 25);

      // Load step and deliverable context
      if (startData.block.step_id) {
        const blocksRes = await fetch("/api/focus-blocks");
        const blocksData = await blocksRes.json();
        const fullBlock = blocksData.blocks?.find(
          (b: any) => b.id === blockId
        );

        if (fullBlock?.fragment_step) {
          const step = fullBlock.fragment_step;
          setStepTitle(step.title);
          setStepDescription(step.description || null);

          // Fetch deliverable for full context
          const delRes = await fetch("/api/deliverables");
          const delData = await delRes.json();
          const deliverable = delData.deliverables?.find(
            (d: any) => d.id === step.deliverable_id
          );

          if (deliverable) {
            setDeliverableTitle(deliverable.title);
            setRubricSummary(deliverable.description || null);

            const allSteps = (deliverable.fragment_steps || []).sort(
              (a: any, b: any) => a.step_number - b.step_number
            );
            const currentStepIdx = allSteps.findIndex(
              (s: any) => s.id === step.id
            );
            const order = currentStepIdx >= 0 ? currentStepIdx + 1 : 1;
            setStepOrder(order);
            setStepsTotal(allSteps.length);

            const completedSteps = allSteps.filter(
              (s: any) => s.completed
            ).length;
            const progress = Math.round(
              (completedSteps / allSteps.length) * 100
            );

            const daysToDeadline = Math.ceil(
              (new Date(deliverable.due_date).getTime() - Date.now()) /
                (1000 * 60 * 60 * 24)
            );

            // Fetch previous checkpoints
            let previousCheckpoints: {
              concept: string;
              student_articulation: string;
            }[] = [];
            // Get from any previous session for this deliverable's steps
            // For now, empty — will populate as sessions occur

            setTutorContext({
              stepTitle: step.title,
              stepDescription: step.description || null,
              stepOrder: order,
              stepsTotal: allSteps.length,
              deliverableTitle: deliverable.title,
              deliverableDescription: deliverable.description || null,
              rubricSummary: deliverable.description || null,
              daysToDeadline,
              previousCheckpoints,
            });
          }
        }
      }

      setLoading(false);
    }
    load();
  }, [blockId, router]);

  async function handleClose(closingNote?: string) {
    await fetch(`/api/focus-blocks/${blockId}/end`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "completed",
        notes: closingNote,
      }),
    });
    router.push("/");
  }

  if (loading) {
    return (
      <div
        className="fixed inset-0 flex items-center justify-center z-50"
        style={{ backgroundColor: "var(--bg-canvas)" }}
      >
        <Loader2
          className="h-8 w-8 animate-spin"
          style={{ color: "var(--text-muted)" }}
        />
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 flex flex-col z-50"
      style={{ backgroundColor: "var(--bg-canvas)" }}
    >
      {/* Header */}
      <SessionHeader
        deliverableTitle={deliverableTitle}
        stepOrder={stepOrder}
        stepsTotal={stepsTotal}
        onClose={handleClose}
      />

      {/* Main content */}
      <div className="flex flex-1 min-h-0">
        {/* Chat — 60% */}
        <div
          className="flex-[3] min-w-0 border-r"
          style={{ borderColor: "var(--bg-muted)" }}
        >
          {tutorContext ? (
            <ChatTutor tutorContext={tutorContext} sessionId={blockId} />
          ) : (
            <div
              className="flex items-center justify-center h-full"
              style={{ color: "var(--text-muted)" }}
            >
              <p className="text-sm">Sin contexto de sesión</p>
            </div>
          )}
        </div>

        {/* Step panel — 35% */}
        <div className="flex-[2] min-w-0">
          <StepPanel
            stepTitle={stepTitle}
            stepDescription={stepDescription}
            rubricSummary={rubricSummary}
          />
        </div>
      </div>

      {/* Progress panel */}
      <ProgressPanel sessionId={blockId} />

      {/* Ambient timer */}
      {startedAt && (
        <AmbientTimer startedAt={startedAt} plannedMinutes={plannedMinutes} />
      )}
    </div>
  );
}
