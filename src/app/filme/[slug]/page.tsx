import { cache } from "react";
import { notFound, permanentRedirect } from "next/navigation";
import Image from "next/image";
import type { Metadata } from "next";
import { CastList } from "@/components/CastList";
import { MovieRail } from "@/components/MovieRail";
import { Trailer } from "@/components/Trailer";
import { WatchProviders } from "@/components/WatchProviders";
import { withBadges } from "@/lib/availability";
import { formatRuntime, formatVotes } from "@/lib/format";
import { movieSlug, parseMovieSlug } from "@/lib/slug";
import { getMovie } from "@/lib/tmdb/movies";
import { TmdbNotFound } from "@/lib/tmdb/client";

// Força renderização dinâmica síncrona (sem streaming) para que
// notFound()/permanentRedirect() produzam o status HTTP real (404/308) em
// vez de um soft-404 (200 OK). A causa raiz do soft-404 NÃO era PPR nem
// cacheComponents (já removidos/desligados): era o loading.tsx global em
// src/app/, ancestral desta rota, que criava um boundary de Suspense e
// fazia o App Router responder sempre 200 com Transfer-Encoding: chunked,
// independente de experimental_ppr. A correção definitiva foi mover
// home/explorar (as rotas que de fato precisam do loading global) e o
// loading.tsx para o grupo de rotas src/app/(com-loading)/, deixando
// /filme/[slug] fora dessa árvore e sem nenhum loading.tsx ancestral.
// Este `dynamic = "force-dynamic"` é mantido como reforço defensivo para
// impedir qualquer streaming parcial futuro nesta rota. Ver
// task-10-report.md para os testes de confirmação via curl.
export const dynamic = "force-dynamic";

const getCachedMovie = cache(getMovie);

type MoviePageProps = {
  params: Promise<{ slug: string }>;
};

async function loadMovie(slug: string) {
  const parsed = parseMovieSlug(slug);
  if (!parsed) notFound();

  try {
    return { movie: await getCachedMovie(parsed.id), parsed };
  } catch (error) {
    if (error instanceof TmdbNotFound) notFound();
    throw error;
  }
}

export async function generateMetadata({ params }: MoviePageProps): Promise<Metadata> {
  const { slug } = await params;
  const { movie } = await loadMovie(slug);
  const image = movie.backdropUrl ?? movie.posterUrl;
  const title = movie.year ? `${movie.title} (${movie.year}) · CineStream` : `${movie.title} · CineStream`;

  return {
    title,
    description: movie.overview,
    openGraph: {
      title,
      description: movie.overview,
      images: image ? [{ url: image }] : undefined,
    },
  };
}

export default async function MoviePage({ params }: MoviePageProps) {
  const { slug } = await params;
  const { movie, parsed } = await loadMovie(slug);

  const canonicalSlug = movieSlug(movie.id, movie.title);
  if (canonicalSlug !== parsed.slug) {
    permanentRedirect(`/filme/${canonicalSlug}`);
  }

  const runtime = formatRuntime(movie.runtime);
  const metaParts = [
    movie.year,
    runtime,
    `★ ${movie.rating.toFixed(1)} (${formatVotes(movie.voteCount)})`,
    movie.certification,
  ].filter((part): part is string | number => part !== null && part !== undefined);

  const recommendations = await withBadges(movie.recommendations);

  return (
    <div className="flex flex-col gap-10 pb-16">
      <section className="relative flex min-h-[60vh] w-full items-end overflow-hidden">
        {movie.backdropUrl && (
          <Image src={movie.backdropUrl} alt="" fill priority className="object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)] via-[var(--background)]/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--background)]/90 via-[var(--background)]/20 to-transparent" />

        <div className="relative z-10 flex w-full max-w-6xl flex-col gap-4 px-4 py-10 sm:flex-row sm:items-end sm:gap-6 sm:px-8">
          {movie.posterUrl && (
            <Image
              src={movie.posterUrl}
              alt={movie.title}
              width={160}
              height={240}
              className="hidden rounded-lg shadow-lg sm:block"
            />
          )}

          <div className="flex flex-col gap-3">
            <h1 className="text-3xl font-bold leading-tight text-[var(--foreground)] sm:text-5xl">
              {movie.title}
            </h1>

            <p className="text-sm text-[var(--foreground)]/80">{metaParts.join(" · ")}</p>

            {movie.genres.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {movie.genres.map((genre) => (
                  <span
                    key={genre.id}
                    className="rounded-full bg-[var(--surface)] px-3 py-1 text-xs font-medium text-[var(--foreground)]/90"
                  >
                    {genre.name}
                  </span>
                ))}
              </div>
            )}

            {movie.trailerKey && <Trailer youtubeKey={movie.trailerKey} />}
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-6xl space-y-10 px-4 sm:px-8">
        <section className="flex flex-col gap-2">
          <p className="max-w-3xl text-[var(--foreground)]/90">{movie.overview}</p>
          {movie.director && (
            <p className="text-sm text-[var(--foreground)]/70">Direção: {movie.director}</p>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Onde assistir no Brasil</h2>
          <WatchProviders watch={movie.watch} />
        </section>

        {movie.cast.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Elenco principal</h2>
            <CastList cast={movie.cast} />
          </section>
        )}

        {recommendations.length > 0 && (
          <MovieRail title="Você também pode gostar" movies={recommendations} />
        )}
      </div>
    </div>
  );
}
