import { Suspense } from "react";
import { Hero } from "@/components/Hero";
import { MoreServices } from "@/components/MoreServices";
import { MovieRail } from "@/components/MovieRail";
import { logoUrl } from "@/lib/images";
import { getHomeTrending, getServiceRail } from "@/lib/home";
import { CURATED_PROVIDERS, HOME_RAIL_PROVIDER_IDS, getProvider } from "@/lib/providers";
import type { ProviderBadge } from "@/lib/tmdb/types";

function RailSkeleton() {
  return (
    <div className="flex gap-3">
      {Array.from({ length: 6 }, (_, index) => (
        <div
          key={index}
          className="aspect-[2/3] w-[30%] shrink-0 animate-pulse rounded-md bg-[var(--surface)] sm:w-[18%] md:w-[15%] lg:w-[14%]"
        />
      ))}
    </div>
  );
}

async function ServiceRail({ providerId }: { providerId: number }) {
  const provider = getProvider(providerId);
  if (!provider) return null;

  try {
    const movies = await getServiceRail(providerId);
    const badge: ProviderBadge = {
      id: provider.id,
      name: provider.name,
      logoUrl: logoUrl(provider.logoPath),
      color: provider.color,
    };

    return (
      <MovieRail
        title={provider.name}
        movies={movies}
        badge={badge}
        seeAllHref={`/explorar?servicos=${provider.id}`}
      />
    );
  } catch {
    return null;
  }
}

export default async function Home() {
  const { hero, trending } = await getHomeTrending();
  const moreProviders = CURATED_PROVIDERS.filter(
    (provider) => !HOME_RAIL_PROVIDER_IDS.includes(provider.id),
  );

  return (
    <div className="flex flex-col gap-10 pb-16">
      {hero && <Hero movie={hero} />}

      <div className="mx-auto w-full max-w-6xl space-y-10 px-4">
        <MovieRail
          title="Em alta em todos os serviços"
          movies={trending}
          seeAllHref="/explorar"
        />

        {HOME_RAIL_PROVIDER_IDS.map((providerId) => (
          <Suspense key={providerId} fallback={<RailSkeleton />}>
            <ServiceRail providerId={providerId} />
          </Suspense>
        ))}

        <MoreServices providers={moreProviders} />
      </div>
    </div>
  );
}
