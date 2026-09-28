-- SPEC 11 — Función public.redeem_invitation para canjear códigos como anónimo
-- Prerequisito: requiere `npx supabase start` (Docker) para `db pull --local`; este archivo se escribió manualmente con el mismo contenido aplicado vía execute_sql.
--
-- Por qué existe: la activación la hace un padre anónimo (aún sin cuenta) y las
-- políticas RLS de invitations/parent_children son solo TO authenticated, así que
-- el anónimo no puede leer la invitación directamente. Esta función SECURITY DEFINER
-- valida por dentro (código + pending + vigente + email) y devuelve solo los datos
-- mínimos; el resto del flujo (signup → vínculo → accepted) ya corre autenticado.
-- El aviso del linter sobre DEFINER ejecutable por anon es intencional.

create or replace function public.redeem_invitation(p_code text, p_email text)
returns table (invitation_id uuid, child_id uuid, full_name text, relationship public.relationship_type, daycare_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inv public.invitations%rowtype;
  v_daycare_id uuid;
begin
  -- Invitación pending vigente por código; sin filas = genérico en el caller.
  select * into v_inv from public.invitations
    where code = upper(nullif(trim(p_code), ''))
      and status = 'pending'
      and expires_at > now()
    limit 1;
  if not found then
    return;
  end if;
  if lower(v_inv.email) <> lower(trim(p_email)) then
    return;
  end if;
  -- Guardería: sala del niño; fallback: staff que invitó.
  select r.daycare_id into v_daycare_id
    from public.children c left join public.rooms r on r.id = c.room_id
    where c.id = v_inv.child_id;
  if v_daycare_id is null then
    select u.daycare_id into v_daycare_id
      from public.users u where u.id = v_inv.invited_by;
  end if;
  if v_daycare_id is null then
    return;
  end if;
  invitation_id := v_inv.id;
  child_id := v_inv.child_id;
  full_name := v_inv.full_name;
  relationship := v_inv.relationship;
  daycare_id := v_daycare_id;
  return next;
end;
$$;
