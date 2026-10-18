import Image from "next/image";
import type { WatchAvailability, WatchOption } from "@/lib/tmdb/types";

type WatchProvidersProps = {
  watch: WatchAvailability;
};

const GROUPS: { key: keyof Omit<WatchAvailability, "link">; label: string }[] = [
  { key: "subscription", label: "Assinatura" },
  { key: "free", label: "Grátis" },
  { key: "rent", label: "Aluguel" },
  { key: "buy", label: "Compra" },
];

function ProviderLink({ option, link }: { option: WatchOption; link: string }) {
  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      title={option.name}
      className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-md bg-[var(--surface)]"
    >
      {option.logoUrl ? (
        <Image src={option.logoUrl} alt={option.name} width={48} height={48} className="object-cover" />
      ) : (
        <span className="text-xs font-semibold">{option.name.slice(0, 1)}</span>
      )}
    </a>
  );
}

export function WatchProviders({ watch }: WatchProvidersProps) {
  const groups = GROUPS.map((group) => ({ ...group, options: watch[group.key] })).filter(
    (group) => group.options.length > 0,
  );

  if (groups.length === 0) {
    return (
      <p className="text-[var(--foreground)]/80">
        Este filme não está disponível em streaming no Brasil no momento.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {groups.map((group) => (
        <div key={group.key} className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-[var(--foreground)]/80">{group.label}</h3>
          <div className="flex flex-wrap gap-3">
            {group.options.map((option) => (
              <ProviderLink key={option.providerId} option={option} link={watch.link ?? "#"} />
            ))}
          </div>
        </div>
      ))}
      <p className="text-xs text-[var(--foreground)]/60">
        Dados de disponibilidade fornecidos por JustWatch.
      </p>
    </div>
  );
}
