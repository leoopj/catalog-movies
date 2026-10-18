import { CURATED_PROVIDERS } from "./providers";
import { logoUrl } from "./images";
import type { MovieSummary, ProviderBadge, WatchAvailability } from "./tmdb/types";
import { getWatchAvailability } from "./tmdb/movies";

export function firstCuratedBadge(w: WatchAvailability): ProviderBadge | null {
  const available = [...w.subscription, ...w.free].map((o) => o.providerId);
  for (const provider of CURATED_PROVIDERS) {
    if (provider.tmdbIds.some((id) => available.includes(id))) {
      return {
        id: provider.id,
        name: provider.name,
        logoUrl: logoUrl(provider.logoPath),
        color: provider.color,
      };
    }
  }
  return null;
}

export async function withBadges(
  movies: MovieSummary[],
  lookup: (id: number) => Promise<WatchAvailability> = getWatchAvailability,
): Promise<MovieSummary[]> {
  const results = await Promise.allSettled(movies.map((m) => lookup(m.id)));
  const withMaybeBadge: (MovieSummary | null)[] = movies.map((movie, i) => {
    const result = results[i];
    if (result.status !== "fulfilled") return null;
    const badge = firstCuratedBadge(result.value);
    if (!badge) return null;
    return { ...movie, badge };
  });
  return withMaybeBadge.filter((m): m is MovieSummary => m !== null);
}
