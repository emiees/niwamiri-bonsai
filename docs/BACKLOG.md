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
| B006 | Token CSS `--green1` no definido — selección invisible en tarjetas de proveedor y otros chips | M1 Onboarding / UI global | P2 | `resuelto` | 2026-03-25 | 2026-04-04 | `var(--green1)` se usaba en toda la app como color de texto sobre fondo accent, pero nunca fue definido en globals.css (el token correcto es `--color-green1`). El radio button de la tarjeta seleccionada en el onboarding quedaba invisible. Fix: alias `--green1: var(--color-green1)` agregado en `:root`. |
| B007 | Header se superpone con Dynamic Island en iPhone 15 Pro | UI global / Header | P1 | `resuelto` | 2026-03-28 | 2026-04-04 | El `Header` usaba `h-14` fijo + `paddingTop: env(safe-area-inset-top)`, lo que comprimía el contenido cuando el safe area (≈59px en iPhone 15 Pro) superaba la altura total de 56px. Fix: se eliminó `h-14` del elemento `<header>` y se anidó un `<div class="h-14">` para el contenido de navegación. El `<main>` en AppShell usa ahora `paddingTop: calc(3.5rem + env(safe-area-inset-top))` en lugar de la clase fija `pt-14`. |
| B008 | Inputs de fecha más anchos que los de texto en iOS | UI global | P2 | `resuelto` | 2026-03-28 | 2026-04-04 | `input[type="date"]` en iOS Safari ignoraba el ancho del contenedor por su apariencia nativa. Fix en globals.css: `-webkit-appearance: none; appearance: none; min-width: 0; max-width: 100%`. |
| B009 | iOS Safari hace zoom al enfocar campos de texto | UI global | P2 | `resuelto` | 2026-03-28 | 2026-04-04 | iOS Safari hace zoom automático en inputs con `font-size < 16px` (la app usa `text-sm` = 14px). Fix en globals.css: `font-size: max(16px, 1em) !important` para `input, textarea, select`. El `!important` es necesario porque el selector de elemento (especificidad 0,0,1) perdía contra las clases Tailwind `text-sm`/`text-xs` (0,1,0). |
| B010 | Mensajes de error desbordan su contenedor con texto largo | M8 AI / M7 Ficha / M14 AI General | P2 | `resuelto` | 2026-03-28 | 2026-04-04 | Strings de error largos (URLs, códigos JSON de la API) desbordaban el `<p>` al no tener `overflow-wrap`. Fix: clase utilitaria `.error-text { overflow-wrap: break-word; word-break: break-word }` en globals.css aplicada en AIAssistant, GeneralAssistant y SpeciesSheet. |
| B011 | Recordatorios de IA no aparecen en el Calendario (vista lista) | M9 Calendario / M4 Cuidado | P1 | `resuelto` | 2026-03-28 | 2026-04-04 | La vista Lista del Calendario consultaba solo `[now, now+30d]`. Eventos con `completed: false` y fecha en el pasado (recordatorios vencidos) quedaban completamente fuera del rango y nunca se mostraban. Fix: query cambia a `[0, now+30d]`; la sección de lista se divide en "Vencidos" (pasado + !completed, con borde rojo y badge VENCIDO) y "Próximos 30 días". |
| B012 | Eventos duplicados al editar un cuidado con recordatorio | M4 Cuidado / M9 Calendario | P2 | `resuelto` | 2026-03-28 | 2026-04-04 | Al editar un cuidado que tenía un `followup-reminder`, el código creaba un segundo evento sin eliminar el anterior. Fix: antes de guardar en modo edición se busca el `followup-reminder` no completado del árbol con el mismo `careType` y se elimina. Requirió agregar `getEventsByBonsai()` en DexieStorageService. |
| B013 | Fecha por defecto en nuevo recordatorio no usa el día seleccionado en el calendario | M9 Calendario | P2 | `resuelto` | 2026-03-29 | 2026-04-04 | Al presionar el FAB (+) con un día seleccionado en el grid, `AddReminderSheet` siempre precargaba la fecha de hoy. Fix: se agrega prop `initialDate` al sheet y se le pasa `selectedDay` cuando hay uno seleccionado. |
| B014 | Recordatorio guardado se visualiza un día antes del seleccionado | M9 Calendario | P2 | `resuelto` | 2026-03-29 | 2026-04-04 | `new Date('YYYY-MM-DD')` interpreta la fecha como UTC medianoche; en Argentina (UTC-3) eso equivale al día anterior a las 21:00. Fix: `new Date(date + 'T12:00:00')` para anclar a mediodía en zona local. |
| B015 | Eventos de cuidados (followup-reminder) no son editables desde el calendario | M9 Calendario | P3 | `resuelto` | 2026-03-29 | 2026-04-04 | El botón de editar solo aparecía para `manual-reminder`. Se amplió la condición a `manual-reminder || followup-reminder`. El botón de eliminar ya funcionaba para todos los tipos. |
| B016 | Botón de cerrar lightbox de Galería queda detrás del reloj en iPhone 15 | M5 Galería | P2 | `resuelto` | 2026-04-04 | 2026-04-04 | El header del lightbox ahora usa `paddingTop: calc(0.75rem + env(safe-area-inset-top))` para respetar el Dynamic Island. |
| B017 | Fecha al crear un cuidado se registra un día antes del seleccionado | M4 Cuidado | P1 | `resuelto` | 2026-04-04 | 2026-04-04 | Misma causa raíz que B014. Fix aplicado en CareForm.tsx (6 ocurrencias) y ClassNotes.tsx (1 ocurrencia): `new Date(date)` → `new Date(date + 'T12:00:00')`. Journal.tsx usaba `T00:00:00` (local time) y no requirió cambios. |
| B018 | Sheet de nuevo evento en Calendario queda detrás del BottomNav | M9 Calendario | P1 | `resuelto` | 2026-04-04 | 2026-04-04 | Misma causa raíz que B001. Fix aplicado en Calendar.tsx, BonsaiDetail.tsx (2 sheets), ClassNotes.tsx (2 sheets) y Backup.tsx: overlay z-40→z-[55], sheet z-50→z-[60]. |

---

## Funcionalidades nuevas

| # | Título | Módulo | Prioridad | Estado | Abierto | Resuelto | Descripción |
|---|---|---|---|---|---|---|---|
| F001 | Nombre común junto al nombre científico en resultado de Identificar | M10 Identificar | P2 | `resuelto` | 2026-03-25 | 2026-03-25 | Se agrega campo `commonName` al prompt y al tipo `Result`. Se muestra debajo del nombre científico en el idioma configurado. |
| F002 | Pantalla de bienvenida al abrir la app | UI global | P3 | `resuelto` | 2026-03-25 | 2026-03-26 | Overlay modal (una vez por sesión). Saludo estacional, cuidados vencidos, recordatorio backup. Auto-cierre 10 s. |
| F004 | Etiquetas personalizadas en árboles y filtro por etiqueta en Inventario | M2 Inventario / M3 Detalle | P3 | `resuelto` | 2026-03-25 | 2026-03-26 | Campo `tags?: string[]` en `Bonsai`. Input con chips en AddBonsaiSheet y EditSheet. Filtro `# tag` en Inventario. |
| F003 | Recordatorio de backup al abrir la app | M11 Backup | P2 | `resuelto` | 2026-03-25 | 2026-03-26 | `lastBackupAt` en `AppConfig`. Card en WelcomeScreen si >7 días sin exportar. |
| F005 | Campo `commonName` editable en ficha del árbol | M3 Detalle | P2 | `resuelto` | 2026-03-28 | 2026-04-04 | El campo `commonName` existía en el schema pero nunca era editable. Agregado en `EditSheet` de BonsaiDetail entre Especie y Estado. |
| F006 | Edición de recordatorios manuales en Calendario | M9 Calendario | P2 | `resuelto` | 2026-03-28 | 2026-04-04 | `AddReminderSheet` ahora acepta `editing?: CalendarEvent`. Al tocar el ícono de lápiz en un `manual-reminder` no completado se abre el sheet pre-cargado con título/fecha/árbol. Incluye botón de eliminar. |
| F007 | Descripción editable de fotos en Galería | M5 Galería | P3 | `resuelto` | 2026-03-28 | 2026-04-04 | En el lightbox de Gallery se muestra `+ Agregar descripción` (o el texto existente) como botón. Al tocarlo se abre un input inline con guardar/cancelar. Requirió agregar `updatePhoto()` en DexieStorageService. |
| F008 | Ocultar "Sugerencia IA" (violeta) del filtro y leyenda del Calendario | M9 Calendario | P3 | `resuelto` | 2026-03-29 | 2026-04-04 | El tipo `ai-suggestion` estaba en la UI (filtros, leyenda) pero ningún flujo de la app lo crea. Se removió del chip de filtro y de la leyenda de colores para evitar confusión. El tipo sigue definido en el schema para implementación futura. |
| F009 | Estilo con nombre informal en pantalla de edición | M3 Detalle | P3 | `resuelto` | 2026-03-29 | 2026-04-04 | En la creación los chips de estilo mostraban nombre japonés + nombre informal en italic. En la edición solo se mostraba el japonés. Se modificó `chipRow` para aceptar `React.ReactNode` y se unificó el renderizado. |
| F010 | Selector de tamaño en pantalla de creación de árbol | M2 Inventario | P3 | `resuelto` | 2026-03-29 | 2026-04-04 | El campo `size` no estaba expuesto en `AddBonsaiSheet`. Se agregó selector con chips igual al de estilo. |
| F011 | Rangos en cm en chips de tamaño (creación y edición) | M2 Inventario / M3 Detalle | P3 | `resuelto` | 2026-03-29 | 2026-04-04 | Se agregó referencia visual de cm debajo del nombre en cada chip (ej: "Shohin / 15–25 cm"). Aplica en creación y edición. |
| F012 | Agregar tamaño Shito al catálogo | M2 Inventario / M3 Detalle | P3 | `resuelto` | 2026-03-29 | 2026-04-04 | Faltaba el tamaño más pequeño (Shito, < 5 cm). Se agregó a `BonsaiSize` en schema.ts (cambio de tipo TypeScript, sin migración Dexie) y a los i18n es/en. |
| F013 | Subir múltiples fotos simultáneas desde la Galería | M5 Galería | P2 | `resuelto` | 2026-04-04 | 2026-04-04 | `input[type=file]` ahora tiene `multiple`. Se genera una cola de fotos pendientes; el modal muestra de a una con indicador "N restantes" y botón "Omitir" para saltear. |
| F014 | Leer fecha EXIF de la foto al subirla y usarla como fecha del historial | M5 Galería | P3 | `resuelto` | 2026-04-04 | 2026-04-04 | `extractExifDate()` escanea los primeros 64 KB del archivo buscando el patrón ASCII "YYYY:MM:DD HH:MM:SS" del EXIF. Si lo encuentra, pre-rellena el date picker; sino, usa fecha actual. |
| F019 | Ordenar fotos por fecha y hora, y mostrar la hora en la Galería | M5 Galería | P3 | `en revisión` | 2026-04-04 | — | `extractExifDatetime()` ahora extrae también HH:MM:SS del EXIF. `PendingPhoto.takenAt` guarda el timestamp completo. `loadPhotos` ordena por `takenAt` desc. `groupByMonth` ordena dentro de cada grupo por timestamp. Lightbox muestra hora `HH:MM` bajo la fecha. |
| F020 | Renderizar markdown en el Asistente IA | M8 AI / M14 AI General | P2 | `en revisión` | 2026-04-04 | — | Instalado `react-markdown`. Creado `src/components/MarkdownMessage.tsx` con custom components para h1-h3, p, ul, ol, li, strong, em, code, pre, blockquote. Aplicado en AIAssistant.tsx y GeneralAssistant.tsx para mensajes del asistente. Mensajes del usuario siguen como texto plano. |
| F015 | Editar la fecha de una foto guardada en la Galería | M5 Galería | P3 | `resuelto` | 2026-04-04 | 2026-04-04 | En el lightbox, la fecha mostrada es un botón con ícono lápiz. Al tocarla aparece un date input inline con Guardar/Cancelar que llama a `updatePhoto({ takenAt })`. |
| F016 | Navegación entre fotos con flechas en el lightbox de la Galería | M5 Galería | P3 | `resuelto` | 2026-04-04 | 2026-04-04 | Flechas ChevronLeft/ChevronRight sobre la imagen (suprimidas en el primer/último ítem). Indicador "N / Total" debajo de la imagen. |
| F017 | Backup con Web Share API + alerta inteligente | M11 Backup | P3 | `resuelto` | 2026-04-04 | 2026-04-04 | OPFS descartado (mismo sandbox que IndexedDB, no aporta seguridad real). Botón exportar usa Web Share API en móvil: abre el sheet nativo para guardar en Archivos, Google Drive, etc. Fallback a download en desktop. WelcomeScreen muestra alerta de backup inteligente: roja si nunca se hizo backup, violeta con conteo exacto de cuidados/fotos/notas sin respaldar si hay >3 registros nuevos desde el último. |
| F018 | Acceder al detalle de un cuidado desde su evento en el Calendario | M9 Calendario / M4 Cuidado | P2 | `en revisión` | 2026-04-04 | — | Se agregó `careId?` a `CalendarEvent`. CareForm guarda el careId. EventRow: toda la tarjeta es clickeable (onClick en el div contenedor + stopPropagation en botones de acción). Título en color accent como indicador visual. |

---

## Mejoras / Refactors

| # | Título | Módulo | Prioridad | Estado | Abierto | Resuelto | Descripción |
|---|---|---|---|---|---|---|---|
| M011 | FAB expandible en Detalle de árbol con 3 acciones rápidas | M3 Detalle | P3 | `resuelto` | 2026-03-28 | 2026-04-04 | El botón "+" fijo en BonsaiDetail ahora se expande (igual que el de Inventario) mostrando 3 opciones: "Agregar cuidado" → `/care`, "Agregar nota de clase" → `/notes`, "Agregar foto" → `/gallery`. Ícono rota 45° al abrir. |
| M014 | Incluir contexto de últimos cuidados en el Asistente IA por árbol | M8 Asistente IA | P3 | `resuelto` | 2026-04-04 | 2026-04-04 | Los 3 providers (Gemini, Claude, OpenAI) ahora incluyen en el system prompt los últimos 7 cuidados con fecha, tipo, condición del árbol y descripción. Antes solo mostraban el tipo. |
| M012 | Botón de ajustes (⚙️) presente en todas las páginas | UI global | P3 | `resuelto` | 2026-03-28 | 2026-04-04 | El ícono de engranaje se incorporó directamente al componente `Header` (derecha, después del slot `actions`). Se suprime con `hideSettings` en Settings y Backup para evitar circularidad. El botón duplicado se eliminó de `Inventory.tsx`. |
| M013 | Logo como botón de navegación al inventario | UI global | P3 | `resuelto` | 2026-03-28 | 2026-04-04 | El logo SVG en el `Header` (visible cuando no hay botón de "volver") quedó envuelto en un `<button>` que navega a `/`. |
| M005 | Nombre común como texto principal de especie en toda la UI | M2, M3, M10 | P3 | `resuelto` | 2026-03-25 | 2026-03-25 | Se agrega `commonName?` a la interfaz `Bonsai` (sin migración de Dexie). En el formulario de nuevo árbol se expone el campo opcional. En cards del inventario, detalle del árbol e Identificar, el nombre común toma precedencia visual sobre el científico (que pasa a ser secundario/italic). Los árboles existentes sin `commonName` no se ven afectados. |
| M008 | Onboarding paso 1: agregar saludo "¡Bienvenido!" | M1 Onboarding | P4 | `resuelto` | 2026-03-25 | 2026-04-04 | Se agrega "¡Bienvenido!" / "Welcome!" como línea destacada antes del párrafo descriptivo del paso 1. |
| M009 | Onboarding paso 3: explicación coloquial de qué es una API Key | M1 Onboarding | P3 | `resuelto` | 2026-03-25 | 2026-04-04 | Card informativa con título "¿Qué es una API Key?" y texto simple: contraseña personal → se guarda cifrada en el dispositivo → nunca sale de él. Ayuda a usuarios no técnicos a entender para qué sirve. |
| M010 | Onboarding: botón "Omitir" en pasos 2 y 3 sale del wizard en lugar de avanzar | M1 Onboarding | P3 | `resuelto` | 2026-03-25 | 2026-04-04 | El comportamiento previo de "Omitir" en pasos 2 y 3 avanzaba al siguiente paso, lo cual era confuso. Ahora llama a `finish(false)` directamente, cerrando el wizard y entrando a la app sin API key. |
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
| N004 | Acceso a Identificar desde FAB expandible + pre-relleno del formulario | M2 Inventario / M10 Identificar | P2 | `resuelto` | 2026-03-26 | 2026-04-04 | FAB "+" se expande en 2 opciones: "Nuevo bonsai" y "Identificar con IA". Desde Identificar, "Usar esta especie" navega a `/` con `state { prefillSpecies, prefillCommonName }`. Inventory detecta el state al montar y abre AddBonsaiSheet con especie y nombre común pre-cargados. |

---

## Ideas / Propuestas (sin comprometer)

| # | Título | Descripción | Origen |
|---|---|---|---|
