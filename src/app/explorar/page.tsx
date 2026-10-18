import Link from "next/link";
import { FilterBar } from "@/components/FilterBar";
import { LoadMore } from "@/components/LoadMore";
import { MovieGrid } from "@/components/MovieGrid";
import { ProviderStrip } from "@/components/ProviderStrip";
import { parseFilters, serializeFilters } from "@/lib/filters";
import { discoverMovies, getGenres } from "@/lib/tmdb/movies";

type ExplorarPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ExplorarPage({ searchParams }: ExplorarPageProps) {
  const params = await searchParams;
  const filters = parseFilters(params);

  const [{ items, page, totalPages }, genres] = await Promise.all([
    discoverMovies(filters, 1),
    getGenres(),
  ]);

  const query = serializeFilters(filters);
  const endpoint = `/api/filmes${query ? `?${query}` : ""}`;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6">
      <ProviderStrip filters={filters} />
      <FilterBar filters={filters} genres={genres} />

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <p className="text-lg font-medium">Nenhum filme com esses filtros</p>
          <Link href="/explorar" className="underline hover:text-[var(--accent)]">
            Limpar filtros
          </Link>
        </div>
      ) : (
        <>
          <p className="text-sm text-[var(--foreground)]/70">Mostrando {items.length} filmes</p>
          <MovieGrid movies={items} />
          <LoadMore endpoint={endpoint} initialPage={page} totalPages={totalPages} />
        </>
      )}
    </div>
  );
}
