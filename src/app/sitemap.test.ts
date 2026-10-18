import { beforeEach, expect, test, vi } from "vitest";
import { summary } from "@/test/helpers";

vi.mock("@/lib/tmdb/movies", () => ({
  discoverMovies: vi.fn(),
}));

import { discoverMovies } from "@/lib/tmdb/movies";
import { TmdbUnavailable } from "@/lib/tmdb/client";
import { SITE } from "@/lib/site";
import sitemap from "./sitemap";

beforeEach(() => {
  vi.mocked(discoverMovies).mockReset();
});

test("sitemap inclui páginas estáticas e filmes sem duplicatas", async () => {
  vi.mocked(discoverMovies).mockResolvedValue({
    items: [{ ...summary, id: 550, title: "Clube da Luta" }],
    page: 1,
    totalPages: 500,
  });

  const urls = (await sitemap()).map((e) => e.url);

  expect(urls).toContain(SITE.url);
  expect(urls).toContain(`${SITE.url}/explorar`);
  expect(urls).toContain(`${SITE.url}/sobre`);
  expect(urls.filter((u) => u.endsWith("/filme/550-clube-da-luta"))).toHaveLength(1);
  expect(discoverMovies).toHaveBeenCalledTimes(15);
});

test("sitemap sobrevive a falha do TMDB", async () => {
  vi.mocked(discoverMovies).mockRejectedValue(new TmdbUnavailable(500));

  expect((await sitemap()).map((e) => e.url)).toEqual([
    SITE.url,
    `${SITE.url}/explorar`,
    `${SITE.url}/sobre`,
  ]);
});
