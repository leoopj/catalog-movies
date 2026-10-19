import Link from "next/link";
import { SITE } from "@/lib/site";
import { SearchBox } from "./SearchBox";

export function Header() {
  return (
    <header className="sticky top-0 z-50 bg-gradient-to-b from-[var(--background)] via-[var(--background)]/80 to-transparent">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-4 sm:px-8">
        <Link
          href="/"
          className="shrink-0 font-[family-name:var(--font-display)] text-lg tracking-tight text-[var(--accent)]"
        >
          {SITE.name}
        </Link>
        <nav className="flex items-center gap-5 text-sm text-[var(--foreground)]/80">
          <Link href="/" className="transition hover:text-[var(--foreground)]">
            Início
          </Link>
          <Link href="/explorar" className="transition hover:text-[var(--foreground)]">
            Explorar
          </Link>
        </nav>
        <div className="ml-auto">
          <SearchBox />
        </div>
      </div>
    </header>
  );
}
