# Catálogo de Filmes em Streaming — Design

- **Data:** 2026-10-18
- **Status:** aguardando revisão
- **Repositório:** https://github.com/leoopj/catalog-movies

## 1. Objetivo

Site **público** que funciona como catálogo dos filmes **disponíveis em streaming no Brasil neste momento**, usando a API do TMDB (dados de disponibilidade fornecidos pelo JustWatch).

**Critério de sucesso:** um visitante encontra rapidamente um filme para ver nos serviços que assina, sabe em qual serviço assistir, e as páginas são indexáveis pelo Google.

### Restrições

- Região fixa **BR**, idioma **pt-BR**.
- Projeto **sem monetização** (sem anúncios, afiliados ou assinatura). Isso mantém o uso dentro do plano gratuito/não comercial do TMDB e do plano Hobby da Vercel. Qualquer monetização futura exige licença comercial do TMDB e plano Pro da Vercel.
- O token da API do TMDB **nunca** é exposto ao navegador.
- Atribuição ao TMDB e ao JustWatch é obrigatória.

### Escopo da v1

1. Listagem de filmes disponíveis em streaming (catálogo).
2. Filtro por serviço de streaming (lista curada).
3. Filtros de descoberta: gênero, faixa de ano, nota mínima, ordenação.
4. Busca por título (retornando apenas filmes disponíveis nos serviços curados).
5. Página de detalhes com sinopse, elenco, trailer e "Onde assistir".

### Fora da v1

Contas de usuário, favoritos/"quero assistir", séries de TV, outras regiões/idiomas, banco de dados próprio.

## 2. Stack e hospedagem

- **Next.js** (App Router) com **TypeScript**.
- Hospedagem na **Vercel** (plano Hobby), repositório no GitHub com deploy automático: preview em cada PR, produção na `main`.
- Domínio inicial `*.vercel.app`.

## 3. Arquitetura

```
Navegador ──► Next.js (Vercel) ──► API TMDB (v3)
               │  Server Components (renderizam páginas)
               │  Route Handler /api/filmes ("carregar mais")
               └─ Cache do Next (fetch revalidate)
```

- Páginas renderizadas no servidor sob demanda; respostas do TMDB guardadas no cache de dados do Next com expiração:
  - listagens (discover, busca): **6 h** (`revalidate: 21600`);
  - detalhes e provedores de um filme: **24 h** (`revalidate: 86400`);
  - gêneros e lista de provedores: **7 dias** (`revalidate: 604800`).
- O navegador acessa diretamente apenas o CDN público de imagens `image.tmdb.org`.
- Token do TMDB (Read Access Token v4) em variável de ambiente `TMDB_READ_TOKEN`, enviado como `Authorization: Bearer`.

### Abordagens descartadas

- **Geração estática + rebuild agendado:** inviável pelo número de combinações de filtros.
- **Banco próprio sincronizado por job:** traz banco, job e sincronização para manter sem necessidade na v1. É o caminho de evolução se surgirem filtros que o TMDB não suporta.

## 4. Páginas

| Rota | Conteúdo | Fonte TMDB |
|---|---|---|
| `/` | Catálogo: grade de pôsteres + barra de filtros | `GET /discover/movie` |
| `/filme/[slug]` (`[id]-[slug-do-titulo]`) | Detalhes do filme | `GET /movie/{id}?append_to_response=credits,videos,watch/providers` |
| `/busca?q=` | Resultados de busca disponíveis nos serviços curados | `GET /search/movie` + `GET /movie/{id}/watch/providers` |
| `/sobre` | Atribuição TMDB/JustWatch e aviso de que a disponibilidade pode variar | estática |

### 4.1 Catálogo (`/`)

Parâmetros fixos do discover: `watch_region=BR`, `language=pt-BR`, `include_adult=false`.

| Filtro | Parâmetro da URL do site | Parâmetro TMDB | Padrão |
|---|---|---|---|
| Serviços | `servicos=8,119` | `with_watch_providers=8\|119` (OU) | todos os curados |
| Tipo de disponibilidade | `aluguel=1` | `with_watch_monetization_types=flatrate\|free\|ads` (+ `\|rent\|buy` quando `aluguel=1`) | assinatura + grátis |
| Gênero | `genero=28` | `with_genres=28` | nenhum |
| Ano | `ano=2020-2024` | `primary_release_date.gte=2020-01-01` / `.lte=2024-12-31` | nenhum |
| Nota mínima | `nota=7` | `vote_average.gte=7` + `vote_count.gte=100` | nenhum |
| Ordenação | `ordem=popularidade\|nota\|lancamento` | `sort_by=popularity.desc\|vote_average.desc\|primary_release_date.desc` | popularidade |

- Ao ordenar por nota sem filtro de nota, aplica-se `vote_count.gte=100` mesmo assim, para evitar filmes com poucos votos no topo.
- Paginação: 20 filmes por página; botão "Carregar mais" chama `/api/filmes` com os mesmos filtros e `page=N`. Limite do TMDB: página 500. Ao atingir o limite ou `total_pages`, o botão some.

### 4.2 Detalhes (`/filme/[slug]`)

- Pôster, imagem de fundo, título, ano, duração, gêneros, nota, sinopse.
- Elenco principal: até 10 nomes com foto.
- Trailer: primeiro vídeo `type=Trailer`, `site=YouTube`; busca em pt-BR com fallback para inglês (`include_video_language=pt,en`). Player carregado só ao clicar.
- "Onde assistir" (região BR) agrupado em **Assinatura**, **Grátis**, **Aluguel**, **Compra**. Cada logo leva ao link "onde assistir" fornecido pelo TMDB (página TMDB/JustWatch).
  - **Limitação conhecida:** a API do TMDB não fornece links diretos para o filme dentro de cada serviço.
- Slug incorreto → redirect para o slug canônico. ID inexistente → 404.

### 4.3 Busca (`/busca?q=`)

- `GET /search/movie` não filtra por disponibilidade. Para cada resultado (20 por página), consulta-se `watch/providers` em paralelo (cache 24 h) e exibem-se **apenas filmes disponíveis (assinatura/grátis) em algum serviço curado**, com o selo do serviço.
- Se a consulta de provedores de um resultado falhar, o filme é omitido; o resto é exibido.
- Pode haver menos de 20 resultados por página; "Carregar mais" busca a próxima página do TMDB.

## 5. Serviços curados

Netflix, Prime Video, Disney+, Max, Globoplay, Apple TV+, Paramount+, Mercado Play, Claro tv+, Telecine, Crunchyroll, Looke.

- Mantidos em um único arquivo `src/lib/providers.ts` (id, nome, logo).
- Os IDs são confirmados na implementação via `GET /watch/providers/movie?watch_region=BR`, porque o TMDB pode alterá-los (ex.: HBO Max → Max). Um serviço que não existir na listagem BR é removido da lista.

## 6. Estrutura de código

```
src/
  app/
    layout.tsx                # cabeçalho com busca, rodapé com atribuição
    page.tsx                  # catálogo
    loading.tsx, error.tsx, not-found.tsx
    filme/[slug]/page.tsx
    busca/page.tsx
    sobre/page.tsx
    api/filmes/route.ts       # "carregar mais"
    sitemap.ts, robots.ts
  lib/
    tmdb/client.ts            # fetch autenticado, revalidate, timeout, erros tipados
    tmdb/types.ts             # tipos das respostas do TMDB usadas
    tmdb/movies.ts            # discoverMovies, getMovie, searchAvailable, getGenres
    filters.ts                # URL ⇄ Filtros (parse, validação, serialização)
    providers.ts              # lista curada
    images.ts                 # URLs de imagem (w342 pôster, w1280 fundo)
    slug.ts                   # gerar/ler [id]-[slug]
  components/
    FilterBar.tsx (client), MovieGrid.tsx, MovieCard.tsx,
    LoadMore.tsx (client), WatchProviders.tsx, Trailer.tsx (client),
    SearchBox.tsx (client)
```

### Fronteiras

- `lib/tmdb/*` é a **única** parte que conhece o formato do TMDB. As páginas recebem modelos próprios (`MovieSummary`, `MovieDetails`, `WatchAvailability`).
- `lib/filters.ts` é puro. Valores inválidos na URL são descartados e substituídos pelo padrão.
- A **URL é a fonte única de verdade** dos filtros. O `FilterBar` apenas atualiza a URL (`router.push`) e não guarda estado próprio.

## 7. Imagens

- `next/image` com `image.tmdb.org` liberado e `unoptimized: true` (o TMDB já serve tamanhos prontos; evita consumir a cota de otimização da Vercel).
- Placeholder para filmes sem pôster ou foto.

## 8. Tratamento de erros

| Situação | Comportamento |
|---|---|
| TMDB 404 | `TmdbNotFound` → `notFound()` → página 404 amigável |
| TMDB 5xx, 429 ou timeout (8 s) | `TmdbUnavailable` → `error.tsx` com "Não conseguimos carregar o catálogo agora" e botão "Tentar de novo" |
| Falha no "carregar mais" | Mensagem inline + botão repetir; cards existentes permanecem |
| Falha de provedores na busca | Filme omitido; demais exibidos |
| Nenhum resultado | Estado vazio com botão "Limpar filtros" |
| Carregando | `loading.tsx` com esqueletos de cards |

O cache do Next continua servindo a última resposta válida enquanto a revalidação falha, o que amortece quedas breves do TMDB.

## 9. SEO

- `generateMetadata` por página: título, descrição, Open Graph com pôster/fundo.
- `sitemap.xml` dinâmico com filmes populares disponíveis (algumas centenas) + páginas estáticas; `robots.txt`.
- URLs legíveis e canônicas (`/filme/550-clube-da-luta`).

## 10. Atribuição

- Rodapé em todas as páginas: logo do TMDB + "Este produto usa a API do TMDB, mas não é endossado ou certificado pelo TMDB."
- Seção "Onde assistir" e resultados de busca: "Dados de disponibilidade fornecidos por JustWatch."
- Página `/sobre` com as mesmas informações.

## 11. Acessibilidade e responsividade

- Mobile-first; grade de 2 colunas (celular) até 6 (desktop).
- Filtros em painel lateral (drawer) no celular.
- Navegação completa por teclado, `alt` com o título do filme, contraste WCAG AA.

## 12. Testes

- **Vitest (unitários):**
  - `filters.ts`: ida e volta URL ⇄ objeto, valores inválidos, padrões, montagem dos parâmetros TMDB.
  - Mapeadores TMDB → modelos próprios, com JSONs reais salvos como fixtures.
  - `client.ts` com `fetch` simulado: cabeçalho de autorização, `revalidate`, erros tipados, timeout.
  - `slug.ts`.
- **Testing Library:** `FilterBar` (gera a URL correta) e `WatchProviders` (agrupamento e estado vazio).
- **Playwright (1 smoke test):** abrir catálogo → filtrar por Netflix → abrir um filme → ver "Onde assistir". Executado contra a API real antes de deploy, não em todo commit.

## 13. Configuração e deploy

- `.env.example` com `TMDB_READ_TOKEN=`; `.env.local` no `.gitignore`.
- `TMDB_READ_TOKEN` configurado nas variáveis de ambiente da Vercel.
- Pré-requisito do responsável: conta no TMDB e Read Access Token (v4).
