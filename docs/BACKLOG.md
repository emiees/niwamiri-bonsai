# NiwaMirî — Backlog de Bugs y Funcionalidades

Registro de seguimiento para bugs reportados, mejoras y nuevas funcionalidades.
Cada ítem incluye fecha de apertura, estado, prioridad y fecha de resolución.

---

## Leyenda

| Estado | Significado |
|---|---|
| `abierto` | Identificado, pendiente de trabajo |
| `en progreso` | En desarrollo activo |
| `en revisión` | Implementado por Claude, pendiente de prueba y confirmación del usuario |
| `resuelto` | Confirmado como resuelto por el usuario |
| `descartado` | No se implementará (con motivo) |

| Prioridad | Significado |
|---|---|
| `P1` | Crítico — rompe funcionalidad core |
| `P2` | Alto — afecta UX significativamente |
| `P3` | Medio — mejora notable |
| `P4` | Bajo — cosmético o nice-to-have |

---

## Bugs

| # | Título | Módulo | Prioridad | Estado | Abierto | Resuelto | Notas |
|---|---|---|---|---|---|---|---|
| B001 | Botón "Agregar árbol" queda oculto detrás del BottomNav | M2 Inventario | P1 | `resuelto` | 2026-03-25 | 2026-03-25 | BottomNav tiene z-50; sheet también tenía z-50 y al renderizarse antes en el DOM, el nav quedaba encima. Solución: overlay z-[55], sheet z-[60]. |
| B002 | PWA manifest start_url y scope incorrectos para subdirectorio de GitHub Pages | PWA | P2 | `resuelto` | — | 2026-03-24 | Fix en commit 03d3c44 |
| B003 | Identificar devuelve error de API Key — modelos Gemini 1.5 deprecados | M10 Identificar | P1 | `resuelto` | 2026-03-25 | 2026-03-25 | El modelo default `gemini-1.5-flash` y todo el listado 1.5/2.0 están deprecados. Se actualizó default a `gemini-2.5-flash` y opciones a 2.5 Flash, 2.5 Pro y 3 Flash Preview. Además se expone el error real de la API en la UI para futuros debug. |
| B004 | Identificar responde en inglés sin respetar el idioma configurado en la app | M10 Identificar | P1 | `resuelto` | 2026-03-25 | 2026-03-25 | Se agregó parámetro `lang` a `identifySpecies` en la interfaz y los 3 providers. El nombre científico permanece en latín. |
| B005 | Foto de portada del árbol no se renderiza en el inventario (se ve ícono ?) | M2 Inventario | P1 | `resuelto` | 2026-03-25 | 2026-03-26 | `BonsaiCard` usaba `main.imageData` (base64 crudo) directamente como `src` del `<img>`. Fix: usar `base64ToDataUrl(main.imageData)` igual que en Gallery, CareForm y el resto de la app. |
| B006 | Token CSS `--green1` no definido — selección invisible en tarjetas de proveedor y otros chips | M1 Onboarding / UI global | P2 | `en revisión` | 2026-03-25 | — | `var(--green1)` se usaba en toda la app como color de texto sobre fondo accent, pero nunca fue definido en globals.css (el token correcto es `--color-green1`). El radio button de la tarjeta seleccionada en el onboarding quedaba invisible. Fix: alias `--green1: var(--color-green1)` agregado en `:root`. |

---

## Funcionalidades nuevas

| # | Título | Módulo | Prioridad | Estado | Abierto | Resuelto | Descripción |
|---|---|---|---|---|---|---|---|
| F001 | Nombre común junto al nombre científico en resultado de Identificar | M10 Identificar | P2 | `resuelto` | 2026-03-25 | 2026-03-25 | Se agrega campo `commonName` al prompt y al tipo `Result`. Se muestra debajo del nombre científico en el idioma configurado. |
| F002 | Pantalla de bienvenida al abrir la app | UI global | P3 | `resuelto` | 2026-03-25 | 2026-03-26 | Overlay modal (una vez por sesión). Saludo estacional, cuidados vencidos, recordatorio backup. Auto-cierre 10 s. |
| F004 | Etiquetas personalizadas en árboles y filtro por etiqueta en Inventario | M2 Inventario / M3 Detalle | P3 | `resuelto` | 2026-03-25 | 2026-03-26 | Campo `tags?: string[]` en `Bonsai`. Input con chips en AddBonsaiSheet y EditSheet. Filtro `# tag` en Inventario. |
| F003 | Recordatorio de backup al abrir la app | M11 Backup | P2 | `resuelto` | 2026-03-25 | 2026-03-26 | `lastBackupAt` en `AppConfig`. Card en WelcomeScreen si >7 días sin exportar. |

---

## Mejoras / Refactors

| # | Título | Módulo | Prioridad | Estado | Abierto | Resuelto | Descripción |
|---|---|---|---|---|---|---|---|
| M005 | Nombre común como texto principal de especie en toda la UI | M2, M3, M10 | P3 | `resuelto` | 2026-03-25 | 2026-03-25 | Se agrega `commonName?` a la interfaz `Bonsai` (sin migración de Dexie). En el formulario de nuevo árbol se expone el campo opcional. En cards del inventario, detalle del árbol e Identificar, el nombre común toma precedencia visual sobre el científico (que pasa a ser secundario/italic). Los árboles existentes sin `commonName` no se ven afectados. |
| M008 | Onboarding paso 1: agregar saludo "¡Bienvenido!" | M1 Onboarding | P4 | `en revisión` | 2026-03-25 | — | Se agrega "¡Bienvenido!" / "Welcome!" como línea destacada antes del párrafo descriptivo del paso 1. |
| M009 | Onboarding paso 3: explicación coloquial de qué es una API Key | M1 Onboarding | P3 | `en revisión` | 2026-03-25 | — | Card informativa con título "¿Qué es una API Key?" y texto simple: contraseña personal → se guarda cifrada en el dispositivo → nunca sale de él. Ayuda a usuarios no técnicos a entender para qué sirve. |
| M010 | Onboarding: botón "Omitir" en pasos 2 y 3 sale del wizard en lugar de avanzar | M1 Onboarding | P3 | `en revisión` | 2026-03-25 | — | El comportamiento previo de "Omitir" en pasos 2 y 3 avanzaba al siguiente paso, lo cual era confuso. Ahora llama a `finish(false)` directamente, cerrando el wizard y entrando a la app sin API key. |
| M004 | Link a página de API Keys del provider en Settings | M12 Configuración | P4 | `resuelto` | 2026-03-25 | 2026-03-26 | Link "Obtener key" con ícono externo junto al campo API Key, apunta a la consola del provider seleccionado. |
| M006 | Sección "Acerca de" con datos del autor en Ajustes | M12 Configuración | P4 | `resuelto` | 2026-03-25 | 2026-03-26 | Sección al final de Settings con NiwaMirî v1.0, Emi Salazar y email mailto. |
| M007 | Mover chip de estación del año por encima del buscador en Inventario | M2 Inventario | P3 | `resuelto` | 2026-03-25 | 2026-03-26 | Chip de estación movido sobre el buscador, alineado a la derecha. |
| M001 | Estilos con español e indicador de estado API en Identificar | M10 Identificar | P3 | `resuelto` | — | 2026-03-24 | Fix en commit a28e344 |
| M002 | Logo squircle | UI global | P4 | `resuelto` | — | 2026-03-24 | Fix en commit a28e344 |
| M003 | Separación visual entre barra de búsqueda y filtros de especie en Inventario | M2 Inventario | P4 | `resuelto` | 2026-03-25 | 2026-03-25 | `py-2` → `pt-3 pb-2` en el wrapper de chips para agregar espacio respecto al input. |

---

## Módulos nuevos

| # | Título | Módulo | Prioridad | Estado | Abierto | Resuelto | Descripción |
|---|---|---|---|---|---|---|---|
| N001 | M13 — Bitácora de Conocimiento | M13 (nuevo) | P2 | `resuelto` | 2026-03-25 | 2026-03-26 | CRUD de notas con búsqueda, filtro por tags, fotos múltiples, FAB. Tabla `journalNotes` en Dexie v2. |
| N002 | M14 — Asistente IA General | M14 (nuevo) | P2 | `resuelto` | 2026-03-25 | 2026-03-26 | Chat con contexto de colección completa. Ruta `/assistant`. Conversación persistida (`bonsaiId = 'general'`). Fix galería + placeholder aplicados en el mismo commit. |
| N003 | Reorganización BottomNav — 4 tabs + ⚙️ en header | UI global | P2 | `resuelto` | 2026-03-25 | 2026-03-26 | BottomNav: Colección · Bitácora · Asistente · Calendario. Ajustes en ⚙️ en header de Inventario. |

---

## Ideas / Propuestas (sin comprometer)

| # | Título | Descripción | Origen |
|---|---|---|---|
