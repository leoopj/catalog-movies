"use client";

import { useState } from "react";
import type { MovieSummary, Paged } from "@/lib/filters";
import { MovieCard } from "./MovieCard";

type LoadMoreProps = {
  endpoint: string;
  initialPage: number;
  totalPages: number;
};

export function LoadMore({ endpoint, initialPage, totalPages }: LoadMoreProps) {
  const [page, setPage] = useState(initialPage);
  const [movies, setMovies] = useState<MovieSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(false);

  if (page >= totalPages) {
    return movies.length > 0 ? (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {movies.map((movie) => (
          <MovieCard key={movie.id} movie={movie} />
        ))}
      </div>
    ) : null;
  }

  async function carregar() {
    setLoading(true);
    setErro(false);
    try {
      const nextPage = page + 1;
      const url = `${endpoint}${endpoint.includes("?") ? "&" : "?"}page=${nextPage}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("falhou");
      const data: Paged<MovieSummary> = await res.json();
      setMovies((prev) => [...prev, ...data.items]);
      setPage(data.page);
    } catch {
      setErro(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {movies.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {movies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      )}

      {erro ? (
        <div className="flex flex-col items-center gap-2 text-sm">
          <p>Não foi possível carregar mais filmes.</p>
          <button
            type="button"
            onClick={carregar}
            className="rounded-md bg-[var(--accent)] px-4 py-2 font-medium text-black hover:opacity-90"
          >
            Tentar de novo
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={carregar}
          disabled={loading}
          className="rounded-md bg-[var(--surface)] px-4 py-2 text-sm font-medium hover:opacity-90"
        >
          Carregar mais
        </button>
      )}
    </div>
  );
}
