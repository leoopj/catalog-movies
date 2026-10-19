export type FakeResposta = { data?: unknown; error?: unknown; count?: number | null };
export type FakeChamada = { metodo: string; args: unknown[] };

const ENCADEAVEIS = [
  "from",
  "select",
  "eq",
  "not",
  "order",
  "limit",
  "maybeSingle",
  "upsert",
  "delete",
] as const;

/**
 * Fake encadeável do cliente Supabase. Cada operação terminal (await da cadeia
 * ou chamada `auth.*`) resolve a próxima resposta da fila `respostas`.
 */
export function fakeSupabase(respostas: FakeResposta[] = []) {
  const fila = [...respostas];
  const chamadas: FakeChamada[] = [];

  const proxima = (): FakeResposta => {
    const r = fila.shift() ?? {};
    return { data: null, error: null, count: null, ...r };
  };

  const cadeia: Record<string, unknown> = {};
  for (const metodo of ENCADEAVEIS) {
    cadeia[metodo] = (...args: unknown[]) => {
      chamadas.push({ metodo, args });
      // maybeSingle encerra a cadeia: devolve uma Promise já resolvida.
      return metodo === "maybeSingle" ? Promise.resolve(proxima()) : cadeia;
    };
  }
  cadeia.then = (
    resolve: (v: FakeResposta) => unknown,
    reject?: (e: unknown) => unknown,
  ) => Promise.resolve(proxima()).then(resolve, reject);

  const auth: Record<string, unknown> = {};
  for (const metodo of ["getUser", "signInWithPassword", "signUp", "signOut"]) {
    auth[metodo] = async (...args: unknown[]) => {
      chamadas.push({ metodo: `auth.${metodo}`, args });
      return proxima();
    };
  }

  return Object.assign(cadeia, { auth, chamadas }) as unknown as {
    from: (...args: unknown[]) => unknown;
    auth: {
      getUser: (...a: unknown[]) => Promise<FakeResposta>;
      signInWithPassword: (...a: unknown[]) => Promise<FakeResposta>;
      signUp: (...a: unknown[]) => Promise<FakeResposta>;
      signOut: (...a: unknown[]) => Promise<FakeResposta>;
    };
    chamadas: FakeChamada[];
  };
}
