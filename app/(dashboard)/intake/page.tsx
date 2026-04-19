"use client";

import { useState, useEffect } from "react";
import { PdfDropzone } from "@/components/intake/PdfDropzone";
import { YleosProcessor } from "@/components/intake/YleosProcessor";
import { Plus } from "lucide-react";

interface Subject {
  id: string;
  name: string;
  code: string | null;
}

export default function IntakePage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [showNewSubject, setShowNewSubject] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCode, setNewCode] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSubjects();
  }, []);

  async function fetchSubjects() {
    const res = await fetch("/api/subjects");
    const data = await res.json();
    if (res.ok) setSubjects(data.subjects);
  }

  async function createSubject(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setLoading(true);

    const res = await fetch("/api/subjects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName, code: newCode || undefined }),
    });
    const data = await res.json();

    if (res.ok) {
      setSubjects((prev) => [data.subject, ...prev]);
      setSelectedSubject(data.subject.id);
      setShowNewSubject(false);
      setNewName("");
      setNewCode("");
    }

    setLoading(false);
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Ingesta de Syllabus
        </h1>
        <p className="mt-1 text-muted">
          Sube un PDF de syllabus para extraer entregables automáticamente.
        </p>
      </div>

      {/* Subject selection */}
      <div className="space-y-3">
        <label className="block text-sm font-medium">Asignatura</label>
        <div className="flex gap-2">
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="flex-1 rounded-lg border border-border bg-surface px-3 py-2.5 text-foreground focus:border-accent focus:outline-none"
          >
            <option value="">Selecciona una asignatura</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.code ? `[${s.code}] ` : ""}
                {s.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => setShowNewSubject(!showNewSubject)}
            className="flex items-center gap-1 rounded-lg bg-surface-2 px-3 py-2.5 text-sm font-medium text-muted hover:bg-border hover:text-foreground transition"
          >
            <Plus className="h-4 w-4" />
            Nueva
          </button>
        </div>

        {showNewSubject && (
          <form
            onSubmit={createSubject}
            className="flex gap-2 rounded-lg border border-border bg-surface p-3"
          >
            <input
              type="text"
              placeholder="Nombre de la asignatura"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted/50 focus:border-accent focus:outline-none"
              required
            />
            <input
              type="text"
              placeholder="Código (opt.)"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
              className="w-28 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted/50 focus:border-accent focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-dim transition disabled:opacity-50"
            >
              Crear
            </button>
          </form>
        )}
      </div>

      {/* PDF Upload */}
      {selectedSubject && (
        <>
          <PdfDropzone onFileSelected={setFile} />

          {file && (
            <YleosProcessor
              subjectId={selectedSubject}
              file={file}
              onComplete={() => {
                setFile(null);
              }}
            />
          )}
        </>
      )}

      {!selectedSubject && (
        <p className="text-sm text-muted">
          Selecciona o crea una asignatura para continuar.
        </p>
      )}
    </div>
  );
}
