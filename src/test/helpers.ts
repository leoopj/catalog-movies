import { vi } from "vitest";
import type { MovieSummary, ProviderBadge, WatchOption } from "@/lib/tmdb/types";

export const summary: MovieSummary = {
  id: 1,
  title: "Filme",
  year: 2024,
  posterUrl: "https://image.tmdb.org/t/p/w342/poster.jpg",
  backdropUrl: "https://image.tmdb.org/t/p/w1280/backdrop.jpg",
  rating: 7,
  overview: "Sinopse de teste.",
  badge: null,
};

export const netflixBadge: ProviderBadge = {
  id: 8,
  name: "Netflix",
  logoUrl: "https://image.tmdb.org/t/p/w92/rK1KljqmbvO9HQa1PBFLILWah72.png",
  color: "#E50914",
};

export function opt(id: number): WatchOption {
  return { providerId: id, name: `Provider ${id}`, logoUrl: null };
}

function fakeResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

export function mockFetch(status: number, body: unknown) {
  const spy = vi.fn().mockResolvedValue(fakeResponse(status, body));
  vi.stubGlobal("fetch", spy);
  return spy;
}

export function mockFetchJson(body: unknown) {
  return mockFetch(200, body);
}

export function mockFetchStatus(status: number) {
  return mockFetch(status, {});
}
