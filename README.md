# NiwaMirî — Gestor de colección de bonsáis con IA

> *Niwa* (jardín, japonés) + *mirî* (pequeño, guaraní) — **jardín pequeño**.

NiwaMirî es una aplicación web progresiva (PWA) diseñada para bonsaístas que quieren digitalizar su diario de trabajo: registrar árboles, documentar cuidados, adjuntar fotos, tomar notas de clase y recibir asistencia de inteligencia artificial en tiempo real.

La app funciona **100% offline** — los datos viven en el dispositivo del usuario, sin servidores ni suscripciones.

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
- **Bitácora** — notas de clase con fotos, vinculadas a especie o ejemplar
- **Backup ZIP** — exporta e importa toda la colección (JSON + fotos) como archivo `.zip`
- **Multiproveedor IA** — compatible con Gemini (gratuito, recomendado), OpenAI y Claude

---

## Documentación

| Documento | Descripción |
|---|---|
| [SPEC.md](docs/SPEC.md) | Especificación técnica del sistema |
| [FUNCTIONAL_SPEC.md](docs/FUNCTIONAL_SPEC.md) | Especificación funcional detallada de cada módulo |
| [BACKLOG.md](docs/BACKLOG.md) | Historial de features, fixes y mejoras |

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| UI | React 19 + TypeScript 5 |
| Bundler | Vite 8 |
| Estilos | Tailwind CSS 3 + CSS custom properties |
| Estado global | Zustand 5 |
| Base de datos local | Dexie.js 4 (IndexedDB) |
| Internacionalización | react-i18next (español + inglés) |
| Componentes UI | shadcn/ui + Lucide React |
| Calendario | react-big-calendar + date-fns |
| PWA | vite-plugin-pwa |
| Backup | JSZip |
| Encriptación | Web Crypto API — AES-GCM (claves de API) |
| Tests | Vitest + jsdom + fake-indexeddb |
| Deploy | GitHub Pages / Netlify (sitio estático) |

Sin backend. Sin base de datos remota. Sin suscripciones.

---

## Cómo usar

### Requerimientos

- Node.js 20+
- npm 10+

### Instalación local

```bash
git clone https://github.com/emiees/niwamiri-bonsai.git
cd niwamiri-bonsai
npm install --legacy-peer-deps
npm run dev
```

> **Nota:** Vite 8 requiere `--legacy-peer-deps` en todas las instalaciones de dependencias.

### Build de producción

```bash
npm run build
npm run preview
```

### Tests

```bash
npm run test
```

---

## Configuración de IA

NiwaMirî usa la API key del propio usuario — no hay proxy ni costos del lado del servidor.

1. Abrí la app y completá el onboarding
2. Elegí tu proveedor (Gemini recomendado — tiene plan gratuito)
3. Ingresá tu API key en Configuración → Inteligencia Artificial
4. La clave se guarda cifrada localmente con AES-GCM

---

## Arquitectura

```
src/
├── pages/          # Vistas principales (una por módulo)
├── components/     # Componentes reutilizables
│   ├── layout/     # AppShell, Header, BottomNav
│   ├── bonsai/     # Tarjetas, sheets, galería
│   └── ui/         # Primitivos (Toggle, SegmentedControl…)
├── services/
│   ├── ai/         # GeminiProvider, OpenAIProvider, ClaudeProvider
│   └── storage/    # DexieStorageService
├── store/          # Zustand stores (bonsaiStore, appStore)
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
