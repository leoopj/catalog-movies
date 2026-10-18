import Image from "next/image";
import type { Metadata } from "next";
import { CURATED_PROVIDERS } from "@/lib/providers";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: `Sobre · ${SITE.name}`,
  description: SITE.description,
};

export default function SobrePage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-10">
      <section className="space-y-3">
        <h1 className="text-3xl font-bold text-[var(--foreground)]">Sobre o {SITE.name}</h1>
        <p className="text-[var(--foreground)]/90">
          O {SITE.name} é um catálogo que ajuda você a descobrir onde assistir filmes nos
          principais serviços de streaming disponíveis no Brasil. Explore por serviço, gênero,
          ano e nota, e veja rapidamente em qual plataforma cada filme está disponível.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          Serviços acompanhados
        </h2>
        <ul className="grid grid-cols-2 gap-2 text-[var(--foreground)]/90 sm:grid-cols-3">
          {CURATED_PROVIDERS.map((provider) => (
            <li key={provider.id}>{provider.name}</li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">Fontes de dados</h2>
        <div className="flex flex-col items-start gap-3 text-[var(--foreground)]/90">
          <Image src="/tmdb-logo.svg" alt="Logo do TMDB" width={120} height={9} />
          <p>Este produto usa a API do TMDB, mas não é endossado ou certificado pelo TMDB.</p>
          <p>Dados de disponibilidade fornecidos por JustWatch.</p>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">Aviso</h2>
        <p className="text-[var(--foreground)]/90">
          A disponibilidade muda com frequência e pode levar algumas horas para ser atualizada
          aqui.
        </p>
      </section>
    </div>
  );
}
