# Lista de aceptación preproducción — Royalty Barber Studio

Marcar cada elemento solo después de probarlo en el entorno identificado. Código escrito no equivale a prueba aprobada.

## Infraestructura y publicación

- [ ] Revisar que el repositorio `alirio404/royalty-barber-studio` tenga la privacidad y propiedad que desea el negocio.
- [ ] Incorporar y revisar `database__migrations__20261013110404_fase1_restrict_available_slots_execute.sql`; confirmar que coincide con la migración ya aplicada en Supabase.
- [ ] Identificar un sitio Netlify de Royalty conectado al repositorio correcto y registrar la URL de Deploy Preview.
- [ ] Revisar backups, permisos administrativos y las migraciones del proyecto Supabase activo `kyhuihtuihwpkftfbxvo`.
- [ ] No ejecutar `database/setup.sql` en la base existente; usar migraciones incrementales revisadas.
- [ ] Configurar las variables de entorno sin exponer claves privadas.
- [ ] Ejecutar instalación reproducible (`npm ci` con lockfile revisado), `npm run typecheck`, `npm run test:rules` y `npm run build`; guardar resultados reales.
- [ ] Ajustar URL del sitio y callback permitido de Supabase Auth para cada entorno.
- [ ] Configurar SMTP transaccional y probar verificación/recuperación de email.
- [ ] Verificar SSL, dominio, redirects, logs, backups y procedimiento de rollback.

## Datos del negocio

- [ ] Nombre comercial y logotipo aprobados.
- [ ] Dirección, teléfono e Instagram confirmados por el propietario.
- [ ] Horario semanal y excepciones confirmados.
- [ ] Cada servicio tiene nombre, descripción, duración, precio y moneda aprobados.
- [ ] Servicios asignados a los barberos correctos; perfiles reales revisados.
- [ ] Biografías, fotografías y galería autorizadas para publicación.
- [ ] Políticas de confirmación, cancelación y reprogramación aprobadas.
- [ ] El método de pago está definido y la web deja claro si no procesa pagos online.

## Pruebas de cliente

- [ ] Registrar una cuenta, verificar el email, iniciar sesión y cerrar sesión.
- [ ] Recuperar contraseña mediante un email real de prueba y crear una nueva contraseña.
- [ ] Confirmar que servicios/perfiles en borrador no son visibles al público.
- [ ] Consultar disponibilidad en fechas futuras, días cerrados, excepciones y bloqueos.
- [ ] Intentar reservar un hueco ocupado y confirmar que no se crea una cita duplicada.
- [ ] Enviar dos solicitudes concurrentes para el mismo barbero y horario; como máximo una debe guardarse.
- [ ] Verificar código de cita, duración e importe como instantáneas de la solicitud.
- [ ] Comprobar que la solicitud permanece `SOLICITADA` hasta que el negocio la apruebe.
- [ ] Confirmar que un cliente solo ve sus propias citas y no puede alterar precios, barbero ni hora manipulando la petición.
- [ ] Probar cancelación dentro y fuera del plazo permitido.
- [ ] Probar en móvil/escritorio, solo teclado y `prefers-reduced-motion`.

## Pruebas de administración y seguridad

- [ ] Un usuario CLIENT no puede abrir páginas ni APIs de ADMIN.
- [ ] Solo la cuenta con correo inicial verificado puede convertirse en el primer ADMIN; repetir bootstrap no eleva a otros usuarios.
- [ ] ADMIN puede crear/editar/desactivar servicios y perfiles y gestionar sus asignaciones.
- [ ] Cambiar horarios, excepciones y bloqueos actualiza la disponibilidad.
- [ ] Cambiar estados de cita respeta las transiciones operativas.
- [ ] Registrar un movimiento externo de pago no realiza un cobro ni marca un pago automáticamente.
- [ ] Imágenes privadas requieren autorización; las URL firmadas expiran.
- [ ] RLS y políticas probadas como anon, CLIENT, BARBER y ADMIN.
- [ ] Verificación de `get_available_slots`: `anon` y `authenticated` no tienen EXECUTE; `service_role` sí.
- [ ] No hay `service_role` en bundles cliente, HTML, repositorio ni logs públicos.
- [ ] Datos personales no aparecen en respuestas públicas.
- [ ] Backups/restauración probados y cambios sensibles presentes en auditoría.

## Resultado

- Fecha de prueba:
- Entorno / URL comprobado:
- Persona responsable:
- Incidencias abiertas:
- Decisión explícita de publicación:
