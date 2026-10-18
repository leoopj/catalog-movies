import Image from "next/image";
import Link from "next/link";
import { logoUrl } from "@/lib/images";
import type { Provider } from "@/lib/providers";

type MoreServicesProps = {
  providers: Provider[];
};

export function MoreServices({ providers }: MoreServicesProps) {
  if (providers.length === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-[var(--foreground)]">Mais serviços</h2>
      <div className="flex flex-wrap gap-3">
        {providers.map((provider) => (
          <Link
            key={provider.id}
            href={`/explorar?servicos=${provider.id}`}
            className="flex items-center gap-2 rounded-full bg-[var(--surface)] px-3 py-2 text-sm font-medium text-[var(--foreground)] hover:opacity-90"
          >
            {logoUrl(provider.logoPath) && (
              <Image
                src={logoUrl(provider.logoPath)!}
                alt=""
                width={20}
                height={20}
                className="rounded"
              />
            )}
            {provider.name}
          </Link>
        ))}
      </div>
    </section>
  );
}
