alter table public.bijoux
add column if not exists metadata jsonb not null default '{}'::jsonb;

comment on column public.bijoux.metadata is
'Free-form JSON settings for jewel experience variants such as recorded voice capsules.';
