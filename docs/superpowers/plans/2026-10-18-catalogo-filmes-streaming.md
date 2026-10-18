# Catálogo de Filmes em Streaming: Plano de Implementação

> **Para agentes:** SUB-SKILL OBRIGATÓRIA: use superpowers:subagent-driven-development (recomendado) ou superpowers:executing-plans para implementar este plano tarefa por tarefa. Os passos usam checkbox (`- [ ]`) para acompanhamento.

**Objetivo:** site público em Next.js que mostra os filmes disponíveis agora nos principais serviços de streaming do Brasil, com vitrine, exploração com filtros, busca e página de detalhes, usando a API do TMDB.

**Arquitetura:** Server Components do Next.js consultam o TMDB no servidor (token nunca vai ao navegador), com cache de dados por `fetch` + `revalidate`. Toda a integração com o TMDB fica em `src/lib/tmdb/` e devolve modelos próprios; a URL é a fonte única de verdade dos filtros (`src/lib/filters.ts`). Dois Route Handlers (`/api/filmes`, `/api/busca`) atendem o "Carregar mais".

**Stack:** Next.js (App Router, versão atual do `create-next-app@latest`), TypeScript, Tailwind CSS, Vitest + Testing Library + jsdom, Playwright, deploy na Vercel.

**Spec:** `docs/superpowers/specs/2026-10-18-catalogo-filmes-streaming-design.md` (leia junto com este plano).

## Restrições globais

- Região `BR`, idioma `pt-BR`; todo texto da interface em português.
- `TMDB_READ_TOKEN` só é lido em código de servidor (`src/lib/tmdb/client.ts`); nenhum componente `"use client"` importa `src/lib/tmdb/*`.
- Base da API: `https://api.themoviedb.org/3`, cabeçalho `Authorization: Bearer ${TMDB_READ_TOKEN}`; imagens de `https://image.tmdb.org/t/p/`.
- Cache: listas (discover, busca) `21600` s; detalhes e provedores de um filme `86400` s; gêneros e lista de provedores `604800` s.
- Timeout de requisição ao TMDB: 8 s.
- Parâmetros fixos do discover: `watch_region=BR`, `language=pt-BR`, `include_adult=false`; tipos padrão `flatrate|free|ads`.
- `vote_count.gte=100` sempre que houver nota mínima **ou** `ordem=nota`.
- Página máxima do TMDB: 500.
- `next/image` com `unoptimized: true` e `remotePatterns` para `image.tmdb.org`.
- Atribuição no rodapé, exata: "Este produto usa a API do TMDB, mas não é endossado ou certificado pelo TMDB." + logo do TMDB. Em "Onde assistir" e na busca: "Dados de disponibilidade fornecidos por JustWatch."
- Tema escuro: fundo `#0b0d11`, superfícies `#1d2129`, texto `#e8e8e8`, destaque `#f5c518` (botões principais e filtros ativos). Nome do site provisório `CineStream`, definido só em `src/lib/site.ts`.
- Modelos usados pela interface vêm de `src/lib/tmdb/types.ts`; componentes nunca recebem JSON cru do TMDB.

## Foco de revisão

1. **URL com parâmetros inválidos ou maliciosos** (`servicos=abc,999`, `ano=3000-1000`, `nota=99`, `ordem=xpto`, `page=-1`): a página abre com os padrões, sem erro 500. Testes na Tarefa 3 e na Tarefa 9.
2. **Filme sem pôster, sem fundo, sem sinopse em pt-BR, sem trailer, sem classificação ou sem provedores no BR:** placeholder de imagem, texto "Sinopse não disponível em português.", e seções omitidas, sem quebrar o layout. Testes na Tarefa 4 e na Tarefa 10.
3. **Busca com termo vazio, só espaços ou com acentos/`&`:** termo vazio mostra o estado "Digite um título para buscar" sem chamar o TMDB; acentos e `&` são codificados corretamente. Testes na Tarefa 5 e na Tarefa 6.
4. **"Carregar mais" no fim da lista** (página = `total_pages` ou 500): o botão some; o Route Handler recusa `page` > 500 com 400. Testes na Tarefa 9.
5. **Slug não numérico ou de outro filme** (`/filme/abc`, `/filme/550-titulo-errado`): 404 e redirect para o slug canônico, respectivamente. Testes na Tarefa 2 e verificação na Tarefa 10.

---

### Tarefa 1: Estrutura do projeto, testes e configuração

**Arquivos:**
- Criar (via create-next-app): `package.json`, `next.config.ts`, `tsconfig.json`, `src/app/*`
- Criar: `vitest.config.ts`, `vitest.setup.ts`, `.env.example`, `src/lib/site.ts`
- Modificar: `.gitignore`
- Teste: `src/lib/site.test.ts`

**Interfaces:**
- Produz: `SITE = { name: "CineStream", description: string, url: string }` em `src/lib/site.ts` (`url` vem de `process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"`); scripts npm `dev`, `build`, `test` (vitest run), `test:e2e` (playwright test).

- [ ] **Passo 1: Criar o projeto.** Pare o servidor do companion visual e mova `.superpowers/` para fora da pasta temporariamente (o create-next-app recusa pastas desconhecidas). Rode na raiz do repositório:
  `npx create-next-app@latest . --ts --app --src-dir --tailwind --eslint --import-alias "@/*" --use-npm --yes`
  Depois devolva `.superpowers/` e garanta que o `.gitignore` contenha `.superpowers/` e `.env*.local`.
- [ ] **Passo 2: Instalar dependências de teste:** `npm i -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event vite-tsconfig-paths @playwright/test` e `npx playwright install chromium`.
- [ ] **Passo 3: Configurar o Vitest** (`environment: "jsdom"`, plugins `react()` e `tsconfigPaths()`, `setupFiles: ["./vitest.setup.ts"]` importando `@testing-library/jest-dom/vitest`, `exclude` de `e2e/**`). Scripts `"test": "vitest run"` e `"test:e2e": "playwright test"`.
- [ ] **Passo 4: Escrever o teste que falha** em `src/lib/site.test.ts`:

```ts
import { SITE } from "./site";
test("nome provisório do site", () => {
  expect(SITE.name).toBe("CineStream");
});
```

- [ ] **Passo 5: Rodar** `npm test`. Esperado: FALHA (módulo `./site` não existe).
- [ ] **Passo 6: Criar `src/lib/site.ts`** com `SITE` e `description: "Filmes disponíveis agora nos principais serviços de streaming do Brasil."`.
- [ ] **Passo 7: Configurar `next.config.ts`:** `images: { unoptimized: true, remotePatterns: [{ protocol: "https", hostname: "image.tmdb.org" }] }`. Criar `.env.example` com `TMDB_READ_TOKEN=` e `NEXT_PUBLIC_SITE_URL=`. Definir `<html lang="pt-BR">` e as cores da seção de restrições como variáveis CSS em `src/app/globals.css`, com `body` em fundo `#0b0d11`.
- [ ] **Passo 8: Rodar** `npm test` e `npm run build`. Esperado: teste PASSA e build conclui.
- [ ] **Passo 9: Commit:** `git add -A && git commit -m "chore: estrutura Next.js, Vitest e configuração base"`

### Tarefa 2: Utilitários de imagem e slug

**Arquivos:**
- Criar: `src/lib/images.ts`, `src/lib/slug.ts`
- Teste: `src/lib/images.test.ts`, `src/lib/slug.test.ts`

**Interfaces:**
- Produz:
  - `posterUrl(path: string | null): string | null` (tamanho `w342`), `backdropUrl(path: string | null): string | null` (`w1280`), `profileUrl(path: string | null): string | null` (`w185`), `logoUrl(path: string | null): string | null` (`w92`).
  - `movieSlug(id: number, title: string): string` e `parseMovieSlug(slug: string): { id: number; slug: string } | null`.

- [ ] **Passo 1: Escrever os testes que falham**

```ts
// images.test.ts
test("monta URL de pôster", () => {
  expect(posterUrl("/abc.jpg")).toBe("https://image.tmdb.org/t/p/w342/abc.jpg");
});
test("caminho nulo vira null", () => {
  expect(backdropUrl(null)).toBeNull();
});
// slug.test.ts
test("gera slug sem acentos", () => {
  expect(movieSlug(550, "Clube da Luta")).toBe("550-clube-da-luta");
  expect(movieSlug(1, "Ainda Estou Aqui!")).toBe("1-ainda-estou-aqui");
  expect(movieSlug(2, "Deadpool & Wolverine")).toBe("2-deadpool-wolverine");
});
test("título só com símbolos gera só o id", () => {
  expect(movieSlug(3, "???")).toBe("3");
});
test("lê id do slug", () => {
  expect(parseMovieSlug("550-clube-da-luta")).toEqual({ id: 550, slug: "550-clube-da-luta" });
  expect(parseMovieSlug("550")).toEqual({ id: 550, slug: "550" });
});
test("slug inválido", () => {
  expect(parseMovieSlug("abc")).toBeNull();
  expect(parseMovieSlug("0-x")).toBeNull();
  expect(parseMovieSlug("-5-x")).toBeNull();
});
```

- [ ] **Passo 2: Rodar** `npx vitest run src/lib/images.test.ts src/lib/slug.test.ts`. Esperado: FALHA.
- [ ] **Passo 3: Implementar.** O slug usa `normalize("NFD")`, remove marcas diacríticas, passa para minúsculas, troca sequências não alfanuméricas por `-` e remove `-` das pontas. `parseMovieSlug` exige que o slug comece com um inteiro positivo seguido de fim ou `-`.
- [ ] **Passo 4: Rodar os testes.** Esperado: PASSA.
- [ ] **Passo 5: Commit:** `git commit -am "feat: utilitários de imagem e slug"` (inclua os arquivos novos com `git add src/lib`).

### Tarefa 3: Serviços curados e filtros da URL

**Arquivos:**
- Criar: `src/lib/providers.ts`, `src/lib/filters.ts`
- Teste: `src/lib/filters.test.ts`

**Interfaces:**
- Produz:
  - `type Provider = { id: number; tmdbIds: number[]; name: string; color: string; logoPath: string }`. `id` é o ID principal, usado na URL. `tmdbIds` traz o principal primeiro e depois as variantes. Os 11 serviços, a ordem, os IDs, as variantes e os logos vêm da tabela da seção 5 da spec.
  - `CURATED_PROVIDERS: Provider[]` (na ordem da spec).
  - `HOME_RAIL_PROVIDER_IDS: number[]` = `[8, 119, 337, 1899, 307, 350]`.
  - `getProvider(id: number): Provider | undefined` (pelo ID principal).
  - `providerForTmdbId(tmdbId: number): Provider | undefined` (pelo principal ou por uma variante).
  - `type SortKey = "popularidade" | "nota" | "lancamento"`
  - `type Filters = { servicos: number[]; aluguel: boolean; genero: number | null; anoDe: number | null; anoAte: number | null; nota: number | null; ordem: SortKey }` (`servicos` vazio = todos os curados)
  - `DEFAULT_FILTERS: Filters`
  - `parseFilters(params: URLSearchParams | Record<string, string | string[] | undefined>): Filters`
  - `serializeFilters(f: Filters): string` (query sem `?`, omite valores padrão, ordem fixa das chaves: `servicos, genero, ano, nota, ordem, aluguel`)
  - `toDiscoverParams(f: Filters, page: number): Record<string, string>`

- [ ] **Passo 1: Os IDs já foram confirmados em 2026-10-18** (seção 5 da spec). Copie a tabela de lá para `providers.ts`, sem consultar a API.
- [ ] **Passo 2: Escrever os testes que falham** em `filters.test.ts`:

```ts
test("URL vazia dá os padrões", () => {
  expect(parseFilters(new URLSearchParams(""))).toEqual(DEFAULT_FILTERS);
  expect(DEFAULT_FILTERS).toEqual({ servicos: [], aluguel: false, genero: null, anoDe: null, anoAte: null, nota: null, ordem: "popularidade" });
});
test("lê todos os filtros", () => {
  const f = parseFilters(new URLSearchParams("servicos=8,119&genero=28&ano=2020-2024&nota=7&ordem=nota&aluguel=1"));
  expect(f).toEqual({ servicos: [8, 119], aluguel: true, genero: 28, anoDe: 2020, anoAte: 2024, nota: 7, ordem: "nota" });
});
test("ano único vira faixa de um ano", () => {
  const f = parseFilters(new URLSearchParams("ano=2020"));
  expect([f.anoDe, f.anoAte]).toEqual([2020, 2020]);
});
test("valores inválidos voltam ao padrão", () => {
  const f = parseFilters(new URLSearchParams("servicos=abc,999,8&genero=-3&ano=3000-1000&nota=99&ordem=xpto&aluguel=talvez"));
  expect(f).toEqual({ ...DEFAULT_FILTERS, servicos: [8] });
});
test("aceita Record de searchParams do Next", () => {
  expect(parseFilters({ servicos: "8", ordem: ["nota", "x"] }).ordem).toBe("nota");
});
test("serialização omite padrões e faz ida e volta", () => {
  expect(serializeFilters(DEFAULT_FILTERS)).toBe("");
  const q = "servicos=8,119&genero=28&ano=2020-2024&nota=7&ordem=nota&aluguel=1";
  expect(serializeFilters(parseFilters(new URLSearchParams(q)))).toBe(q);
});
test("parâmetros do discover com padrões", () => {
  expect(toDiscoverParams(DEFAULT_FILTERS, 1)).toEqual({
    watch_region: "BR", language: "pt-BR", include_adult: "false",
    with_watch_providers: "8|1796|119|2100|337|1899|307|350|531|2303|2302|484|283|47",
    with_watch_monetization_types: "flatrate|free|ads",
    sort_by: "popularity.desc", page: "1",
  });
});
test("parâmetros do discover com todos os filtros", () => {
  const p = toDiscoverParams(parseFilters(new URLSearchParams("servicos=8,119&genero=28&ano=2020-2024&nota=7&aluguel=1&ordem=lancamento")), 3);
  expect(p).toMatchObject({
    with_watch_providers: "8|1796|119|2100", with_genres: "28",
    "primary_release_date.gte": "2020-01-01", "primary_release_date.lte": "2024-12-31",
    "vote_average.gte": "7", "vote_count.gte": "100",
    with_watch_monetization_types: "flatrate|free|ads|rent|buy",
    sort_by: "primary_release_date.desc", page: "3",
  });
});
test("ID de variante na URL é descartado (só IDs principais valem)", () => {
  expect(parseFilters(new URLSearchParams("servicos=1796,8")).servicos).toEqual([8]);
});
test("ordenar por nota exige 100 votos mesmo sem nota mínima", () => {
  const p = toDiscoverParams({ ...DEFAULT_FILTERS, ordem: "nota" }, 1);
  expect(p.sort_by).toBe("vote_average.desc");
  expect(p["vote_count.gte"]).toBe("100");
});
```

- [ ] **Passo 3: Rodar** `npx vitest run src/lib/filters.test.ts`. Esperado: FALHA.
- [ ] **Passo 4: Implementar `providers.ts` e `filters.ts`.** Regras de validação: `servicos` mantém só IDs principais curados, sem duplicatas, na ordem recebida; `genero` é inteiro positivo; ano entre 1900 e (ano atual + 1), com `anoDe <= anoAte`, senão os dois viram `null`; `nota` é inteiro de 1 a 9; `aluguel` só vale `"1"`; em `Record`, um array usa o primeiro valor.
- [ ] **Passo 5: Rodar os testes.** Esperado: PASSA.
- [ ] **Passo 6: Commit:** `git add src/lib && git commit -m "feat: serviços curados e filtros da URL"`

### Tarefa 4: Cliente e modelos do TMDB

**Arquivos:**
- Criar: `src/lib/tmdb/client.ts`, `src/lib/tmdb/types.ts`, `src/lib/tmdb/mappers.ts`, `src/lib/tmdb/__fixtures__/movie-details.json`, `src/lib/tmdb/__fixtures__/discover.json`, `src/test/helpers.ts`
- Teste: `src/lib/tmdb/client.test.ts`, `src/lib/tmdb/mappers.test.ts`

**Interfaces:**
- Consome: `posterUrl`, `backdropUrl`, `profileUrl`, `logoUrl` (Tarefa 2).
- Produz:
  - `REVALIDATE = { list: 21600, detail: 86400, static: 604800 } as const`
  - `class TmdbNotFound extends Error`, `class TmdbUnavailable extends Error { status: number | null }`
  - `tmdbFetch<T>(path: string, params: Record<string, string | number | undefined>, revalidate: number): Promise<T>`
  - Modelos em `types.ts`:
    - `ProviderBadge = { id: number; name: string; logoUrl: string | null; color: string }`
    - `MovieSummary = { id: number; title: string; year: number | null; posterUrl: string | null; backdropUrl: string | null; rating: number; overview: string; badge: ProviderBadge | null }`
    - `Paged<T> = { items: T[]; page: number; totalPages: number }` (`totalPages` já limitado a 500)
    - `WatchOption = { providerId: number; name: string; logoUrl: string | null }`
    - `WatchAvailability = { link: string | null; subscription: WatchOption[]; free: WatchOption[]; rent: WatchOption[]; buy: WatchOption[] }`
    - `CastMember = { name: string; character: string; profileUrl: string | null }`
    - `MovieDetails = MovieSummary & { runtime: number | null; genres: { id: number; name: string }[]; voteCount: number; certification: string | null; director: string | null; cast: CastMember[]; trailerKey: string | null; watch: WatchAvailability; recommendations: MovieSummary[] }`
    - Tipos crus do TMDB (`RawMovie`, `RawPaged`, `RawDetails`, `RawWatchProviders`) com só os campos usados.
  - Auxiliares de teste em `src/test/helpers.ts`, usados por todas as tarefas seguintes:
    - `summary: MovieSummary`: filme genérico com `id: 1`, título "Filme", `posterUrl` e `backdropUrl` preenchidos, `rating: 7`, `badge: null`.
    - `netflixBadge: ProviderBadge` (id 8).
    - `opt(id: number): WatchOption`.
    - `mockFetch(status, body)`, `mockFetchJson(body)` (status 200) e `mockFetchStatus(status)`, que fazem `vi.stubGlobal("fetch", …)` e devolvem o espião.
  - `mapSummary(raw: RawMovie): MovieSummary` (badge `null`), `mapPaged(raw: RawPaged): Paged<MovieSummary>`, `mapWatch(raw: RawWatchProviders): WatchAvailability` (região BR), `mapDetails(raw: RawDetails): MovieDetails`.

- [ ] **Passo 1: Capturar fixtures reais.** Com o token:
  `curl -s -H "Authorization: Bearer $TMDB_READ_TOKEN" "https://api.themoviedb.org/3/movie/693134?language=pt-BR&include_video_language=pt,en&append_to_response=credits,videos,watch/providers,release_dates,recommendations"` → `movie-details.json`; e um discover padrão (parâmetros da Tarefa 3) → `discover.json`. Reduza o elenco a 12 nomes e as recomendações a 3 para manter os arquivos pequenos.
- [ ] **Passo 2: Escrever os testes que falham do cliente** (`fetch` simulado com `vi.stubGlobal`, `process.env.TMDB_READ_TOKEN = "t"`):

```ts
test("envia token, parâmetros e revalidate", async () => {
  const f = mockFetch(200, { ok: 1 });
  await tmdbFetch("/discover/movie", { page: 2, x: undefined }, 21600);
  const [url, init] = f.mock.calls[0];
  expect(url).toBe("https://api.themoviedb.org/3/discover/movie?page=2");
  expect(init.headers.Authorization).toBe("Bearer t");
  expect(init.next).toEqual({ revalidate: 21600 });
});
test("404 vira TmdbNotFound", async () => {
  mockFetch(404, {});
  await expect(tmdbFetch("/movie/1", {}, 1)).rejects.toBeInstanceOf(TmdbNotFound);
});
test.each([500, 503, 429, 401])("%i vira TmdbUnavailable com status", async (s) => {
  mockFetch(s, {});
  await expect(tmdbFetch("/x", {}, 1)).rejects.toMatchObject({ name: "TmdbUnavailable", status: s });
});
test("erro de rede ou timeout vira TmdbUnavailable sem status", async () => {
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new DOMException("t", "TimeoutError")));
  await expect(tmdbFetch("/x", {}, 1)).rejects.toMatchObject({ name: "TmdbUnavailable", status: null });
});
```

- [ ] **Passo 3: Escrever os testes que falham dos mapeadores** (com as fixtures):

```ts
test("mapDetails extrai os campos da spec", () => {
  const d = mapDetails(details);
  expect(d.id).toBe(693134);
  expect(d.cast.length).toBeLessThanOrEqual(10);
  expect(d.director).toBe("Denis Villeneuve");
  expect(d.trailerKey).toMatch(/^[\w-]{11}$/);
  expect(d.posterUrl).toMatch(/^https:\/\/image\.tmdb\.org\/t\/p\/w342\//);
  expect(d.recommendations.every((r) => r.badge === null)).toBe(true);
});
test("trailer prefere pt e só aceita YouTube + Trailer", () => {
  const raw = { ...details, videos: { results: [
    { key: "vimeo000001", site: "Vimeo", type: "Trailer", iso_639_1: "pt" },
    { key: "teaserpt001", site: "YouTube", type: "Teaser", iso_639_1: "pt" },
    { key: "trailerEn01", site: "YouTube", type: "Trailer", iso_639_1: "en" },
    { key: "trailerPt01", site: "YouTube", type: "Trailer", iso_639_1: "pt" },
  ] } };
  expect(mapDetails(raw).trailerKey).toBe("trailerPt01");
});
test("classificação BR: primeira não vazia; ausente vira null", () => {
  const withBR = { ...details, release_dates: { results: [{ iso_3166_1: "BR", release_dates: [{ certification: "" }, { certification: "14" }] }] } };
  expect(mapDetails(withBR).certification).toBe("14");
  expect(mapDetails({ ...details, release_dates: { results: [] } }).certification).toBeNull();
});
test("campos ausentes não quebram", () => {
  const d = mapDetails({ ...details, poster_path: null, backdrop_path: null, overview: "", runtime: 0, release_date: "", videos: { results: [] }, "watch/providers": { results: {} } });
  expect(d.posterUrl).toBeNull();
  expect(d.overview).toBe("Sinopse não disponível em português.");
  expect(d.runtime).toBeNull();
  expect(d.year).toBeNull();
  expect(d.trailerKey).toBeNull();
  expect(d.watch).toEqual({ link: null, subscription: [], free: [], rent: [], buy: [] });
});
test("mapWatch junta free e ads em Grátis", () => {
  const w = mapWatch({ results: { BR: { link: "https://www.themoviedb.org/movie/1/watch?locale=BR", flatrate: [{ provider_id: 8, provider_name: "Netflix", logo_path: "/n.jpg" }], free: [{ provider_id: 1, provider_name: "A", logo_path: null }], ads: [{ provider_id: 2, provider_name: "B", logo_path: null }] } } });
  expect(w.link).toContain("watch");
  expect(w.subscription.map((o) => o.providerId)).toEqual([8]);
  expect(w.free.map((o) => o.providerId)).toEqual([1, 2]);
});
test("mapPaged limita totalPages a 500", () => {
  expect(mapPaged({ ...discover, total_pages: 9000 }).totalPages).toBe(500);
});
```

- [ ] **Passo 4: Rodar** `npx vitest run src/lib/tmdb`. Esperado: FALHA.
- [ ] **Passo 5: Implementar `client.ts`, `types.ts` e `mappers.ts`.** O cliente usa `AbortSignal.timeout(8000)`, monta a query com `URLSearchParams` ignorando `undefined`, e começa com `import "server-only"` (instale `server-only`; no Vitest, crie um alias de `server-only` para um módulo vazio em `vitest.config.ts`). `year` vem dos 4 primeiros dígitos de `release_date`; `runtime` 0 vira `null`; `rating` com uma casa decimal.
- [ ] **Passo 6: Rodar os testes.** Esperado: PASSA.
- [ ] **Passo 7: Commit:** `git add src/lib/tmdb vitest.config.ts package*.json && git commit -m "feat: cliente e mapeadores do TMDB"`

### Tarefa 5: Consultas de filmes e filtro de disponibilidade

**Arquivos:**
- Criar: `src/lib/tmdb/movies.ts`, `src/lib/availability.ts`
- Teste: `src/lib/tmdb/movies.test.ts`, `src/lib/availability.test.ts`

**Interfaces:**
- Consome: `tmdbFetch`, `REVALIDATE`, mapeadores (Tarefa 4); `toDiscoverParams`, `Filters` (Tarefa 3); `CURATED_PROVIDERS`, `getProvider`, `providerForTmdbId` (Tarefa 3).
- Produz:
  - `discoverMovies(f: Filters, page: number): Promise<Paged<MovieSummary>>` (cache `list`)
  - `getMovie(id: number): Promise<MovieDetails>` (cache `detail`; lança `TmdbNotFound`)
  - `getWatchAvailability(id: number): Promise<WatchAvailability>` (cache `detail`)
  - `getGenres(): Promise<{ id: number; name: string }[]>` (`/genre/movie/list`, cache `static`)
  - `searchMovies(q: string, page: number): Promise<Paged<MovieSummary>>` (cache `list`)
  - `firstCuratedBadge(w: WatchAvailability): ProviderBadge | null`: primeiro serviço curado (na ordem de `CURATED_PROVIDERS`) com o ID principal ou uma variante presente em `subscription` ou `free`; o selo é sempre o do serviço principal (ex.: 1796 → Netflix, id 8).
  - `withBadges(movies: MovieSummary[], lookup?: (id: number) => Promise<WatchAvailability>): Promise<MovieSummary[]>`: consulta em paralelo (`Promise.allSettled`), mantém a ordem e **omite** filmes sem serviço curado ou cuja consulta falhou. `lookup` padrão é `getWatchAvailability`.
  - `searchAvailable(q: string, page: number): Promise<Paged<MovieSummary>>`: `q.trim()` vazio devolve `{ items: [], page: 1, totalPages: 0 }` sem chamar o TMDB; senão `searchMovies` + `withBadges`, preservando `page` e `totalPages` do TMDB.

- [ ] **Passo 1: Escrever os testes que falham**

```ts
// availability.test.ts
const opt = (id: number) => ({ providerId: id, name: String(id), logoUrl: null });
const empty = { link: null, subscription: [], free: [], rent: [], buy: [] };
test("primeiro serviço curado segue a ordem da lista curada", () => {
  const w = { ...empty, subscription: [opt(119), opt(8)] };
  expect(firstCuratedBadge(w)?.id).toBe(8); // Netflix vem antes na lista curada
});
test("só aluguel ou serviço não curado não conta", () => {
  expect(firstCuratedBadge({ ...empty, rent: [opt(8)] })).toBeNull();
  expect(firstCuratedBadge({ ...empty, subscription: [opt(99999)] })).toBeNull();
  expect(firstCuratedBadge({ ...empty, subscription: [opt(1796)] })?.id).toBe(8); // variante com anúncios conta como Netflix
});
test("withBadges omite indisponíveis e falhas, mantendo a ordem", async () => {
  const movies = [1, 2, 3, 4].map((id) => ({ ...summary, id }));
  const lookup = vi.fn(async (id: number) => {
    if (id === 2) throw new Error("x");
    if (id === 3) return empty;
    return { ...empty, free: [opt(8)] };
  });
  const out = await withBadges(movies, lookup);
  expect(out.map((m) => m.id)).toEqual([1, 4]);
  expect(out[0].badge?.name).toBe("Netflix");
});
// movies.test.ts (mock de ./client)
test("searchAvailable com termo vazio não chama o TMDB", async () => {
  expect(await searchAvailable("   ", 1)).toEqual({ items: [], page: 1, totalPages: 0 });
  expect(tmdbFetch).not.toHaveBeenCalled();
});
test("searchMovies envia o termo sem alteração", async () => {
  await searchMovies("Amélie & cia", 1);
  expect(tmdbFetch).toHaveBeenCalledWith("/search/movie", expect.objectContaining({ query: "Amélie & cia", language: "pt-BR", include_adult: "false", page: 1 }), 21600);
});
test("getMovie pede os apêndices da spec", async () => {
  await getMovie(10);
  expect(tmdbFetch).toHaveBeenCalledWith("/movie/10", expect.objectContaining({
    append_to_response: "credits,videos,watch/providers,release_dates,recommendations",
    include_video_language: "pt,en", language: "pt-BR",
  }), 86400);
});
```

- [ ] **Passo 2: Rodar** `npx vitest run src/lib/availability.test.ts src/lib/tmdb/movies.test.ts`. Esperado: FALHA.
- [ ] **Passo 3: Implementar `movies.ts` e `availability.ts`** conforme as interfaces. O `ProviderBadge` vem de `getProvider` (nome, cor e `logoUrl(logoPath)` da lista curada).
- [ ] **Passo 4: Rodar os testes.** Esperado: PASSA.
- [ ] **Passo 5: Commit:** `git add src/lib && git commit -m "feat: consultas de filmes e filtro de disponibilidade"`

### Tarefa 6: Layout geral, busca no cabeçalho e páginas de estado

**Arquivos:**
- Modificar: `src/app/layout.tsx`, `src/app/globals.css`
- Criar: `src/components/Header.tsx`, `src/components/SearchBox.tsx` (client), `src/components/Footer.tsx`, `src/app/not-found.tsx`, `src/app/error.tsx` (client), `src/app/loading.tsx`, `public/tmdb-logo.svg`
- Teste: `src/components/SearchBox.test.tsx`

**Interfaces:**
- Consome: `SITE` (Tarefa 1).
- Produz: `<SearchBox defaultValue?: string />`, que navega para `/busca?q=<termo codificado>` com `router.push` ao enviar o formulário; termo vazio ou só espaços não navega.

- [ ] **Passo 1: Escrever os testes que falham** (mock de `next/navigation` com `push` espião):

```tsx
test("Enter navega para a busca com termo codificado", async () => {
  render(<SearchBox />);
  await userEvent.type(screen.getByRole("searchbox"), "  Amélie & cia {enter}");
  expect(push).toHaveBeenCalledWith("/busca?q=Am%C3%A9lie+%26+cia");
});
test("termo vazio não navega", async () => {
  render(<SearchBox />);
  await userEvent.type(screen.getByRole("searchbox"), "   {enter}");
  expect(push).not.toHaveBeenCalled();
});
```

- [ ] **Passo 2: Rodar** `npx vitest run src/components/SearchBox.test.tsx`. Esperado: FALHA.
- [ ] **Passo 3: Implementar.**
  - `SearchBox`: `<form role="search">` com `<input type="search" aria-label="Buscar filme">`; a query é montada com `new URLSearchParams({ q: termo.trim() })`.
  - Cabeçalho fixo (`sticky`): `SITE.name` em destaque `#f5c518`, links "Início" (`/`) e "Explorar" (`/explorar`), `SearchBox`.
  - Rodapé: logo do TMDB (baixe o logo oficial da página de marca do TMDB em `public/tmdb-logo.svg`), o texto exato de atribuição e link para `/sobre`.
  - `error.tsx`: "Não conseguimos carregar o catálogo agora" + botão "Tentar de novo" chamando `reset()`.
  - `not-found.tsx`: "Página não encontrada" + link para o início.
  - `loading.tsx`: grade de esqueletos de 12 cards.
- [ ] **Passo 4: Rodar** `npm test` e `npm run build`. Esperado: PASSA.
- [ ] **Passo 5: Commit:** `git add -A && git commit -m "feat: layout geral, busca no cabeçalho e páginas de estado"`

### Tarefa 7: Cards, carrossel e grade

**Arquivos:**
- Criar: `src/components/MovieCard.tsx`, `src/components/MovieRail.tsx`, `src/components/RailArrows.tsx` (client), `src/components/MovieGrid.tsx`
- Teste: `src/components/MovieCard.test.tsx`, `src/components/MovieRail.test.tsx`

**Interfaces:**
- Consome: `MovieSummary`, `ProviderBadge` (Tarefa 4); `movieSlug` (Tarefa 2).
- Produz:
  - `<MovieCard movie: MovieSummary />`: link para `/filme/${movieSlug(id, title)}`, pôster com `alt={title}` (ou placeholder com o título quando `posterUrl` for `null`), nota `★ 8.2` no canto superior esquerdo e selo do `badge` no canto superior direito quando houver (elemento com `aria-label="Serviço: <nome>"`).
  - `<MovieRail title: ReactNode; movies: MovieSummary[]; seeAllHref?: string; badge?: ProviderBadge />`: com `badge`, aplica-o a todos os cards e mostra o logo no título. Lista vazia não renderiza nada.
  - `<MovieGrid movies: MovieSummary[] />`: grade de 2 colunas (celular) até 6 (desktop).

- [ ] **Passo 1: Escrever os testes que falham**

```tsx
test("card leva ao slug e mostra nota e selo", () => {
  render(<MovieCard movie={{ ...summary, id: 550, title: "Clube da Luta", rating: 8.4, badge: netflixBadge }} />);
  expect(screen.getByRole("link")).toHaveAttribute("href", "/filme/550-clube-da-luta");
  expect(screen.getByText("★ 8.4")).toBeInTheDocument();
  expect(screen.getByLabelText("Serviço: Netflix")).toBeInTheDocument();
});
test("card sem pôster mostra placeholder com o título", () => {
  render(<MovieCard movie={{ ...summary, title: "Sem Pôster", posterUrl: null }} />);
  expect(screen.queryByRole("img")).toBeNull();
  expect(screen.getByText("Sem Pôster")).toBeInTheDocument();
});
test("carrossel tem link Ver todos e aplica o selo do serviço", () => {
  render(<MovieRail title="Netflix" movies={[summary, { ...summary, id: 2 }]} seeAllHref="/explorar?servicos=8" badge={netflixBadge} />);
  expect(screen.getByRole("link", { name: /ver todos/i })).toHaveAttribute("href", "/explorar?servicos=8");
  expect(screen.getAllByLabelText("Serviço: Netflix")).toHaveLength(2);
});
test("carrossel vazio não renderiza", () => {
  const { container } = render(<MovieRail title="X" movies={[]} />);
  expect(container).toBeEmptyDOMElement();
});
```

- [ ] **Passo 2: Rodar** `npx vitest run src/components`. Esperado: FALHA.
- [ ] **Passo 3: Implementar.** O carrossel é uma lista com `overflow-x: auto` e `scroll-snap`, com cerca de 7 cards visíveis no desktop e 3 no celular. `RailArrows` (client) mostra setas no desktop, que rolam o contêiner com `scrollBy` em uma largura visível.
- [ ] **Passo 4: Rodar os testes.** Esperado: PASSA.
- [ ] **Passo 5: Commit:** `git add src/components && git commit -m "feat: cards, carrossel e grade de filmes"`

### Tarefa 8: Vitrine (`/`)

**Arquivos:**
- Criar: `src/lib/home.ts`, `src/components/Hero.tsx`, `src/components/MoreServices.tsx`, `src/components/Trailer.tsx` (client)
- Modificar: `src/app/page.tsx`
- Teste: `src/lib/home.test.ts`, `src/components/Trailer.test.tsx`

**Interfaces:**
- Consome: `discoverMovies`, `getMovie`, `withBadges`, `firstCuratedBadge` (Tarefa 5); `DEFAULT_FILTERS` (Tarefa 3); `HOME_RAIL_PROVIDER_IDS`, `CURATED_PROVIDERS`, `getProvider` (Tarefa 3); `MovieRail` (Tarefa 7).
- Produz:
  - `pickHero(movies: MovieSummary[]): MovieSummary | null`: primeiro com `backdropUrl`.
  - `getHomeTrending(): Promise<{ hero: MovieDetails | null; trending: MovieSummary[] }>`: discover padrão página 1; `hero = getMovie(pickHero(...).id)` com o campo `badge` preenchido por `firstCuratedBadge(hero.watch)`; `trending = withBadges(itens)`.
  - `getServiceRail(providerId: number): Promise<MovieSummary[]>`: discover com `{ ...DEFAULT_FILTERS, servicos: [providerId] }`, página 1.
  - `<Trailer youtubeKey: string; label?: string />`: botão "▶ Trailer" que, ao clicar, abre um diálogo com iframe de `https://www.youtube-nocookie.com/embed/<key>?autoplay=1`. Antes do clique, não existe iframe. Fecha com Esc ou botão "Fechar".
  - `<Hero movie: MovieDetails />`, `<MoreServices providers: Provider[] />`.

- [ ] **Passo 1: Escrever os testes que falham**

```ts
test("pickHero ignora filmes sem imagem de fundo", () => {
  expect(pickHero([{ ...summary, id: 1, backdropUrl: null }, { ...summary, id: 2, backdropUrl: "u" }])?.id).toBe(2);
  expect(pickHero([{ ...summary, backdropUrl: null }])).toBeNull();
});
test("trilho de serviço filtra só aquele serviço", async () => {
  await getServiceRail(8);
  expect(discoverMovies).toHaveBeenCalledWith(expect.objectContaining({ servicos: [8] }), 1);
});
```

```tsx
test("trailer só carrega o player depois do clique", async () => {
  const { container } = render(<Trailer youtubeKey="abcdefghijk" />);
  expect(container.querySelector("iframe")).toBeNull();
  await userEvent.click(screen.getByRole("button", { name: /trailer/i }));
  expect(document.querySelector("iframe")?.getAttribute("src")).toContain("youtube-nocookie.com/embed/abcdefghijk");
});
```

- [ ] **Passo 2: Rodar** `npx vitest run src/lib/home.test.ts src/components/Trailer.test.tsx`. Esperado: FALHA.
- [ ] **Passo 3: Implementar e montar `page.tsx`**, nesta ordem:
  1. `Hero`: fundo com degradê; "Em destaque · Disponível em <serviço>" (omitido se `badge` for `null`); título; `ano · duração (2h46) · gênero principal · ★ nota`; sinopse cortada em 3 linhas; botões "Ver detalhes" e `Trailer` (só se `trailerKey`). Sem herói, a seção é omitida.
  2. `MovieRail` "Em alta em todos os serviços" com `seeAllHref="/explorar"`.
  3. Os 6 carrosséis de `HOME_RAIL_PROVIDER_IDS`, cada um em `<Suspense>` com esqueleto, título com o nome do serviço, `badge` do serviço e `seeAllHref="/explorar?servicos=<id>"`.
  4. `MoreServices` com os curados fora de `HOME_RAIL_PROVIDER_IDS`, como chips para `/explorar?servicos=<id>`.

  Um carrossel de serviço que falhar some sozinho, sem derrubar a página: cada um captura o erro e renderiza `null`.
- [ ] **Passo 4: Rodar** `npm test`, depois `npm run dev` e abra `http://localhost:3000`. Esperado: testes PASSAM; a vitrine mostra destaque, "Em alta", 6 carrosséis e "Mais serviços".
- [ ] **Passo 5: Commit:** `git add -A && git commit -m "feat: vitrine com destaque e carrosséis"`

### Tarefa 9: Explorar (`/explorar`) e "Carregar mais"

**Arquivos:**
- Criar: `src/app/explorar/page.tsx`, `src/components/ProviderStrip.tsx` (client), `src/components/FilterBar.tsx` (client), `src/components/LoadMore.tsx` (client), `src/app/api/filmes/route.ts`, `src/lib/paging.ts`
- Teste: `src/components/FilterBar.test.tsx`, `src/components/ProviderStrip.test.tsx`, `src/components/LoadMore.test.tsx`, `src/app/api/filmes/route.test.ts`, `src/lib/paging.test.ts`

**Interfaces:**
- Consome: `parseFilters`, `serializeFilters`, `Filters` (Tarefa 3); `discoverMovies`, `getGenres` (Tarefa 5); `MovieGrid`, `MovieCard` (Tarefa 7).
- Produz:
  - `parsePage(v: string | null): number | null`: inteiro de 1 a 500, senão `null`.
  - `GET /api/filmes?<filtros>&page=N` → `200` com `Paged<MovieSummary>`; `page` inválida → `400`; `TmdbUnavailable` → `503`.
  - `<ProviderStrip filters: Filters />`: chip "Todos" e um chip por serviço curado, todos `<button>` com `aria-pressed` (ativo = serviço em `servicos`; "Todos" ativo quando `servicos` está vazio); clicar alterna (acrescentando ao fim ou removendo) o serviço em `servicos` e navega para `/explorar?<serializeFilters>`.
  - `<FilterBar filters: Filters; genres: {id,name}[] />`: menus Gênero, Ano (faixas fixas: 2020-2026, 2010-2019, 2000-2009, 1990-1999, 1900-1989), Nota (6+, 7+, 8+), caixa "Aluguel/compra" e Ordenação. Cada mudança faz `router.push("/explorar?" + serializeFilters(novo))` e não guarda estado próprio.
  - `<LoadMore endpoint: string; initialPage: number; totalPages: number />`: `endpoint` é um caminho com query sem `page` (ex.: `/api/filmes?servicos=8`). Busca `endpoint + "&page=" + (n+1)` (ou `"?page="` se não houver query), acrescenta os `MovieCard`, some quando `página >= totalPages` e, em erro, mostra "Não foi possível carregar mais filmes." com botão "Tentar de novo".

- [ ] **Passo 1: Escrever os testes que falham**

```ts
test("parsePage", () => {
  expect(parsePage("2")).toBe(2);
  expect(parsePage("500")).toBe(500);
  for (const v of [null, "0", "-1", "501", "abc", "1.5"]) expect(parsePage(v)).toBeNull();
});
// route.test.ts (mock de discoverMovies)
test("repassa filtros e página", async () => {
  const res = await GET(new Request("http://x/api/filmes?servicos=8&page=2"));
  expect(res.status).toBe(200);
  expect(discoverMovies).toHaveBeenCalledWith(expect.objectContaining({ servicos: [8] }), 2);
});
test("página inválida dá 400", async () => {
  expect((await GET(new Request("http://x/api/filmes?page=501"))).status).toBe(400);
});
test("TMDB fora do ar dá 503", async () => {
  vi.mocked(discoverMovies).mockRejectedValueOnce(new TmdbUnavailable(500));
  expect((await GET(new Request("http://x/api/filmes?page=2"))).status).toBe(503);
});
```

```tsx
test("FilterBar troca o gênero mantendo os outros filtros", async () => {
  render(<FilterBar filters={{ ...DEFAULT_FILTERS, servicos: [8] }} genres={[{ id: 28, name: "Ação" }]} />);
  await userEvent.selectOptions(screen.getByLabelText("Gênero"), "28");
  expect(push).toHaveBeenCalledWith("/explorar?servicos=8&genero=28");
});
test("FilterBar marca aluguel/compra", async () => {
  render(<FilterBar filters={DEFAULT_FILTERS} genres={[]} />);
  await userEvent.click(screen.getByLabelText("Aluguel/compra"));
  expect(push).toHaveBeenCalledWith("/explorar?aluguel=1");
});
test("ProviderStrip alterna serviço e Todos limpa", async () => {
  render(<ProviderStrip filters={{ ...DEFAULT_FILTERS, servicos: [8] }} />);
  await userEvent.click(screen.getByRole("button", { name: "Prime Video" }));
  expect(push).toHaveBeenLastCalledWith("/explorar?servicos=8,119");
  await userEvent.click(screen.getByRole("button", { name: "Todos" }));
  expect(push).toHaveBeenLastCalledWith("/explorar");
});
test("LoadMore some na última página", async () => {
  mockFetchJson({ items: [summary], page: 2, totalPages: 2 });
  render(<LoadMore endpoint="/api/filmes?servicos=8" initialPage={1} totalPages={2} />);
  await userEvent.click(screen.getByRole("button", { name: "Carregar mais" }));
  expect(fetch).toHaveBeenCalledWith("/api/filmes?servicos=8&page=2");
  expect(await screen.findByRole("link")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Carregar mais" })).toBeNull();
});
test("LoadMore não aparece quando já está na última página", () => {
  render(<LoadMore endpoint="/api/filmes" initialPage={1} totalPages={1} />);
  expect(screen.queryByRole("button")).toBeNull();
});
test("LoadMore em erro mostra mensagem e tentar de novo", async () => {
  mockFetchStatus(503);
  render(<LoadMore endpoint="/api/filmes" initialPage={1} totalPages={5} />);
  await userEvent.click(screen.getByRole("button", { name: "Carregar mais" }));
  expect(await screen.findByText("Não foi possível carregar mais filmes.")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Tentar de novo" })).toBeInTheDocument();
});
```

- [ ] **Passo 2: Rodar** `npx vitest run src/lib/paging.test.ts src/app/api src/components`. Esperado: FALHA nos testes novos.
- [ ] **Passo 3: Implementar.** Em `explorar/page.tsx`, `searchParams` é uma `Promise` (Next 15+): use `await` e passe para `parseFilters`. A página monta `ProviderStrip`, `FilterBar` (com `getGenres()`), o total "N filmes", `MovieGrid` e `LoadMore` com `endpoint="/api/filmes?" + serializeFilters(f)`. Sem resultados: "Nenhum filme com esses filtros" e link "Limpar filtros" para `/explorar`. No celular, os menus do `FilterBar` ficam num painel lateral aberto pelo botão "Filtros".
- [ ] **Passo 4: Rodar** `npm test` e conferir no navegador `/explorar?servicos=8&ordem=nota` e `/explorar?servicos=abc&ano=3000`. Esperado: testes PASSAM; a segunda URL abre com os padrões.
- [ ] **Passo 5: Commit:** `git add -A && git commit -m "feat: página Explorar com filtros e carregar mais"`

### Tarefa 10: Detalhes do filme (`/filme/[slug]`)

**Arquivos:**
- Criar: `src/app/filme/[slug]/page.tsx`, `src/components/WatchProviders.tsx`, `src/components/CastList.tsx`, `src/lib/format.ts`
- Teste: `src/components/WatchProviders.test.tsx`, `src/lib/format.test.ts`

**Interfaces:**
- Consome: `parseMovieSlug`, `movieSlug` (Tarefa 2); `getMovie`, `withBadges` (Tarefa 5); `TmdbNotFound` (Tarefa 4); `Trailer` (Tarefa 8); `MovieRail` (Tarefa 7).
- Produz:
  - `formatRuntime(min: number | null): string | null` (`166` → `"2h46"`, `45` → `"45min"`, `120` → `"2h"`, `null` → `null`)
  - `formatVotes(n: number): string` (`6100` → `"6,1 mil votos"`, `850` → `"850 votos"`)
  - `<WatchProviders watch: WatchAvailability />`: grupos na ordem Assinatura, Grátis, Aluguel, Compra; grupo vazio é omitido; cada logo é um link para `watch.link` (abre em nova aba, `rel="noopener noreferrer"`); nota "Dados de disponibilidade fornecidos por JustWatch."; sem nenhuma opção: "Este filme não está disponível em streaming no Brasil no momento."
  - `<CastList cast: CastMember[] />`

- [ ] **Passo 1: Escrever os testes que falham**

```ts
test("formatRuntime e formatVotes", () => {
  expect(formatRuntime(166)).toBe("2h46");
  expect(formatRuntime(45)).toBe("45min");
  expect(formatRuntime(120)).toBe("2h");
  expect(formatRuntime(null)).toBeNull();
  expect(formatVotes(6100)).toBe("6,1 mil votos");
  expect(formatVotes(850)).toBe("850 votos");
});
```

```tsx
test("agrupa na ordem da spec e omite grupos vazios", () => {
  render(<WatchProviders watch={{ link: "https://www.themoviedb.org/movie/1/watch?locale=BR", subscription: [opt(1899)], free: [], rent: [opt(2)], buy: [] }} />);
  expect(screen.getAllByRole("heading").map((h) => h.textContent)).toEqual(["Assinatura", "Aluguel"]);
  expect(screen.getAllByRole("link")[0]).toHaveAttribute("href", "https://www.themoviedb.org/movie/1/watch?locale=BR");
  expect(screen.getByText("Dados de disponibilidade fornecidos por JustWatch.")).toBeInTheDocument();
});
test("sem opções mostra aviso", () => {
  render(<WatchProviders watch={{ link: null, subscription: [], free: [], rent: [], buy: [] }} />);
  expect(screen.getByText("Este filme não está disponível em streaming no Brasil no momento.")).toBeInTheDocument();
});
```

- [ ] **Passo 2: Rodar** `npx vitest run src/lib/format.test.ts src/components/WatchProviders.test.tsx`. Esperado: FALHA.
- [ ] **Passo 3: Implementar a página.**
  - `parseMovieSlug` nulo leva a `notFound()`. `getMovie` lançando `TmdbNotFound` também leva a `notFound()`. Se `movieSlug(id, title)` diferir do slug recebido, faz `permanentRedirect` para o slug canônico.
  - Use `cache()` do React em `getMovie` para que a página e o `generateMetadata` compartilhem a mesma chamada.
  - Layout conforme a seção 4.2 da spec:
    - Cabeçalho com fundo e degradê, pôster e título.
    - Metadados: `ano · duração · ★ nota (N votos) · classificação`. Campos `null` são omitidos.
    - Chips de gêneros e `Trailer`, se houver.
    - Sinopse e "Direção: X".
    - `<h2>Onde assistir no Brasil</h2>` + `WatchProviders`.
    - "Elenco principal" com `CastList`.
    - "Você também pode gostar" com `MovieRail` de `withBadges(recommendations)`, omitido se vazio.
  - `generateMetadata`: `title: "<título> (<ano>) · CineStream"`, `description` = sinopse, Open Graph com `backdropUrl ?? posterUrl`.
- [ ] **Passo 4: Rodar** `npm test` e conferir no navegador `/filme/693134`, que deve redirecionar para o slug, `/filme/abc`, que deve dar 404, e `/filme/999999999-x`, que também deve dar 404. Esperado: comportamentos conforme descrito.
- [ ] **Passo 5: Commit:** `git add -A && git commit -m "feat: página de detalhes do filme"`

### Tarefa 11: Busca (`/busca`)

**Arquivos:**
- Criar: `src/app/busca/page.tsx`, `src/app/api/busca/route.ts`
- Teste: `src/app/api/busca/route.test.ts`

**Interfaces:**
- Consome: `searchAvailable` (Tarefa 5); `parsePage` (Tarefa 9); `MovieGrid`, `LoadMore` (Tarefas 7 e 9); `SearchBox` (Tarefa 6).
- Produz: `GET /api/busca?q=<termo>&page=N` → `200` com `Paged<MovieSummary>`; `page` inválida → `400`; `TmdbUnavailable` → `503`.

- [ ] **Passo 1: Escrever os testes que falham**

```ts
test("repassa termo e página", async () => {
  const res = await GET(new Request("http://x/api/busca?q=Am%C3%A9lie%20%26%20cia&page=2"));
  expect(res.status).toBe(200);
  expect(searchAvailable).toHaveBeenCalledWith("Amélie & cia", 2);
});
test("página inválida dá 400", async () => {
  expect((await GET(new Request("http://x/api/busca?q=a&page=0"))).status).toBe(400);
});
```

- [ ] **Passo 2: Rodar** `npx vitest run src/app/api/busca`. Esperado: FALHA.
- [ ] **Passo 3: Implementar a página.**
  - Termo vazio: "Digite um título para buscar."
  - Com resultados: "Resultados para "<termo>"", `MovieGrid` e a nota "Dados de disponibilidade fornecidos por JustWatch.".
  - `LoadMore` com `endpoint="/api/busca?q=" + encodeURIComponent(q)`, mantido mesmo quando a página atual vier com menos de 20 itens.
  - Sem resultados disponíveis: "Nenhum filme com esse título está disponível nos serviços de streaming acompanhados."
  - `metadata` com `robots: { index: false }`.
- [ ] **Passo 4: Rodar** `npm test` e buscar "duna" no navegador. Esperado: PASSA; os resultados têm selo de serviço.
- [ ] **Passo 5: Commit:** `git add -A && git commit -m "feat: busca por título restrita aos serviços curados"`

### Tarefa 12: Sobre, SEO, smoke test e deploy

**Arquivos:**
- Criar: `src/app/sobre/page.tsx`, `src/app/sitemap.ts`, `src/app/robots.ts`, `playwright.config.ts`, `e2e/smoke.spec.ts`, `README.md`
- Teste: `src/app/sitemap.test.ts`, `e2e/smoke.spec.ts`

**Interfaces:**
- Consome: `discoverMovies`, `DEFAULT_FILTERS`, `movieSlug`, `SITE`.
- Produz: `sitemap()` com `/`, `/explorar` e `/sobre`, mais `/filme/<slug>` das páginas 1 a 15 do discover padrão (até 300 filmes, sem duplicatas). Se o TMDB falhar, devolve só as estáticas. `robots()` libera tudo, exceto `/api/` e `/busca`, e aponta para `${SITE.url}/sitemap.xml`.

- [ ] **Passo 1: Escrever os testes que falham**

```ts
test("sitemap inclui páginas estáticas e filmes sem duplicatas", async () => {
  vi.mocked(discoverMovies).mockResolvedValue({ items: [{ ...summary, id: 550, title: "Clube da Luta" }], page: 1, totalPages: 500 });
  const urls = (await sitemap()).map((e) => e.url);
  expect(urls).toContain(`${SITE.url}/explorar`);
  expect(urls.filter((u) => u.endsWith("/filme/550-clube-da-luta"))).toHaveLength(1);
  expect(discoverMovies).toHaveBeenCalledTimes(15);
});
test("sitemap sobrevive a falha do TMDB", async () => {
  vi.mocked(discoverMovies).mockRejectedValue(new TmdbUnavailable(500));
  expect((await sitemap()).map((e) => e.url)).toEqual([SITE.url, `${SITE.url}/explorar`, `${SITE.url}/sobre`]);
});
```

- [ ] **Passo 2: Rodar** `npx vitest run src/app/sitemap.test.ts`. Esperado: FALHA.
- [ ] **Passo 3: Implementar.** A página `/sobre` traz o que o site é, a lista dos serviços acompanhados, a atribuição ao TMDB (logo e texto exato), o crédito ao JustWatch e o aviso: "A disponibilidade muda com frequência e pode levar algumas horas para ser atualizada aqui."
- [ ] **Passo 4: Escrever o smoke test** `e2e/smoke.spec.ts`. O `playwright.config.ts` usa `webServer: { command: "npm run build && npm run start", url: "http://localhost:3000" }`. Fluxo:
  1. Abrir `/`.
  2. Clicar em "Ver todos" do carrossel da Netflix e verificar a URL `/explorar?servicos=8` e o chip "Netflix" com `aria-pressed="true"`.
  3. Abrir o primeiro filme e verificar o texto "Onde assistir no Brasil".
- [ ] **Passo 5: Rodar** `npm test` e `npm run test:e2e` com o token real. Esperado: tudo PASSA.
- [ ] **Passo 6: Escrever o `README.md`.** Ele explica:
  - Como obter o Read Access Token no TMDB.
  - Como criar o `.env.local`.
  - `npm run dev`, `npm test` e `npm run test:e2e`.
  - O deploy: importar o repositório na Vercel, definir `TMDB_READ_TOKEN` e `NEXT_PUBLIC_SITE_URL`, e que a `main` vai para produção.
  - Que o projeto é não comercial, nos termos do TMDB e do Vercel Hobby.
- [ ] **Passo 7: Commit:** `git add -A && git commit -m "feat: página sobre, SEO, smoke test e README"`
