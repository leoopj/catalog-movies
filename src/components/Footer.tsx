import Image from "next/image";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-white/10 bg-[var(--surface)]">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 py-6 text-center text-sm text-[var(--foreground)]/80">
        <Image
          src="/tmdb-logo.svg"
          alt="Logo do TMDB"
          width={120}
          height={9}
        />
        <p>
          Este produto usa a API do TMDB, mas não é endossado ou certificado
          pelo TMDB.
        </p>
        <Link href="/sobre" className="underline hover:text-[var(--accent)]">
          Sobre
        </Link>
      </div>
    </footer>
  );
}
