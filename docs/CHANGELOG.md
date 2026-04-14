# NiwaMirî — Changelog

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
