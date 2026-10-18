// Modelos de domínio (usados pela UI) e tipos crus do TMDB (apenas os campos consumidos).

export type ProviderBadge = {
  id: number;
  name: string;
  logoUrl: string | null;
  color: string;
};

export type MovieSummary = {
  id: number;
  title: string;
  year: number | null;
  posterUrl: string | null;
  backdropUrl: string | null;
  rating: number;
  overview: string;
  badge: ProviderBadge | null;
};

export type Paged<T> = {
  items: T[];
  page: number;
  totalPages: number;
};

export type WatchOption = {
  providerId: number;
  name: string;
  logoUrl: string | null;
};

export type WatchAvailability = {
  link: string | null;
  subscription: WatchOption[];
  free: WatchOption[];
  rent: WatchOption[];
  buy: WatchOption[];
};

export type CastMember = {
  name: string;
  character: string;
  profileUrl: string | null;
};

export type MovieDetails = MovieSummary & {
  runtime: number | null;
  genres: { id: number; name: string }[];
  voteCount: number;
  certification: string | null;
  director: string | null;
  cast: CastMember[];
  trailerKey: string | null;
  watch: WatchAvailability;
  recommendations: MovieSummary[];
};

// --- Tipos crus do TMDB (somente os campos usados pelos mapeadores) ---

export type RawMovie = {
  id: number;
  title: string;
  release_date?: string | null;
  poster_path?: string | null;
  backdrop_path?: string | null;
  vote_average?: number | null;
  overview?: string | null;
};

export type RawPaged = {
  results: RawMovie[];
  page: number;
  total_pages: number;
};

export type RawProviderEntry = {
  provider_id: number;
  provider_name: string;
  logo_path: string | null;
};

export type RawWatchProviders = {
  results: Record<
    string,
    {
      link?: string;
      flatrate?: RawProviderEntry[];
      free?: RawProviderEntry[];
      ads?: RawProviderEntry[];
      rent?: RawProviderEntry[];
      buy?: RawProviderEntry[];
    }
  >;
};

export type RawCastMember = {
  name: string;
  character?: string | null;
  profile_path?: string | null;
  order?: number;
};

export type RawCrewMember = {
  name: string;
  job?: string;
  department?: string;
};

export type RawVideo = {
  key: string;
  site: string;
  type: string;
  iso_639_1?: string;
};

export type RawReleaseDateEntry = {
  certification?: string;
};

export type RawReleaseDatesCountry = {
  iso_3166_1: string;
  release_dates: RawReleaseDateEntry[];
};

export type RawDetails = RawMovie & {
  runtime?: number | null;
  genres?: { id: number; name: string }[];
  vote_count?: number | null;
  credits?: {
    cast?: RawCastMember[];
    crew?: RawCrewMember[];
  };
  videos?: {
    results: RawVideo[];
  };
  "watch/providers"?: RawWatchProviders;
  release_dates?: {
    results: RawReleaseDatesCountry[];
  };
  recommendations?: {
    results: RawMovie[];
  };
};
