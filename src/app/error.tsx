"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 px-4 py-24 text-center">
      <h1 className="text-xl font-semibold">
        Não conseguimos carregar o catálogo agora
      </h1>
      <button
        type="button"
        onClick={reset}
        className="rounded-md bg-[var(--accent)] px-4 py-2 font-medium text-black hover:opacity-90"
      >
        Tentar de novo
      </button>
    </div>
  );
}
