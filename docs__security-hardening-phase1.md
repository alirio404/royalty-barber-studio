# Evidencia de endurecimiento de seguridad — Fase 1

**Fecha:** 13 de octubre de 2026  
**Proyecto Supabase:** `royalty-barber-studio` (`kyhuihtuihwpkftfbxvo`)  
**Resultado:** cambio aplicado y verificado remotamente; falta sincronizar el archivo en GitHub.

## Hallazgo

El asesor de seguridad de Supabase reportó que `public.get_available_slots(p_service_id uuid, p_barber_id uuid, p_date date)` es una función `SECURITY DEFINER` y podía ejecutarse desde los roles `anon` y `authenticated`. El código de Next.js utiliza un cliente de servidor con `SUPABASE_SERVICE_ROLE_KEY` para llamar a la función; no hace falta exponer su ejecución directa a los clientes.

## Cambio aplicado

Se aplicó la migración `20261013110404 fase1_restrict_available_slots_execute`:

```sql
revoke all privileges on function public.get_available_slots(uuid, uuid, date)
  from public, anon, authenticated;

grant execute on function public.get_available_slots(uuid, uuid, date)
  to service_role;
```

La migración también incluye un bloque `DO` que aborta si los permisos efectivos no coinciden con el límite esperado. El archivo completo de la migración se entrega por separado con este nombre:

`database__migrations__20261013110404_fase1_restrict_available_slots_execute.sql`

## Evidencia posterior

Consulta posterior de privilegios efectivos en PostgreSQL:

| Rol | ¿Puede ejecutar la función? |
|---|---:|
| `anon` | No |
| `authenticated` | No |
| `service_role` | Sí |

El listado de migraciones remotas registra `20261013110404 fase1_restrict_available_slots_execute`. El asesor de seguridad posterior dejó de reportar la función como ejecutable por usuarios públicos. Permanece un aviso informativo para `public.dev_log` (RLS activado sin políticas); no se modificó su acceso.

## Límites y acciones pendientes

- La integración GitHub devolvió `403 Resource not accessible by integration` al intentar crear la rama y subir el archivo. No hay commit ni PR nuevo para esta corrección.
- La migración está aplicada en Supabase antes de sincronizar el archivo; subirla al repositorio documenta el estado actual.
- No se ejecutaron typecheck, pruebas unitarias locales ni build en esta sesión por la falta de conectividad de GitHub desde el entorno. No declarar la fase terminada hasta ejecutar esas verificaciones.
- No ejecutar el esquema inicial `database/setup.sql` sobre este proyecto existente.
