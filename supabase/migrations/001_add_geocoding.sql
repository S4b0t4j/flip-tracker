-- Add latitude/longitude for the property map
-- Run this in Supabase SQL Editor after the initial schema.sql

alter table public.properties
  add column if not exists latitude numeric(10, 7),
  add column if not exists longitude numeric(10, 7);

create index if not exists idx_properties_geo
  on public.properties(latitude, longitude)
  where latitude is not null and longitude is not null;
