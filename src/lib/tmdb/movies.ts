import { toDiscoverParams, type Filters } from "../filters";
import { withBadges } from "../availability";
import { REVALIDATE, tmdbFetch } from "./client";
import { mapDetails, mapPaged, mapWatch } from "./mappers";
import type { MovieDetails, MovieSummary, Paged, RawDetails, RawPaged, RawWatchProviders, WatchAvailability } from "./types";

const APPEND_TO_RESPONSE = "credits,videos,watch/providers,release_dates,recommendations";

export async function discoverMovies(f: Filters, page: number): Promise<Paged<MovieSummary>> {
  const raw = await tmdbFetch<RawPaged>("/discover/movie", toDiscoverParams(f, page), REVALIDATE.list);
  return mapPaged(raw);
}

export async function getMovie(id: number): Promise<MovieDetails> {
  const raw = await tmdbFetch<RawDetails>(
    `/movie/${id}`,
    {
      append_to_response: APPEND_TO_RESPONSE,
      include_video_language: "pt,en",
      language: "pt-BR",
    },
    REVALIDATE.detail,
  );
  return mapDetails(raw);
}

export async function getWatchAvailability(id: number): Promise<WatchAvailability> {
  const raw = await tmdbFetch<RawWatchProviders>(`/movie/${id}/watch/providers`, {}, REVALIDATE.detail);
  return mapWatch(raw);
}

export async function getGenres(): Promise<{ id: number; name: string }[]> {
  const raw = await tmdbFetch<{ genres: { id: number; name: string }[] }>(
    "/genre/movie/list",
    { language: "pt-BR" },
    REVALIDATE.static,
  );
  return raw.genres;
}

export async function searchMovies(q: string, page: number): Promise<Paged<MovieSummary>> {
  const raw = await tmdbFetch<RawPaged>(
    "/search/movie",
    { query: q, language: "pt-BR", include_adult: "false", page },
    REVALIDATE.list,
  );
  return mapPaged(raw);
}

export async function searchAvailable(q: string, page: number): Promise<Paged<MovieSummary>> {
  if (q.trim() === "") {
    return { items: [], page: 1, totalPages: 0 };
  }
  const paged = await searchMovies(q, page);
  const items = await withBadges(paged.items);
  return { items, page: paged.page, totalPages: paged.totalPages };
}
