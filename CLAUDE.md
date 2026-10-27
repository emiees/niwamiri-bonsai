# NiwaMirî — Entrada para Claude Code

## Instrucciones compartidas

Antes de trabajar, leer y seguir:

1. [AGENTS.md](AGENTS.md): acuerdos para todos los agentes del proyecto.
2. [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md): flujo de mantenimiento, bugs, verificaciones y publicaciones.

Estas reglas se mantienen en esos documentos para que Claude Code y Codex trabajen con el mismo proceso. Este archivo conserva la entrada de contexto para Claude Code.

## Contexto breve

NiwaMirî es una PWA personal de gestión de bonsáis para su autor y compañeros de clase. No tiene backend: los datos viven en IndexedDB. La gestión local funciona offline tras la carga inicial; las funciones de IA requieren internet y la API key del usuario.

La aplicación incluye los módulos M1–M14. La versión de referencia de esta revisión es 1.4.0; el estado de cada corrección se consulta en el backlog, sin confundir implementación con validación del usuario.

## Referencias

- [README.md](README.md): instalación y comandos.
- [docs/SPEC.md](docs/SPEC.md): stack actual, arquitectura, datos, servicios, rutas y PWA.
- [docs/FUNCTIONAL_SPEC.md](docs/FUNCTIONAL_SPEC.md): comportamiento y alcance de cada módulo, incluidos requisitos pendientes.
- [docs/BACKLOG.md](docs/BACKLOG.md): seguimiento existente, sin nuevos campos ni plantillas.
- [docs/CHANGELOG.md](docs/CHANGELOG.md): cambios por versión.

Los permisos de `.claude/settings.local.json` son locales y están excluidos de Git. No sustituyen los acuerdos compartidos ni documentan el proceso del proyecto.
