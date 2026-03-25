# NiwaMirî — Contexto del Proyecto

## Qué es

NiwaMirî es una **PWA de gestión de colección de bonsáis con IA integrada**. App personal del autor (Ing. en Sistemas, Entre Ríos, Argentina) y ~10 compañeros de clase de bonsái. Se distribuye como sitio estático en GitHub Pages / Netlify. No hay backend ni base de datos remota.

El nombre "NiwaMirî" proviene de una fusión del japones: *niwa* (jardín/árbol) + del guaraní *mirî* (pequeño). Árbol pequeño del jardín.

## Objetivo principal

Digitalizar el diario de trabajo del bonsaísta: registrar árboles, cuidados, fotos y notas de clase, con sugerencias y asistencia de IA en tiempo real. Todo funciona 100% offline; los datos viven en el dispositivo del usuario.

---

## Stack técnico

| Capa | Tecnología |
|---|---|
| UI | React 19 + TypeScript 5.x |
| Bundler | Vite 8 |
| Estilos | Tailwind CSS 3.x + CSS custom properties (design tokens) |
| Estado | Zustand 5 |
| DB local | Dexie.js 4 (IndexedDB) |
| Internacionalización | react-i18next (es + en) |
| Componentes | shadcn/ui + Lucide React |
| Calendario | react-big-calendar + date-fns |
| PWA | vite-plugin-pwa |
| Backup | JSZip (ZIP con JSON + carpeta de fotos) |
| Encriptación | Web Crypto API — AES-GCM (API keys) |
| Tests | Vitest + jsdom + fake-indexeddb |

> **Importante:** Vite 8 requiere `--legacy-peer-deps` en todos los `npm install`.

---

## Módulos de la aplicación (todos implementados)

| Ruta | Módulo | Función |
|---|---|---|
| `/` | M2 Inventario | Grid/lista de árboles con búsqueda, filtro por especie y estado |
| `/bonsai/:id` | M3 Detalle | Foto principal, stats rápidos, 6 secciones colapsables, edición |
| `/bonsai/:id/care` | M4 Registro de cuidado | 14 tipos de cuidado, condición, fotos, sugerencia IA, recordatorio |
| `/bonsai/:id/gallery` | M5 Galería | Grid 3 columnas, timeline por mes, lightbox, cover |
| `/bonsai/:id/notes` | M6 Notas de clase | Notas vinculadas a especie/ejemplar, búsqueda, CRUD |
| `/bonsai/:id/sheet` | M7 Ficha de especie | Ficha técnica, generación IA, edición inline |
| `/bonsai/:id/ai` | M8 Asistente IA | Chat contextualizado por ejemplar, adjuntar foto, historial persistido |
| `/calendar` | M9 Calendario | Vista mes + lista 30 días, eventos por color, recordatorios manuales |
| `/identify` | M10 Identificar | Cámara/upload → IA vision → especie + confianza, aceptar/descartar |
| `/settings/backup` | M11 Backup | Export/import ZIP real (JSON + fotos) |
| `/settings` | M12 Configuración | Tema, idioma, tamaño de fuente, hemisferio, proveedor IA, API key |
| `/onboarding` | M1 Onboarding | Wizard 4 pasos: bienvenida → proveedor → instrucciones → API key |

---

## Modelo de datos (Dexie / IndexedDB)

```
bonsais        — árbol con nombre, especie, estilo, estado, foto principal
cares          — cuidado con tipo, fecha, condición, campos específicos, recordatorio
photos         — foto base64 (max 1200px, calidad 85%), vinculada a bonsai/care
classNotes     — nota de clase anclada a especie (obligatorio) + ejemplar/cuidado opcionales
speciesSheets  — ficha técnica de especie (puede ser generada por IA o manual)
events         — eventos de calendario: care | manual-reminder | followup | ai-suggestion
conversations  — historial de chat IA por ejemplar
config         — singleton con preferencias del usuario (tema, idioma, API key cifrada…)
```

---

## Servicio de IA

La interfaz `AIService` tiene 6 métodos:
- `identifySpecies(imageBase64)` — identifica especie por foto
- `generateSpeciesSheet(species)` — genera ficha técnica
- `summarizeNotesForCare(notes, careType, species)` — resume notas relevantes
- `chat(messages, context)` — chat libre contextualizado por ejemplar
- `suggestNextCares(context)` — sugiere próximos cuidados con fecha y motivo
- `suggestReminder(care, context)` — sugiere recordatorio post-cuidado
- `verifyConnection(apiKey)` — valida la API key

Proveedores implementados: **Gemini (recomendado, gratuito)**, OpenAI, Claude (Anthropic). El proveedor y API key se configuran en onboarding y se pueden cambiar en Settings. La API key se guarda cifrada con AES-GCM.

---

## Estado actual del proyecto

**Todos los módulos (M1–M12) están completos.** Build pasa (75 módulos), 26 tests de storage pasan.

La app está publicada y funcional. Las fases de desarrollo (1–6) ya están cerradas.

---

## Decisiones de diseño importantes

- **Sin backend:** toda la lógica es client-side. Los datos persisten en IndexedDB.
- **API key del usuario:** cada usuario aporta su propia clave de IA. No hay proxy.
- **Hemisferio configurable:** el cálculo de estaciones considera norte/sur (Por defecto: hemisferio sur).
- **Idioma por defecto:** español (es). La UI completa tiene traducciones en es + en.
- **Tema por defecto:** oscuro.
- **Fotos como base64:** se comprimen a max 1200px, calidad 85%, y se guardan en IndexedDB junto con el resto de los datos.
- **Backup ZIP:** exporta JSON de todas las tablas + carpeta `/photos/` con las imágenes.

---

## Convenciones del proyecto

- Comentarios en código: español.
- UI pública (labels, mensajes): bilingüe via i18n, español como idioma principal.
- Componentes de página en `src/pages/`, componentes reutilizables en `src/components/`.
- Stores Zustand en `src/store/`, servicios en `src/services/`, hooks en `src/hooks/`.
- CSS usa custom properties (`var(--color-accent)`, `var(--bg)`, etc.) definidas en `globals.css` — nunca hardcodear colores Tailwind directamente en componentes de UI.
