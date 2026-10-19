# CineStream

Catálogo de filmes que mostra onde assistir cada título nos principais serviços de streaming
disponíveis no Brasil (Netflix, Prime Video, Disney+, HBO Max, Globoplay, Apple TV+,
Paramount+, Mercado Play, Claro tv+, Crunchyroll e Looke). Construído com Next.js (App Router)
e TypeScript, consumindo a API do TMDB.

## Pré-requisitos

- Node.js 20+
- npm

## Obtendo o Read Access Token do TMDB

1. Crie uma conta gratuita em [themoviedb.org](https://www.themoviedb.org/).
2. Acesse **Configurações → API** ([link direto](https://www.themoviedb.org/settings/api)) e
   solicite uma chave de API (tipo "Developer" é suficiente para uso não comercial).
3. Na mesma página, copie o **API Read Access Token** (token longo, formato JWT) — é esse
   token que o projeto usa, e não a "API Key" curta (v3 auth).

## Configuração local

1. Copie o arquivo de exemplo de variáveis de ambiente:

   ```bash
   cp .env.example .env.local
   ```

2. Preencha o `.env.local`:

   ```bash
   TMDB_READ_TOKEN=seu_token_de_leitura_do_tmdb
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

   - `TMDB_READ_TOKEN`: o Read Access Token obtido acima. Nunca comite este arquivo (ele já
     está no `.gitignore`).
   - `NEXT_PUBLIC_SITE_URL`: a URL pública do site, usada no `sitemap.xml`, no `robots.txt` e
     em metadados de SEO. Em produção, é a URL do domínio na Vercel.

3. Instale as dependências:

   ```bash
   npm install
   ```

## Configurando o Supabase

O login e as listas do usuário (Favoritos, Assistidos, Assistir depois) usam o
[Supabase](https://supabase.com). Sem as variáveis abaixo o app continua funcionando como catálogo
público, e a tela de login mostra "Login indisponível no momento."

1. Crie um projeto em supabase.com na região **South America (São Paulo)**.
2. Em **Project Settings → API**, copie a **Project URL** e a **Publishable key** (`anon` em
   projetos antigos) para o `.env.local`:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sua_publishable_key
   ```

   A secret key do Supabase **não** é usada pelo app.
3. Execute `supabase/migrations/0001_user_movies.sql` no **SQL Editor**.
4. Em **Authentication → URL Configuration**, defina a **Site URL** com a URL de produção e
   adicione às **Redirect URLs**: `http://localhost:3000/**` e `https://<dominio-vercel>/**`.
5. Em **Authentication → Sign In / Providers → Email**, mantenha **Confirm email desligado**: o
   cadastro cria a sessão na hora. Com isso, qualquer pessoa pode criar conta com um e-mail que
   não é dela, o que é aceitável porque a conta só guarda listas de filmes.
6. Cadastre as mesmas variáveis de ambiente na Vercel (**Project Settings → Environment
   Variables**).

## Rodando o projeto

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no navegador.

## Testes

Testes unitários e de componentes (Vitest):

```bash
npm test
```

Teste de ponta a ponta / smoke test (Playwright — builda e sobe o app real, consome a API
real do TMDB, portanto exige um `TMDB_READ_TOKEN` válido em `.env.local`):

```bash
npm run test:e2e
```

Na primeira execução do Playwright pode ser necessário instalar os navegadores:

```bash
npx playwright install chromium
```

## Deploy (Vercel)

1. Importe este repositório na [Vercel](https://vercel.com/new).
2. Em **Project Settings → Environment Variables**, defina:
   - `TMDB_READ_TOKEN`: o Read Access Token do TMDB (mesmo valor usado localmente).
   - `NEXT_PUBLIC_SITE_URL`: a URL de produção do projeto na Vercel (ex.:
     `https://seu-projeto.vercel.app`).
3. A branch `main` é a que vai para produção — qualquer merge/push nela dispara um novo deploy.

## Uso não comercial

Este é um projeto não comercial, pessoal/de estudo, operando nos termos de uso da
[API do TMDB](https://www.themoviedb.org/documentation/api/terms-of-use) e do plano
[Vercel Hobby](https://vercel.com/docs/plans/hobby) (não destinado a uso comercial). Os dados
de disponibilidade em serviços de streaming são fornecidos por [JustWatch](https://www.justwatch.com/)
através da API do TMDB. Este produto usa a API do TMDB, mas não é endossado ou certificado
pelo TMDB.
