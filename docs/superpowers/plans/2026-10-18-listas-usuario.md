# Contas e Listas do Usuário: Plano de Implementação

> **Para agentes:** SUB-SKILL OBRIGATÓRIA: use superpowers:subagent-driven-development (recomendado) ou superpowers:executing-plans para implementar este plano tarefa por tarefa. Os passos usam checkbox (`- [ ]`) para acompanhamento.

**Objetivo:** login com e-mail e senha via Supabase e três listas pessoais (Favoritos, Assistidos, Assistir depois). As listas são acessadas pelo menu central do header e marcadas na página de detalhes do filme.

**Arquitetura:**
- **Sessão:** `@supabase/ssr` guarda a sessão em cookie, e `src/proxy.ts` a renova a cada requisição.
- **Leituras e mutações:** Server Components fazem as leituras e Server Actions fazem as mutações. Não existe cliente Supabase no navegador.
- **Domínio:** toda a lógica das listas fica em `src/lib/marks.ts`, com funções puras e funções que recebem o cliente Supabase por parâmetro, o que facilita testar com um fake.
- **Snapshot:** o snapshot do filme (título, pôster, ano, nota) é gravado no banco para que as abas não dependam do TMDB.

**Stack:** Next.js 16.4 (App Router; middleware agora é `proxy.ts`), React 19.3, TypeScript, Tailwind 4, `@supabase/supabase-js`, `@supabase/ssr`, Vitest + Testing Library, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-18-listas-usuario-design.md`. Leia junto com este plano. Os textos de interface, as tabelas e o SQL estão lá.

## Restrições globais

- **Next 16:** antes de escrever código, leia `node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md`, `02-guides/authentication.md` e `02-guides/server-actions.md`. Neste projeto, `cacheComponents` está **desligado**, então não use `use cache`.
- **Variáveis de ambiente:** apenas `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. A secret key nunca entra no código.
- **Supabase só no servidor:** nenhum arquivo `"use client"` importa `@supabase/*` nem `src/lib/supabase/*`.
- **Sem variáveis do Supabase:** o app inteiro funciona como hoje (catálogo público, header com "Entrar"). Isso também vale para o build e o E2E sem `.env`.
- **Página de detalhes:** não mude `dynamic = "force-dynamic"` nem a estrutura do grupo `(com-loading)`, pois o 404 e o 308 de `/filme/[slug]` dependem disso.
- **Textos:** toda a interface em português. Use os textos exatos da spec nas seções 4 (erros de autenticação), 6 (abas) e 8 (tabela de erros).
- **Valores fixos:** 30 filmes por página e `pagina` limitada a 1–20; senha com no mínimo 8 caracteres.
- **Nomes:** `MarkList = "favorite" | "watched" | "watch_later"` e `Aba = "favoritos" | "assistidos" | "assistir-depois"`.
- **Cores:** use apenas os tokens de `globals.css` (`--background`, `--foreground`, `--surface`, `--surface-raised`, `--accent`, `--accent-dim`).
- **Referência visual:** `.superpowers/brainstorm/*/content/menu-v3.html` (header) e `listas-mockup.html` (abas e botões).
- **Commits:** em português, no padrão `feat:`/`fix:`/`docs:`/`test:`, terminando com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **Cliques rápidos em sequência num botão de marcação:** o estado final na tela deve bater com o do banco. Os botões ficam desabilitados enquanto a action roda (teste na Tarefa 7).
2. **Desmarcar um filme que sumiu do TMDB ou com o TMDB fora do ar:** desmarcar deve funcionar, porque o snapshot só é buscado quando a linha vai ser gravada (teste na Tarefa 4).
3. **`?pagina=abc`, `-3`, `999` e `?aba=x&aba=y` (array):** `pagina` cai para o intervalo 1–20, e uma `aba` que não seja string única é tratada como aba Início (teste na Tarefa 4).
4. **E-mail com espaços ou maiúsculas no login e no cadastro:** o e-mail passa por `trim()` e `toLowerCase()` antes de ir ao Supabase (teste na Tarefa 2).
5. **Variáveis do Supabase ausentes no build e no E2E:** `getCurrentUser()` retorna `null` sem lançar erro, e `/entrar` mostra "Login indisponível no momento." (testes nas Tarefas 1 e 2; o E2E da Tarefa 8 roda sem `.env`).

---

### Tarefa 1: Fundação do Supabase (dependências, config, cliente, proxy, migração, README)

**Arquivos:**
- Criar:
  - `supabase/migrations/0001_user_movies.sql`
  - `src/lib/supabase/config.ts`
  - `src/lib/supabase/server.ts`
  - `src/lib/supabase/proxy.ts`
  - `src/proxy.ts`
  - `src/test/supabaseFake.ts`
- Modificar: `package.json`, `.env.example`, `README.md`
- Testar: `src/lib/supabase/config.test.ts`, `src/lib/supabase/server.test.ts`

**Interfaces produzidas:**
- `supabaseConfig(): { url: string; key: string } | null` (`config.ts`, sem `server-only`): retorna `null` se alguma das duas variáveis estiver vazia ou ausente.
- `createSupabaseServerClient(): Promise<SupabaseClient | null>` (`server.ts`, `server-only`): retorna `null` sem config. Os cookies usam `getAll`/`setAll` de `await cookies()`. O `setAll` fica em `try/catch`, porque chamá-lo de um Server Component lança erro e o proxy já renova a sessão.
- `type CurrentUser = { id: string; email: string }`
- `getCurrentUser: () => Promise<CurrentUser | null>`: envolvida em `React.cache`. Usa `auth.getUser()`. Se não houver cliente, se ocorrer um erro ou se não houver usuário, retorna `null`. Erros inesperados vão para `console.error`.
- `updateSession(request: NextRequest): Promise<NextResponse>` (`supabase/proxy.ts`): segue o padrão do `@supabase/ssr` para Next, com `getAll` e `setAll` em `request.cookies` e em `NextResponse.next({ request })`. Sem config, retorna `NextResponse.next()`.
- `src/proxy.ts`: `export async function proxy(request)` chama `updateSession`.
  - `config.matcher`: `["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"]`
- `fakeSupabase(respostas)` (`src/test/supabaseFake.ts`): fake encadeável para as Tarefas 2, 4 e 7.
  - Implementa os métodos `from`, `select`, `eq`, `not`, `order`, `limit`, `maybeSingle`, `upsert`, `delete` e `auth.{getUser, signInWithPassword, signUp, signOut}`.
  - Registra cada chamada em `fake.chamadas: { metodo: string; args: unknown[] }[]`.
  - Cada operação terminal (await da cadeia ou chamada `auth.*`) resolve a próxima resposta configurada em `respostas` (fila de `{ data?, error?, count? }`).

- [ ] **Passo 1: instalar as dependências**

  Rodar `npm install @supabase/supabase-js @supabase/ssr`. Resultado esperado: os dois pacotes aparecem em `dependencies`.

- [ ] **Passo 2: escrever os testes que devem falhar**

  `config.test.ts`:
  - `"retorna null sem variáveis"`: com `vi.stubEnv` das duas variáveis em `""`, espera `null`.
  - `"retorna url e key"`: com as duas preenchidas, espera `{ url, key }`.

  `server.test.ts`:
  - Mocks: `vi.mock("next/headers")` para `cookies` e `vi.mock("@supabase/ssr")` para `createServerClient`.
  - `"getCurrentUser retorna null sem config"`: espera `null` e que `createServerClient` não tenha sido chamado.
  - `"getCurrentUser mapeia id e email"`: `getUser` resolve `{ data: { user: { id: "u1", email: "a@b.com" } } }` e o resultado é `{ id: "u1", email: "a@b.com" }`.
  - `"getCurrentUser retorna null quando getUser falha"`: com `error` preenchido, espera `null`.

- [ ] **Passo 3: rodar e ver falhar**

  `npx vitest run src/lib/supabase` deve falhar porque os módulos ainda não existem.

- [ ] **Passo 4: implementar**

  Implementar `config.ts`, `server.ts`, `supabase/proxy.ts`, `src/proxy.ts` e `supabaseFake.ts` conforme as interfaces acima.

- [ ] **Passo 5: rodar e ver passar**

  `npx vitest run src/lib/supabase` passa.

- [ ] **Passo 6: migração, variáveis e README**

  - Copiar o SQL da seção 3 da spec, sem alterações, para `0001_user_movies.sql`.
  - Acrescentar as duas variáveis ao `.env.example`.
  - No README, criar a seção "Configurando o Supabase" com os seis passos da seção 2 da spec, incluindo "Confirm email" desligado e as variáveis na Vercel.

- [ ] **Passo 7: verificar o build e a suíte**

  `npm run build && npm test` passam sem `.env.local` do Supabase. O build lista `Proxy (Middleware)`.

- [ ] **Passo 8: commit**

  `feat: fundação do Supabase (cliente servidor, proxy de sessão, migração)`

---

### Tarefa 2: Autenticação (helpers, actions, telas `/entrar` e `/cadastro`)

Cadastro **sem confirmação por e-mail**: `signUp` já devolve a sessão. Não existe rota `/auth/confirmar`.

**Arquivos:**
- Criar:
  - `src/lib/auth.ts`
  - `src/app/auth/actions.ts`
  - `src/components/AuthForm.tsx`
  - `src/app/entrar/page.tsx`
  - `src/app/cadastro/page.tsx`
- Testar:
  - `src/lib/auth.test.ts`
  - `src/app/auth/actions.test.ts`
  - `src/components/AuthForm.test.tsx`

**Interfaces:**
- Consome: `createSupabaseServerClient` e `getCurrentUser` (Tarefa 1).
- Produz:
  - `proximoSeguro(valor: unknown): string`
  - `traduzirErroAuth(erro: { code?: string } | null | undefined): string`, com os textos da seção 4 da spec.
  - `normalizarEmail(valor: unknown): string`: `String(valor ?? "").trim().toLowerCase()`.
  - `type EstadoEntrar = { erro?: string }`
  - `entrar(prev: EstadoEntrar, form: FormData): Promise<EstadoEntrar>`, com os campos `email`, `senha` e `proximo`.
  - `type EstadoCadastro = { erro?: string }`
  - `cadastrar(prev: EstadoCadastro, form: FormData): Promise<EstadoCadastro>`, com os campos `email`, `senha`, `confirmacao` e `proximo`.
    - Em caso de sucesso com sessão, faz `redirect(proximoSeguro(proximo))`.
    - Se `signUp` não devolver `session`, retorna `{ erro: "Conta criada. Confirme seu e-mail antes de entrar." }`.
  - `sair(): Promise<void>`

**Textos de validação** (fixados aqui porque a spec não traz):
- E-mail vazio: "Informe seu e-mail."
- Senha curta: "A senha precisa ter pelo menos 8 caracteres."
- Confirmação diferente: "As senhas não conferem."
- Sem config do Supabase: "Login indisponível no momento."

- [ ] **Passo 1: escrever os testes de `auth.test.ts`**
  - `proximoSeguro`:
    - `"/filme/1-x"` e `"/?aba=favoritos"` são mantidos.
    - `"//evil.com"`, `"/\\evil.com"`, `"https://evil.com"`, `""`, `undefined` e `123` viram `"/"`.
  - `traduzirErroAuth`: cada um dos cinco códigos da spec (incluindo `user_already_exists`) produz o texto exato. `{ code: "x" }` e `null` produzem "Não foi possível concluir. Tente novamente."
  - `normalizarEmail`: `"  Leo@Exemplo.COM "` vira `"leo@exemplo.com"`.

- [ ] **Passo 2: escrever os testes de `actions.test.ts`**

  Mocks: `@/lib/supabase/server` com `fakeSupabase`, e `next/navigation` com `redirect` lançando `new Error("REDIRECT:" + url)`.
  - `"entrar normaliza e-mail e redireciona para proximo seguro"`: `signInWithPassword` recebe `{ email: "leo@exemplo.com", password }` e o redirect vai para `/filme/1-x`.
  - `"entrar com proximo malicioso redireciona para /"`.
  - `"entrar com credenciais inválidas retorna erro traduzido"`: `{ erro: "E-mail ou senha incorretos." }`.
  - `"entrar sem config retorna Login indisponível no momento."`
  - `"cadastrar valida senha curta e confirmação"`: retorna os textos de validação acima, sem chamar `signUp`.
  - `"cadastrar com sessão normaliza e-mail e redireciona para proximo seguro"`.
  - `"cadastrar com e-mail existente retorna Já existe uma conta com este e-mail. Tente entrar."`: o fake responde `{ error: { code: "user_already_exists" } }`.
  - `"cadastrar sem sessão na resposta retorna Conta criada. Confirme seu e-mail antes de entrar."`
  - `"sair chama signOut e redireciona para /"`.

- [ ] **Passo 3: escrever os testes de `AuthForm.test.tsx`**

  `AuthForm` é client e recebe `{ modo: "entrar" | "cadastro"; action; proximo?: string; indisponivel?: boolean }`.
  - `"modo cadastro mostra campo de confirmação"`.
  - `"exibe erro do estado em role=alert"`.
  - `"envia proximo em campo hidden e o link para a outra tela repassa ?proximo="`.
  - `"indisponivel desabilita o envio e mostra Login indisponível no momento."`

- [ ] **Passo 4: rodar e ver falhar**

  `npx vitest run src/lib/auth src/app/auth src/components/AuthForm` falha porque os módulos não existem.

- [ ] **Passo 5: implementar `auth.ts`, as actions e o `AuthForm`**
  - O `AuthForm` usa `useActionState`. Os campos têm `name` igual aos das actions, `type="email"` e `autoComplete`.
  - Visual: card centralizado em `--surface`, conforme o mockup 5 de `listas-mockup.html`.

- [ ] **Passo 6: implementar as páginas `/entrar` e `/cadastro`**
  - São Server Components.
  - Se `getCurrentUser()` retornar usuário, fazem `redirect("/")`.
  - As duas leem `searchParams.proximo` e o repassam ao `AuthForm`.
  - Passam `indisponivel={supabaseConfig() === null}`.
  - Metadados: `title` "Entrar · CineStream" e "Criar conta · CineStream", ambos com `robots: { index: false }`.

- [ ] **Passo 7: rodar e ver passar**

  `npx vitest run` passa por completo.

- [ ] **Passo 8: commit**

  `feat: cadastro, login e logout com e-mail e senha`

---

### Tarefa 3: Header estilo Netflix (menu central, busca com ícone, menu do usuário)

**Arquivos:**
- Criar:
  - `src/lib/nav.ts`
  - `src/components/NavMenu.tsx`
  - `src/components/UserMenu.tsx`
- Modificar:
  - `src/components/Header.tsx`
  - `src/components/SearchBox.tsx`
  - `src/components/SearchBox.test.tsx`
- Testar:
  - `src/lib/nav.test.ts`
  - `src/components/NavMenu.test.tsx`
  - `src/components/UserMenu.test.tsx`

**Interfaces:**
- Consome: `getCurrentUser` (Tarefa 1) e `sair` (Tarefa 2).
- Produz:
  - `type ItemMenu = "inicio" | "explorar" | "favoritos" | "assistidos" | "assistir-depois"`
  - `ITENS_MENU: { id: ItemMenu; rotulo: string; href: string; grupo: "navegacao" | "listas" }[]`, na ordem e com os hrefs da tabela da seção 5 da spec.
  - `itemAtivo(pathname: string, aba: string | null): ItemMenu | null`
  - `NavMenu()`: client, sem props. Usa `usePathname` e `useSearchParams`. Renderiza um separador entre os grupos e marca o item ativo com `aria-current="page"`.
  - `UserMenu({ email }: { email: string | null })`: client.
  - `SearchBox()`: client, sem props. A prop `defaultValue` deixa de existir.

- [ ] **Passo 1: escrever os testes de `nav.test.ts`**

  `itemAtivo`:
  - `("/", null)` → `"inicio"`
  - `("/", "favoritos")` → `"favoritos"`
  - `("/", "xyz")` → `"inicio"`
  - `("/explorar", null)` → `"explorar"`
  - `("/filme/1-x", null)` → `null`
  - `("/busca", null)` → `null`

- [ ] **Passo 2: escrever os testes de componentes**
  - `NavMenu`, com mock de `next/navigation`:
    - `"marca Favoritos como aria-current em /?aba=favoritos"`.
    - `"todos os cinco links têm os hrefs da spec"`.
  - `UserMenu`:
    - `"deslogado mostra link Entrar para /entrar"`.
    - `"logado mostra inicial maiúscula e abre menu com email e botão Sair"`.
    - `"Esc fecha o menu"`.
  - `SearchBox` (substituir os testes atuais):
    - `"começa como botão Abrir busca e expande com foco no campo"`.
    - `"Enter navega para /busca?q= codificado"`: mantém a asserção atual, `"/busca?q=Am%C3%A9lie+%26+cia"`.
    - `"termo vazio não navega"`.
    - `"Esc com campo vazio recolhe"`.
    - `"em /busca?q=x começa expandido com x"`: mock de `usePathname` e `useSearchParams`.

- [ ] **Passo 3: rodar e ver falhar**

  `npx vitest run src/lib/nav src/components/NavMenu src/components/UserMenu src/components/SearchBox` falha.

- [ ] **Passo 4: implementar `nav.ts`, `NavMenu`, `UserMenu` e o novo `SearchBox`**
  - Pílula ativa: `bg-white/15 font-semibold text-[var(--foreground)]`.
  - Avatar: quadrado `h-8 w-8 rounded-md`, fundo `--accent`, texto escuro.
  - No celular, o `NavMenu` rola o item ativo para o centro ao montar, com `scrollIntoView({ inline: "center", block: "nearest" })`. Proteja a chamada com `?.`, porque o jsdom não implementa esse método.
  - Fechar por clique fora: listener de `pointerdown` no `document`.

- [ ] **Passo 5: reescrever o `Header`**
  - É um Server Component assíncrono e chama `getCurrentUser()`.
  - Grid `grid-cols-[1fr_auto_1fr]` a partir de `sm`. Mantém o `sticky` e o gradiente atual.
  - Centro: `SearchBox` + `NavMenu`, só a partir de `sm`.
  - Direita: `UserMenu`.
  - Abaixo de `sm`: a linha 1 tem logo à esquerda e, à direita, uma segunda instância do `SearchBox` + `UserMenu`. A linha 2 tem o `NavMenu` com `overflow-x-auto` e scrollbar escondida.
  - `NavMenu` e `SearchBox` ficam dentro de `<Suspense fallback={null}>`.

- [ ] **Passo 6: rodar a suíte e o build**

  `npx vitest run && npm run build` passam. `/` e `/explorar` continuam renderizando.

- [ ] **Passo 7: commit**

  `feat: header com menu central estilo Netflix e menu do usuário`

---

### Tarefa 4: Domínio das listas (`src/lib/marks.ts`)

**Arquivos:**
- Criar: `src/lib/marks.ts`
- Testar: `src/lib/marks.test.ts`

**Interfaces:**
- Consome: `MovieSummary` (`src/lib/tmdb/types.ts`) e `fakeSupabase` (Tarefa 1).
- Produz (sem `server-only`, porque `proximoEstado` também roda no cliente):
  - `type MarkList = "favorite" | "watched" | "watch_later"`
  - `type Aba = "favoritos" | "assistidos" | "assistir-depois"`
  - `ABAS: Record<Aba, { lista: MarkList; titulo: string; vazio: string; convite: string }>`
    - Os textos de `titulo` e `vazio` vêm da seção 6 da spec.
    - `convite`: "Entre para ver seus favoritos", "Entre para ver os filmes que você já assistiu" e "Entre para ver sua lista para assistir depois".
  - `parseAba(valor: string | string[] | undefined): Aba | null`
  - `parsePagina(valor: string | string[] | undefined): number`: inteiro de 1 a 20. Valores inválidos ou arrays viram 1, e valores acima de 20 viram 20.
  - `POR_PAGINA = 30`
  - `type MarkState = { favorite_at: string | null; watched_at: string | null; watch_later_at: string | null }`
  - `type Marcacoes = Record<MarkList, boolean>`
  - `type MovieSnapshot = { movie_id: number; title: string; poster_url: string | null; year: number | null; rating: number }`
  - `proximoEstado(atual: MarkState | null, lista: MarkList, agora: string): MarkState`
  - `paraMarcacoes(estado: MarkState | null): Marcacoes`
  - `snapshotDe(movie: MovieSummary): MovieSnapshot`
  - `paraSummary(row: MovieSnapshot): MovieSummary`: preenche `overview: ""`, `backdropUrl: null` e `badge: null`.
  - `lerMarcacoes(sb: SupabaseClient, userId: string, movieId: number): Promise<Marcacoes>`
  - `alternar(sb: SupabaseClient, userId: string, movieId: number, lista: MarkList, obterSnapshot: () => Promise<MovieSnapshot>, agora?: string): Promise<Marcacoes>`
    - Lê a linha com `maybeSingle` e calcula o próximo estado.
    - Se tudo ficar nulo, faz `delete` com `eq` em `user_id` e `movie_id`, **sem** chamar `obterSnapshot`.
    - Caso contrário, chama `obterSnapshot()` e faz `upsert({ user_id, ...snapshot, ...estado, updated_at: agora })`.
    - Lança erro se o Supabase devolver `error`.
  - `listarFilmes(sb: SupabaseClient, userId: string, lista: MarkList, limite: number): Promise<{ itens: MovieSummary[]; total: number }>`
    - `select(..., { count: "exact" })`, `eq("user_id")`, `not(<coluna>, "is", null)`, `order(<coluna>, { ascending: false })` e `limit(limite)`.
    - Lança erro se houver `error`.

- [ ] **Passo 1: escrever os testes que devem falhar**
  - `proximoEstado`:
    - `"marca favorito a partir de null"` → `favorite_at === agora`, demais nulos.
    - `"desmarca favorito preservando os outros"`.
    - `"marcar assistido limpa assistir depois"`.
    - `"desmarcar assistido não restaura assistir depois"`.
    - `"marcar assistir depois não mexe em assistido"`.
  - `parseAba`: `"favoritos"` → `"favoritos"`; `"x"`, `undefined` e `["favoritos", "assistidos"]` → `null`.
  - `parsePagina`: `"2"` → 2; `"abc"`, `"-3"`, `"0"`, `undefined` e `["2"]` → 1; `"999"` → 20; `"2.5"` → 1.
  - `snapshotDe` e `paraSummary`: ida e volta preservam `id`, `title`, `posterUrl`, `year` e `rating`.
  - `alternar`, com `fakeSupabase`:
    - `"insere via upsert com snapshot quando não existe linha"`.
    - `"apaga a linha e não chama obterSnapshot quando tudo fica nulo"`: `obterSnapshot` é um `vi.fn()` que rejeita, e o teste prova que desmarcar funciona sem o TMDB.
    - `"propaga erro do Supabase"`.
  - `listarFilmes`:
    - `"filtra pela coluna da lista, ordena desc, aplica limite e retorna total"`, verificando as chamadas registradas.
    - `"lança erro do Supabase"`.

- [ ] **Passo 2: rodar e ver falhar**

  `npx vitest run src/lib/marks` falha.

- [ ] **Passo 3: implementar `marks.ts`**

  Mapeamento de colunas: `favorite → favorite_at`, `watched → watched_at`, `watch_later → watch_later_at`.

- [ ] **Passo 4: rodar e ver passar**

  `npx vitest run src/lib/marks` passa.

- [ ] **Passo 5: commit**

  `feat: domínio das listas do usuário (marcações e listagem)`

---

### Tarefa 5: Abas de lista na home

**Arquivos:**
- Criar: `src/components/ListaUsuario.tsx`
- Modificar: `src/app/(com-loading)/page.tsx`
- Testar: `src/components/ListaUsuario.test.tsx`

**Interfaces:**
- Consome:
  - `getCurrentUser` e `createSupabaseServerClient` (Tarefa 1)
  - `ABAS`, `parseAba`, `parsePagina`, `POR_PAGINA` e `listarFilmes` (Tarefa 4)
  - `MovieGrid` (existente)
- Produz:
  - `ListaUsuario({ aba, pagina }: { aba: Aba; pagina: number })`: Server Component assíncrono.
  - Partes de apresentação exportadas, testáveis sem Supabase:
    - `ConviteEntrar({ aba }: { aba: Aba })`
    - `ListaVazia({ aba }: { aba: Aba })`
    - `ListaConteudo({ aba, pagina, itens, total }: { aba: Aba; pagina: number; itens: MovieSummary[]; total: number })`

- [ ] **Passo 1: escrever os testes que devem falhar**
  - `"ConviteEntrar mostra o convite da aba e links Entrar (/entrar?proximo=%2F%3Faba%3Dfavoritos) e Criar conta (/cadastro)"`. O `proximo` vai codificado com `encodeURIComponent`.
  - `"ListaVazia mostra o texto da aba e link para /explorar"`.
  - `"ListaConteudo mostra título, '12 filmes' e Ver mais para pagina+1 quando total > itens"`.
  - `"ListaConteudo usa '1 filme' no singular e esconde Ver mais quando total <= itens"`.

- [ ] **Passo 2: rodar e ver falhar**

  `npx vitest run src/components/ListaUsuario` falha.

- [ ] **Passo 3: implementar `ListaUsuario`**
  - Sem usuário: mostra `ConviteEntrar`.
  - Com usuário: chama `listarFilmes(sb, user.id, ABAS[aba].lista, POR_PAGINA * pagina)` dentro de `try/catch`. Em caso de erro, faz `console.error` e mostra "Não foi possível carregar sua lista agora."
  - Com `total === 0`: mostra `ListaVazia`. Caso contrário, mostra `ListaConteudo`.
  - O link "Ver mais" usa `scroll={false}`.

- [ ] **Passo 4: integrar na home**
  - `Home` recebe `searchParams`. Se `parseAba(aba)` for válida, renderiza `<ListaUsuario aba pagina />` dentro do mesmo container `max-w-6xl`, no lugar do Hero e das fileiras. Caso contrário, mantém o conteúdo atual.
  - Adicionar `generateMetadata({ searchParams })`: com aba válida, `title` `"${ABAS[aba].titulo} · CineStream"` e `robots: { index: false }`. Sem aba, `{}` (herda do layout).

- [ ] **Passo 5: rodar a suíte e o build**

  `npx vitest run && npm run build` passam.

- [ ] **Passo 6: commit**

  `feat: abas Favoritos, Assistidos e Assistir depois na home`

---

### Tarefa 6: Server Action de marcação

**Arquivos:**
- Criar: `src/app/filme/actions.ts`
- Testar: `src/app/filme/actions.test.ts`

**Interfaces:**
- Consome:
  - `getCurrentUser` e `createSupabaseServerClient` (Tarefa 1)
  - `alternar`, `snapshotDe` e `MarkList` (Tarefa 4)
  - `getMovie` (`src/lib/tmdb/movies.ts`)
- Produz:
  - `type ResultadoMarcacao = { ok: true; marcacoes: Marcacoes } | { ok: false; motivo: "invalido" | "nao-autenticado" | "erro" }`
  - `alternarMarcacao(movieId: number, lista: MarkList): Promise<ResultadoMarcacao>`
    - Arquivo com `"use server"`.
    - O snapshot é obtido de forma preguiçosa, com `() => getMovie(movieId).then(snapshotDe)`.
    - Em caso de sucesso, chama `revalidatePath("/filme/[slug]", "page")` e `revalidatePath("/")`.
    - Qualquer exceção vira `{ ok: false, motivo: "erro" }`, com `console.error`.

- [ ] **Passo 1: escrever os testes que devem falhar**

  Mocks: `@/lib/supabase/server`, `@/lib/tmdb/movies`, `next/cache` e `@/lib/marks`.
  - `"movieId inválido (0, -1, 1.5, NaN) ou lista desconhecida retorna invalido sem consultar usuário"`.
  - `"sem usuário retorna nao-autenticado"`.
  - `"sucesso chama alternar com userId/movieId/lista e revalida os dois paths"`.
  - `"getMovie falhando durante upsert retorna erro"`: `alternar` mockado invoca `obterSnapshot` e o resultado é `{ ok: false, motivo: "erro" }`.

- [ ] **Passo 2: rodar e ver falhar**

  `npx vitest run src/app/filme` falha.

- [ ] **Passo 3: implementar**

  Implementar `alternarMarcacao` conforme a interface acima.

- [ ] **Passo 4: rodar e ver passar**

  `npx vitest run src/app/filme` passa.

- [ ] **Passo 5: commit**

  `feat: server action para alternar marcação de filme`

---

### Tarefa 7: Botões de marcação na página de detalhes

**Arquivos:**
- Criar:
  - `src/components/MovieActions.tsx`
  - `src/components/MarkButtons.tsx`
- Modificar: `src/app/filme/[slug]/page.tsx`, para inserir `<MovieActions movieId slug />` logo abaixo dos gêneros e do trailer, dentro da coluna de texto do hero.
- Testar: `src/components/MarkButtons.test.tsx`

**Interfaces:**
- Consome:
  - `getCurrentUser` e `createSupabaseServerClient` (Tarefa 1)
  - `lerMarcacoes`, `proximoEstado`, `Marcacoes` e `MarkList` (Tarefa 4)
  - `alternarMarcacao` e `ResultadoMarcacao` (Tarefa 6)
- Produz:
  - `MovieActions({ movieId, slug }: { movieId: number; slug: string })`: Server Component assíncrono.
    - Sem usuário, inclusive quando falta a config do Supabase (assim o app se comporta como para um visitante deslogado): mostra `<MarkButtons movieId slug marcacoes={null} />`.
    - Com usuário: chama `lerMarcacoes` dentro de `try/catch`. Se falhar, retorna `null` e faz `console.error`.
  - `MarkButtons({ movieId, slug, marcacoes, acao? }: { movieId: number; slug: string; marcacoes: Marcacoes | null; acao?: typeof alternarMarcacao })`: client.
    - A prop `acao` existe para injeção nos testes e tem `alternarMarcacao` como padrão.
    - Com `marcacoes === null`: três `<Link>` para `/entrar?proximo=${encodeURIComponent("/filme/" + slug)}`.
    - Caso contrário: três `<button aria-pressed>`.
    - Rótulos: "♥ Favorito", "✓ Assistido" e "+ Assistir depois".

- [ ] **Passo 1: escrever os testes que devem falhar**
  - `"deslogado: três links para /entrar?proximo=%2Ffilme%2F<slug>"`.
  - `"clicar Favorito alterna aria-pressed imediatamente (otimista)"`: com `acao` pendente (promise controlada), o botão já aparece pressionado antes de resolver.
  - `"marcar Assistido desliga Assistir depois otimisticamente"`.
  - `"botões ficam disabled enquanto a ação está pendente"`.
  - `"erro reverte o estado e mostra 'Não foi possível salvar. Tente de novo.' em role=status"`.
  - `"nao-autenticado navega para /entrar?proximo=..."`: com mock de `useRouter().push`.

- [ ] **Passo 2: rodar e ver falhar**

  `npx vitest run src/components/MarkButtons` falha.

- [ ] **Passo 3: implementar `MarkButtons`**
  - Usa `useOptimistic` + `useTransition`, aplicando `proximoEstado`/`paraMarcacoes` sobre um `MarkState` derivado das `marcacoes`.
  - O estado confirmado é atualizado com `marcacoes` vindas de `{ ok: true }`.
  - Estilos: marcado com `bg-[var(--accent)] text-black border-[var(--accent)]`; desmarcado com borda `#3a3c48` e fundo `var(--surface)/85`; formato `rounded-full px-4 py-2 text-sm font-semibold`.

- [ ] **Passo 4: implementar `MovieActions` e inserir na página**

  Implementar `MovieActions` conforme a interface acima e inseri-lo na página de detalhes.

- [ ] **Passo 5: rodar a suíte e o build**

  `npx vitest run && npm run build` passam.

- [ ] **Passo 6: commit**

  `feat: botões de favorito, assistido e assistir depois na página do filme`

---

### Tarefa 8: E2E deslogado e verificação final

**Arquivos:**
- Criar: `e2e/listas.spec.ts`

- [ ] **Passo 1: escrever o teste E2E**

  `"deslogado: Favoritos mostra convite e botões do filme levam ao login"`:
  - Abrir `/` e clicar no link "Favoritos" do menu.
  - Esperar a URL `/?aba=favoritos` e o texto "Entre para ver seus favoritos" visível.
  - Abrir o primeiro `a[href^="/filme/"]` a partir de `/`.
  - O link "♥ Favorito" deve ter `href` começando com `/entrar?proximo=%2Ffilme%2F`. Isso vale com ou sem a config do Supabase (Tarefa 7).

- [ ] **Passo 2: rodar todos os testes**

  `npm run lint && npm test && npm run test:e2e` passam: smoke atual + novo.

- [ ] **Passo 3: verificar os status HTTP**

  Com `npm run build && npm run start`:
  - `curl -s -o /dev/null -w "%{http_code}" localhost:3000/filme/0-inexistente` → `404`
  - `curl -s -o /dev/null -w "%{http_code}" localhost:3000/filme/550-slug-errado` → `308`
  - `curl -s -o /dev/null -w "%{http_code}" "localhost:3000/?aba=favoritos"` → `200`

- [ ] **Passo 4: verificação manual com o Supabase real**

  O usuário configura o `.env.local` e roda a migração (README). Depois:
  1. Cadastrar uma conta e conferir que já entra logado; sair e entrar de novo.
  2. Marcar um filme como Favorito e Assistir depois.
  3. Marcar Assistido e conferir que Assistir depois desliga.
  4. Conferir as três abas.
  5. Sair.

  Registrar o resultado.

- [ ] **Passo 5: commit**

  `test: e2e das listas para visitante deslogado`
