-- SPEC 11 — Función public.is_email_linked_to_child para no re-invitar vinculados
-- Prerequisito: requiere `npx supabase start` (Docker) para `db pull --local`; este archivo se escribió manualmente con el mismo contenido aplicado vía execute_sql.
--
-- Por qué existe: invita el staff autenticado, pero el email vive en auth.users
-- (no en public.users), así que la Server Action no puede resolver email → vínculo
-- con acceso directo. Esta función SECURITY DEFINER responde solo sí/no para no
-- crear pendientes redundantes cuando el padre ya está vinculado al niño.

create or replace function public.is_email_linked_to_child(p_child_id uuid, p_email text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
      from public.parent_children pc
      join auth.users u on u.id = pc.parent_id
      where pc.child_id = p_child_id
        and lower(u.email) = lower(trim(p_email))
  );
$$;
