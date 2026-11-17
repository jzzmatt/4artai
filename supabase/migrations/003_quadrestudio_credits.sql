-- Atomic credit changes for the fusion function.
-- Clients have no UPDATE policy on profiles. Only service_role may call these.

create or replace function public.spend_credit(target uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  remaining integer;
begin
  update public.profiles
     set credits_remaining = credits_remaining - 1
   where id = target
     and credits_remaining > 0
  returning credits_remaining into remaining;

  return remaining;
end;
$$;

create or replace function public.refund_credit(target uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  remaining integer;
begin
  update public.profiles
     set credits_remaining = credits_remaining + 1
   where id = target
  returning credits_remaining into remaining;

  return remaining;
end;
$$;

revoke all on function public.spend_credit(uuid) from public, anon, authenticated;
revoke all on function public.refund_credit(uuid) from public, anon, authenticated;
grant execute on function public.spend_credit(uuid) to service_role;
grant execute on function public.refund_credit(uuid) to service_role;
