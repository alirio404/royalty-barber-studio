# Royalty Barber Studio — plataforma web

**Estado: base técnica en construcción; NO desplegada y NO lista para atender clientes.** Este repositorio no debe presentarse como una web de producción. La integración real depende de un proyecto nuevo de Supabase, sus credenciales, la configuración de correo y la publicación de información verificada. Las rutas sin backend no generan cuentas, citas, horas disponibles ni pagos ficticios.

## Qué incluye esta base

- Web pública responsive con la identidad Royalty: negro/rojo, oro, tipografía condensada, estética streetwear/Y2K y detalles animados.
- Catálogo y perfiles obtenidos de PostgreSQL; los borradores no se muestran como datos oficiales.
- Registro e inicio de sesión con Supabase Auth, confirmación por correo y flujo de recuperación de contraseña (requiere correo SMTP y URL de redirección configurados).
- Flujo de reservas para clientes con cuenta: consulta de huecos en PostgreSQL, solicitud con código de seguimiento, estado pendiente, historial y cancelación sujeta a reglas del negocio.
- Panel de administración con catálogo, perfiles, horarios, excepciones, bloqueos, solicitudes, registro manual de cobros/reembolsos externos, ajustes del negocio y galería privada.
- Esquema inicial PostgreSQL, roles, políticas RLS, restricciones anti-solapamiento, registro de auditoría y almacenamiento privado para fotografías.
- Valores provisionales no sembrados como precios reales. Emmanuel Rose aparece como borrador sin biografía inventada ni fotografía falsa. Luis Vazques no se incluye como integrante del equipo.

## Funciones deliberadamente no activadas

- No hay pasarela de pago ni cobro online. El panel de caja únicamente documenta movimientos que el negocio ya procesó fuera de la web.
- No hay envíos de newsletters ni campañas. No se ha configurado proveedor de correo de producción ni sistema de consentimiento comercial.
- OpenAI Platform no se integra en el MVP: no hace falta para los requisitos básicos de catálogo, autenticación y citas. Añadir IA sin un caso de uso definido añade coste y riesgos sin resolver una necesidad del negocio.
- No hay imágenes de muestra publicadas. Se necesitan fotos reales y autorización para utilizarlas.
- No hay cuentas de barbero/panel de barbero en esta primera entrega; la gestión de agenda queda en el panel ADMIN. Esto debe terminarse o aceptarse como alcance del MVP antes del lanzamiento si varios barberos necesitarán acceso individual.

## Stack

- Next.js App Router + React + TypeScript.
- Supabase Auth, PostgreSQL, RLS y Storage privado.
- Netlify como alojamiento principal, con previews y despliegue automático cuando se conecte el repositorio de GitHub. La configuración inicial está en `netlify.toml`.
- GitHub para historial de código y revisión de cambios.
- Cloudflare queda opcional para DNS/protección cuando el dominio del negocio esté definido y añadido a esa cuenta; no es necesario duplicar almacenamiento si Supabase Storage cubre las fotos.

Dependencias principales fijadas en `package.json`; no se ha generado un lockfile porque el registro de npm no respondió desde el entorno de preparación. Debe generarse y revisarse con `npm install` antes de producción. El análisis sintáctico local de TypeScript/TSX pasó, y las pruebas puras de reglas de horario pasaron; no se pudo ejecutar `next build`, pruebas de integración ni pruebas con base real porque aún no existe una conexión a un proyecto Supabase nuevo.

## Puesta en marcha segura

1. **Crear un proyecto Supabase nuevo.** No reutilizar los proyectos inactivos existentes. Elegir la región según latencia, residencia de datos y condiciones de la cuenta.
2. **Aplicar `database/setup.sql` una sola vez en el SQL Editor de la base nueva y vacía.** Este archivo crea el esquema inicial, políticas, triggers, restricciones y el bucket privado. No ejecutarlo sobre otro proyecto ni volver a ejecutarlo después de que se haya aplicado.
3. **Configurar Supabase Auth.** Habilitar verificación por email, configurar SMTP propio, URL del sitio y URL permitida de callback (`/auth/callback`). Definir las URLs reales de producción y preview, no dejar placeholders.
4. **Preparar el usuario administrador.** Guardar `INITIAL_ADMIN_EMAIL` como variable de entorno privada en Netlify. El propietario crea la cuenta con ese correo, verifica el correo e inicia sesión. El servidor solo promueve ese correo verificado si todavía no existe un administrador. No asignar el rol desde el navegador.
5. **Crear/usar el repositorio de GitHub** y conectar ese repositorio a un sitio Netlify de tipo Next.js. Configurar las siguientes variables en los entornos de desarrollo, previews y producción donde corresponda:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (**solo servidor, nunca `NEXT_PUBLIC_`**)
   - `INITIAL_ADMIN_EMAIL` (servidor, durante el bootstrap inicial)
6. **Crear una Deploy Preview de Netlify y ejecutar pruebas** antes de cualquier promoción a producción. No habilitar indexación hasta completar la lista de aceptación.
7. Entrar como ADMIN y cargar manualmente: teléfono, servicios, precio y moneda, duración, perfiles y asignación de servicios, horario semanal, restricciones, fotos reales autorizadas. Publicar la configuración del negocio solo después de verificarlo todo.
8. Probar autenticación, recuperación por email, reserva, dos solicitudes simultáneas para el mismo hueco, excepciones/bloqueos, cancelación dentro y fuera del margen, gestión de estados, privilegios y galería en móvil/escritorio.
9. Retirar `INITIAL_ADMIN_EMAIL` de los entornos tras completar el alta inicial, si el flujo de bootstrap ya no se necesita. Mantener `SUPABASE_SERVICE_ROLE_KEY` únicamente como variable privada del servidor.

## Variables de entorno

Copia los nombres de `.env.example` en la configuración de variables de entorno del sitio Netlify. No compartas credenciales, tokens, la clave `service_role` ni archivos `.env` por chat, correo o repositorios. Los valores de ejemplo son placeholders, no credenciales válidas.

## Pruebas disponibles

```bash
npm install
npm run test:rules
npm run typecheck
npm run build
```

`npm run test:rules` cubre el parser de horas, límites de intervalos y cierre de horario. No sustituye pruebas end-to-end ni comprobaciones de RLS en Supabase. Antes de producir se necesitan pruebas de integración y revisión de seguridad usando una instancia de desarrollo separada.

## Antes de llamarla “lista”

Completar `docs/acceptance-checklist.md` y verificar cada caso en una preview real. Hasta entonces, no habilitar indexación, no imprimir el sitio como un resultado final de producción y no aceptar clientes reales en ella.
