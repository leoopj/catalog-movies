import { expect, test } from "vitest";
import detailsFixture from "./__fixtures__/movie-details.json";
import discoverFixture from "./__fixtures__/discover.json";
import { mapDetails, mapPaged, mapWatch } from "./mappers";
import type { RawDetails, RawPaged } from "./types";

const details = detailsFixture as unknown as RawDetails;
const discover = discoverFixture as unknown as RawPaged;

test("mapDetails extrai os campos da spec", () => {
  const d = mapDetails(details);
  expect(d.id).toBe(693134);
  expect(d.cast.length).toBeLessThanOrEqual(10);
  expect(d.director).toBe("Denis Villeneuve");
  expect(d.trailerKey).toMatch(/^[\w-]{11}$/);
  expect(d.posterUrl).toMatch(/^https:\/\/image\.tmdb\.org\/t\/p\/w342\//);
  expect(d.recommendations.every((r) => r.badge === null)).toBe(true);
});

test("trailer prefere pt e só aceita YouTube + Trailer", () => {
  const raw = {
    ...details,
    videos: {
      results: [
        { key: "vimeo000001", site: "Vimeo", type: "Trailer", iso_639_1: "pt" },
        { key: "teaserpt001", site: "YouTube", type: "Teaser", iso_639_1: "pt" },
        { key: "trailerEn01", site: "YouTube", type: "Trailer", iso_639_1: "en" },
        { key: "trailerPt01", site: "YouTube", type: "Trailer", iso_639_1: "pt" },
      ],
    },
  };
  expect(mapDetails(raw).trailerKey).toBe("trailerPt01");
});

test("classificação BR: primeira não vazia; ausente vira null", () => {
  const withBR = {
    ...details,
    release_dates: {
      results: [
        {
          iso_3166_1: "BR",
          release_dates: [{ certification: "" }, { certification: "14" }],
        },
      ],
    },
  };
  expect(mapDetails(withBR).certification).toBe("14");
  expect(mapDetails({ ...details, release_dates: { results: [] } }).certification).toBeNull();
});

test("campos ausentes não quebram", () => {
  const d = mapDetails({
    ...details,
    poster_path: null,
    backdrop_path: null,
    overview: "",
    runtime: 0,
    release_date: "",
    videos: { results: [] },
    "watch/providers": { results: {} },
  });
  expect(d.posterUrl).toBeNull();
  expect(d.overview).toBe("Sinopse não disponível em português.");
  expect(d.runtime).toBeNull();
  expect(d.year).toBeNull();
  expect(d.trailerKey).toBeNull();
  expect(d.watch).toEqual({ link: null, subscription: [], free: [], rent: [], buy: [] });
});

test("mapWatch junta free e ads em Grátis", () => {
  const w = mapWatch({
    results: {
      BR: {
        link: "https://www.themoviedb.org/movie/1/watch?locale=BR",
        flatrate: [{ provider_id: 8, provider_name: "Netflix", logo_path: "/n.jpg" }],
        free: [{ provider_id: 1, provider_name: "A", logo_path: null }],
        ads: [{ provider_id: 2, provider_name: "B", logo_path: null }],
      },
    },
  });
  expect(w.link).toContain("watch");
  expect(w.subscription.map((o) => o.providerId)).toEqual([8]);
  expect(w.free.map((o) => o.providerId)).toEqual([1, 2]);
});

test("mapPaged limita totalPages a 500", () => {
  expect(mapPaged({ ...discover, total_pages: 9000 }).totalPages).toBe(500);
});
