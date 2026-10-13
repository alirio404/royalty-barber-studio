# Estado verificable de Royalty Barber Studio

**Corte:** 13 de octubre de 2026. **Estado:** estabilización de seguridad en curso; no está aprobado para producción.

## Estado remoto verificado

- **GitHub:** `alirio404/royalty-barber-studio`, repositorio público, rama principal `main`, HEAD `776f05c6ed7f13f3246701d53a3b9835d5d73396` (`Add files via upload`, 11 de octubre de 2026). Hay un PR abierto #1. Las operaciones de lectura funcionan; la integración conectada devuelve HTTP 403 al intentar escribir ramas o archivos.
- **Supabase:** proyecto `royalty-barber-studio`, ref `kyhuihtuihwpkftfbxvo`, estado `ACTIVE_HEALTHY`, región `sa-east-1`, PostgreSQL 17.11. Este proyecto ya existe y contiene migraciones; no crees otro ni ejecutes `database/setup.sql` sobre él.
- **Migración de seguridad aplicada:** `20261013110404 fase1_restrict_available_slots_execute`.
- **Configuración comercial:** `business_settings.is_published = false`; cero servicios, cero horarios y cero citas; no hay barberos publicados. El negocio permanece cerrado a reservas online.

## Corrección de seguridad verificada

El asesor de seguridad encontró que `public.get_available_slots(uuid, uuid, date)` era `SECURITY DEFINER` y podía ejecutarse desde `anon` y `authenticated`. La función solo necesita ser invocada por el backend con `service_role`.

Se aplicó una migración que revoca esos permisos y añade una comprobación de privilegios. Consulta de solo lectura posterior:

- `anon_can_execute = false`
- `authenticated_can_execute = false`
- `service_role_can_execute = true`

El asesor de seguridad posterior ya no reporta la ejecución pública de esa función. Queda un aviso informativo: `public.dev_log` tiene RLS activado y no tiene políticas; por tanto, sus filas quedan denegadas por RLS. No se abrió acceso a esa tabla.

## Pruebas y límites de esta fase

- **Aprobada:** aplicación de la migración remota (`{"success":true}`) y comprobación de los permisos efectivos.
- **Aprobada:** lectura del estado comercial; no se publicaron datos ni se crearon citas.
- **No ejecutadas en esta sesión:** `npm ci`, `npm run typecheck`, `npm run test:rules`, `npm run build`, pruebas E2E y pruebas de concurrencia. El acceso de red desde el contenedor falló al resolver `github.com`; no se descargó una copia local para ejecutar esos comandos.
- En el historial de documentación previo se consignan 3/3 pruebas unitarias puras, pero no se volvieron a ejecutar durante esta fase. No se consideran una nueva aprobación.
- No se verificaron correo real, pago, reserva extremo a extremo ni despliegue.

## Sincronización pendiente con GitHub

La base remota ya tiene la migración, pero el archivo correspondiente debe incorporarse al repositorio. El archivo que acompaña este estado es:

`database__migrations__20261013110404_fase1_restrict_available_slots_execute.sql`

Este repositorio conserva algunos archivos con nombres planos separados por `__`; `restaurar-estructura.mjs` los reconstruye como carpetas. Mantén ese patrón si subes el archivo desde la interfaz web de GitHub.

## Bloqueadores antes de aprobar la fase

1. Subir el archivo de migración a GitHub y verificar que su contenido coincide con el cambio ya aplicado en Supabase.
2. Recuperar conectividad al registro npm y ejecutar instalación reproducible, typecheck, pruebas y build.
3. Revisar el aviso residual de `public.dev_log` sin exponer la bitácora, y priorizar los hallazgos de rendimiento mediante migraciones revisadas.
4. Confirmar y cargar los datos comerciales reales; mantener el negocio sin publicar hasta verificarlos.
5. Completar pruebas de seguridad por rol, reservas concurrentes y aceptación en una preview real.

**Estado de fase 1: EN CURSO.** La corrección de permisos está aplicada y verificada en Supabase, pero el archivo todavía debe sincronizarse manualmente en GitHub y no se ha aprobado la compilación ni el despliegue.
