import { beforeEach, expect, test, vi } from "vitest";
import { summary } from "@/test/helpers";

vi.mock("./tmdb/movies", () => ({
  discoverMovies: vi.fn(),
  getMovie: vi.fn(),
}));

vi.mock("./availability", () => ({
  withBadges: vi.fn(),
  firstCuratedBadge: vi.fn(),
}));

import { discoverMovies, getMovie } from "./tmdb/movies";
import { firstCuratedBadge, withBadges } from "./availability";
import { getHomeTrending, getServiceRail, pickHero } from "./home";

const discoverMock = discoverMovies as unknown as ReturnType<typeof vi.fn>;
const getMovieMock = getMovie as unknown as ReturnType<typeof vi.fn>;
const withBadgesMock = withBadges as unknown as ReturnType<typeof vi.fn>;
const firstCuratedBadgeMock = firstCuratedBadge as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  discoverMock.mockReset();
  getMovieMock.mockReset();
  withBadgesMock.mockReset();
  firstCuratedBadgeMock.mockReset();
});

test("pickHero ignora filmes sem imagem de fundo", () => {
  expect(pickHero([{ ...summary, id: 1, backdropUrl: null }, { ...summary, id: 2, backdropUrl: "u" }])?.id).toBe(2);
  expect(pickHero([{ ...summary, backdropUrl: null }])).toBeNull();
});

test("trilho de serviço filtra só aquele serviço", async () => {
  discoverMock.mockResolvedValue({ items: [], page: 1, totalPages: 0 });
  await getServiceRail(8);
  expect(discoverMovies).toHaveBeenCalledWith(expect.objectContaining({ servicos: [8] }), 1);
});

test("getHomeTrending monta herói com badge e filmes em alta", async () => {
  const items = [{ ...summary, id: 1, backdropUrl: null }, { ...summary, id: 2, backdropUrl: "u" }];
  discoverMock.mockResolvedValue({ items, page: 1, totalPages: 1 });
  const heroDetails = { ...summary, id: 2, watch: { link: null, subscription: [], free: [], rent: [], buy: [] } };
  getMovieMock.mockResolvedValue(heroDetails);
  withBadgesMock.mockResolvedValue(items);
  firstCuratedBadgeMock.mockReturnValue(null);

  const result = await getHomeTrending();

  expect(getMovie).toHaveBeenCalledWith(2);
  expect(firstCuratedBadge).toHaveBeenCalledWith(heroDetails.watch);
  expect(result.hero?.id).toBe(2);
  expect(result.trending).toBe(items);
});
