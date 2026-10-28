# NiwaMirî — Gestor de colección de bonsáis con IA

> *Niwa* (jardín, japonés) + *mirî* (pequeño, guaraní) — **jardín pequeño**.

NiwaMirî es una aplicación web progresiva (PWA) diseñada para bonsaístas que quieren digitalizar su diario de trabajo: registrar árboles, documentar cuidados, adjuntar fotos, tomar notas de clase y recibir asistencia de inteligencia artificial en tiempo real.

La gestión de la colección funciona **offline después de la carga inicial**: los datos viven en el dispositivo del usuario, sin backend propio. Las funciones de IA requieren internet y la API key del usuario; sus costos y cuotas dependen del proveedor.

---

## Capturas de pantalla

> _Próximamente_

---

## Funcionalidades principales

- **Colección** — inventario con búsqueda, filtro por especie, estado y etiquetas
- **Detalle del árbol** — ficha completa con foto principal, historial de cuidados, galería, notas y estadísticas
- **Registro de cuidados** — 14 tipos (riego, poda, trasplante, etc.) con fotos, condición y recordatorios
- **Asistente IA** — chat contextualizado por árbol o para consultas generales sobre bonsáis
- **Identificación por foto** — sube una foto y la IA identifica la especie con nivel de confianza
- **Ficha técnica** — generada por IA o editada manualmente para cada especie
- **Calendario** — vista mensual de cuidados y recordatorios
- **Bitácora** — notas generales de conocimiento con fotos y etiquetas; las notas por especie o ejemplar se gestionan desde la ficha del árbol
- **Backup ZIP** — exporta e importa toda la colección (JSON + fotos) como archivo `.zip`
- **Multiproveedor IA** — compatible con Gemini, OpenAI y Claude mediante la clave de cada usuario

---

## Documentación

| Documento | Descripción |
|---|---|
| [DEVELOPMENT.md](docs/DEVELOPMENT.md) | Proceso compartido de desarrollo, bugs, validación y publicación |
| [AGENTS.md](AGENTS.md) | Instrucciones para agentes de desarrollo |
| [CLAUDE.md](CLAUDE.md) | Entrada para Claude Code y referencias al proceso compartido |
| [SPEC.md](docs/SPEC.md) | Especificación técnica del sistema |
| [FUNCTIONAL_SPEC.md](docs/FUNCTIONAL_SPEC.md) | Especificación funcional detallada de cada módulo |
| [BACKLOG.md](docs/BACKLOG.md) | Historial de features, fixes y mejoras |
| [CHANGELOG.md](docs/CHANGELOG.md) | Cambios publicados por versión |

Las mejoras de Cuidados F033–F035 (carga masiva, filtros y detalles por tipo) se incluyen en v1.5.0 y fueron validadas por el usuario el 2026-10-28; su alcance está en M4 de la especificación funcional.

La versión **1.6.0** incorpora ajustes de cuidados y recordatorios masivos, fallecidos ocultos por defecto con opción en filtros y novedades por versión. Estos cambios están `en revisión`, pendientes de la prueba del usuario.

El proyecto está en mantenimiento. Para corregir un bug, empezar por la guía de desarrollo y conservar el seguimiento existente. La documentación técnica distingue la implementación actual de las funciones previstas.

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| UI | React 19 + TypeScript 5 |
| Bundler / routing | Vite 8 / React Router 7 (HashRouter) |
| Estilos | Tailwind CSS 3 + CSS custom properties |
| Estado global | Zustand 5 |
| Base de datos local | Dexie.js 4 (IndexedDB) |
| Internacionalización | react-i18next (español + inglés) |
| Componentes UI | Componentes propios, configuración shadcn/ui, Radix Slider y Lucide React |
| Fechas / calendario | date-fns y vistas propias; react-big-calendar figura como dependencia |
| PWA | vite-plugin-pwa |
| Backup | JSZip |
| Encriptación | Web Crypto API — AES-GCM (claves de API) |
| Tests | Vitest + jsdom + fake-indexeddb |
| Deploy | GitHub Pages automático desde `main` |

Sin backend propio ni base de datos remota.

---

## Cómo usar

### Requerimientos

- Node.js 24 recomendado para este proyecto; los engines instalados de Vite y jsdom admiten `^20.19.0 || ^22.13.0 || >=24.0.0`
- npm 10+

### Instalación local

```bash
git clone https://github.com/emiees/niwamiri-bonsai.git
cd niwamiri-bonsai
npm ci --legacy-peer-deps
npm run dev
```

> **Nota:** este proyecto usa `--legacy-peer-deps` por sus conflictos de peer dependencies. Para instalar desde el lockfile usar `npm ci`; para cambiar dependencias, `npm install`, con el mismo flag. Abrir la URL que muestre Vite con la base `/niwamiri-bonsai/`.

### Build de producción

```bash
npm run build
npm run preview
```

### Tests

```bash
npm run test
```

También están disponibles `npm run lint` y `npm run format` (este último escribe sobre `src/`). El estado de partida de las verificaciones y las pruebas manuales según el cambio están documentados en [DEVELOPMENT.md](docs/DEVELOPMENT.md).

---

## Configuración de IA

NiwaMirî usa la API key del propio usuario — no hay proxy ni costos del lado del servidor.

1. Abrí la app y completá el onboarding
2. Elegí tu proveedor y consultá sus cuotas y condiciones vigentes
3. Ingresá tu API key en Configuración → Inteligencia Artificial
4. La clave se guarda cifrada localmente con AES-GCM

---

## Arquitectura

```
src/
├── pages/          # Vistas principales (una por módulo)
├── components/     # Componentes reutilizables
│   ├── layout/     # AppShell, Header, BottomNav
│   ├── bonsai/     # Tarjeta reutilizable de ejemplar
│   └── ui/         # Primitivos (Toggle, SegmentedControl…)
├── services/
│   ├── ai/         # GeminiProvider, OpenAIProvider, ClaudeProvider
│   └── storage/    # DexieStorageService
├── store/          # Zustand stores (bonsaiStore, appStore, calendarStore)
├── hooks/          # useSeason, useAI, etc.
├── db/             # Schema Dexie + seeds
└── utils/          # backup, crypto, images
```

---

## Autor

**Emiliano Salazar**
Ingeniero en Sistemas · Entre Ríos, Argentina

- Email: [emilianoesalazar@gmail.com](mailto:emilianoesalazar@gmail.com)
- GitHub: [@emiees](https://github.com/emiees)

---

## Agradecimientos

Inspirado y apoyado por **[GM Bonsai](https://www.instagram.com/gabrielmedinabonsai/)** — Gabriel Medina, maestro bonsaísta.

---

## Licencia

MIT — ver [LICENSE](LICENSE).
