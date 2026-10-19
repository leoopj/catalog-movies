import Image from "next/image";
import Link from "next/link";
import type { MovieSummary, ProviderBadge } from "@/lib/tmdb/types";
import { movieSlug } from "@/lib/slug";

type MovieCardProps = {
  movie: MovieSummary;
  badge?: ProviderBadge | null;
};

export function MovieCard({ movie, badge }: MovieCardProps) {
  const resolvedBadge = badge ?? movie.badge;
  const href = `/filme/${movieSlug(movie.id, movie.title)}`;

  return (
    <Link
      href={href}
      className="group relative block w-full overflow-hidden rounded bg-[var(--surface)] snap-start transition-transform duration-300 ease-out hover:z-10 hover:scale-[1.06] hover:shadow-2xl hover:shadow-black/60"
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden">
        {movie.posterUrl ? (
          <Image
            src={movie.posterUrl}
            alt={movie.title}
            fill
            sizes="180px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[var(--surface)] p-2 text-center text-sm text-[var(--foreground)]/80">
            {movie.title}
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        <span className="absolute left-1.5 top-1.5 rounded bg-black/70 px-1.5 py-0.5 text-xs font-semibold text-[var(--accent)]">
          ★ {movie.rating.toFixed(1)}
        </span>

        {resolvedBadge && (
          <span
            aria-label={`Serviço: ${resolvedBadge.name}`}
            title={resolvedBadge.name}
            className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white"
            style={{ backgroundColor: resolvedBadge.color }}
          >
            {resolvedBadge.logoUrl ? (
              <Image
                src={resolvedBadge.logoUrl}
                alt=""
                width={20}
                height={20}
                className="rounded-full"
              />
            ) : (
              resolvedBadge.name.slice(0, 1)
            )}
          </span>
        )}

        {movie.posterUrl && (
          <p className="absolute inset-x-0 bottom-0 translate-y-2 p-2 text-xs font-medium leading-snug text-[var(--foreground)] opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            {movie.title}
          </p>
        )}
      </div>
    </Link>
  );
}
