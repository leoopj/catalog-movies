import { firstCuratedBadge, withBadges } from "./availability";
import { DEFAULT_FILTERS } from "./filters";
import { discoverMovies, getMovie } from "./tmdb/movies";
import type { MovieDetails, MovieSummary } from "./tmdb/types";

export function pickHero(movies: MovieSummary[]): MovieSummary | null {
  return movies.find((movie) => movie.backdropUrl !== null) ?? null;
}

export async function getHomeTrending(): Promise<{
  hero: MovieDetails | null;
  trending: MovieSummary[];
}> {
  const paged = await discoverMovies(DEFAULT_FILTERS, 1);
  const picked = pickHero(paged.items);

  const [hero, trending] = await Promise.all([
    picked ? getMovie(picked.id) : Promise.resolve(null),
    withBadges(paged.items),
  ]);

  if (hero) {
    hero.badge = firstCuratedBadge(hero.watch);
  }

  return { hero, trending };
}

export async function getServiceRail(providerId: number): Promise<MovieSummary[]> {
  const paged = await discoverMovies({ ...DEFAULT_FILTERS, servicos: [providerId] }, 1);
  return paged.items;
}
