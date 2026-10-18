import type { Metadata } from "next";
import { LoadMore } from "@/components/LoadMore";
import { MovieGrid } from "@/components/MovieGrid";
import { searchAvailable } from "@/lib/tmdb/movies";

export const metadata: Metadata = {
  robots: { index: false },
};

type BuscaPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function BuscaPage({ searchParams }: BuscaPageProps) {
  const params = await searchParams;
  const qRaw = params.q;
  const q = (Array.isArray(qRaw) ? qRaw[0] : qRaw) ?? "";

  if (q.trim() === "") {
    return (
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6">
        <p className="text-lg font-medium">Digite um título para buscar.</p>
      </div>
    );
  }

  const { items, page, totalPages } = await searchAvailable(q, 1);
  const endpoint = `/api/busca?q=${encodeURIComponent(q)}`;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6">
      <h1 className="text-xl font-semibold">Resultados para &quot;{q}&quot;</h1>

      {items.length === 0 ? (
        <p className="text-lg font-medium">
          Nenhum filme com esse título está disponível nos serviços de streaming acompanhados.
        </p>
      ) : (
        <>
          <MovieGrid movies={items} />
          <p className="text-xs text-[var(--foreground)]/60">
            Dados de disponibilidade fornecidos por JustWatch.
          </p>
          <LoadMore endpoint={endpoint} initialPage={page} totalPages={totalPages} />
        </>
      )}
    </div>
  );
}
