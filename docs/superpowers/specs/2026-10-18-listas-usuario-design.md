# Contas e Listas do Usuário (Favoritos, Assistidos, Assistir depois) — Design

- **Data:** 2026-10-18
- **Status:** aguardando revisão
- **Repositório:** https://github.com/leoopj/catalog-movies
- **Depende de:** [Catálogo de Filmes em Streaming — Design](2026-10-18-catalogo-filmes-streaming-design.md)

## 1. Objetivo

Permitir que o visitante crie uma conta com e-mail e senha e mantenha três listas pessoais de filmes: **Favoritos**, **Assistidos** e **Assistir depois**. As listas ficam acessíveis pelo menu central do header e são exibidas na home.

**Critério de sucesso:** um usuário logado marca um filme na página de detalhes e o vê imediatamente na aba correspondente. Um visitante não logado continua usando todo o catálogo como hoje e é convidado a entrar ao tentar usar uma lista.

### Decisões tomadas no brainstorming

| Tema | Decisão |
|---|---|
| Visitante não logado | Catálogo continua **público**. Listas e botões de marcação pedem login. |
| Onde ficam as abas | No **menu central do header**, estilo Netflix: `🔍 Início · Explorar \| Favoritos · Assistidos · Assistir depois`. |
| URL das abas | Home com query string: `/?aba=favoritos`, `/?aba=assistidos`, `/?aba=assistir-depois`. |
| Onde marcar | **Só na página de detalhes** do filme (três botões). |
| Relação entre listas | Marcar **Assistido** remove de **Assistir depois**. Favorito é independente. Desmarcar Assistido não devolve o filme para Assistir depois. |
| Fluxos de conta | Cadastro **com confirmação por e-mail**, login, sair. **Sem** "esqueci minha senha" nesta entrega. |
| Arquitetura | Sessão em cookie via `@supabase/ssr`, Server Actions, **snapshot** do filme gravado no banco. |

### Fora do escopo

Recuperação de senha, marcação pelos cards, login social, perfis públicos e compartilhamento de listas, exclusão de conta, SMTP próprio, teste E2E do fluxo logado.

## 2. Configuração do Supabase (manual, documentada no README)

1. Criar um projeto em supabase.com na região **South America (São Paulo)**.
2. Em **Project Settings → API**, copiar a **Project URL** e a **Publishable key** (`anon` em projetos antigos) para o `.env.local`.
3. Executar `supabase/migrations/0001_user_movies.sql` no **SQL Editor**.
4. Em **Authentication → URL Configuration**:
   - Definir a **Site URL** com a URL de produção.
   - Adicionar às **Redirect URLs**: `http://localhost:3000/**` e `https://<dominio-vercel>/**`.
5. Em **Authentication → Email Templates → Confirm signup**, trocar o link por:
   `{{ .SiteURL }}/auth/confirmar?token_hash={{ .TokenHash }}&type=email`
6. Manter **Confirm email** ligado (padrão).
7. Cadastrar as mesmas variáveis de ambiente na Vercel.

**Aviso:** o e-mail embutido do Supabase tem limite baixo de envios por hora. Isso é suficiente para uso pessoal. Para tráfego real será preciso configurar um SMTP próprio, o que está fora do escopo.

### Variáveis de ambiente novas

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Ambas são públicas por natureza: a segurança vem da RLS. A secret key do Supabase **não** é usada pelo app.

## 3. Modelo de dados

Arquivo `supabase/migrations/0001_user_movies.sql`:

```sql
create table public.user_movies (
  user_id         uuid        not null default auth.uid()
                              references auth.users (id) on delete cascade,
  movie_id        integer     not null,
  title           text        not null,
  poster_url      text,
  year            integer,
  rating          numeric(3,1) not null default 0,
  favorite_at     timestamptz,
  watched_at      timestamptz,
  watch_later_at  timestamptz,
  updated_at      timestamptz not null default now(),
  primary key (user_id, movie_id)
);

create index user_movies_favorite_idx    on public.user_movies (user_id, favorite_at desc)    where favorite_at    is not null;
create index user_movies_watched_idx     on public.user_movies (user_id, watched_at desc)     where watched_at     is not null;
create index user_movies_watch_later_idx on public.user_movies (user_id, watch_later_at desc) where watch_later_at is not null;

alter table public.user_movies enable row level security;

create policy "select próprio" on public.user_movies for select to authenticated using ((select auth.uid()) = user_id);
create policy "insert próprio" on public.user_movies for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "update próprio" on public.user_movies for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "delete próprio" on public.user_movies for delete to authenticated using ((select auth.uid()) = user_id);
```

**Regras:**
- Cada linha representa um par usuário + filme. Uma coluna `*_at` preenchida indica que o filme está naquela lista, e o valor guarda o momento da marcação, que define a ordem de exibição (mais recente primeiro).
- Quando as três colunas `*_at` ficam nulas, a linha é **apagada**.
- `title`, `poster_url`, `year` e `rating` formam o **snapshot** do filme. São obtidos no servidor via `getMovie(movieId)` e atualizados a cada marcação. Nunca vêm do cliente.

## 4. Autenticação

### Pacotes

`@supabase/supabase-js` e `@supabase/ssr`.

### Módulos

- `src/lib/supabase/server.ts`, marcado com `server-only`:
  - `createSupabaseServerClient()` usa `createServerClient` com `cookies()` do Next.
  - `getCurrentUser()` chama `supabase.auth.getUser()` e retorna `{ id, email } | null`. É memoizada com `React.cache` por requisição.
  - Se as variáveis de ambiente estiverem ausentes, retorna `null` em vez de lançar erro (ver seção 8).
- `src/lib/supabase/proxy.ts`: `updateSession(request)` cria o cliente com os cookies da requisição e da resposta, chama `getUser()` para renovar o token e devolve a resposta.
- **Não existe** cliente Supabase no navegador.

### `src/proxy.ts`

O antigo middleware passou a se chamar proxy no Next 16.

- Chama `updateSession(request)`.
- Matcher: todas as rotas, exceto `_next/static`, `_next/image`, `favicon.ico`, `robots.txt`, `sitemap.xml` e arquivos de imagem.
- **Não redireciona.** A autorização fica nas páginas e actions.

### Rotas

Ficam fora do grupo `(com-loading)`.

| Rota | Tipo | Comportamento |
|---|---|---|
| `/entrar` | página | Formulário de e-mail e senha. Lê `?proximo=` e `?erro=link-invalido`. Link para `/cadastro`. Usuário já logado é redirecionado para `/`. |
| `/cadastro` | página | E-mail, senha (mínimo de 8) e confirmação. Após o envio, mostra "Enviamos um link de confirmação para *email*". A mesma mensagem aparece se o e-mail já existir, porque o Supabase não revela isso. |
| `/auth/confirmar` | route handler `GET` | Recebe `token_hash` e `type`. Chama `verifyOtp`. Em caso de sucesso, redireciona para `/`. Em caso de falha, redireciona para `/entrar?erro=link-invalido`. |

### Server Actions (`src/app/auth/actions.ts`)

- `entrar(estadoAnterior, formData)`: `signInWithPassword`. Em caso de sucesso, faz `redirect(proximoSeguro)`. Em caso de erro, retorna `{ erro: string }`.
- `cadastrar(estadoAnterior, formData)`:
  - Valida os campos no servidor: e-mail não vazio, senha com 8 ou mais caracteres e confirmação igual.
  - Chama `signUp` com `emailRedirectTo` apontando para `${NEXT_PUBLIC_SITE_URL}/auth/confirmar`.
  - Retorna `{ enviadoPara: email }` ou `{ erro }`.
- `sair()`: `signOut` e depois `redirect("/")`.

Os formulários usam `useActionState` e funcionam também sem JavaScript.

### Funções puras (`src/lib/auth.ts`)

- `proximoSeguro(valor)`: aceita apenas caminhos que começam com `/` e **não** com `//` ou `/\`. Em qualquer outro caso, retorna `/`.
- `traduzirErroAuth(erro)`: converte o código do Supabase em mensagem em português:
  - `invalid_credentials` → "E-mail ou senha incorretos."
  - `email_not_confirmed` → "Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada."
  - `weak_password` → "Senha muito fraca. Use pelo menos 8 caracteres."
  - `over_email_send_rate_limit` → "Muitas tentativas. Aguarde alguns minutos."
  - Qualquer outro código → "Não foi possível concluir. Tente novamente."

## 5. Header e menu central

Layout em três colunas (`grid-cols-[1fr_auto_1fr]`): **logo à esquerda, menu no centro, usuário à direita**. O header continua `sticky` e mantém o gradiente escuro atual sobre o Hero. Referência visual: mockup `menu-v3` aprovado no brainstorming.

### Itens do menu

| Rótulo | Destino | Ativo quando |
|---|---|---|
| 🔍 (ícone) | abre a busca | — |
| Início | `/` | `pathname === "/"` e sem `aba` válida |
| Explorar | `/explorar` | `pathname` começa com `/explorar` |
| *(separador)* | | |
| Favoritos | `/?aba=favoritos` | `pathname === "/"` e `aba=favoritos` |
| Assistidos | `/?aba=assistidos` | idem |
| Assistir depois | `/?aba=assistir-depois` | idem |

- O item ativo recebe uma pílula (`bg-white/14`, texto em `--foreground`, `font-semibold`) e `aria-current="page"`.
- Os itens de lista aparecem para **todos**, logados ou não.

### Componentes

- **`Header`** (Server Component): monta o layout, chama `getCurrentUser()` e renderiza `NavMenu` dentro de `<Suspense>` e `UserMenu`.
- **`NavMenu`** (Client): usa `usePathname()` e `useSearchParams()` para descobrir o item ativo. A lógica de "qual item está ativo" fica numa função pura `itemAtivo(pathname, aba)` em `src/lib/nav.ts`, com testes.
- **`SearchBox`** (Client, alterado):
  - Começa como botão de ícone (`aria-label="Abrir busca"`). Ao clicar, expande para o campo atual e foca o input.
  - Esc ou clique fora recolhe o campo, se ele estiver vazio.
  - Em `/busca`, já começa expandido com o termo atual.
  - O envio continua igual (`/busca?q=`).
- **`UserMenu`** (Client):
  - Recebe `email | null`.
  - **Deslogado:** link-botão **Entrar**, em amarelo, para `/entrar`.
  - **Logado:** botão-avatar quadrado em amarelo com a inicial maiúscula do e-mail e `aria-haspopup="menu"`. Abre um menu com "Conectado como *email*" e o botão **Sair**, um `<form action={sair}>`.
  - O menu fecha com Esc ou clique fora.

### Celular (< `sm`)

- Linha de cima: logo à esquerda; lupa e Entrar ou avatar à direita.
- O menu desce para uma segunda linha com rolagem horizontal, sem barra visível.
- O item ativo é rolado para dentro da área visível ao montar a página (`scrollIntoView({ inline: "center" })`).

## 6. Abas de lista na home

`src/app/(com-loading)/page.tsx` passa a ler `searchParams.aba` e `searchParams.pagina`.

- `aba` ausente ou inválida: mostra a home atual (Hero, fileiras e MoreServices), sem mudanças.
- `aba` válida: renderiza **`ListaUsuario`** no lugar do Hero e das fileiras.

### Mapeamento

Fica em `src/lib/marks.ts`:

| `aba` (URL) | `MarkList` | coluna | título |
|---|---|---|---|
| `favoritos` | `favorite` | `favorite_at` | Favoritos |
| `assistidos` | `watched` | `watched_at` | Assistidos |
| `assistir-depois` | `watch_later` | `watch_later_at` | Assistir depois |

### `ListaUsuario` (Server Component)

- **Deslogado:** mostra um painel centralizado com ícone, o título "Entre para ver seus favoritos" (o texto varia por aba), uma frase curta e os botões **Entrar** (`/entrar?proximo=/?aba=<aba>`) e **Criar conta** (`/cadastro`). Não há redirecionamento.
- **Logado:**
  - Chama `listarFilmes(userId, lista, limite)` com `limite = 30 × pagina`. `pagina` é inteiro, mínimo 1 e máximo 20. A função retorna `{ itens: MovieSummary[], total: number }`, com `total` vindo de `count: "exact"` do Supabase.
  - Exibe o cabeçalho com título e contagem ("12 filmes" ou "1 filme"), seguido do `MovieGrid` existente.
  - Se houver mais itens, mostra o link **Ver mais**, que aponta para `/?aba=<aba>&pagina=<n+1>` com `scroll={false}`.
  - **Lista vazia:** mostra uma mensagem por aba ("Você ainda não favoritou nenhum filme.", "Você ainda não marcou nenhum filme como assistido.", "Sua lista para assistir depois está vazia.") e um link para **Explorar**.
- **Erro do Supabase:** mostra "Não foi possível carregar sua lista agora." sem derrubar a página.
- **Metadados:** título da página `"<Aba> · CineStream"`. Abas de lista recebem `robots: { index: false }`.

O snapshot vira `MovieSummary` com `overview: ""`, `backdropUrl: null` e `badge: null`. O `MovieCard` não muda.

## 7. Marcação na página de detalhes

### `MovieActions` (Server Component)

Fica em `src/app/filme/[slug]/page.tsx`, abaixo dos gêneros e do trailer.

- **Deslogado:** três links com aparência de botão para `/entrar?proximo=/filme/<slug>`.
- **Logado:** lê as marcações com `lerMarcacoes(userId, movieId)`, que retorna `{ favorite, watched, watch_later }` como booleanos. Passa o resultado para `MarkButtons`.
- **Supabase indisponível:** não renderiza os botões.

### `MarkButtons` (Client)

- São três botões em pílula: **♥ Favorito**, **✓ Assistido** e **+ Assistir depois**.
  - Marcado: fundo `--accent`, texto escuro.
  - Desmarcado: borda e fundo `surface`.
  - Todos usam `aria-pressed`.
- O estado otimista usa `useOptimistic`, com a regra de assistido aplicada também no cliente: marcar Assistido desliga Assistir depois.
- Cada botão envia `alternarMarcacao(movieId, lista)` dentro de `startTransition`.
- **Resultado `{ ok: false, motivo: "nao-autenticado" }`:** faz `router.push("/entrar?proximo=...")`.
- **Outro erro:** o estado volta ao anterior e aparece a mensagem "Não foi possível salvar. Tente de novo." em `role="status"`.

### Server Action `alternarMarcacao(movieId: number, lista: MarkList)`

Fica em `src/app/filme/actions.ts`.

1. Valida `movieId` (inteiro positivo) e `lista` (um dos três valores). Se inválidos, retorna `{ ok: false, motivo: "invalido" }`.
2. Chama `getCurrentUser()`. Sem usuário, retorna `{ ok: false, motivo: "nao-autenticado" }`.
3. Chama `getMovie(movieId)` para obter o snapshot. Se o TMDB falhar, retorna `{ ok: false, motivo: "erro" }`.
4. Chama `alternar(supabase, userId, snapshot, lista)` em `src/lib/marks.ts`:
   - Lê a linha atual e calcula o novo estado com a função pura `proximoEstado(atual, lista, agora)`:
     - Inverte a coluna da lista: se estava preenchida, vira `null`; se estava nula, recebe `agora`.
     - Se a lista é `watched` e passou a ficar preenchida, `watch_later_at` vira `null`.
   - Se as três colunas ficarem nulas, faz `delete`. Caso contrário, faz `upsert` com o snapshot e `updated_at`.
5. Chama `revalidatePath("/filme/[slug]", "page")` e `revalidatePath("/")`.
6. Retorna `{ ok: true, estado }`.

## 8. Tratamento de erros

| Situação | Comportamento |
|---|---|
| Variáveis do Supabase ausentes | `getCurrentUser()` retorna `null`, o header mostra "Entrar" e as páginas `/entrar` e `/cadastro` mostram "Login indisponível no momento". O catálogo continua funcionando. |
| Supabase fora do ar na leitura | As abas mostram uma mensagem de erro amigável e os botões do detalhe não aparecem. O erro é registrado com `console.error` no servidor. |
| Falha ao salvar marcação | O estado otimista é revertido e aparece uma mensagem curta. |
| Sessão expirada | A action retorna `nao-autenticado` e o usuário é levado a `/entrar?proximo=`. |
| Link de confirmação inválido ou expirado | Redireciona para `/entrar?erro=link-invalido` com a mensagem "Link inválido ou expirado. Tente entrar ou crie a conta novamente." |
| `proximo` malicioso | `proximoSeguro` substitui o valor por `/`. |

## 9. Testes

**Unitários (Vitest):**
- `src/lib/marks.test.ts`:
  - `proximoEstado`: marcar e desmarcar cada lista, a regra de assistido, e o caso de desmarcar assistido sem restaurar assistir depois.
  - Mapeamento entre aba e lista.
  - Snapshot para `MovieSummary`.
  - `alternar` com cliente simulado: insert, update e delete quando tudo fica nulo.
  - `listarFilmes`: ordenação e limite.
- `src/lib/auth.test.ts`: `proximoSeguro` (`/x` passa; `//evil.com`, `/\evil`, `https://evil.com` e vazio não passam) e `traduzirErroAuth`.
- `src/lib/nav.test.ts`: `itemAtivo` para `/`, `/?aba=*` válida e inválida, `/explorar` e `/filme/x`.

**Componentes (Testing Library):**
- `NavMenu`: item ativo e `aria-current`.
- `SearchBox`: ícone expande, Esc recolhe e o envio navega.
- `UserMenu`: estado deslogado e avatar com menu.
- `MarkButtons`: alternância otimista, regra de assistido e reversão em caso de erro.
- Painel de deslogado do `ListaUsuario`.

**E2E (Playwright):**
- O smoke test atual deve continuar passando.
- Novo teste deslogado: clicar em "Favoritos" no menu mostra o convite para entrar, e os botões da página de um filme apontam para `/entrar?proximo=`.

**Build:** `npm run build` sem erros. Verificar com `curl` que `/filme/<slug-invalido>` continua retornando 404 e que um slug não canônico retorna 308.

## 10. Arquivos

**Novos:**
- `supabase/migrations/0001_user_movies.sql`
- `src/proxy.ts`
- `src/lib/supabase/server.ts`
- `src/lib/supabase/proxy.ts`
- `src/lib/auth.ts`
- `src/lib/marks.ts`
- `src/lib/nav.ts`
- `src/app/auth/actions.ts`
- `src/app/auth/confirmar/route.ts`
- `src/app/entrar/page.tsx`
- `src/app/cadastro/page.tsx`
- `src/app/filme/actions.ts`
- `src/components/NavMenu.tsx`
- `src/components/UserMenu.tsx`
- `src/components/ListaUsuario.tsx`
- `src/components/MovieActions.tsx`
- `src/components/MarkButtons.tsx`
- `src/components/AuthForm.tsx` (campos e mensagens compartilhados pelas duas telas)
- Testes correspondentes

**Alterados:**
- `src/components/Header.tsx`
- `src/components/SearchBox.tsx`
- `src/app/(com-loading)/page.tsx`
- `src/app/filme/[slug]/page.tsx`
- `.env.example`
- `README.md`
- `e2e/smoke.spec.ts` (ou um novo `e2e/listas.spec.ts`)
- `package.json`
