"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

type SearchBoxProps = {
  defaultValue?: string;
};

export function SearchBox({ defaultValue = "" }: SearchBoxProps) {
  const router = useRouter();
  const [termo, setTermo] = useState(defaultValue);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const termoLimpo = termo.trim();
    if (!termoLimpo) {
      return;
    }

    const params = new URLSearchParams({ q: termoLimpo });
    router.push(`/busca?${params.toString()}`);
  }

  return (
    <form role="search" onSubmit={handleSubmit}>
      <input
        type="search"
        aria-label="Buscar filme"
        value={termo}
        onChange={(event) => setTermo(event.target.value)}
        placeholder="Buscar filme..."
        className="rounded-md bg-[var(--surface)] px-3 py-1.5 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground)]/60 outline-none focus:ring-2 focus:ring-[var(--accent)]"
      />
    </form>
  );
}
