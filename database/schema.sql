create table session_summaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid, -- optional for now
  campaign_id text,
  session_date date not null,
  summary text,
  location text,
  characters_met text[],
  plot_threads text[],
  created_at timestamp default now()
);
