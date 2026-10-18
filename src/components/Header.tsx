import Link from "next/link";
import { SITE } from "@/lib/site";
import { SearchBox } from "./SearchBox";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[var(--background)]/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-3">
        <Link
          href="/"
          className="text-lg font-bold text-[var(--accent)] shrink-0"
        >
          {SITE.name}
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/" className="hover:text-[var(--accent)]">
            Início
          </Link>
          <Link href="/explorar" className="hover:text-[var(--accent)]">
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
