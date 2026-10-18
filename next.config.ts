import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // cacheComponents/partialPrefetching foram removidos: eram apenas padrões
  // do scaffold do create-next-app (Tarefa 1), não um requisito da spec/plano.
  // Com PPR habilitado, notFound()/permanentRedirect() em rotas com partes
  // estáticas (PPR) nunca produziam o status HTTP real (sempre 200 OK,
  // soft-404). Mesmo com essas flags desligadas, o loading.tsx global
  // (src/app/loading.tsx) ainda criava um boundary de streaming para
  // /filme/[slug], então a rota também precisou de
  // `export const experimental_ppr = false` (ver page.tsx) para garantir
  // renderização síncrona e status HTTP real. Ver task-10-report.md para
  // os testes de confirmação via curl.
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
