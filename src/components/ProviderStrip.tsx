"use client";

import { useRouter } from "next/navigation";
import type { Filters } from "@/lib/filters";
import { serializeFilters } from "@/lib/filters";
import { CURATED_PROVIDERS } from "@/lib/providers";

type ProviderStripProps = {
  filters: Filters;
};

export function ProviderStrip({ filters }: ProviderStripProps) {
  const router = useRouter();

  function go(servicos: number[]) {
    const query = serializeFilters({ ...filters, servicos });
    router.push(`/explorar${query ? `?${query}` : ""}`);
  }

  function toggle(id: number) {
    const servicos = filters.servicos.includes(id)
      ? filters.servicos.filter((s) => s !== id)
      : [...filters.servicos, id];
    go(servicos);
  }

  const todosAtivo = filters.servicos.length === 0;

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      <button
        type="button"
        aria-pressed={todosAtivo}
        onClick={() => go([])}
        className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium ${
          todosAtivo ? "bg-[var(--accent)] text-black" : "bg-[var(--surface)] text-[var(--foreground)]"
        }`}
      >
        Todos
      </button>
      {CURATED_PROVIDERS.map((provider) => {
        const ativo = filters.servicos.includes(provider.id);
        return (
          <button
            key={provider.id}
            type="button"
            aria-pressed={ativo}
            onClick={() => toggle(provider.id)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium ${
              ativo ? "bg-[var(--accent)] text-black" : "bg-[var(--surface)] text-[var(--foreground)]"
            }`}
          >
            {provider.name}
          </button>
        );
      })}
    </div>
  );
}
