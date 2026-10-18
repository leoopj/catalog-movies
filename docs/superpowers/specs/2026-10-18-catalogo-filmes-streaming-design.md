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

1. Vitrine na página inicial: filme em destaque + carrosséis "em alta" por serviço.
2. Página Explorar: grade de filmes disponíveis em streaming com filtros.
3. Filtro por serviço de streaming (lista curada).
4. Filtros de descoberta: gênero, faixa de ano, nota mínima, ordenação.
5. Busca por título (retornando apenas filmes disponíveis nos serviços curados).
6. Página de detalhes com sinopse, classificação indicativa, elenco, trailer, "Onde assistir" e "Você também pode gostar".

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
| `/` | Vitrine: destaque + carrosséis | `GET /discover/movie` (uma chamada por carrossel) |
| `/explorar` | Catálogo: grade de pôsteres + barra de filtros | `GET /discover/movie` |
| `/filme/[slug]` (`[id]-[slug-do-titulo]`) | Detalhes do filme | `GET /movie/{id}?append_to_response=credits,videos,watch/providers,release_dates,recommendations` |
| `/busca?q=` | Resultados de busca disponíveis nos serviços curados | `GET /search/movie` + `GET /movie/{id}/watch/providers` |
| `/sobre` | Atribuição TMDB/JustWatch e aviso de que a disponibilidade pode variar | estática |

### 4.0 Vitrine (`/`)

Composição, de cima para baixo:

1. **Destaque (hero):** o filme mais popular do momento entre os serviços curados (primeiro resultado do discover com todos os serviços curados que tenha imagem de fundo). Mostra imagem de fundo, título, ano, duração, gênero principal, nota, sinopse curta, o serviço onde está disponível e os botões "Ver detalhes" e "▶ Trailer". É um filme só, sem rotação automática; muda quando o cache renova (6 h).
2. **Carrossel "Em alta em todos os serviços"**: discover com todos os serviços curados, ordenado por popularidade.
3. **Seis carrosséis de serviço**, nesta ordem: Netflix, Prime Video, Disney+, HBO Max, Globoplay, Apple TV+. Cada um: discover com `with_watch_providers` com o ID principal e as variantes do serviço (seção 5), ordenado por popularidade, 20 filmes, logo do serviço no título e link "Ver todos ›" para `/explorar?servicos=<id>`.
4. **"Mais serviços"**: linha de atalhos (chips) para os demais serviços curados, cada um levando a `/explorar?servicos=<id>`.

Regras:

- Mesmos parâmetros fixos e tipos de disponibilidade padrão do Explorar (assinatura + grátis).
- Cada pôster mostra a nota (canto superior esquerdo) e o selo do serviço (canto superior direito).
  - Nos carrosséis de serviço, o selo é o do próprio serviço (sem chamada extra).
  - No destaque e no carrossel "Em alta em todos os serviços", o discover não informa o serviço. Por isso, consulta-se `watch/providers` de cada um desses filmes (cache 24 h) e mostra-se o primeiro serviço curado em que ele está disponível, seguindo a ordem da lista curada.
- Os carrosséis abaixo da dobra são renderizados em streaming (`Suspense`), para a página abrir rápido.
- Custo por renovação de cache (6 h): 8 chamadas de discover. Custo a cada 24 h: até 21 consultas de provedores (destaque + carrossel geral).

### 4.1 Explorar (`/explorar`)

Layout: faixa horizontal com os logos dos serviços curados no topo (chip "Todos" + um chip por serviço, rolagem lateral no celular), seguida de uma linha de menus compactos (Gênero, Ano, Nota, ☐ Aluguel/compra, Ordenação à direita) e a grade de pôsteres na largura toda (2 colunas no celular até 6 no desktop).

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

Layout "cabeçalho cinematográfico": imagem de fundo em largura total com degradê, pôster sobreposto à esquerda e, ao lado, título, metadados, gêneros e botão "▶ Trailer". Abaixo, em uma coluna: sinopse e direção → "Onde assistir no Brasil" → elenco principal → "Você também pode gostar". No celular, o pôster fica acima do título.

- Pôster, imagem de fundo, título, ano, duração, gêneros, nota (com número de votos), sinopse, direção.
- Classificação indicativa brasileira: `release_dates` da região BR (primeiro `certification` não vazio). Se não houver, o campo é omitido.
- Elenco principal: até 10 nomes com foto.
- Trailer: primeiro vídeo `type=Trailer`, `site=YouTube`; busca em pt-BR com fallback para inglês (`include_video_language=pt,en`). Player carregado só ao clicar.
- "Onde assistir" (região BR) agrupado em **Assinatura**, **Grátis**, **Aluguel**, **Compra**. Cada logo leva ao link "onde assistir" fornecido pelo TMDB (página TMDB/JustWatch).
  - **Limitação conhecida:** a API do TMDB não fornece links diretos para o filme dentro de cada serviço.
- "Você também pode gostar": até 20 filmes de `recommendations`, filtrados com a mesma regra da busca (consulta de `watch/providers` por filme, cache 24 h; só exibe os disponíveis em assinatura/grátis em algum serviço curado). Se nenhum restar, a seção é omitida. Falhas individuais omitem o filme.
- Slug incorreto → redirect para o slug canônico. ID inexistente → 404.

### 4.3 Busca (`/busca?q=`)

- `GET /search/movie` não filtra por disponibilidade. Para cada resultado (20 por página), consulta-se `watch/providers` em paralelo (cache 24 h) e exibem-se **apenas filmes disponíveis (assinatura/grátis) em algum serviço curado**, com o selo do serviço.
- Se a consulta de provedores de um resultado falhar, o filme é omitido; o resto é exibido.
- Pode haver menos de 20 resultados por página; "Carregar mais" busca a próxima página do TMDB.

## 5. Serviços curados

IDs confirmados em 2026-10-18 via `GET /watch/providers/movie?watch_region=BR`. Cada serviço tem um **ID principal** (usado na URL do site, `servicos=<id>`) e pode agrupar **variantes** do mesmo serviço (com anúncios, premium), que entram juntas no filtro do TMDB. O visitante vê um único chip por serviço.

| Ordem | Serviço (nome exibido) | ID principal | Variantes agrupadas | Logo (`logo_path`) |
|---|---|---|---|---|
| 1 | Netflix | 8 | 1796 (Netflix Standard with Ads) | `/rK1KljqmbvO9HQa1PBFLILWah72.png` |
| 2 | Prime Video | 119 | 2100 (Amazon Prime Video with Ads) | `/gMZdpavHmxFNnLpMHwVxfqeux2g.png` |
| 3 | Disney+ | 337 | — | `/5eZ872CghnHFLB1j8grszbrx0dx.png` |
| 4 | HBO Max | 1899 | — | `/skypuy7SXuugIQeYg0IglmzoKaS.png` |
| 5 | Globoplay | 307 | — | `/9A6Oxd3F7iXm7mds7CxYOBicojs.png` |
| 6 | Apple TV+ | 350 | — | `/9icYBfYFcwgCbky5VdGUIKJ4C5i.png` |
| 7 | Paramount+ | 531 | 2303 (Paramount Plus Premium) | `/pkx3klJlwW5JdtaulvDx6hDNtch.png` |
| 8 | Mercado Play | 2302 | — | `/1jZnP6bS5nNOqwY7GGJuyLhWEYW.png` |
| 9 | Claro tv+ | 484 | — | `/olzQMHt2SX7iNy8WDMR299hVFcL.png` |
| 10 | Crunchyroll | 283 | — | `/uFL3c4Cq8M6WoLymlC5Y8bmGytV.png` |
| 11 | Looke | 47 | — | `/jsAseYgBGuHRkl0sJs9AAQHHU8P.png` |

- Os 6 primeiros são os carrosséis da vitrine (seção 4.0); "Max" passa a se chamar "HBO Max" em toda a interface.
- **Telecine foi removido**: no TMDB/BR ele só existe como "Telecine Amazon Channel" (2156), um complemento do Prime Video.
- Não entram: canais da Amazon/Apple ("… Amazon Channel", "… Apple TV Channel"), "Apple TV Store" (2, aluguel/compra) e "Claro video" (167).
- Mantidos em um único arquivo `src/lib/providers.ts`. Se o TMDB mudar um ID, só esse arquivo muda.

## 6. Estrutura de código

```
src/
  app/
    layout.tsx                # cabeçalho com busca, rodapé com atribuição
    page.tsx                  # vitrine
    explorar/page.tsx         # catálogo com filtros
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
    availability.ts           # filtra listas por disponibilidade nos serviços curados (busca e recomendações)
    filters.ts                # URL ⇄ Filtros (parse, validação, serialização)
    providers.ts              # lista curada
    images.ts                 # URLs de imagem (w342 pôster, w1280 fundo)
    slug.ts                   # gerar/ler [id]-[slug]
  components/
    Hero.tsx, MovieRail.tsx (carrossel com rolagem lateral), MoreServices.tsx,
    ProviderStrip.tsx, FilterBar.tsx (client), MovieGrid.tsx, MovieCard.tsx,
    LoadMore.tsx (client), WatchProviders.tsx, Trailer.tsx (client),
    CastList.tsx, SearchBox.tsx (client)
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

## 11. Direção visual, acessibilidade e responsividade

- Tema escuro no estilo dos apps de streaming (fundo quase preto, texto claro) com uma cor de destaque amarela para botões principais e filtros ativos. Cada serviço usa sua cor/logo nos selos.
- Cabeçalho fixo com nome do site, links "Início" e "Explorar" e campo de busca.
- Nome do site provisório: "CineStream" (definido em um único arquivo de configuração).
- Carrosséis: rolagem lateral por toque/trackpad e setas no desktop; cerca de 7 pôsteres visíveis no desktop e 3 no celular.
- Mobile-first; grade do Explorar de 2 colunas (celular) até 6 (desktop).
- Filtros em painel lateral (drawer) no celular.
- Navegação completa por teclado, `alt` com o título do filme, contraste WCAG AA.

## 12. Testes

- **Vitest (unitários):**
  - `filters.ts`: ida e volta URL ⇄ objeto, valores inválidos, padrões, montagem dos parâmetros TMDB.
  - Mapeadores TMDB → modelos próprios, com JSONs reais salvos como fixtures.
  - `client.ts` com `fetch` simulado: cabeçalho de autorização, `revalidate`, erros tipados, timeout.
  - `slug.ts`.
  - `availability.ts`: filtragem por serviços curados e omissão em caso de falha.
- **Testing Library:** `FilterBar` (gera a URL correta), `WatchProviders` (agrupamento e estado vazio) e `MovieRail` (link "Ver todos" correto).
- **Playwright (1 smoke test):** abrir a vitrine → "Ver todos" do carrossel da Netflix → conferir filtro ativo no Explorar → abrir um filme → ver "Onde assistir". Executado contra a API real antes de deploy, não em todo commit.

## 13. Configuração e deploy

- `.env.example` com `TMDB_READ_TOKEN=`; `.env.local` no `.gitignore`.
- `TMDB_READ_TOKEN` configurado nas variáveis de ambiente da Vercel.
- Pré-requisito do responsável: conta no TMDB e Read Access Token (v4).
