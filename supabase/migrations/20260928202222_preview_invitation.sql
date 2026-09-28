-- SPEC 11 — Función public.preview_invitation para mostrar datos de solo lectura
-- Prerequisito: requiere `npx supabase start` (Docker) para `db pull --local`; este archivo se escribió manualmente con el mismo contenido aplicado vía execute_sql.
--
-- Por qué existe: /auth/activate-account muestra nombre y email de solo lectura
-- cuando llega ?code=, y el anónimo no puede leer invitations (RLS solo TO authenticated).
-- Solo devuelve invitaciones pending vigentes; el canje real lo valida
-- redeem_invitation con código + email. Poseer el código implica ser el destinatario.

create or replace function public.preview_invitation(p_code text)
returns table (full_name text, email text, child_name text)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
    select i.full_name, i.email, c.full_name
      from public.invitations i
      join public.children c on c.id = i.child_id
      where i.code = upper(nullif(trim(p_code), ''))
        and i.status = 'pending'
        and i.expires_at > now()
      limit 1;
end;
$$;
