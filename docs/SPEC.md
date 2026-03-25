# NiwaMirî — Especificación Técnica

> **Jardín pequeño** — *niwa* (庭, japonés) + *mirî* (pequeño, guaraní entrerriano)
> App de gestión de colecciones Bonsai con IA integrada. Origen: Entre Ríos, Argentina.

---

## 1. Stack tecnológico

| Necesidad | Librería | Versión |
|---|---|---|
| UI Framework | React | 18 |
| Lenguaje | TypeScript | 5.x |
| Bundler / Dev server | Vite | 5.x |
| PWA | vite-plugin-pwa | latest |
| Routing | React Router | v6 |
| Estado global | Zustand | latest |
| Base de datos local | Dexie.js | 3.x |
| i18n | react-i18next | latest |
| Componentes UI | shadcn/ui | latest |
| Íconos | Lucide React | latest |
| Calendario | react-big-calendar | latest |
| Fechas | date-fns | latest |
| Estilos | Tailwind CSS | 3.x |

**Comando de creación del proyecto:**
```bash
npm create vite@latest niwamiri -- --template react-ts
cd niwamiri
npm install
```

---

## 2. Estructura de carpetas

```
niwamiri/
├── public/
│   ├── icons/                  # Íconos PWA (logo NiwaMirî en distintos tamaños)
│   └── manifest.json
├── src/
│   ├── assets/                 # Imágenes estáticas, fuentes
│   ├── components/             # Componentes reutilizables de UI
│   │   ├── ui/                 # Componentes base (Button, Card, Input, Badge...)
│   │   ├── layout/             # AppShell, BottomNav, Header
│   │   ├── bonsai/             # BonsaiCard, BonsaiGrid, HeroPhoto
│   │   ├── care/               # CareEntry, CareForm, CareTypeSelector
│   │   ├── calendar/           # CalendarGrid, EventCard, FilterChips
│   │   ├── ai/                 # AIPanel, AIChatBubble, AISuggestButton
│   │   └── logo/               # LogoSVG component
│   ├── pages/                  # Una página por módulo
│   │   ├── Onboarding.tsx      # M1
│   │   ├── Inventory.tsx       # M2
│   │   ├── BonsaiDetail.tsx    # M3
│   │   ├── CareForm.tsx        # M4
│   │   ├── Gallery.tsx         # M5
│   │   ├── ClassNotes.tsx      # M6
│   │   ├── SpeciesSheet.tsx    # M7
│   │   ├── AIAssistant.tsx     # M8
│   │   ├── Calendar.tsx        # M9
│   │   ├── Identify.tsx        # M10
│   │   ├── Backup.tsx          # M11
│   │   └── Settings.tsx        # M12
│   ├── services/               # Capa de abstracción — nunca llamar directo a DB o IA desde UI
│   │   ├── storage/
│   │   │   ├── StorageService.ts       # Interfaz abstracta
│   │   │   └── DexieStorageService.ts  # Implementación IndexedDB
│   │   └── ai/
│   │       ├── AIService.ts            # Interfaz abstracta
│   │       ├── GeminiProvider.ts       # Implementación Gemini
│   │       ├── OpenAIProvider.ts       # Implementación OpenAI
│   │       └── ClaudeProvider.ts       # Implementación Anthropic
│   ├── db/
│   │   ├── schema.ts           # Definición completa de Dexie.js
│   │   └── seeds.ts            # Datos de prueba para desarrollo
│   ├── store/                  # Estado global con Zustand
│   │   ├── appStore.ts         # Estado general (tema, idioma, configuración)
│   │   ├── bonsaiStore.ts      # Colección de ejemplares
│   │   └── calendarStore.ts    # Eventos y recordatorios
│   ├── hooks/                  # Custom hooks
│   │   ├── useBonsai.ts
│   │   ├── useAI.ts
│   │   ├── useStorage.ts
│   │   └── useSeason.ts        # Calcula estación del año según hemisferio
│   ├── i18n/
│   │   ├── index.ts            # Configuración react-i18next
│   │   ├── es.json             # Traducciones español
│   │   └── en.json             # Traducciones inglés
│   ├── utils/
│   │   ├── dates.ts            # Helpers de fecha con date-fns
│   │   ├── images.ts           # Compresión de imágenes (max 1200px, calidad 85%)
│   │   ├── crypto.ts           # Cifrado de API key (Web Crypto API)
│   │   └── backup.ts           # Export/import ZIP
│   ├── types/                  # Tipos TypeScript globales
│   │   └── index.ts
│   ├── styles/
│   │   └── globals.css         # Variables CSS, Tailwind base
│   ├── App.tsx                 # Router principal
│   └── main.tsx                # Entry point
├── SPEC.md                     # Este archivo
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 3. Design tokens

### Colores
```ts
// tokens/colors.ts
export const colors = {
  // Verdes
  green1: '#0f2e1c',
  green2: '#1a4a2e',
  green3: '#2e7048',   // primario
  green4: '#3d9060',
  green5: '#6ec48a',
  green6: '#b8dcc8',
  accent: '#4ab87a',   // acento interactivo

  // Semánticos
  warn:   '#e07840',   // alertas / recordatorios seguimiento
  gold:   '#c8a84a',   // recordatorios manuales
  ai:     '#7a6ec4',   // sugerencias IA

  // Modo oscuro (preferido)
  dark: {
    bg:       '#0e1a13',
    bg2:      '#141f18',
    bg3:      '#1c2b21',
    card:     '#1a2820',
    card2:    '#213328',
    border:   'rgba(255,255,255,0.07)',
    border2:  'rgba(255,255,255,0.12)',
    text1:    '#eef4f0',
    text2:    '#8aaa96',
    text3:    '#4a6a56',
    nav:      '#111d16',
  },

  // Modo claro
  light: {
    bg:       '#EFEDE8',
    bg2:      '#E8E5DF',
    bg3:      '#f5f3ef',
    card:     '#ffffff',
    card2:    '#f7f5f1',
    border:   'rgba(0,0,0,0.07)',
    border2:  'rgba(0,0,0,0.12)',
    text1:    '#1a1a1a',
    text2:    '#6a7a6e',
    text3:    '#aab8b0',
    nav:      '#ffffff',
  },
}
```

### Tipografías
```css
/* Google Fonts — cargar en index.html */
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,500;0,9..144,600;1,9..144,300;1,9..144,400&family=DM+Sans:wght@300;400;500;600&display=swap');

/* Uso:
   Títulos / nombres de árboles / display: font-family: 'Fraunces', serif
   Cuerpo / etiquetas / UI: font-family: 'DM Sans', sans-serif
*/
```

---

## 4. Schema de base de datos (Dexie.js)

```ts
// src/db/schema.ts
import Dexie, { Table } from 'dexie';

// ── TIPOS ──────────────────────────────────────────────────────

export type BonsaiStatus = 'developing' | 'maintenance' | 'recovery' | 'donated' | 'dead';
export type BonsaiStyle  = 'chokkan' | 'moyogi' | 'shakan' | 'kengai' | 'han-kengai' |
                           'hokidachi' | 'fukinagashi' | 'yose-ue' | 'literati' | 'other';
export type BonsaiSize   = 'mame' | 'shohin' | 'chuhin' | 'dai';
export type BonsaiOrigin = 'prebonsai' | 'yamadori' | 'seed' | 'cutting' | 'gift' | 'purchase';

export type CareType =
  | 'watering' | 'fertilizing' | 'maintenance-pruning' | 'structural-pruning'
  | 'wiring' | 'wire-removal' | 'repotting' | 'root-pruning'
  | 'defoliation' | 'pest-treatment' | 'jin-shari' | 'relocation'
  | 'observation' | 'other';

export type TreeCondition = 'good' | 'regular' | 'problematic';
export type AIProvider    = 'gemini' | 'openai' | 'claude';
export type SheetOrigin   = 'local-db' | 'ai-generated' | 'edited' | 'manual';
export type NoteScope     = 'species' | 'specimen' | 'care';

// ── ENTIDADES ─────────────────────────────────────────────────

export interface Bonsai {
  id:                    string;       // UUID
  name:                  string;       // Nombre/apodo del árbol
  species:               string;       // Nombre científico o común
  style?:                BonsaiStyle;
  acquisitionDate?:      string;       // ISO date
  germinationYear?:      number;       // Año estimado de germinación
  origin?:               BonsaiOrigin;
  size?:                 BonsaiSize;
  potAndSubstrate?:      string;
  location?:             string;
  status:                BonsaiStatus;
  generalNotes?:         string;
  mainPhotoId?:          string;       // ref → Photo.id
  createdAt:             number;       // timestamp
  updatedAt:             number;
}

export interface Care {
  id:                    string;
  bonsaiId:              string;       // ref → Bonsai.id
  type:                  CareType;
  date:                  number;       // timestamp
  description?:          string;
  treeCondition:         TreeCondition;
  specificFields?:       Record<string, unknown>; // campos variables por tipo
  followUpReminder?: {
    date:                number;
    description:         string;
  };
  createdAt:             number;
}

export interface Photo {
  id:                    string;
  bonsaiId:              string;       // ref → Bonsai.id
  careId?:               string;       // ref → Care.id (opcional)
  imageData:             string;       // base64 comprimida (max 1200px, calidad 85%)
  takenAt:               number;       // timestamp
  description?:          string;
  isMainPhoto:           boolean;
  createdAt:             number;
}

export interface ClassNote {
  id:                    string;
  species:               string;       // ANCLA OBLIGATORIA
  specimenId?:           string;       // ref → Bonsai.id (opcional)
  careId?:               string;       // ref → Care.id (opcional)
  classDate:             number;       // timestamp
  title?:                string;
  content:               string;
  createdAt:             number;
  updatedAt:             number;
}

export interface SpeciesSheet {
  id:                    string;
  species:               string;       // nombre canónico
  origin:                SheetOrigin;
  content:               Record<string, string>; // campos de la ficha
  lastUpdated:           number;
}

export interface CalendarEvent {
  id:                    string;
  bonsaiId?:             string;       // ref → Bonsai.id (opcional para eventos globales)
  type:                  'care' | 'manual-reminder' | 'followup-reminder' | 'ai-suggestion';
  careType?:             CareType;
  title:                 string;
  description?:          string;
  date:                  number;       // timestamp
  completed:             boolean;
  createdAt:             number;
}

export interface AIConversation {
  id:                    string;
  bonsaiId:              string;
  messages:              Array<{ role: 'user' | 'assistant'; content: string; timestamp: number }>;
  createdAt:             number;
  updatedAt:             number;
}

export interface AppConfig {
  id:                    1;            // singleton
  language:              'es' | 'en';
  theme:                 'dark' | 'light';
  hemisphere:            'north' | 'south';
  aiProvider:            AIProvider;
  aiModel?:              string;
  encryptedApiKey?:      string;       // cifrada con Web Crypto API
  photoQuality:          'high' | 'medium' | 'low';
  pushNotifications:     boolean;
  onboardingCompleted:   boolean;
  fontSize:              'normal' | 'large';
}

// ── DATABASE CLASS ─────────────────────────────────────────────

export class NiwaMiriDB extends Dexie {
  bonsais!:       Table<Bonsai>;
  cares!:         Table<Care>;
  photos!:        Table<Photo>;
  classNotes!:    Table<ClassNote>;
  speciesSheets!: Table<SpeciesSheet>;
  events!:        Table<CalendarEvent>;
  conversations!: Table<AIConversation>;
  config!:        Table<AppConfig>;

  constructor() {
    super('NiwaMiriDB');
    this.version(1).stores({
      bonsais:       '++id, species, status, updatedAt',
      cares:         '++id, bonsaiId, type, date',
      photos:        '++id, bonsaiId, careId, takenAt',
      classNotes:    '++id, species, specimenId, careId, classDate',
      speciesSheets: '++id, &species',
      events:        '++id, bonsaiId, type, date, completed',
      conversations: '++id, bonsaiId',
      config:        '&id',
    });
  }
}

export const db = new NiwaMiriDB();
```

---

## 5. Interfaces de servicio

### StorageService (abstracta)
```ts
// src/services/storage/StorageService.ts
export interface StorageService {
  // Bonsais
  getBonsaiList(): Promise<Bonsai[]>;
  getBonsaiById(id: string): Promise<Bonsai | undefined>;
  saveBonsai(bonsai: Omit<Bonsai, 'id' | 'createdAt' | 'updatedAt'>): Promise<string>;
  updateBonsai(id: string, data: Partial<Bonsai>): Promise<void>;
  deleteBonsai(id: string): Promise<void>;

  // Cares
  getCaresByBonsai(bonsaiId: string): Promise<Care[]>;
  saveCare(care: Omit<Care, 'id' | 'createdAt'>): Promise<string>;
  deleteCare(id: string): Promise<void>;

  // Photos
  getPhotosByBonsai(bonsaiId: string): Promise<Photo[]>;
  savePhoto(photo: Omit<Photo, 'id' | 'createdAt'>): Promise<string>;
  deletePhoto(id: string): Promise<void>;

  // Class Notes
  getNotesBySpecies(species: string): Promise<ClassNote[]>;
  getNotesBySpecimen(specimenId: string): Promise<ClassNote[]>;
  saveNote(note: Omit<ClassNote, 'id' | 'createdAt' | 'updatedAt'>): Promise<string>;
  updateNote(id: string, data: Partial<ClassNote>): Promise<void>;
  deleteNote(id: string): Promise<void>;

  // Species Sheets
  getSheetBySpecies(species: string): Promise<SpeciesSheet | undefined>;
  saveSheet(sheet: Omit<SpeciesSheet, 'id'>): Promise<string>;
  updateSheet(id: string, data: Partial<SpeciesSheet>): Promise<void>;

  // Calendar Events
  getEventsByDateRange(from: number, to: number): Promise<CalendarEvent[]>;
  saveEvent(event: Omit<CalendarEvent, 'id' | 'createdAt'>): Promise<string>;
  updateEvent(id: string, data: Partial<CalendarEvent>): Promise<void>;
  deleteEvent(id: string): Promise<void>;

  // Config
  getConfig(): Promise<AppConfig>;
  updateConfig(data: Partial<AppConfig>): Promise<void>;
}
```

### AIService (abstracta)
```ts
// src/services/ai/AIService.ts
export interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
  imageBase64?: string; // para consultas con foto
}

export interface BonsaiContext {
  bonsai:      Bonsai;
  recentCares: Care[];
  classNotes:  ClassNote[];
  season:      'spring' | 'summer' | 'autumn' | 'winter';
}

export interface AIService {
  // Identificar especie por foto
  identifySpecies(imageBase64: string): Promise<{
    species: string;
    confidence: 'high' | 'medium' | 'low';
    notes: string;
  }>;

  // Generar ficha técnica de especie
  generateSpeciesSheet(species: string): Promise<Record<string, string>>;

  // Resumir notas de clase contextuales para un tipo de cuidado
  summarizeNotesForCare(
    notes: ClassNote[],
    careType: CareType,
    species: string
  ): Promise<string>;

  // Chat libre contextualizado por ejemplar
  chat(messages: AIMessage[], context: BonsaiContext): Promise<string>;

  // Sugerir próximos cuidados
  suggestNextCares(context: BonsaiContext): Promise<Array<{
    careType: CareType;
    suggestedDate: number;
    reason: string;
  }>>;

  // Sugerir recordatorio para un cuidado recién registrado
  suggestReminder(care: Care, context: BonsaiContext): Promise<{
    date: number;
    description: string;
  }>;

  // Verificar que la API key es válida
  verifyConnection(apiKey: string): Promise<boolean>;
}
```

---

## 6. Rutas (React Router v6)

```tsx
// src/App.tsx
const routes = [
  { path: '/',                  element: <Inventory />        }, // M2
  { path: '/onboarding',        element: <Onboarding />       }, // M1
  { path: '/bonsai/:id',        element: <BonsaiDetail />     }, // M3
  { path: '/bonsai/:id/care',   element: <CareForm />         }, // M4 nuevo
  { path: '/bonsai/:id/care/:careId', element: <CareForm />   }, // M4 editar
  { path: '/calendar',          element: <Calendar />         }, // M9
  { path: '/identify',          element: <Identify />         }, // M10
  { path: '/settings',          element: <Settings />         }, // M12
  { path: '/settings/backup',   element: <Backup />           }, // M11
];
```

---

## 7. Módulos funcionales (resumen)

| Módulo | Descripción |
|---|---|
| **M1 Onboarding** | Asistente 4 pasos: bienvenida → elegir proveedor IA → obtener API key → verificar conexión. Solo se muestra la primera vez. |
| **M2 Inventario** | Grilla de tarjetas (foto arriba, datos abajo). Búsqueda, filtro por especie (chips múltiples), chips de estación del año. Alerta visual en tarjeta por cuidados pendientes. |
| **M3 Ficha del ejemplar** | Hero photo + stats rápidos + scroll vertical con 6 secciones colapsables: Resumen · Cuidados · Galería · Notas · Ficha Técnica · Asistente IA. FAB para nuevo cuidado. |
| **M4 Registro de cuidados** | Formulario con selector de tipo (chips), fecha, estado del árbol, observaciones, fotos. Panel IA contextual con resumen de notas relevantes. Botón "Sugerir con IA" para recordatorio de seguimiento. |
| **M5 Galería** | Grilla 3 columnas + línea de tiempo por mes. Fotos comprimidas (max 1200px, calidad 85%). |
| **M6 Notas de clase** | Especie como ancla obligatoria. Vínculos opcionales a ejemplar y/o cuidado. Creación posible desde M4. Resumen IA contextual al registrar cuidados. |
| **M7 Ficha técnica** | Origen: base local / IA / editada / manual. Badge de origen visible. Editable. Crear desde cero. Descargar PDF. Aviso al regenerar si hay cambios manuales. |
| **M8 Asistente IA** | Chat contextualizado con historial del árbol, especie, cuidados y notas. Soporte de foto en consulta. |
| **M9 Calendario** | Dos vistas: grilla mensual (mini íconos por tipo de cuidado) + lista próximos 30 días. Filtros combinables: tipo de evento + árbol + tipo de cuidado. Toggle entre vistas. |
| **M10 Identificar** | Foto → API visión → nombre especie + confianza. Pre-rellena campo especie al crear nuevo árbol. |
| **M11 Backup** | Export ZIP (JSON + fotos). Import con modos Reemplazar / Fusionar. Export individual por árbol. |
| **M12 Configuración** | Idioma, tema, hemisferio, proveedor IA, API key cifrada, modelo, calidad de fotos, notificaciones, tamaño de letra (normal/grande). |

---

## 8. Orden de desarrollo acordado

### Fase 1 — Proyecto base
- [ ] Crear proyecto Vite + React + TypeScript
- [ ] Instalar y configurar Tailwind CSS
- [ ] Instalar todas las dependencias del stack
- [ ] Configurar vite-plugin-pwa (manifest + service worker)
- [ ] Configurar ESLint + Prettier
- [ ] Estructura de carpetas completa
- [ ] Variables CSS globales con design tokens

### Fase 2 — Base de datos
- [ ] Implementar schema Dexie.js completo (ver sección 4)
- [ ] Implementar `DexieStorageService` (ver interfaz sección 5)
- [ ] Crear datos de prueba en `seeds.ts`
- [ ] Tests básicos de CRUD

### Fase 3 — Routing y navegación
- [ ] Configurar React Router v6 con todas las rutas
- [ ] Componente `AppShell` con layout base
- [ ] Componente `BottomNav`
- [ ] Componente `Header` reutilizable
- [ ] Guard de onboarding (redirigir si no completó configuración)

### Fase 4 — AIService
- [ ] Implementar interfaz `AIService` (ver sección 5)
- [ ] Implementar `GeminiProvider`
- [ ] Implementar `OpenAIProvider`
- [ ] Implementar `ClaudeProvider`
- [ ] Cifrado de API key con Web Crypto API
- [ ] Hook `useAI` que consume el servicio según proveedor configurado

### Fase 5 — i18n
- [ ] Configurar react-i18next
- [ ] Crear `es.json` con todas las cadenas de texto
- [ ] Crear `en.json` con traducciones
- [ ] Hook `useTranslation` disponible en toda la app

### Fase 6 — Pantallas
Orden sugerido (de más simple a más compleja):
1. M12 Settings — sin datos, solo configuración
2. M1 Onboarding — flujo lineal de 4 pasos
3. M2 Inventory — listado + búsqueda + filtros
4. M3 BonsaiDetail — ficha colapsable
5. M4 CareForm — formulario + panel IA
6. M5 Gallery — grilla de fotos
7. M6 ClassNotes — notas + vínculos
8. M7 SpeciesSheet — ficha técnica editable
9. M8 AIAssistant — chat contextual
10. M9 Calendar — grilla + lista + filtros
11. M10 Identify — foto + IA
12. M11 Backup — export/import ZIP

---

## 9. Decisiones arquitectónicas importantes

### Capa de abstracción (CRÍTICO)
La UI **nunca** accede directamente a Dexie ni a las APIs de IA. Siempre usa `StorageService` y `AIService`. Esto permite migrar a Supabase en el futuro cambiando solo la implementación, sin tocar ninguna pantalla.

```
UI / Componentes
      ↓
StorageService / AIService   ← única puerta de entrada
      ↓
DexieStorageService / GeminiProvider / etc.
```

### API key
- Se guarda cifrada en `AppConfig.encryptedApiKey` usando Web Crypto API (AES-GCM)
- Nunca en texto plano, nunca en localStorage directamente
- La key es por usuario, en su dispositivo — modelo BYOK

### Imágenes
- Se comprimen antes de guardar: máximo 1200px en el lado mayor, calidad 85%
- Se guardan como base64 en IndexedDB
- Se incluyen en el backup ZIP

### Hemisferio y estaciones
- Configurable en M12 (norte / sur)
- Default: hemisferio sur (Argentina)
- Hook `useSeason()` calcula la estación actual según la fecha y el hemisferio configurado
- Las sugerencias de IA siempre incluyen la estación en el contexto

### Modo de fuente grande
- Opción en M12 (normal / grande)
- Implementar con variable CSS `--font-scale: 1` / `--font-scale: 1.2`
- Todos los tamaños de fuente deben usar `calc(Xrem * var(--font-scale))`

---

## 10. Design system — componentes clave

### LogoSVG
Círculo verde con árbol Bonsai en contorno claro (sin relleno). Disponible como componente React con prop `size`. Ver archivo `src/components/logo/LogoSVG.tsx`.

### BonsaiCard
- Foto arriba (gradient fallback si no hay foto)
- Datos abajo: nombre (Fraunces), especie (itálica), edad calculada, último cuidado
- Badge de especie sobre la foto (top-right)
- Alerta visual (círculo naranja, top-left) si hay cuidados pendientes
- Border-radius: 20px

### EventCard (Calendario)
- Franja de color lateral (4px) según tipo de evento
- Verde: cuidado registrado
- Dorado: recordatorio manual
- Violeta: sugerencia IA
- Naranja: recordatorio de seguimiento / alerta

### AIPanel
- Panel expandible dentro de M4
- Header con badge "IA" y título "Notas de clase relevantes"
- Body con resumen generado, texto en color secundario
- Nunca bloquea el formulario

---

## 11. Configuración PWA

```ts
// vite.config.ts — sección PWA
VitePWA({
  registerType: 'autoUpdate',
  manifest: {
    name: 'NiwaMirî',
    short_name: 'NiwaMirî',
    description: 'Gestión de colecciones Bonsai con IA',
    theme_color: '#0e1a13',
    background_color: '#0e1a13',
    display: 'standalone',
    orientation: 'portrait',
    start_url: '/',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  },
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
        handler: 'CacheFirst',
        options: { cacheName: 'google-fonts', expiration: { maxAgeSeconds: 60 * 60 * 24 * 365 } },
      },
    ],
  },
})
```

---

## 12. Contexto del proyecto

- **Autor:** Ingeniero en sistemas, Entre Ríos, Argentina
- **Hobby:** Cultivo de Bonsai, estudiante de clases formales
- **Usuarios:** El autor + compañeros de clase (~10 personas)
- **Distribución:** URL estática (GitHub Pages / Netlify) — cada usuario instala la PWA en su teléfono
- **Modelo de datos:** Local primero (IndexedDB). Diseñado para migración futura a Supabase sin cambios en UI
- **IA:** Multi-proveedor (Gemini recomendado por tier gratuito). Cada usuario configura su propia API key
- **Idiomas:** Español (default) / Inglés
- **Hemisferio default:** Sur (Argentina)
- **Tema default:** Oscuro

---

*SPEC.md — NiwaMirî v1.0 — Documento vivo, actualizar al tomar decisiones nuevas durante el desarrollo*
