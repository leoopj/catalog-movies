import { CURATED_PROVIDERS, getProvider } from "./providers";
import type { MovieSummary, Paged } from "./tmdb/types";

// Re-exportados aqui para que client components (ex.: LoadMore) possam
// importar esses tipos sem depender diretamente de "@/lib/tmdb/*", que é
// reservado para código server-only.
export type { MovieSummary, Paged };

export type SortKey = "popularidade" | "nota" | "lancamento";

export type Filters = {
  servicos: number[];
  aluguel: boolean;
  genero: number | null;
  anoDe: number | null;
  anoAte: number | null;
  nota: number | null;
  ordem: SortKey;
};

export const DEFAULT_FILTERS: Filters = {
  servicos: [],
  aluguel: false,
  genero: null,
  anoDe: null,
  anoAte: null,
  nota: null,
  ordem: "popularidade",
};

const SORT_KEYS: SortKey[] = ["popularidade", "nota", "lancamento"];
const MIN_YEAR = 1900;

type RawParams = URLSearchParams | Record<string, string | string[] | undefined>;

function getParam(params: RawParams, key: string): string | undefined {
  if (params instanceof URLSearchParams) {
    return params.get(key) ?? undefined;
  }
  const value = params[key];
  if (Array.isArray(value)) return value[0];
  return value;
}

function parseServicos(raw: string | undefined): number[] {
  if (!raw) return [];
  const result: number[] = [];
  for (const part of raw.split(",")) {
    const n = Number(part);
    if (!Number.isInteger(n)) continue;
    const provider = getProvider(n);
    if (!provider) continue;
    if (!result.includes(n)) result.push(n);
  }
  return result;
}

function parseGenero(raw: string | undefined): number | null {
  if (raw === undefined) return null;
  const n = Number(raw);
  if (!Number.isInteger(n) || n <= 0) return null;
  return n;
}

function parseAno(raw: string | undefined): { anoDe: number | null; anoAte: number | null } {
  if (!raw) return { anoDe: null, anoAte: null };
  const maxYear = new Date().getFullYear() + 1;
  const invalid = { anoDe: null, anoAte: null };
  const parts = raw.split("-");
  let anoDe: number;
  let anoAte: number;
  if (parts.length === 1) {
    const n = Number(parts[0]);
    if (!Number.isInteger(n)) return invalid;
    anoDe = n;
    anoAte = n;
  } else if (parts.length === 2) {
    const de = Number(parts[0]);
    const ate = Number(parts[1]);
    if (!Number.isInteger(de) || !Number.isInteger(ate)) return invalid;
    anoDe = de;
    anoAte = ate;
  } else {
    return invalid;
  }
  if (anoDe < MIN_YEAR || anoDe > maxYear) return invalid;
  if (anoAte < MIN_YEAR || anoAte > maxYear) return invalid;
  if (anoDe > anoAte) return invalid;
  return { anoDe, anoAte };
}

function parseNota(raw: string | undefined): number | null {
  if (raw === undefined) return null;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1 || n > 9) return null;
  return n;
}

function parseOrdem(raw: string | undefined): SortKey {
  if (raw && (SORT_KEYS as string[]).includes(raw)) return raw as SortKey;
  return DEFAULT_FILTERS.ordem;
}

export function parseFilters(params: RawParams): Filters {
  const servicos = parseServicos(getParam(params, "servicos"));
  const aluguel = getParam(params, "aluguel") === "1";
  const genero = parseGenero(getParam(params, "genero"));
  const { anoDe, anoAte } = parseAno(getParam(params, "ano"));
  const nota = parseNota(getParam(params, "nota"));
  const ordem = parseOrdem(getParam(params, "ordem"));
  return { servicos, aluguel, genero, anoDe, anoAte, nota, ordem };
}

export function serializeFilters(f: Filters): string {
  const parts: string[] = [];
  if (f.servicos.length > 0) parts.push(`servicos=${f.servicos.join(",")}`);
  if (f.genero !== null) parts.push(`genero=${f.genero}`);
  if (f.anoDe !== null && f.anoAte !== null) {
    parts.push(`ano=${f.anoDe === f.anoAte ? f.anoDe : `${f.anoDe}-${f.anoAte}`}`);
  }
  if (f.nota !== null) parts.push(`nota=${f.nota}`);
  if (f.ordem !== DEFAULT_FILTERS.ordem) parts.push(`ordem=${f.ordem}`);
  if (f.aluguel) parts.push("aluguel=1");
  return parts.join("&");
}

const SORT_BY: Record<SortKey, string> = {
  popularidade: "popularity.desc",
  nota: "vote_average.desc",
  lancamento: "primary_release_date.desc",
};

export function toDiscoverParams(f: Filters, page: number): Record<string, string> {
  const providers =
    f.servicos.length > 0
      ? f.servicos.map((id) => getProvider(id)).filter((p): p is NonNullable<typeof p> => !!p)
      : CURATED_PROVIDERS;
  const tmdbIds = providers.flatMap((p) => p.tmdbIds);

  const monetizationTypes = ["flatrate", "free", "ads"];
  if (f.aluguel) monetizationTypes.push("rent", "buy");

  const params: Record<string, string> = {
    watch_region: "BR",
    language: "pt-BR",
    include_adult: "false",
    with_watch_providers: tmdbIds.join("|"),
    with_watch_monetization_types: monetizationTypes.join("|"),
    sort_by: SORT_BY[f.ordem],
    page: String(page),
  };

  if (f.genero !== null) params.with_genres = String(f.genero);
  if (f.anoDe !== null) params["primary_release_date.gte"] = `${f.anoDe}-01-01`;
  if (f.anoAte !== null) params["primary_release_date.lte"] = `${f.anoAte}-12-31`;
  if (f.nota !== null) params["vote_average.gte"] = String(f.nota);
  if (f.nota !== null || f.ordem === "nota") params["vote_count.gte"] = "100";

  return params;
}
