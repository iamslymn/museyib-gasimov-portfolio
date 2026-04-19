-- Ordered gallery: stills + extra YouTube/Vimeo embeds (hero uses projects.embed_url).
-- Apply with: supabase db push   or   run in SQL Editor

alter table public.projects
  add column if not exists gallery_media jsonb default '[]'::jsonb;

comment on column public.projects.gallery_media is
  'JSON array of {type: "image", url} | {type: "video", embedType, embedUrl} in display order.';
