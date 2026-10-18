"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Filters, SortKey } from "@/lib/filters";
import { serializeFilters } from "@/lib/filters";

type Genre = { id: number; name: string };

type FilterBarProps = {
  filters: Filters;
  genres: Genre[];
};

const YEAR_RANGES: { label: string; anoDe: number; anoAte: number }[] = [
  { label: "2020 - 2026", anoDe: 2020, anoAte: 2026 },
  { label: "2010 - 2019", anoDe: 2010, anoAte: 2019 },
  { label: "2000 - 2009", anoDe: 2000, anoAte: 2009 },
  { label: "1990 - 1999", anoDe: 1990, anoAte: 1999 },
  { label: "1900 - 1989", anoDe: 1900, anoAte: 1989 },
];

const NOTA_OPTIONS = [6, 7, 8];

const ORDEM_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "popularidade", label: "Popularidade" },
  { value: "nota", label: "Nota" },
  { value: "lancamento", label: "Lançamento" },
];

function yearKey(anoDe: number | null, anoAte: number | null): string {
  if (anoDe === null || anoAte === null) return "";
  return `${anoDe}-${anoAte}`;
}

export function FilterBar({ filters, genres }: FilterBarProps) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);

  function go(novo: Filters) {
    const query = serializeFilters(novo);
    router.push(`/explorar${query ? `?${query}` : ""}`);
  }

  function handleGenero(value: string) {
    go({ ...filters, genero: value === "" ? null : Number(value) });
  }

  function handleAno(value: string) {
    if (value === "") {
      go({ ...filters, anoDe: null, anoAte: null });
      return;
    }
    const range = YEAR_RANGES.find((r) => yearKey(r.anoDe, r.anoAte) === value);
    if (!range) return;
    go({ ...filters, anoDe: range.anoDe, anoAte: range.anoAte });
  }

  function handleNota(value: string) {
    go({ ...filters, nota: value === "" ? null : Number(value) });
  }

  function handleAluguel(checked: boolean) {
    go({ ...filters, aluguel: checked });
  }

  function handleOrdem(value: string) {
    go({ ...filters, ordem: value as SortKey });
  }

  const content = (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
      <label className="flex flex-col gap-1 text-sm">
        Gênero
        <select
          aria-label="Gênero"
          value={filters.genero ?? ""}
          onChange={(e) => handleGenero(e.target.value)}
          className="rounded-md bg-[var(--surface)] px-2 py-1.5 text-sm"
        >
          <option value="">Todos</option>
          {genres.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Ano
        <select
          aria-label="Ano"
          value={yearKey(filters.anoDe, filters.anoAte)}
          onChange={(e) => handleAno(e.target.value)}
          className="rounded-md bg-[var(--surface)] px-2 py-1.5 text-sm"
        >
          <option value="">Qualquer</option>
          {YEAR_RANGES.map((r) => (
            <option key={r.label} value={yearKey(r.anoDe, r.anoAte)}>
              {r.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Nota
        <select
          aria-label="Nota"
          value={filters.nota ?? ""}
          onChange={(e) => handleNota(e.target.value)}
          className="rounded-md bg-[var(--surface)] px-2 py-1.5 text-sm"
        >
          <option value="">Qualquer</option>
          {NOTA_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n}+
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          aria-label="Aluguel/compra"
          checked={filters.aluguel}
          onChange={(e) => handleAluguel(e.target.checked)}
        />
        Aluguel/compra
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Ordenação
        <select
          aria-label="Ordenação"
          value={filters.ordem}
          onChange={(e) => handleOrdem(e.target.value)}
          className="rounded-md bg-[var(--surface)] px-2 py-1.5 text-sm"
        >
          {ORDEM_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="rounded-md bg-[var(--surface)] px-3 py-1.5 text-sm font-medium sm:hidden"
      >
        Filtros
      </button>

      <div className="hidden sm:block">{content}</div>

      {aberto && (
        <div className="fixed inset-0 z-50 flex sm:hidden">
          <button
            type="button"
            aria-label="Fechar filtros"
            onClick={() => setAberto(false)}
            className="flex-1 bg-black/60"
          />
          <div className="h-full w-72 max-w-[85%] overflow-y-auto bg-[var(--background)] p-4">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-semibold">Filtros</span>
              <button type="button" onClick={() => setAberto(false)} aria-label="Fechar">
                ✕
              </button>
            </div>
            {content}
          </div>
        </div>
      )}
    </div>
  );
}
