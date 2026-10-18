import { beforeEach, expect, test, vi } from "vitest";
import { summary } from "@/test/helpers";
import { TmdbUnavailable } from "@/lib/tmdb/client";

vi.mock("@/lib/tmdb/movies", () => ({
  searchAvailable: vi.fn(),
}));

import { searchAvailable } from "@/lib/tmdb/movies";
import { GET } from "./route";

const mockedSearch = searchAvailable as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  mockedSearch.mockReset();
  mockedSearch.mockResolvedValue({ items: [summary], page: 2, totalPages: 10 });
});

test("repassa termo e página", async () => {
  const res = await GET(new Request("http://x/api/busca?q=Am%C3%A9lie%20%26%20cia&page=2"));
  expect(res.status).toBe(200);
  expect(searchAvailable).toHaveBeenCalledWith("Amélie & cia", 2);
});

test("página inválida dá 400", async () => {
  expect((await GET(new Request("http://x/api/busca?q=a&page=0"))).status).toBe(400);
});

test("TMDB fora do ar dá 503", async () => {
  mockedSearch.mockRejectedValueOnce(new TmdbUnavailable(500));
  expect((await GET(new Request("http://x/api/busca?q=a&page=1"))).status).toBe(503);
});
