# Lista de aceptación preproducción — Royalty Barber Studio

Marcar cada elemento solo después de probarlo en el entorno desplegado que corresponda. “Código escrito” no equivale a “prueba aprobada”.

## Infraestructura y publicación

- [ ] Repositorio de GitHub de la barbería creado y bajo propiedad del negocio.
- [ ] Sitio Netlify enlazado al repositorio correcto; Deploy Preview y URL de producción identificadas.
- [ ] Proyecto Supabase nuevo, región aprobada, backups y acceso administrativo revisados.
- [ ] Variables de entorno de los tres entornos configuradas sin exponer claves privadas.
- [ ] `npm install`, lockfile committed, `npm run typecheck`, `npm run build` y pruebas completadas sin errores.
- [ ] URLs permitidas de Auth y callback ajustadas para la web real.
- [ ] SMTP transaccional propio y entrega de verificación/recuperación comprobadas.
- [ ] SSL, dominio, redirects, logs, backups y procedimiento de rollback verificados.

## Datos del negocio

- [ ] Nombre comercial y logotipo aprobados.
- [ ] Dirección y teléfono comprobados por el propietario.
- [ ] Instagram oficial confirmado.
- [ ] Horario por día y días feriados/pausas confirmados.
- [ ] Cada servicio tiene nombre, descripción, duración, precio y moneda aprobados.
- [ ] Cada servicio está asignado al barbero correcto y solo los perfiles reales están activos.
- [ ] Biografías, fotos y galería tienen autorización de publicación.
- [ ] Política de confirmación de citas aprobada.
- [ ] Política de cancelación/reprogramación y antelación aprobada.
- [ ] Forma de cobro definida; si no hay pasarela, el texto público aclara que el pago no se procesa online.

## Pruebas de cliente

- [ ] Registrar una cuenta, confirmar el email, iniciar sesión y cerrar sesión.
- [ ] Solicitar recuperación de contraseña, usar el enlace y crear una contraseña nueva.
- [ ] Probar un servicio publicado y uno que no esté publicado; los borradores no deben ser visibles.
- [ ] Consultar disponibilidad en fecha futura, fecha cerrada, bloqueo y excepción de horario.
- [ ] Intentar reservar un hueco que ya no está libre; no debe crearse una cita duplicada.
- [ ] Probar dos solicitudes simultáneas para el mismo barbero/hueco: como máximo una se guarda.
- [ ] Comprobar código público, importe y duración guardados como instantánea.
- [ ] Verificar que una cita queda SOLICITADA y no se presenta como confirmada sin aprobación.
- [ ] Verificar que un cliente solo vea sus propias citas y no pueda editar el precio, barbero ni hora por petición manipulada.
- [ ] Probar cancelación en el plazo permitido y fuera de él.
- [ ] Probar en móvil, escritorio, teclado y `prefers-reduced-motion`.

## Pruebas de administración y seguridad

- [ ] Una cuenta CLIENT no puede abrir rutas ni APIs de ADMIN.
- [ ] Solo el correo inicial verificado puede obtener el primer ADMIN; el bootstrap no vuelve a promover otros usuarios.
- [ ] ADMIN puede crear/editar/desactivar servicios y barberos, y gestionar relaciones servicio-barbero.
- [ ] ADMIN puede cambiar horarios, excepciones y bloqueos; la disponibilidad cambia de inmediato.
- [ ] ADMIN puede confirmar/cancelar/avanzar citas respetando las transiciones operativas.
- [ ] Registro de pagos no realiza cobros ni marca pagos automáticamente.
- [ ] Imágenes privadas no son accesibles de forma permanente sin autorización; las URLs firmadas expiran.
- [ ] RLS está activado en todas las tablas expuestas y se han probado las políticas con anon, CLIENT, BARBER y ADMIN.
- [ ] No existe clave service_role en bundle cliente, HTML, repositorio, source map ni logs públicos.
- [ ] Datos personales de un cliente no aparecen en rutas o respuestas públicas.
- [ ] Backups y restauración se han probado; logs de auditoría para cambios sensibles están presentes.

## Resultado

- Fecha de la prueba:
- URL de preview/producción probada:
- Persona que prueba:
- Incidencias abiertas:
- Decisión explícita de publicar:
