# Estado verificable de Royalty Barber Studio

**Corte:** 10 de octubre de 2026. **Estado:** fase de base técnica; todavía no es un sitio de producción. Se eligió Netlify como alojamiento previsto, Supabase para datos/autenticación/almacenamiento y GitHub para el código; Cloudflare queda opcional para DNS/protección cuando haya dominio.

## Qué está escrito en el código

- Web pública responsive con identidad negra, roja y dorada, tipografía condensada, estética streetwear/Y2K y navegación por páginas.
- Catálogo, equipo y galería conectados a consultas de datos reales; no se siembran tarifas de ejemplo ni fotos falsas.
- Registro, inicio/cierre de sesión y recuperación de contraseña con Supabase Auth.
- Flujo de reservas que exige cuenta, consulta disponibilidad en PostgreSQL, registra solicitudes `SOLICITADA` y muestra el código de seguimiento.
- Validación de horarios y antelación en servidor, restricción de base de datos contra dos citas simultáneas para el mismo barbero y bloqueo de pausas que colisionen con citas activas.
- Panel ADMIN para servicios, perfiles, asignaciones, horarios, excepciones, bloqueos, solicitudes, anotaciones manuales de pagos externos, datos del negocio y galería privada.
- RLS, funciones con permisos restringidos y un flujo de alta inicial de ADMIN limitado a un correo verificado configurado en el servidor.

## Comprobaciones ejecutadas en este entorno

- `node --test tests/*.test.mjs`: **3/3 pruebas unitarias puras aprobadas** (parseo de horas, solapamiento de intervalos y límites de horario).
- Análisis sintáctico TypeScript/TSX/MTS: **42 archivos analizados, 0 errores de sintaxis**.
- Revisión de imports locales: **0 rutas de import local sin resolver**.
- No hay un archivo `.env` con credenciales en este paquete; `.env.example` contiene solo valores de ejemplo.

## Comprobaciones que todavía NO se han podido ejecutar

- `npm install`, creación de `package-lock.json`, `npm run typecheck` con las dependencias reales y `npm run build`.
- Ejecución de `database/setup.sql` contra un proyecto Supabase nuevo, vacío y aislado.
- Pruebas end-to-end en una URL real, pruebas de entrega de correo, concurrencia de reservas, RLS como cada rol, restauración de backups y revisión final de seguridad.
- `npm run build` y despliegue a Netlify. La cuenta tiene dos sitios de nombre aleatorio, ambos con acceso SSO de equipo, que no se reutilizarán; aún no existe un sitio de Royalty conectado a este código.

El registro de paquetes no respondió desde el entorno de preparación; por eso no es honesto presentar la revisión sintáctica como si fuera una compilación de producción. No existe un `package-lock.json` inventado.

## Bloqueadores antes de producción

1. Crear y autorizar un proyecto **nuevo** de Supabase. La organización disponible se identifica como `unelmlk-portal`; hay dos proyectos inactivos que no deben reutilizarse ni modificarse sin autorización explícita. El alta nueva puede generar costes y exige confirmación informada.
2. Crear un repositorio privado propio en GitHub y conectarlo a Netlify. La conexión de GitHub no muestra repositorios accesibles y las herramientas conectadas no ofrecen crear un repositorio vacío.
3. Confirmar con el propietario los datos comerciales: teléfono, dirección exacta, horarios, servicios, duración, precio, moneda, reglas de cancelación y confirmación.
4. Recibir una biografía real y fotos con autorización de publicación.
5. Configurar correo de autenticación y decidir el proveedor de notificaciones operativas. No se anuncian emails de citas que todavía no están implementados.
6. Decidir pasarela de pago si se requieren cobros online. El módulo actual solo documenta movimientos realizados fuera de la web.
7. Completar o aprobar expresamente dejar fuera del primer MVP un panel y acceso individual para cada barbero.
8. Volver a comprobar las versiones y avisos de seguridad del framework y sus dependencias antes del despliegue; no publicar esta versión sin actualización y build verificada.
9. Cloudflare está conectado, pero actualmente la cuenta no tiene zonas DNS ni proyectos de Pages, Workers o D1; R2 todavía no está habilitado. No crear recursos de Cloudflare sin un dominio/caso de uso definido.
10. Completar `docs/acceptance-checklist.md` en una Deploy Preview y aprobar expresamente la puesta en producción.

**Ninguna cuenta real, cita real, correo, cobro ni despliegue de producción ha sido creado por este paquete.**
