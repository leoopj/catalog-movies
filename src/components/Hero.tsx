import Image from "next/image";
import Link from "next/link";
import type { MovieDetails } from "@/lib/tmdb/types";
import { movieSlug } from "@/lib/slug";
import { Trailer } from "./Trailer";

type HeroProps = {
  movie: MovieDetails;
};

function formatRuntime(minutes: number | null): string | null {
  if (!minutes) return null;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return `${hours}h${String(rest).padStart(2, "0")}`;
}

export function Hero({ movie }: HeroProps) {
  const runtime = formatRuntime(movie.runtime);
  const mainGenre = movie.genres[0]?.name ?? null;
  const metaParts = [movie.year, runtime, mainGenre, `★ ${movie.rating.toFixed(1)}`].filter(
    (part): part is string | number => part !== null,
  );

  return (
    <section className="relative flex min-h-[70vh] w-full items-end overflow-hidden">
      {movie.backdropUrl && (
        <Image
          src={movie.backdropUrl}
          alt=""
          fill
          priority
          className="object-cover"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)] via-[var(--background)]/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-[var(--background)]/90 via-[var(--background)]/20 to-transparent" />

      <div className="relative z-10 flex max-w-2xl flex-col gap-4 px-4 py-12 sm:px-8">
        {movie.badge && (
          <p className="text-sm font-semibold text-[var(--accent)]">
            Em destaque · Disponível em {movie.badge.name}
          </p>
        )}

        <h1 className="text-3xl font-bold leading-tight text-[var(--foreground)] sm:text-5xl">
          {movie.title}
        </h1>

        <p className="text-sm text-[var(--foreground)]/80">{metaParts.join(" · ")}</p>

        <p className="line-clamp-3 max-w-xl text-[var(--foreground)]/90">{movie.overview}</p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Link
            href={`/filme/${movieSlug(movie.id, movie.title)}`}
            className="rounded-md bg-[var(--accent)] px-4 py-2 font-semibold text-black hover:opacity-90"
          >
            Ver detalhes
          </Link>
          {movie.trailerKey && <Trailer youtubeKey={movie.trailerKey} />}
        </div>
      </div>
    </section>
  );
}
