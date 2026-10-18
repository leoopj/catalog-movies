import { beforeEach, expect, test, vi } from "vitest";
import { summary } from "@/test/helpers";
import { TmdbUnavailable } from "@/lib/tmdb/client";

vi.mock("@/lib/tmdb/movies", () => ({
  discoverMovies: vi.fn(),
}));

import { discoverMovies } from "@/lib/tmdb/movies";
import { GET } from "./route";

const mockedDiscover = discoverMovies as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  mockedDiscover.mockReset();
  mockedDiscover.mockResolvedValue({ items: [summary], page: 2, totalPages: 10 });
});

test("repassa filtros e página", async () => {
  const res = await GET(new Request("http://x/api/filmes?servicos=8&page=2"));
  expect(res.status).toBe(200);
  expect(discoverMovies).toHaveBeenCalledWith(expect.objectContaining({ servicos: [8] }), 2);
  expect(await res.json()).toEqual({ items: [summary], page: 2, totalPages: 10 });
});

test("página inválida dá 400", async () => {
  expect((await GET(new Request("http://x/api/filmes?page=501"))).status).toBe(400);
});

test("TMDB fora do ar dá 503", async () => {
  mockedDiscover.mockRejectedValueOnce(new TmdbUnavailable(500));
  expect((await GET(new Request("http://x/api/filmes?page=2"))).status).toBe(503);
});
