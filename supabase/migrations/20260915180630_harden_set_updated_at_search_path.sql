-- Pin the trigger helper search_path to avoid role-mutable function resolution.
alter function public.set_updated_at() set search_path = public;
