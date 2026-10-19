import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import type { MovieSummary, ProviderBadge } from "@/lib/tmdb/types";
import { MovieCard } from "./MovieCard";
import { RailArrows } from "./RailArrows";

type MovieRailProps = {
  title: ReactNode;
  movies: MovieSummary[];
  seeAllHref?: string;
  badge?: ProviderBadge | null;
};

export function MovieRail({ title, movies, seeAllHref, badge }: MovieRailProps) {
  if (movies.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2.5 text-lg font-semibold text-[var(--foreground)]">
          <span className="h-4 w-1 rounded-full bg-[var(--accent)]" aria-hidden />
          {badge?.logoUrl && (
            <Image
              src={badge.logoUrl}
              alt=""
              width={24}
              height={24}
              className="rounded"
            />
          )}
          {title}
        </h2>

        {seeAllHref && (
          <Link
            href={seeAllHref}
            className="group/link flex items-center gap-1 text-sm text-[var(--foreground)]/70 transition hover:text-[var(--accent)]"
          >
            Ver todos
            <span className="transition-transform group-hover/link:translate-x-0.5">
              →
            </span>
          </Link>
        )}
      </div>

      <RailArrows>
        {movies.map((movie) => (
          <div
            key={movie.id}
            className="w-[30%] shrink-0 sm:w-[18%] md:w-[15%] lg:w-[14%]"
          >
            <MovieCard movie={movie} badge={badge} />
          </div>
        ))}
      </RailArrows>
    </section>
  );
}
