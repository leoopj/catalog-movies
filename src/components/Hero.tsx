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
    <section className="relative flex min-h-[78vh] w-full items-end overflow-hidden sm:min-h-[88vh]">
      {movie.backdropUrl && (
        <Image
          src={movie.backdropUrl}
          alt=""
          fill
          priority
          className="object-cover"
        />
      )}
      {/* bottom fade: pulls the image into the page */}
      <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)] via-[var(--background)]/55 to-transparent" />
      {/* left fade: gives the text block a legible field */}
      <div className="absolute inset-0 bg-gradient-to-r from-[var(--background)] via-[var(--background)]/35 to-transparent sm:via-[var(--background)]/25" />
      {/* top fade: lets the sticky header sit on the image */}
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--background)]/70 via-transparent to-transparent" />

      <div className="relative z-10 flex max-w-xl flex-col gap-5 px-4 pb-10 pt-24 sm:px-8 sm:pb-16">
        {movie.badge && (
          <p className="flex items-center gap-2 text-sm font-medium text-[var(--accent)]">
            <span className="h-px w-6 bg-[var(--accent)]" />
            Em destaque · disponível em {movie.badge.name}
          </p>
        )}

        <h1 className="font-[family-name:var(--font-display)] text-4xl leading-[0.95] tracking-tight text-[var(--foreground)] sm:text-6xl">
          {movie.title}
        </h1>

        <p className="text-sm text-[var(--foreground)]/70">{metaParts.join("  ·  ")}</p>

        <p className="line-clamp-3 max-w-md text-[15px] leading-relaxed text-[var(--foreground)]/85">
          {movie.overview}
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Link
            href={`/filme/${movieSlug(movie.id, movie.title)}`}
            className="rounded bg-[var(--accent)] px-5 py-2.5 font-semibold text-black transition hover:brightness-110"
          >
            Ver detalhes
          </Link>
          {movie.trailerKey && <Trailer youtubeKey={movie.trailerKey} />}
        </div>
      </div>
    </section>
  );
}
