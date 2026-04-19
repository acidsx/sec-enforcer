// ── Database Types (matching supabase/schema.sql) ──

export interface Subject {
  id: string;
  user_id: string;
  name: string;
  code: string | null;
  created_at: string;
}

export interface Deliverable {
  id: string;
  subject_id: string;
  user_id: string;
  title: string;
  type: "informe" | "presentacion" | "codigo" | "ensayo" | "examen" | "tarea";
  due_date: string;
  weight: number;
  description: string | null;
  status: "pending" | "in_progress" | "completed" | "overdue";
  created_at: string;
}

export interface FragmentStep {
  id: string;
  deliverable_id: string;
  user_id: string;
  step_number: number;
  title: string;
  description: string | null;
  scheduled_date: string;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
}

export interface FocusBlock {
  id: string;
  user_id: string;
  step_id: string | null;
  started_at: string | null;
  ended_at: string | null;
  planned_minutes: number;
  status: "planned" | "active" | "completed" | "abandoned";
  notes: string | null;
  created_at: string;
}

export interface Checkin {
  id: string;
  focus_block_id: string;
  user_id: string;
  mood: number;
  progress: number;
  note: string | null;
  created_at: string;
}

// Joined types for UI
export interface DeliverableWithSteps extends Deliverable {
  fragment_steps: FragmentStep[];
}

export interface FocusBlockWithCheckins extends FocusBlock {
  checkins: Checkin[];
  fragment_step?: FragmentStep | null;
}
