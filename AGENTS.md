# Guía para agentes — NiwaMirî

NiwaMirî es una PWA personal para gestionar bonsáis, con datos locales en IndexedDB y asistencia de IA con la clave del usuario. El proyecto está en mantenimiento; priorizar correcciones acotadas.

## Antes de trabajar

1. Leer [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md): procedimiento compartido por humanos, Claude Code y Codex.
2. Consultar [README.md](README.md), [docs/SPEC.md](docs/SPEC.md) y el módulo afectado en [docs/FUNCTIONAL_SPEC.md](docs/FUNCTIONAL_SPEC.md).
3. Revisar [docs/BACKLOG.md](docs/BACKLOG.md), [docs/CHANGELOG.md](docs/CHANGELOG.md), la rama y los cambios locales. Respetar el trabajo existente.

## Acuerdos de trabajo

- Mantener el seguimiento actual de bugs: mismos IDs, prioridades, estados y tablas. No agregar campos, plantillas, automatizaciones ni migrar el registro sin un pedido del usuario.
- Dejar los cambios implementados en `en revisión`. Solo el usuario puede confirmar que un ítem pasa a `resuelto`; publicar una corrección no equivale a validarla.
- Usar `develop` para mantenimiento y `main` para publicaciones, según la guía de desarrollo. No publicar, crear versiones ni modificar issues remotos como consecuencia implícita de una edición local.
- Corregir el problema solicitado sin refactors, actualizaciones de dependencias ni nuevas funcionalidades ajenas a ese problema.
- La estructura, tipos y configuración ejecutables describen la implementación actual. Si difieren de un requisito, investigar y explicar la diferencia; no cambiar el requisito para ocultar un bug.

## Organización de la documentación

- Antes de crear un documento, revisar las responsabilidades definidas en `docs/DEVELOPMENT.md` y ampliar el documento existente que corresponda.
- Documentar propuestas de producto, flujos, reglas funcionales, campos y criterios de aceptación en el módulo correspondiente de `docs/FUNCTIONAL_SPEC.md`, también durante el diseño previo a la implementación. Distinguir explícitamente lo propuesto, lo aprobado y lo implementado.
- Documentar arquitectura y decisiones de implementación en `docs/SPEC.md`; mantener el proceso en `docs/DEVELOPMENT.md`, el seguimiento en `docs/BACKLOG.md` y los cambios por versión en `docs/CHANGELOG.md`.
- No crear documentos separados de diseño o especificación por módulo o funcionalidad, salvo pedido explícito del usuario. Una propuesta pendiente de aprobación se integra en la especificación existente con ese estado.
- Mantener una única ubicación para cada definición y enlazarla desde los demás documentos; no copiar el diseño completo al backlog ni mantener especificaciones paralelas. Al mover contenido, actualizar sus referencias y retirar el documento que quede redundante.

## Convenciones y arquitectura

- TypeScript + React; páginas en `src/pages/`, componentes reutilizables en `src/components/`, stores en `src/store/` y servicios en `src/services/`.
- Usar la capa de almacenamiento y `AIService`; no introducir accesos nuevos a Dexie ni llamadas HTTP a proveedores desde componentes. Hay excepciones heredadas documentadas en `docs/SPEC.md`.
- Preservar IndexedDB y la compatibilidad de los backups. Evaluar migraciones si cambia el esquema; nunca borrar datos del usuario para resolver un problema.
- Para fechas de calendario usar `dateStrToTs`, `tsToDateStr` y `localToday` de `src/utils/dates.ts`. Preservar hora local/EXIF cuando el flujo maneje fecha y hora.
- Usar los tokens de `src/styles/globals.css` para colores y temas. Respetar safe areas, capas de sheets y navegación móvil.
- Comentarios nuevos en español. Textos nuevos de UI en `src/i18n/es.json` y `src/i18n/en.json`; evitar ampliar los textos inline heredados.
- No registrar claves de API, backups personales ni configuración local de herramientas en el repositorio.

## Verificación y entrega

- Instalación reproducible: `npm ci --legacy-peer-deps`.
- Para cambios de código: ejecutar `npm run test`, `npm run lint` y `npm run build`; añadir una prueba de regresión cuando aporte cobertura útil. Comunicar fallas previas por separado.
- Para cambios solo documentales: comprobar enlaces locales, referencias, coherencia con el código y `git diff --check`; no hacen falta tests de aplicación.
- El agente realiza únicamente validaciones de código: tests unitarios, integración con servicios simulados/jsdom, análisis estático, TypeScript, lint y build. No abrir Chrome ni otros navegadores, automatizar la app, tomar capturas ni iniciar servidores para probarla, salvo un pedido explícito posterior del usuario.
- Todas las pruebas usando la aplicación (visuales, funcionales, dispositivos, cámara, IA real y offline/PWA) quedan a cargo del usuario. Dejar el cambio `en revisión` e indicar brevemente qué necesita comprobar; esperar su confirmación para marcarlo `resuelto`.
- Actualizar solo la documentación afectada. Entregar qué cambió, cómo se verificó y qué queda pendiente de validación del usuario.
