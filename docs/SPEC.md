# NiwaMirî — Especificación Técnica

> Referencia de implementación: aplicación 1.5.0. Revisión documental: 2026-10-27.
> PWA de gestión de colecciones de bonsáis con IA, sin backend propio.

**B026 en v1.5.0, en revisión:** nueva pantalla de historial de cuidados y actualización de sus relaciones, pendientes de validación del usuario.

El proceso de desarrollo está en [DEVELOPMENT.md](DEVELOPMENT.md) y las instrucciones para agentes en [AGENTS.md](../AGENTS.md). El alcance funcional se consulta en [FUNCTIONAL_SPEC.md](FUNCTIONAL_SPEC.md).

## 1. Stack vigente

| Capa | Implementación |
|---|---|
| UI / lenguaje | React 19 / TypeScript 5.9 |
| Bundler | Vite 8 |
| Routing | React Router 7, con `HashRouter` |
| Estilos | Tailwind CSS 3 y custom properties |
| Estado | Zustand 5 |
| Persistencia | Dexie 4 sobre IndexedDB |
| Idiomas | i18next / react-i18next, español e inglés |
| Componentes | Componentes propios, configuración shadcn/ui, Radix Slider y Lucide React |
| Fechas / calendario | date-fns 4 y vistas propias en `Calendar.tsx` |
| Markdown | react-markdown |
| PWA | vite-plugin-pwa / Workbox |
| Backup | JSZip |
| Cifrado | Web Crypto API, AES-GCM |
| Tests | Vitest 4, jsdom y fake-indexeddb |
| Calidad | ESLint 9 y Prettier 3 |
| Distribución | GitHub Pages desde `main` |

Consultar [package.json](../package.json) para dependencias declaradas y [package-lock.json](../package-lock.json) para las resueltas. `react-big-calendar` permanece como dependencia, aunque la pantalla actual usa un calendario propio. Las menciones históricas a React 18, Router 6, Vite 5 y Dexie 3 correspondían al diseño inicial.

El entorno y los comandos de instalación se mantienen en [DEVELOPMENT.md](DEVELOPMENT.md). No hay configuración de despliegue de Netlify/Vercel en el repositorio; son alternativas futuras de hosting estático.

## 2. Estructura real del proyecto

```text
AGENTS.md                 Reglas compartidas para agentes
CLAUDE.md                 Entrada de contexto para Claude Code
README.md                 Presentación e instalación
docs/                     Proceso, especificaciones, backlog y changelog
.github/workflows/        Publicación en GitHub Pages
public/                   Favicon e íconos de la PWA
scripts/                  Generación de íconos
src/
  pages/                  Pantallas M1–M14
  components/
    layout/               AppShell, Header y BottomNav
    care/                 Formularios compartidos, detalles y filtros de cuidados
    bonsai/               BonsaiCard
    logo/                 LogoSVG
    ui/                   SelectRow, SegmentedControl, Toggle y RangeSlider
  services/
    storage/              Contrato StorageService e implementación Dexie
    ai/                   AIService y proveedores Gemini, OpenAI y Claude
  store/                  Stores de aplicación, colección y calendario
  hooks/                  Acceso a servicios, colección y estaciones
  db/                     Esquema y seeds de desarrollo
  i18n/                   Configuración y traducciones es/en
  utils/                  Backups, cifrado, imágenes y fechas
  styles/                 CSS global y tokens
  test/                   Setup y tests de almacenamiento, flujos y backups
  types/                  Tipos compartidos y detalles por tipo de cuidado
  lib/                    Utilidades de componentes
  App.tsx                 Rutas y guard de onboarding
  main.tsx                Inicialización
```

El manifest y el service worker se generan durante el build a partir de [vite.config.ts](../vite.config.ts); no se mantiene un `public/manifest.json` manual.

## 3. Arquitectura y servicios

El diseño busca separar la UI del almacenamiento y de los proveedores de IA:

```text
Páginas / componentes / stores
             ↓
StorageService / AIService
             ↓
DexieStorageService / GeminiProvider / OpenAIProvider / ClaudeProvider
```

### Persistencia

- [StorageService.ts](../src/services/storage/StorageService.ts): contrato común para árboles, cuidados, fotos, notas, fichas, eventos y configuración.
- [DexieStorageService.ts](../src/services/storage/DexieStorageService.ts): implementación y singleton `storageService`. Incluye también métodos usados por las pantallas que aún no están declarados en el contrato común.
- [useStorage.ts](../src/hooks/useStorage.ts): acceso tipado al contrato.

**Excepciones heredadas:** las pantallas de chat acceden directamente a `conversations`; `WelcomeScreen` consulta tablas para contar registros; las utilidades de backup también acceden directamente a Dexie. La migración a una persistencia remota requeriría revisar estas excepciones y completar el contrato, no solo cambiar una implementación. No ampliar estas excepciones al corregir bugs ni emprender ese refactor sin necesidad.

### Mantenimiento de cuidados (B026 en v1.5.0)

[CareList.tsx](../src/pages/CareList.tsx) consulta el historial completo mediante el servicio. El formulario recibe `fromCareList` en el estado de navegación y vuelve a esa pantalla al guardar; los accesos desde otras pantallas conservan su retorno a la ficha del árbol.

`updateCare` actualiza el registro en una transacción con sus eventos de calendario, conservando ID y fecha de creación. Los eventos de seguimiento nuevos guardan `careId` (campo opcional ya existente, sin cambio de índices ni migración Dexie).

`deleteCare` elimina el cuidado y sus eventos vinculados en una transacción; conserva fotos y notas y les quita el `careId`. No modifica la foto de portada del árbol. Los recordatorios antiguos sin `careId` solo se consideran asociados si tipo, fecha y descripción coinciden con un único cuidado del árbol; se conservan los ambiguos.

### Inteligencia artificial

[AIService.ts](../src/services/ai/AIService.ts) define ocho operaciones:

| Operación | Uso |
|---|---|
| `identifySpecies(imageBase64, lang?)` | Especie, nombre común, confianza y observaciones |
| `generateSpeciesSheet(species)` | Ficha técnica |
| `summarizeNotesForCare(notes, careType, species)` | Resumen contextual de notas |
| `chat(messages, context)` | Chat por ejemplar |
| `chatGeneral(messages, context)` | Chat con contexto de colección y bitácora |
| `suggestNextCares(context)` | Contrato disponible; sin generación periódica de eventos en la UI |
| `suggestReminder(care, context)` | Propuesta editable de recordatorio |
| `verifyConnection(apiKey)` | Verificación de conexión |

[useAI.ts](../src/hooks/useAI.ts) exporta la fábrica asíncrona `createAIService`: descifra la clave y selecciona el proveedor. Las llamadas externas viven en los proveedores de `src/services/ai/`. La pantalla de chat por ejemplar prepara diez cuidados y los prompts usan hasta siete; las notas de clase recibidas en ese contexto aún no se usan en el chat. El chat general prepara diez notas de bitácora y los prompts usan hasta cinco, abreviadas a 120 caracteres de contenido por nota.

Los modelos ofrecidos se consultan en `Settings.tsx`, los defaults de onboarding y los constructores de los proveedores. No asumir vigencia de un modelo ni gratuidad por una lista histórica: comprobarlo con la documentación oficial del proveedor cuando una tarea requiera cambiar esa integración.

## 4. Modelo de datos

La referencia completa de campos, tipos e índices es [src/db/schema.ts](../src/db/schema.ts). Evitar duplicar aquí interfaces enteras que puedan quedar desactualizadas.

| Tabla | Contenido y relaciones |
|---|---|
| `bonsais` | Árboles con especie, nombre común opcional, etiquetas, estado y foto principal |
| `cares` | Cuidados por árbol, condición, descripción, detalles por tipo y recordatorio opcional |
| `photos` | Imágenes base64 por árbol, vínculo opcional a cuidado, fecha de toma y portada |
| `classNotes` | Especie obligatoria, ejemplar y cuidado opcionales |
| `journalNotes` | Conocimiento general con etiquetas y fotos base64 inline opcionales |
| `speciesSheets` | Ficha por especie, origen y contenido editable |
| `events` | `care`, `manual-reminder`, `followup-reminder` y tipo reservado `ai-suggestion` |
| `conversations` | Mensajes por ejemplar; el asistente general usa `bonsaiId = 'general'` |
| `config` | Singleton `id = 1`: preferencias, clave cifrada, onboarding y último backup |

La base se llama `NiwaMiriDB`. El esquema v1 crea las tablas originales; v2 agrega `journalNotes`. Los registros de dominio usan IDs string generados con UUID; la configuración usa su ID fijo. Revisar versiones Dexie e índices antes de modificar el esquema. Un campo opcional nuevo sin índice no exige por sí solo una migración, pero hay que comprobar cómo lo leerán los datos existentes.

`AIConversation` no contiene título ni un catálogo de sesiones generales. El chat general actual mantiene una conversación persistida. Las fotos de la bitácora se guardan en la propia nota y no son filas de `photos`.

## 5. Rutas y navegación

La referencia es [App.tsx](../src/App.tsx). Las rutas siguientes son internas a `HashRouter`:

| Ruta | Módulo |
|---|---|
| `/onboarding` | M1 Onboarding |
| `/` | M2 Inventario |
| `/bonsai/:id` | M3 Ficha del ejemplar |
| `/bonsai/:id/cares` | M4 Listado completo con búsqueda, filtros, edición y eliminación |
| `/cares/bulk` | M4 Selección de árboles, carga masiva y revisión antes de guardar |
| `/bonsai/:id/care` y `/bonsai/:id/care/:careId` | M4 Crear/editar cuidado |
| `/bonsai/:id/gallery` | M5 Galería |
| `/bonsai/:id/notes` | M6 Notas de clase |
| `/bonsai/:id/sheet` | M7 Ficha de especie |
| `/bonsai/:id/ai` | M8 Chat por ejemplar |
| `/calendar` | M9 Calendario |
| `/identify` | M10 Identificar |
| `/settings/backup` | M11 Backup |
| `/settings` | M12 Configuración |
| `/journal` | M13 Bitácora |
| `/assistant` | M14 Asistente general |

El guard exige `onboardingCompleted` en todas las rutas salvo onboarding. La barra inferior tiene Colección, Bitácora, Asistente y Calendario. El header comparte acceso a ajustes, estación y pendientes, con excepciones según pantalla.

## 6. UI, temas y compatibilidad móvil

- Los tokens vigentes están en [globals.css](../src/styles/globals.css); la configuración Tailwind está en [tailwind.config.ts](../tailwind.config.ts). No hay un archivo `tokens/colors.ts` separado.
- Se usan Fraunces para títulos y DM Sans para cuerpo/UI. El tema por defecto es oscuro.
- `App.tsx` aplica el tema y la clase `font-large` a `<html>`. El CSS define `--font-scale` y utilidades escaladas. Mantener el soporte al agregar controles.
- Los textos nuevos se externalizan en `es.json` y `en.json`; todavía existen textos inline bilingües y formatos de fecha en español.
- El header respeta `safe-area-inset-top`; los sheets deben quedar por encima de BottomNav (patrón actual: overlay 55, sheet 60). Respetar también el área segura inferior.
- Cámara y galería usan inputs separados para evitar la limitación de cámara con `multiple` en Android.

Compatibilidad, contraste, tamaño táctil y rendimiento son objetivos que requieren validación en dispositivos; los tests de almacenamiento no los certifican.

## 7. Fechas, imágenes y claves

### Fechas

Persistir instantes como timestamps en milisegundos y usar la zona local del dispositivo para fechas de calendario. [dates.ts](../src/utils/dates.ts) define `dateStrToTs` (mediodía local), `tsToDateStr` y `localToday`. Evitar `new Date('YYYY-MM-DD')` y `toISOString().split('T')[0]` para representar el día elegido por el usuario.

Cuando el flujo maneje hora, como fotos EXIF y edición de fecha/hora de galería, conservarla. [useSeason.ts](../src/hooks/useSeason.ts) calcula estaciones por mes y hemisferio, con sur como valor por defecto.

### Imágenes

[images.ts](../src/utils/images.ts) concentra compresión, conversión base64/data URL y lectura EXIF. El límite habitual de galería/cuidados es 1200 px en el lado mayor, con calidad configurable; los chats usan una compresión menor. No hay un límite garantizado de bytes por imagen.

`Photo.imageData` almacena base64 sin el prefijo de data URL; usar `base64ToDataUrl` para renderizarla. Los grupos mensuales de Galería ordenan por `takenAt` descendente, con desempate por `createdAt`. Sin EXIF, Galería usa el día actual a mediodía local; CareForm usa el instante de subida. Conservar esa distinción al investigar problemas de fechas y orden.

### Claves

Cada usuario aporta su clave; no hay proxy. Se persiste en `config.encryptedApiKey` mediante AES-GCM, implementado en [crypto.ts](../src/utils/crypto.ts), y se descifra para llamar al proveedor. La derivación actual usa constantes de la aplicación, no una contraseña del usuario; no documentarla como una clave secreta exclusiva del dispositivo. La clave se envía al proveedor seleccionado, nunca a un servidor propio.

## 8. Backup y restauración

La implementación está en [backup.ts](../src/utils/backup.ts) y la UI en [Backup.tsx](../src/pages/Backup.tsx).

- Backup completo: ZIP con `data.json` (formato v2), metadata de fotos y `photos/<id>.jpg`. Incluye bitácora, conversaciones y configuración; las fotos inline de bitácora permanecen en el JSON.
- Backup por ejemplar: formato v1, árbol, cuidados, fotos, notas vinculadas al ejemplar, ficha de especie y eventos. No incluye conversaciones, configuración ni bitácora general.
- `replace`: limpia las colecciones de dominio e importa; la configuración se actualiza si el archivo la incluye.
- `merge`: conserva los registros no presentes en el backup y usa `bulkPut` para agregar o sobrescribir por ID. No hay conciliación por contenido ni por fecha de modificación.
- La importación comprueba que exista `data.json`, parsea el JSON y escribe dentro de una transacción. No hay validación exhaustiva del esquema del archivo ni un resumen previo de registros.
- En móvil, exportar intenta Web Share con MIME `application/octet-stream`, con fallback a descarga. Cancelar el selector no marca una exportación exitosa.

El backup completo contiene configuración, incluida la API key cifrada si existe. Usar datos de prueba para verificar importaciones y no versionar archivos personales.

## 9. PWA y publicación

[vite.config.ts](../vite.config.ts) fija `base`, `start_url` y `scope` en `/niwamiri-bonsai/`. El manifest usa íconos de 192 y 512 px, modo standalone y orientación portrait. Workbox genera el service worker con `registerType: 'autoUpdate'`, precache de assets y caché de fuentes de Google.

La colección, cuidados y datos ya guardados pueden usarse offline después de la carga inicial. Las operaciones de IA requieren conexión. No hay implementación de suscripción Web Push: el toggle de configuración solo persiste una preferencia.

El procedimiento de publicación y las limitaciones actuales de CI están en [DEVELOPMENT.md](DEVELOPMENT.md). El build genera `dist/` y el workflow publica en GitHub Pages desde `main`.

## Cuidados masivos, filtros y detalles (F033–F035)

Incluidos en v1.5.0 (2026-10-27), `en revisión`. El alcance y los criterios de aceptación aprobados se definen en [M4 de FUNCTIONAL_SPEC.md](FUNCTIONAL_SPEC.md#m4--registro-de-cuidados).

- [CareFields.tsx](../src/components/care/CareFields.tsx) comparte tipo/fecha, condición/observaciones, detalles y recordatorio entre los flujos individual y masivo. Usa los tokens, temas, traducciones es/en y controles del proyecto.
- [careDetails.ts](../src/types/careDetails.ts) define los datos conocidos de cada `CareType`. [careDetails.ts (utilidades)](../src/utils/careDetails.ts) contiene el catálogo fijo de campos, validación, normalización de decimales y resúmenes. Se guardan en el `Care.specificFields` opcional existente, conservando campos desconocidos cuando el tipo no cambia. No se modificaron tablas ni índices Dexie.
- [BulkCareForm.tsx](../src/pages/BulkCareForm.tsx), en `/cares/bulk`, mantiene selección y borradores en memoria hasta confirmar. [bulkCare.ts](../src/utils/bulkCare.ts) comparte las reglas de selección y herencia de valores. Incluye los modos común e individual y protege el envío con un bloqueo inmediato además del estado de guardado.
- `StorageService.saveBulkCares` valida datos y destinatarios, elimina IDs repetidos y guarda cuidados y eventos en una transacción que incluye `bonsais`, `cares` y `events`. Un error revierte todo el conjunto. Cada cuidado tiene ID propio y el seguimiento incluye su `careId`; la edición y eliminación posteriores usan las operaciones de B026.
- `StorageService.getCareProducts` obtiene nombres usados anteriormente, sin catálogo adicional ni dosis precargadas. La relación de fotos se consulta mediante `getPhotosByBonsai`.
- [CareList.tsx](../src/pages/CareList.tsx) conserva búsqueda y filtros en los parámetros de la ruta (`q`, `type`, `period`, `from`, `to`, `photos`). [careFilters.ts](../src/utils/careFilters.ts) combina filtros en memoria y calcula períodos por días locales completos. La presencia de fotos se determina por `careId`. Un aviso de retorno por entrada de navegación usa `sessionStorage`; no contiene datos del cuidado ni modifica IndexedDB.
- Los backups completos e individuales conservan `specificFields` sin transformar su contenido. Los tests verifican exportación/restauración, archivos antiguos sin detalles y campos desconocidos.
- La fecha de revisión de alambrado puede copiarse al seguimiento manual mediante una acción explícita. La carga masiva no realiza consultas de IA ni genera recordatorios adicionales ocultos.

Las pruebas unitarias y de integración se encuentran en `src/test/care-details.test.ts`, `src/test/bulk-care.test.tsx`, `src/test/care-history.test.tsx`, `src/test/care-backup.test.ts` y `src/test/storage.test.ts`. Las pruebas usando la aplicación quedan a cargo del usuario.

## 10. Historia y estado de mantenimiento

Las seis fases iniciales (base, almacenamiento, navegación, IA, i18n y pantallas) dieron lugar a la aplicación publicada; no constituyen una lista de trabajo pendiente. Se incorporaron después M13/M14 y las mejoras de las versiones 1.1–1.4.

La existencia de todos los módulos no significa que cada requisito del diseño inicial se haya implementado o validado. Los alcances pendientes están identificados en [FUNCTIONAL_SPEC.md](FUNCTIONAL_SPEC.md); los bugs y su validación siguen en [BACKLOG.md](BACKLOG.md). El estado fechado de tests, build y lint se conserva en [DEVELOPMENT.md](DEVELOPMENT.md), no como afirmación permanente de que todo pasa.
