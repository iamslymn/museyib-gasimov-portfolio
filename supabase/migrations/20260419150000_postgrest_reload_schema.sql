-- Tell PostgREST to reload its schema cache (e.g. after add_gallery_media or manual DDL).
-- Prevents PGRST204 "Could not find the '...' column ... in the schema cache" until the next automatic refresh.

notify pgrst, 'reload schema';
