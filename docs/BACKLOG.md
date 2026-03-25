# NiwaMirî — Backlog de Bugs y Funcionalidades

Registro de seguimiento para bugs reportados, mejoras y nuevas funcionalidades.
Cada ítem incluye fecha de apertura, estado, prioridad y fecha de resolución.

---

## Leyenda

| Estado | Significado |
|---|---|
| `abierto` | Identificado, pendiente de trabajo |
| `en progreso` | En desarrollo activo |
| `resuelto` | Implementado y verificado |
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
| B001 | Botón "Agregar árbol" queda fuera de pantalla en sheet nuevo bonsai | M2 Inventario | P1 | `resuelto` | 2026-03-25 | 2026-03-25 | Fix anterior (a28e344) no resolvió. Solución: botón movido fuera del área scrollable a un footer fijo con `shrink-0` y `padding-bottom: max(1.5rem, safe-area-inset-bottom)`. |
| B002 | PWA manifest start_url y scope incorrectos para subdirectorio de GitHub Pages | PWA | P2 | `resuelto` | — | 2026-03-24 | Fix en commit 03d3c44 |
| B003 | Identificar devuelve error de API Key — modelos Gemini 1.5 deprecados | M10 Identificar | P1 | `resuelto` | 2026-03-25 | 2026-03-25 | El modelo default `gemini-1.5-flash` y todo el listado 1.5/2.0 están deprecados. Se actualizó default a `gemini-2.5-flash` y opciones a 2.5 Flash, 2.5 Pro y 3 Flash Preview. Además se expone el error real de la API en la UI para futuros debug. |
| B004 | Identificar responde en inglés sin respetar el idioma configurado en la app | M10 Identificar | P1 | `resuelto` | 2026-03-25 | 2026-03-25 | Se agregó parámetro `lang` a `identifySpecies` en la interfaz y los 3 providers. El nombre científico permanece en latín. |

---

## Funcionalidades nuevas

| # | Título | Módulo | Prioridad | Estado | Abierto | Resuelto | Descripción |
|---|---|---|---|---|---|---|---|

---

## Mejoras / Refactors

| # | Título | Módulo | Prioridad | Estado | Abierto | Resuelto | Descripción |
|---|---|---|---|---|---|---|---|
| M004 | Link a página de API Keys del provider en Settings | M12 Configuración | P4 | `abierto` | 2026-03-25 | — | En la sección de configuración del provider de IA, agregar un link externo a la página de administración de API Keys del provider seleccionado (igual que en el onboarding). Facilita reconfigurar la key sin tener que recordar o buscar la URL. |
| M001 | Estilos con español e indicador de estado API en Identificar | M10 Identificar | P3 | `resuelto` | — | 2026-03-24 | Fix en commit a28e344 |
| M002 | Logo squircle | UI global | P4 | `resuelto` | — | 2026-03-24 | Fix en commit a28e344 |
| M003 | Separación visual entre barra de búsqueda y filtros de especie en Inventario | M2 Inventario | P4 | `resuelto` | 2026-03-25 | 2026-03-25 | `py-2` → `pt-3 pb-2` en el wrapper de chips para agregar espacio respecto al input. |

---

## Ideas / Propuestas (sin comprometer)

| # | Título | Descripción | Origen |
|---|---|---|---|
