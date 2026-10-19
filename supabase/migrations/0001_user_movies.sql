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
