-- Fase 1: reducir la superficie de ejecución de la RPC privilegiada de disponibilidad.
-- La aplicación llama a esta función desde el servidor con service_role; los clientes
-- anon/authenticated no necesitan ejecutarla directamente a través de /rest/v1/rpc.
revoke all privileges on function public.get_available_slots(uuid, uuid, date)
  from public, anon, authenticated;

grant execute on function public.get_available_slots(uuid, uuid, date)
  to service_role;

-- Verificación transaccional: la migración falla si el límite de permisos no queda aplicado.
do $verify$
declare
  v_function regprocedure := 'public.get_available_slots(uuid,uuid,date)'::regprocedure;
begin
  if has_function_privilege('anon', v_function, 'EXECUTE') then
    raise exception 'Security check failed: anon can execute get_available_slots';
  end if;
  if has_function_privilege('authenticated', v_function, 'EXECUTE') then
    raise exception 'Security check failed: authenticated can execute get_available_slots';
  end if;
  if not has_function_privilege('service_role', v_function, 'EXECUTE') then
    raise exception 'Security check failed: service_role cannot execute get_available_slots';
  end if;
end;
$verify$;
