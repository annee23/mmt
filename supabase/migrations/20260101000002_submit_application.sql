-- Atomic application intake. Called only from the server with the service role.
-- Validates the program/session state, applies the waitlist rule when a session is full,
-- stores health notes in the separate sensitive table and writes the first history row.

create function public.submit_application(p jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  prog public.programs%rowtype;
  sess public.program_sessions%rowtype;
  has_sessions boolean;
  confirmed int;
  cap int;
  new_status text := 'new';
  app public.applications%rowtype;
  health text := nullif(btrim(coalesce(p->>'health_note', '')), '');
begin
  select * into prog from public.programs where id = (p->>'program_id')::uuid and is_published;
  if not found then raise exception 'program_closed' using errcode = 'P0001'; end if;
  if prog.recruit_status <> 'open' or (prog.apply_deadline is not null and prog.apply_deadline < now()) then
    raise exception 'program_closed' using errcode = 'P0001';
  end if;

  select exists (select 1 from public.program_sessions s
                 where s.program_id = prog.id and s.is_published
                   and coalesce(s.ends_at, s.starts_at) >= now()) into has_sessions;

  if nullif(p->>'session_id', '') is not null then
    select * into sess from public.program_sessions
      where id = (p->>'session_id')::uuid and program_id = prog.id and is_published
      for update;
    if not found then raise exception 'session_closed' using errcode = 'P0001'; end if;
    if sess.status <> 'open' or coalesce(sess.ends_at, sess.starts_at) < now()
       or (sess.apply_deadline is not null and sess.apply_deadline < now()) then
      raise exception 'session_closed' using errcode = 'P0001';
    end if;
    cap := coalesce(sess.capacity, prog.default_capacity);
    select count(*) into confirmed from public.applications where session_id = sess.id and status = 'confirmed';
    if cap is not null and confirmed >= cap then new_status := 'waitlist'; end if;
  elsif has_sessions then
    raise exception 'session_required' using errcode = 'P0001';
  end if;

  if exists (select 1 from public.applications a
             where a.program_id = prog.id and a.contact = btrim(p->>'contact')
               and a.session_id is not distinct from sess.id
               and a.status <> 'cancelled' and a.created_at > now() - interval '24 hours') then
    raise exception 'duplicate' using errcode = 'P0001';
  end if;

  if health is not null and not coalesce((p->>'consent_sensitive')::boolean, false) then
    raise exception 'sensitive_consent_required' using errcode = 'P0001';
  end if;

  insert into public.applications
    (program_id, session_id, name, age_group, gender, contact, heard_didgeridoo, reason, expectations,
     status, consent_privacy, consent_version, consent_sensitive, lang)
  values
    (prog.id, sess.id, btrim(coalesce(p->>'name', '')), p->>'age_group', p->>'gender', btrim(p->>'contact'),
     nullif(p->>'heard_didgeridoo', ''), btrim(coalesce(p->>'reason', '')), btrim(coalesce(p->>'expectations', '')),
     new_status, true, coalesce(p->>'consent_version', ''), health is not null, coalesce(p->>'lang', 'ko'))
  returning * into app;

  if health is not null then
    insert into public.application_sensitive_notes (application_id, health_note, consent_sensitive_at)
    values (app.id, health, now());
  end if;

  insert into public.application_status_history (application_id, from_status, to_status)
  values (app.id, null, new_status);

  return jsonb_build_object('application_no', app.application_no, 'status', app.status,
                            'program_id', prog.id, 'session_id', app.session_id);
end $$;

revoke all on function public.submit_application(jsonb) from public, anon, authenticated;
grant execute on function public.submit_application(jsonb) to service_role;
