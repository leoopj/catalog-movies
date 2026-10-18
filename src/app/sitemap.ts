import type { MetadataRoute } from "next";
import { DEFAULT_FILTERS } from "@/lib/filters";
import { SITE } from "@/lib/site";
import { movieSlug } from "@/lib/slug";
import { discoverMovies } from "@/lib/tmdb/movies";

const DISCOVER_PAGES = 15;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = [
    { url: SITE.url },
    { url: `${SITE.url}/explorar` },
    { url: `${SITE.url}/sobre` },
  ];

  const seen = new Set<number>();
  const movieEntries: MetadataRoute.Sitemap = [];

  try {
    const pages = await Promise.all(
      Array.from({ length: DISCOVER_PAGES }, (_, i) => discoverMovies(DEFAULT_FILTERS, i + 1)),
    );

    for (const paged of pages) {
      for (const movie of paged.items) {
        if (seen.has(movie.id)) continue;
        seen.add(movie.id);
        movieEntries.push({ url: `${SITE.url}/filme/${movieSlug(movie.id, movie.title)}` });
      }
    }
  } catch {
    return staticEntries;
  }

  return [...staticEntries, ...movieEntries];
}
