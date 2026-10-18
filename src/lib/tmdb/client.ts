import "server-only";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TIMEOUT_MS = 8000;

export const REVALIDATE = {
  list: 21600,
  detail: 86400,
  static: 604800,
} as const;

export class TmdbNotFound extends Error {
  constructor(path: string) {
    super(`TMDB: recurso não encontrado em ${path}`);
    this.name = "TmdbNotFound";
  }
}

export class TmdbUnavailable extends Error {
  status: number | null;

  constructor(status: number | null, message?: string) {
    super(message ?? `TMDB indisponível${status !== null ? ` (status ${status})` : ""}`);
    this.name = "TmdbUnavailable";
    this.status = status;
  }
}

function buildUrl(path: string, params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    search.set(key, String(value));
  }
  const query = search.toString();
  return `${TMDB_BASE_URL}${path}${query ? `?${query}` : ""}`;
}

export async function tmdbFetch<T>(
  path: string,
  params: Record<string, string | number | undefined>,
  revalidate: number,
): Promise<T> {
  const token = process.env.TMDB_READ_TOKEN;
  const url = buildUrl(path, params);

  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      next: { revalidate },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    throw new TmdbUnavailable(null);
  }

  if (response.status === 404) {
    throw new TmdbNotFound(path);
  }

  if (!response.ok) {
    throw new TmdbUnavailable(response.status);
  }

  return (await response.json()) as T;
}
