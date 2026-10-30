-- ============================================================================
-- OmniPulse Full-Stack PostgreSQL Schema for Supabase
-- Run this script in: Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ============================================================================

create table if not exists public.tickets (
  id text primary key,
  channel text not null check (channel in ('whatsapp', 'instagram')),
  sub_type text default 'Cloud Webhook',
  customer_name text not null,
  handle text not null,
  avatar_bg text default 'bg-emerald-600',
  initials text default 'CU',
  tier text default 'Verified Customer',
  order_id text default '#ORD-90500',
  status text default 'New' check (status in ('New', 'Open', 'Pending', 'Resolved')),
  priority text default 'High' check (priority in ('Urgent', 'High', 'Medium', 'Low')),
  unread_count int default 1,
  sla_remaining_min int default 15,
  assignee text default 'Unassigned',
  tags jsonb default '[]'::jsonb,
  window_note text default '24h Service Window Active',
  messages jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);

-- Enable Row Level Security (RLS) & allow read/write for your dashboard
alter table public.tickets enable row level security;

drop policy if exists "Allow public read/write for demo" on public.tickets;
create policy "Allow public read/write for demo"
  on public.tickets
  for all
  using (true)
  with check (true);

-- Enable Supabase Realtime so new tickets pop up in the browser immediately
alter publication supabase_realtime add table public.tickets;
