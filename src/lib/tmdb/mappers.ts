import { backdropUrl, posterUrl, profileUrl, logoUrl } from "../images";
import type {
  CastMember,
  MovieDetails,
  MovieSummary,
  Paged,
  RawCastMember,
  RawCrewMember,
  RawDetails,
  RawMovie,
  RawPaged,
  RawProviderEntry,
  RawReleaseDatesCountry,
  RawVideo,
  RawWatchProviders,
  WatchAvailability,
  WatchOption,
} from "./types";

const MAX_TOTAL_PAGES = 500;
const MAX_CAST = 10;
const DEFAULT_OVERVIEW = "Sinopse não disponível em português.";

function parseYear(releaseDate: string | null | undefined): number | null {
  if (!releaseDate || releaseDate.length < 4) return null;
  const year = Number(releaseDate.slice(0, 4));
  return Number.isInteger(year) ? year : null;
}

function roundRating(voteAverage: number | null | undefined): number {
  if (!voteAverage) return 0;
  return Math.round(voteAverage * 10) / 10;
}

export function mapSummary(raw: RawMovie): MovieSummary {
  const overview = raw.overview && raw.overview.trim() !== "" ? raw.overview : DEFAULT_OVERVIEW;
  return {
    id: raw.id,
    title: raw.title,
    year: parseYear(raw.release_date),
    posterUrl: posterUrl(raw.poster_path ?? null),
    backdropUrl: backdropUrl(raw.backdrop_path ?? null),
    rating: roundRating(raw.vote_average),
    overview,
    badge: null,
  };
}

export function mapPaged(raw: RawPaged): Paged<MovieSummary> {
  return {
    items: raw.results.map(mapSummary),
    page: raw.page,
    totalPages: Math.min(raw.total_pages, MAX_TOTAL_PAGES),
  };
}

function mapOptions(entries: RawProviderEntry[] | undefined): WatchOption[] {
  return (entries ?? []).map((entry) => ({
    providerId: entry.provider_id,
    name: entry.provider_name,
    logoUrl: logoUrl(entry.logo_path),
  }));
}

export function mapWatch(raw: RawWatchProviders): WatchAvailability {
  const br = raw.results?.BR;
  if (!br) {
    return { link: null, subscription: [], free: [], rent: [], buy: [] };
  }
  return {
    link: br.link ?? null,
    subscription: mapOptions(br.flatrate),
    free: [...mapOptions(br.free), ...mapOptions(br.ads)],
    rent: mapOptions(br.rent),
    buy: mapOptions(br.buy),
  };
}

function pickTrailer(videos: RawVideo[]): string | null {
  const trailers = videos.filter((v) => v.site === "YouTube" && v.type === "Trailer");
  if (trailers.length === 0) return null;
  const pt = trailers.find((v) => v.iso_639_1 === "pt");
  return (pt ?? trailers[0]).key;
}

function pickCertification(countries: RawReleaseDatesCountry[]): string | null {
  const br = countries.find((c) => c.iso_3166_1 === "BR");
  if (!br) return null;
  const found = br.release_dates.find((r) => r.certification && r.certification.trim() !== "");
  return found?.certification ?? null;
}

function pickDirector(crew: RawCrewMember[]): string | null {
  return crew.find((c) => c.job === "Director")?.name ?? null;
}

function mapCast(cast: RawCastMember[]): CastMember[] {
  return cast.slice(0, MAX_CAST).map((member) => ({
    name: member.name,
    character: member.character ?? "",
    profileUrl: profileUrl(member.profile_path ?? null),
  }));
}

export function mapDetails(raw: RawDetails): MovieDetails {
  const base = mapSummary(raw);
  const runtime = raw.runtime && raw.runtime > 0 ? raw.runtime : null;
  const cast = mapCast(raw.credits?.cast ?? []);
  const director = pickDirector(raw.credits?.crew ?? []);
  const trailerKey = pickTrailer(raw.videos?.results ?? []);
  const certification = pickCertification(raw.release_dates?.results ?? []);
  const watch = mapWatch(raw["watch/providers"] ?? { results: {} });
  const recommendations = (raw.recommendations?.results ?? []).map(mapSummary);

  return {
    ...base,
    runtime,
    genres: raw.genres ?? [],
    voteCount: raw.vote_count ?? 0,
    certification,
    director,
    cast,
    trailerKey,
    watch,
    recommendations,
  };
}
