import { beforeEach, expect, test, vi } from "vitest";
import discoverFixture from "./__fixtures__/discover.json";
import detailsFixture from "./__fixtures__/movie-details.json";

vi.mock("./client", async () => {
  const actual = await vi.importActual<typeof import("./client")>("./client");
  return {
    ...actual,
    tmdbFetch: vi.fn(),
  };
});

import { tmdbFetch } from "./client";
import { getGenres, getMovie, searchAvailable, searchMovies } from "./movies";

const mockedFetch = tmdbFetch as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  mockedFetch.mockReset();
});

test("searchAvailable com termo vazio não chama o TMDB", async () => {
  expect(await searchAvailable("   ", 1)).toEqual({ items: [], page: 1, totalPages: 0 });
  expect(tmdbFetch).not.toHaveBeenCalled();
});

test("searchMovies envia o termo sem alteração", async () => {
  mockedFetch.mockResolvedValue(discoverFixture);
  await searchMovies("Amélie & cia", 1);
  expect(tmdbFetch).toHaveBeenCalledWith(
    "/search/movie",
    expect.objectContaining({ query: "Amélie & cia", language: "pt-BR", include_adult: "false", page: 1 }),
    21600,
  );
});

test("getMovie pede os apêndices da spec", async () => {
  mockedFetch.mockResolvedValue(detailsFixture);
  await getMovie(10);
  expect(tmdbFetch).toHaveBeenCalledWith(
    "/movie/10",
    expect.objectContaining({
      append_to_response: "credits,videos,watch/providers,release_dates,recommendations",
      include_video_language: "pt,en",
      language: "pt-BR",
    }),
    86400,
  );
});

test("getGenres busca a lista de gêneros em pt-BR", async () => {
  mockedFetch.mockResolvedValue({ genres: [{ id: 28, name: "Ação" }] });
  const genres = await getGenres();
  expect(genres).toEqual([{ id: 28, name: "Ação" }]);
  expect(tmdbFetch).toHaveBeenCalledWith("/genre/movie/list", expect.objectContaining({ language: "pt-BR" }), 604800);
});
