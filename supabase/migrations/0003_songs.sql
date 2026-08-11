-- Songs: song_references table.

create table public.song_references (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  provider_song_id text not null,
  title text not null,
  artist text not null,
  album text,
  artwork_url text,
  preview_url text,
  external_url text not null,
  duration integer check (duration is null or duration >= 0),
  created_at timestamptz not null default now()
);

-- The same external song always resolves to a single reference row.
create unique index song_references_provider_song_key
  on public.song_references (provider, provider_song_id);

comment on table public.song_references is
  'Metadata-only reference to an external song. No audio is stored or proxied.';