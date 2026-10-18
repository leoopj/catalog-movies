import { beforeEach, expect, test, vi } from "vitest";
import { mockFetch } from "@/test/helpers";
import { TmdbNotFound, tmdbFetch } from "./client";

beforeEach(() => {
  process.env.TMDB_READ_TOKEN = "t";
});

test("envia token, parâmetros e revalidate", async () => {
  const f = mockFetch(200, { ok: 1 });
  await tmdbFetch("/discover/movie", { page: 2, x: undefined }, 21600);
  const [url, init] = f.mock.calls[0];
  expect(url).toBe("https://api.themoviedb.org/3/discover/movie?page=2");
  expect(init.headers.Authorization).toBe("Bearer t");
  expect(init.next).toEqual({ revalidate: 21600 });
});

test("404 vira TmdbNotFound", async () => {
  mockFetch(404, {});
  await expect(tmdbFetch("/movie/1", {}, 1)).rejects.toBeInstanceOf(TmdbNotFound);
});

test.each([500, 503, 429, 401])("%i vira TmdbUnavailable com status", async (s) => {
  mockFetch(s, {});
  await expect(tmdbFetch("/x", {}, 1)).rejects.toMatchObject({ name: "TmdbUnavailable", status: s });
});

test("erro de rede ou timeout vira TmdbUnavailable sem status", async () => {
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new DOMException("t", "TimeoutError")));
  await expect(tmdbFetch("/x", {}, 1)).rejects.toMatchObject({ name: "TmdbUnavailable", status: null });
});
