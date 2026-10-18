import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // cacheComponents/partialPrefetching foram removidos: eram apenas padrões
  // do scaffold do create-next-app (Tarefa 1), não um requisito da spec/plano.
  // Com PPR habilitado, notFound()/permanentRedirect() em rotas com partes
  // estáticas (PPR) nunca produziam o status HTTP real (sempre 200 OK,
  // soft-404). A causa raiz completa do soft-404 em /filme/[slug], porém,
  // só foi resolvida movendo o loading.tsx global para o route group
  // src/app/(com-loading)/ (junto com as rotas / e /explorar que
  // realmente precisam dele), pois ele criava um boundary de Suspense
  // ancestral que o App Router usava para streamar a resposta (sempre
  // 200, Transfer-Encoding: chunked) mesmo com essas flags desligadas e
  // com experimental_ppr = false isolado na rota. Ver page.tsx em
  // src/app/filme/[slug]/ e task-10-report.md para os testes de
  // confirmação via curl.
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "image.tmdb.org",
      },
    ],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
