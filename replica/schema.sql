-- Cloudflare D1 (SQLite). Font shop only. Money in integer paise.
create table fonts (
  id text primary key,                 -- 'cvsuhail-vahid'
  name text not null,
  style text not null,                 -- naskh, kufi, ruqaa...
  base_font text not null,             -- OFL source, for attribution
  price_paise integer not null check (price_paise >= 0),
  currency text not null default 'INR',
  preview_key text not null,           -- R2 key, watermarked woff2
  file_key text not null,              -- R2 key, full ttf/otf (never public)
  active integer not null default 1 check (active in (0,1)),
  created_at integer not null default (unixepoch()),
  updated_at integer not null default (unixepoch())
);

create table orders (
  id text primary key,
  razorpay_order_id text not null unique,
  email text not null,
  amount_paise integer not null check (amount_paise >= 0),
  currency text not null default 'INR',
  status text not null default 'created'
    check (status in ('created','paid','failed','refunded')),
  created_at integer not null default (unixepoch()),
  updated_at integer not null default (unixepoch())
);
create index orders_email on orders (email);

create table order_items (
  order_id text not null references orders(id) on delete cascade,
  font_id text not null references fonts(id) on delete restrict,
  price_paise integer not null,
  primary key (order_id, font_id)
);
create index order_items_font on order_items (font_id);

create table licenses (
  key text primary key,                -- random 128-bit, emailed to buyer
  order_id text not null references orders(id) on delete cascade,
  font_id text not null references fonts(id) on delete restrict,
  email text not null,
  created_at integer not null default (unixepoch()),
  unique (order_id, font_id)
);
create index licenses_order on licenses (order_id);
create index licenses_font on licenses (font_id);

create table webhook_events (
  event_id text primary key,           -- idempotency
  type text not null,
  received_at integer not null default (unixepoch())
);
