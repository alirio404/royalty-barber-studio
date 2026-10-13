# Royalty Barber Studio — plataforma web

**Estado: fase de estabilización técnica; NO aprobada para producción.** El repositorio es `alirio404/royalty-barber-studio`. Existe un proyecto Supabase activo asociado al negocio y su esquema ya tiene migraciones; no crees otra instancia ni ejecutes el script inicial sobre la base existente.

La comprobación del 13 de octubre de 2026 encontró que el negocio está sin publicar, con cero servicios, cero horarios, ningún barbero publicado y cero citas. No se debe aceptar ni anunciar reservas reales hasta verificar los datos comerciales y completar las pruebas.

## Funcionalidad del repositorio

- Next.js App Router, React y TypeScript.
- Identidad visual Royalty en negro, rojo y oro, estética streetwear/Y2K, diseño responsive y controles de accesibilidad.
- Catálogo, perfiles y galería conectados a consultas reales; los datos en borrador no se publican.
- Supabase Auth para registro, inicio de sesión y recuperación de contraseña.
- Solicitudes de reserva sujetas a validación de horarios y a restricciones de PostgreSQL para evitar solapamientos.
- Panel ADMIN para servicios, equipo, horarios, excepciones, reservas, registros de pagos externos, datos del negocio y galería privada.
- Políticas RLS y almacenamiento privado. La clave `SUPABASE_SERVICE_ROLE_KEY` solo se utiliza en el servidor.

No se ha verificado una pasarela de pago, campañas de newsletter, notificaciones operativas por correo ni un panel individual de barbero en producción. No presentar esas capacidades como operativas.

## Infraestructura verificada

- **GitHub:** `alirio404/royalty-barber-studio`, rama `main`. El repositorio está marcado como público. La integración disponible permite leer pero devuelve HTTP 403 al escribir ramas o archivos.
- **Supabase:** proyecto `royalty-barber-studio`, ref `kyhuihtuihwpkftfbxvo`, región `sa-east-1`, PostgreSQL 17.11, estado `ACTIVE_HEALTHY`.
- **Netlify:** destino de alojamiento configurado en `netlify.toml`, pero no se ha verificado una URL de producción o preview conectada y funcionando.

## Migraciones y seguridad

La migración remota `20261013110404 fase1_restrict_available_slots_execute` restringe `public.get_available_slots(uuid, uuid, date)` a `service_role` y al propietario PostgreSQL. Tras aplicarla se verificó: `anon_can_execute=false`, `authenticated_can_execute=false` y `service_role_can_execute=true`.

El archivo que registra el cambio en el repositorio es `database__migrations__20261013110404_fase1_restrict_available_slots_execute.sql` (el repositorio codifica carpetas con `__` y `restaurar-estructura.mjs` las reconstruye).

**No ejecutes `database/setup.sql` en el proyecto Supabase existente.** Es un esquema inicial pensado para una base nueva y vacía, no una migración de actualización.

## Variables de entorno

Guarda los valores reales en el gestor de secretos del proveedor, nunca en el repositorio ni en el chat:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` — solo servidor; nunca `NEXT_PUBLIC_`.
- `INITIAL_ADMIN_EMAIL` — variable de servidor necesaria solo durante el bootstrap inicial del administrador.

Consulta `.env.example` (generado desde `punto-env.example`) para los placeholders; los valores del ejemplo no son credenciales válidas.

## Comprobaciones antes de producción

```bash
npm ci
npm run test:rules
npm run typecheck
npm run build
```

Estos comandos deben ejecutarse realmente con un lockfile comprobado y dependencias instaladas. Durante la revisión del 13 de octubre, la conexión al repositorio desde el contenedor falló por resolución DNS de GitHub, por lo que no se declara un typecheck ni un build aprobado en esta fase.

Completa `docs/acceptance-checklist.md` en una preview identificada antes de publicar. Verifica correo, autenticación, RLS por rol, concurrencia, cancelación, horarios reales, dispositivos móviles y restauración de backups. No habilites la publicación comercial hasta que el propietario confirme dirección, teléfono, moneda, servicios, precios, duración, horarios, políticas, biografías y fotografías autorizadas.
