# NiwaMirî — Changelog

## v1.6.0 — 2026-10-28

### Documentación

- F038: secuencia de modales documentada en M1 y backlog, implementada y en revisión. Regla de aprobación del texto de novedades antes de publicar incorporada a AGENTS y al procedimiento de versiones.
- F037: visibilidad de árboles fallecidos implementada y documentada en M2 y backlog, pendiente de validación del usuario.
- Regla explícita de reutilización y consistencia de componentes en AGENTS.md, con referencia en la guía de desarrollo.
- Ajustes de Cuidados registrados en B027–B029, M015 y F036; solución aprobada e incluida en esta versión; pendiente de validación del usuario.

### Cuidados — ajustes en revisión

- **B027:** cada paso masivo comienza arriba y conserva el borrador.
- **B028 / M015:** selectores visibles de unidades, dosis opcional y volumen adicional desplegable. Se puede guardar solo el producto por árbol. Detalles y Recordatorio comparten la tarjeta/título del recordatorio individual; ambos formularios reutilizan el mismo componente de seguimiento.
- **B029:** fecha de tamaño estable y «Quitar recordatorio» para limpiar fecha y descripción. Bloqueo de seguimientos incompletos y protección frente a respuestas tardías de IA.
- **F036:** sugerencia común editable para todos los árboles, mediante una sola consulta explícita. Mismo comportamiento en individual y masivo, con Gemini/OpenAI/Claude y traducciones es/en.

### Colección — F037 en revisión

- Fallecidos ocultos por defecto en grilla y lista. Check «Mostrar árboles fallecidos» en el panel de filtros, sincronizado con el estado Fallecido y combinado con los demás criterios.
- El botón de filtros siempre abre el panel, incluso con filtros activos; limpiar restablece la exclusión inicial. Se conserva la colección y los historiales, y el check reutiliza el mismo componente que la carga masiva.

### Bienvenida — F038 en revisión

- Modal de novedades por versión previo a la bienvenida habitual, con cuatro bullets en español proporcionados y aprobados por el usuario, y traducción al inglés. Estructura visual compartida, foco de teclado y desplazamiento en pantallas pequeñas.
- «Continuar» recuerda localmente la versión vista y abre la bienvenida; las novedades no se cierran automáticamente ni se repiten en esa versión. El temporizador de bienvenida comienza en su propio paso.
- Versión obtenida de `package.json` para bienvenida, novedades y Ajustes. El registro de lectura no modifica la colección ni los backups. Publicada con versión 1.6.0.

### Validación de código

- 130 tests pasan y build correcto. Lint queda en 13 errores y 6 advertencias previos; se retiran dos errores y una advertencia de la bienvenida al implementar la secuencia, sin problemas nuevos. Sin pruebas del agente usando la app ni proveedores reales; pendientes de confirmación del usuario.

## v1.5.0 — 2026-10-27

### Documentación

- Diseño aprobado de F033–F035 integrado en M4 de la especificación funcional; implementación y decisiones técnicas documentadas en SPEC.

- Guía compartida de desarrollo y mantenimiento, con reglas para agentes y entrada para Claude Code.
- README y especificaciones actualizados al versión 1.5.0, distinguiendo funciones disponibles y requisitos previstos.
- Verificaciones y publicación documentadas. Se conserva el seguimiento existente de bugs, sin cambios de estructura ni de estado.

### Cuidados

- **F033:** registro en varios árboles desde Colección, con estado y observaciones comunes o por árbol, revisión previa y guardado transaccional de cuidados/eventos. Ante errores se conserva el borrador y se revierte la carga completa.
- **F034:** filtros del historial por tipos, fechas locales y fotos vinculadas, combinados con búsqueda de producto y detalles; se conservan al editar y volver.
- **F035:** detalles opcionales para los 14 tipos, con productos usados anteriormente, dosis y unidades, varios calibres de alambre, resúmenes y edición. Se conserva la compatibilidad de registros y backups anteriores.
- Incluidas en v1.5.0; validadas por el usuario el 2026-10-28. Las comprobaciones del agente se limitan a código.

### Validación de código

- 84 tests unitarios y de integración pasan; incluye comprobaciones de fechas con cambio de horario. Build de producción correcto, con advertencias previas de bundle/imports/Browserslist.
- Lint conserva 15 errores y 7 advertencias preexistentes; sin problemas nuevos.
- Validación posterior (2026-10-28): el usuario confirmó B026 y F029–F035; los ocho ítems pasaron a `resuelto` en el backlog.

### Correcciones

- **B026 — Historial de cuidados:** «Ver todos» abre una pantalla con todos los cuidados, búsqueda, edición, eliminación con confirmación y alta desde el botón «+». El acceso también está disponible con cinco cuidados o menos.
- Editar conserva el ID del cuidado, sus fotos y notas vinculadas, y actualiza los eventos de calendario. Eliminar quita los eventos vinculados y conserva fotos y notas del árbol sin referencias huérfanas.
- Revisados los accesos a galería, notas de clase, ficha técnica y eventos del día: sus vistas completas muestran los elementos que no aparecen en el resumen.

---

## v1.4.0 — 2026-04-14

### Galería
- **Zoom con botones** en el lightbox: botones `+` y `−` flotantes sobre la imagen. Rango 1×–4× en pasos de 0.5×. Se resetea al cambiar de foto.
- **Paneo al hacer zoom**: con el dedo (o mouse) se puede arrastrar la imagen cuando está ampliada para ver cualquier detalle.
- **Botones siempre visibles** (fix B025): en fotos de relación de aspecto muy alta (retrato extremo), los botones "Portada" y "Eliminar" ahora están anclados al fondo de la pantalla y no quedan fuera del viewport.
- **Confirmación al eliminar**: tocar "Eliminar" muestra un paso de confirmación con "Cancelar" / "¿Eliminar?". Evita borrados accidentales.

### Inventario — Filtros
- **Nombre común en filtros rápidos** (F030): los chips de especie muestran el nombre común si está definido (ej. "Olmo chino" en lugar de "Ulmus parvifolia").
- **Panel de filtros avanzados** (F031): botón `⚙` a la derecha de la barra de búsqueda que abre un sheet con:
  - Estado (multi-selección)
  - Estilo (multi-selección)
  - Tamaño (multi-selección)
  - Edad del árbol — slider dual con rango dinámico de la colección
  - Antigüedad de adquisición — slider dual con rango dinámico de la colección
- Los filtros avanzados actúan primero; la búsqueda de texto y los filtros rápidos operan sobre el subconjunto resultante.
- El botón se convierte en `✕` con badge numérico cuando hay filtros activos. Un toque limpia todo.

---

## v1.3.0 — 2026-04-06

### Header global
- Emoji de estación del año (🌸/☀️/🍂/❄️) visible en todas las pantallas excepto Ajustes.
- Chip de pendientes en el header: 🚨 rojo pulsante si hay eventos vencidos, ⏰ naranja si hay eventos de hoy, 🗓️ gris si son todos futuros. Al tocarlo muestra un mini-sheet con la lista de eventos y permite navegar al Calendario.

### Pantalla de bienvenida (WelcomeScreen)
- Logo + saludo estacional como titular, tagline "Tu jardín pequeño te espera".
- Alerta de backup más clara: sin countdown cuando hay alerta; texto en negrita con `animate-pulse` si nunca se hizo backup.

### Inventario
- Filtros de etiquetas en segunda fila separada (solo si hay labels definidos).
- Sección "Acerca de" en Ajustes reorganizada.

### Fixes
- B024: inputs de cámara separados en flujos con `multiple` (Android Chrome).

---

## v1.2.0 — 2026-04-05

### Galería
- F019: hora EXIF visible en el lightbox.
- F020: markdown renderizado en el Asistente IA.
- F015: edición de fecha de foto directamente desde el lightbox.
- F016: navegación entre fotos con flechas y contador de posición.

### Fixes de fecha (timezone)
- B019: fechas corregidas globalmente para evitar desfase UTC vs UTC-3.
- B020: orden de fotos dentro de grupos mensuales estabilizado con desempate por `createdAt`.
- B021: backup en Android corregido (MIME `application/octet-stream`).
- B022/B023: contador y labels de notas de clase corregidos en vista de otro árbol.

---

## v1.1.0 — 2026-04-04

### Calendario
- Vista lista con sección "Vencidos" diferenciada (B011).
- Fix de eventos duplicados al editar cuidado con recordatorio (B012).
- Fecha por defecto en nuevo recordatorio toma el día seleccionado (B013/B014).
- Eventos followup-reminder editables (B015).
- Sheet de nuevo evento corregido (no quedaba detrás del BottomNav) (B018).

### Galería
- Subida de múltiples fotos simultáneas (F013).
- Lectura de fecha EXIF al subir (F014).
- Descripción editable por foto (F007).

### UI global
- Fix Dynamic Island en iPhone 15 Pro (B007).
- Fix zoom en inputs en iOS Safari (B009).
- Fix inputs de fecha más anchos en iOS (B008).

---

## v1.0.0 — 2026-03-26

Versión inicial con todos los módulos M1–M14 completos:
inventario, detalle, registro de cuidados, galería, notas de clase, ficha de especie, asistente IA por árbol, asistente IA general, calendario, identificar con IA, bitácora, backup y ajustes.
