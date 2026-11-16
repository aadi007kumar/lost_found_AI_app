create extension if not exists vector;

create table if not exists items (
  id            uuid primary key default gen_random_uuid(),
  type          text not null check (type in ('lost','found')),
  title         text not null,
  category      text not null,
  description   text not null,
  image_url     text,
  image_caption text,
  state         text not null,
  city          text not null,
  place         text,
  event_date    date not null,
  contact_name  text not null,
  contact_phone text not null,
  contact_email text,
  embedding     vector(1024),
  created_at    timestamptz default now()
);

create index if not exists items_embedding_idx on items using hnsw (embedding vector_cosine_ops);
create index if not exists items_type_date_idx on items (type, event_date);
