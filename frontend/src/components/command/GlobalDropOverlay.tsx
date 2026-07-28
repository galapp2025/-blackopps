"use client";

import { useEffect, useState } from "react";

type GlobalDropOverlayProps = {
  onFile: (file: File) => void;
  active: boolean;
};

export function GlobalDropOverlay({ onFile, active }: GlobalDropOverlayProps) {
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (!active) return;
    const prevent = (e: DragEvent) => {
      e.preventDefault();
    };
    const onEnter = (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer?.types.includes("Files")) setDragging(true);
    };
    const onLeave = (e: DragEvent) => {
      if (e.relatedTarget === null) setDragging(false);
    };
    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer?.files?.[0];
      if (file) onFile(file);
    };
    window.addEventListener("dragover", prevent);
    window.addEventListener("dragenter", onEnter);
    window.addEventListener("dragleave", onLeave);
    window.addEventListener("drop", onDrop);
    return () => {
      window.removeEventListener("dragover", prevent);
      window.removeEventListener("dragenter", onEnter);
      window.removeEventListener("dragleave", onLeave);
      window.removeEventListener("drop", onDrop);
    };
  }, [active, onFile]);

  if (!dragging) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[90] flex items-center justify-center bg-red-950/40 backdrop-blur-sm">
      <div className="glass-panel-strong rounded-3xl border-2 border-dashed border-red-400/60 px-12 py-10 text-center">
        <p className="tactical-header text-red-300">Drop Zone Active</p>
        <p className="command-text mt-2 text-lg text-white">שחרר קובץ Excel לייבוא מיידי</p>
      </div>
    </div>
  );
}
