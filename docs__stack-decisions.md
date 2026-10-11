# Decisiones de infraestructura — Royalty Barber Studio

Corte: 10 de octubre de 2026. Son decisiones iniciales de despliegue sujetas a verificación durante la puesta en marcha.

## Stack previsto

- **GitHub:** repositorio privado y revisión del código. La conexión actual no muestra repositorios accesibles, así que el repositorio del negocio aún debe crearse.
- **Netlify:** alojamiento de la app Next.js, funciones de servidor, previews y despliegue automático desde el repositorio. `netlify.toml` fija el comando de build; se deja el adaptador moderno de Next.js administrado por Netlify sin fijar una versión. Netlify documenta compatibilidad con App Router, Server Actions y Route Handlers.
- **Supabase:** PostgreSQL, autenticación, políticas RLS y almacenamiento privado para imágenes. Se debe crear un proyecto nuevo, aislado y con el coste confirmado; no reutilizar los dos proyectos inactivos existentes.
- **Cloudflare:** opcional para DNS y protección cuando el propietario identifique el dominio que se usará. La cuenta conectada no tiene zonas DNS configuradas; no hay proyectos Pages/Workers/D1, y R2 requiere habilitación. No es necesario duplicar hoy funciones que Netlify y Supabase ya cubren.
- **OpenAI Platform:** excluido del MVP hasta que se defina un uso real que aporte valor; no se necesita para catálogo y reservas básicas.
- **Vercel:** no se usará en paralelo con Netlify para este MVP; ambos serían una capa de alojamiento redundante.

## Recursos existentes revisados sin modificarlos

- GitHub: usuario conectado `alirio404`; la enumeración de repositorios accesibles devolvió una lista vacía.
- Netlify: cuenta de equipo `royalty barber`; hay dos sitios con nombres generados al azar y acceso por SSO de equipo. No hay evidencia de que alguno sea el sitio de Royalty, así que no se editaron.
- Cloudflare: cuenta conectada; listado consultado sin zonas ni proyectos Pages, Workers o D1; la API indicó que R2 primero debe habilitarse desde el panel.
- Supabase: la organización disponible se identifica como `unelmlk-portal`; los dos proyectos visibles están inactivos y no se modificarán.

## Requisito antes de publicar

El acceso a una cuenta de proveedor no equivale a una aplicación desplegada. Antes de publicar: crear el repositorio, crear un proyecto Supabase nuevo después de revisar y confirmar el coste, configurar variables privadas, aplicar el esquema en el proyecto vacío, generar lockfile, compilar y pasar pruebas, conectar Netlify al repositorio, probar una preview y completar la lista de aceptación. La web seguirá fuera de producción hasta finalizar esas comprobaciones.
