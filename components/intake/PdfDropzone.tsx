"use client";

import { useState, useRef } from "react";
import { Upload, FileText, X } from "lucide-react";

interface PdfDropzoneProps {
  onFileSelected: (file: File) => void;
}

export function PdfDropzone({ onFileSelected }: PdfDropzoneProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    if (file.type !== "application/pdf") return;
    setSelectedFile(file);
    onFileSelected(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragActive(true);
      }}
      onDragLeave={() => setDragActive(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition ${
        dragActive
          ? "border-accent bg-accent/5"
          : "border-border hover:border-muted"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        onChange={handleChange}
        className="hidden"
      />

      {selectedFile ? (
        <div className="flex items-center justify-center gap-3">
          <FileText className="h-8 w-8 text-accent" />
          <div className="text-left">
            <p className="font-medium">{selectedFile.name}</p>
            <p className="text-sm text-muted">
              {(selectedFile.size / 1024).toFixed(0)} KB
            </p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedFile(null);
            }}
            className="ml-2 text-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      ) : (
        <>
          <Upload className="h-10 w-10 text-muted mx-auto mb-3" />
          <p className="font-medium">
            Arrastra tu syllabus aquí o haz click para seleccionar
          </p>
          <p className="text-sm text-muted mt-1">Solo archivos PDF</p>
        </>
      )}
    </div>
  );
}
