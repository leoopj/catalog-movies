"use client";

import { useEffect, useState } from "react";

type TrailerProps = {
  youtubeKey: string;
  label?: string;
};

export function Trailer({ youtubeKey, label = "Trailer" }: TrailerProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded bg-white/10 px-5 py-2.5 font-semibold text-[var(--foreground)] backdrop-blur-sm transition hover:bg-white/20"
      >
        ▶ {label}
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
        >
          <div className="relative aspect-video w-full max-w-3xl">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${youtubeKey}?autoplay=1`}
              title={label}
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              className="h-full w-full rounded-md"
            />
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute -top-10 right-0 rounded-md bg-[var(--surface)] px-3 py-1 text-sm font-medium text-[var(--foreground)] hover:opacity-90"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
