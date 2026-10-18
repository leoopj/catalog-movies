import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 px-4 py-24 text-center">
      <h1 className="text-xl font-semibold">Página não encontrada</h1>
      <Link href="/" className="underline hover:text-[var(--accent)]">
        Voltar para o início
      </Link>
    </div>
  );
}
