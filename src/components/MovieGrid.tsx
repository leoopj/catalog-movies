import type { MovieSummary } from "@/lib/tmdb/types";
import { MovieCard } from "./MovieCard";

type MovieGridProps = {
  movies: MovieSummary[];
};

export function MovieGrid({ movies }: MovieGridProps) {
  if (movies.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {movies.map((movie) => (
        <MovieCard key={movie.id} movie={movie} />
      ))}
    </div>
  );
}
