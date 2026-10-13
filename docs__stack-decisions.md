# Decisiones de infraestructura — Royalty Barber Studio

**Corte:** 13 de octubre de 2026. Este documento refleja los recursos revisados mediante las integraciones disponibles.

## Stack

- **GitHub:** repositorio existente `alirio404/royalty-barber-studio`, rama `main`. Está marcado como público. Las lecturas funcionan, pero la integración actual devuelve HTTP 403 al crear o actualizar archivos; los cambios pendientes se deberán sincronizar manualmente si no se restaura el permiso.
- **Next.js:** App Router, React y TypeScript. El repositorio almacena algunos archivos con nombres codificados mediante `__`; `restaurar-estructura.mjs` los copia a las rutas que consume Next antes de ejecutar los scripts npm.
- **Supabase:** proyecto activo `royalty-barber-studio` (`kyhuihtuihwpkftfbxvo`), región `sa-east-1`, PostgreSQL 17.11. Ya registra varias migraciones y no es una base nueva.
- **Alojamiento:** Netlify sigue siendo el destino previsto por `netlify.toml`, pero no se ha verificado una URL publicada y conectada correctamente a este repositorio. No se debe reutilizar un sitio de nombre aleatorio sin confirmar su identidad.
- **Cloudflare:** opcional para DNS/protección cuando el propietario defina el dominio. No se ha creado ni modificado ningún recurso en esta fase.
- **Pagos y correo:** no se ha verificado una pasarela de pagos ni la entrega de correo transaccional de extremo a extremo.

## Estado de base de datos y seguridad

- `business_settings` sigue sin publicar (`is_published = false`). No hay servicios, horarios ni citas; no hay barberos publicados.
- Las tablas de negocio revisadas tienen RLS habilitado.
- La migración `20261013110404 fase1_restrict_available_slots_execute` revocó el permiso `EXECUTE` de `PUBLIC`, `anon` y `authenticated` sobre `public.get_available_slots(uuid, uuid, date)`, conservándolo para `service_role`.
- La comprobación efectiva posterior fue: `anon=false`, `authenticated=false`, `service_role=true`.
- El asesor de seguridad ya no muestra el aviso de ejecución pública de esta función. Permanece un aviso informativo sobre `public.dev_log` con RLS activado y sin políticas, que deniega acceso por RLS. No se abrió esa tabla.
- Los asesores de rendimiento reportaron claves foráneas sin índices de cobertura y políticas permisivas superpuestas. No se hicieron cambios masivos ni se eliminaron índices no usados sin evidencia de carga.

## Instalación y aceptación pendientes

El intento de acceso desde el entorno de preparación no permitió descargar el repositorio por un fallo de resolución DNS de `github.com`; tampoco se pudieron instalar dependencias. Por tanto, `npm ci`, `npm run typecheck`, `npm run test:rules` y `npm run build` quedan pendientes de ejecución en un entorno con red y dependencias disponibles.

Antes de producción:

1. Versionar la migración ya aplicada en el repositorio y revisar el diff.
2. Ejecutar las verificaciones npm con el lockfile real y sin inventar resultados.
3. Completar y probar autenticación, permisos RLS por rol, concurrencia de reservas y recuperación de contraseña.
4. Configurar secretos de servidor de forma privada; nunca usar `SUPABASE_SERVICE_ROLE_KEY` en variables `NEXT_PUBLIC_*`.
5. Cargar los datos reales, publicar únicamente después de la validación del propietario y completar `docs/acceptance-checklist.md` en una preview identificada.

No ejecutar `database/setup.sql` sobre el proyecto Supabase existente: es el esquema inicial, no una migración incremental.
