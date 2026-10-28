# NiwaMirî — Desarrollo y mantenimiento

Guía compartida por el propietario, Claude Code y Codex. El proyecto es pequeño y está en mantenimiento: conservar el proceso simple y concentrarse en las correcciones solicitadas.

## 1. Documentación y fuentes de referencia

| Documento | Responsabilidad |
|---|---|
| [README.md](../README.md) | Presentación, instalación y acceso a la documentación |
| [AGENTS.md](../AGENTS.md) | Acuerdos para los agentes de desarrollo |
| [CLAUDE.md](../CLAUDE.md) | Entrada para Claude Code, con enlaces a las reglas compartidas |
| [SPEC.md](SPEC.md) | Arquitectura, decisiones técnicas y referencias al código vigente |
| [FUNCTIONAL_SPEC.md](FUNCTIONAL_SPEC.md) | Comportamiento funcional y requisitos aún pendientes |
| [BACKLOG.md](BACKLOG.md) | Registro existente de bugs, funcionalidades, mejoras e ideas |
| [CHANGELOG.md](CHANGELOG.md) | Cambios por versión de la aplicación |

Las dependencias declaradas y resueltas se consultan en `package.json` y `package-lock.json`; los tipos, rutas y configuración efectivos se consultan en el código. Las especificaciones describen también requisitos: una diferencia con el código requiere análisis, no significa automáticamente que el requisito deba eliminarse.

Las instrucciones de proceso viven aquí y en `AGENTS.md`. Evitar copiarlas en varios documentos. `.claude/settings.local.json` contiene permisos de la herramienta en esta máquina y está excluido de Git; no es un registro de decisiones ni una guía para otros colaboradores.

La [wiki](https://github.com/emiees/niwamiri-bonsai/wiki) está orientada al usuario final. Cuando una publicación cambie instrucciones de uso, revisar las páginas afectadas, incluida su copia del changelog. La edición de la wiki es independiente de los archivos de este repositorio.

## 2. Preparación local

- Usar Node 24 como referencia. Los engines instalados de Vite 8 y jsdom 29 admiten en conjunto `^20.19.0 || ^22.13.0 || >=24.0.0`. La verificación inicial se realizó con Node 24.14.0 y npm 11.9.0.
- Usar npm y conservar `package-lock.json` como lockfile del proyecto.
- Este proyecto instala con `--legacy-peer-deps` para resolver sus conflictos de peer dependencies. Es una decisión de instalación del proyecto, no un requisito universal de Vite.

```bash
npm ci --legacy-peer-deps
npm run dev
```

Abrir la dirección que muestre Vite con la base `/niwamiri-bonsai/`. La navegación interna usa hash, por ejemplo `/niwamiri-bonsai/#/calendar`.

Para agregar o actualizar una dependencia, usar `npm install --legacy-peer-deps` con el paquete correspondiente y revisar los cambios del manifiesto y del lockfile. No reinstalar ni actualizar dependencias si la tarea no lo necesita.

## 3. Ramas y cambios locales

- `develop`: integración de correcciones y mejoras en desarrollo. Es la rama de trabajo usada en el historial reciente.
- `main`: versión destinada a producción. Cada push dispara la publicación en GitHub Pages.
- Para una corrección pequeña se puede trabajar en `develop`. Una rama temporal desde `develop` es opcional si ayuda a aislar un cambio; no se exige un PR para cada bug.

Antes de editar, revisar `git status` y la rama activa. No descartar cambios de otra tarea ni cambiar de rama con trabajo pendiente sin preservarlo. Cuando se use una rama temporal, integrarla primero a `develop`.

El historial usa mensajes como `fix:`, `feat:`, `docs:`, `refactor:` y `chore:`. Mantener ese estilo; mencionar el ID existente cuando ayude a identificar el cambio, sin incorporar un requisito nuevo de trazabilidad.

## 4. Corrección de bugs

Se mantiene el mecanismo existente de [BACKLOG.md](BACKLOG.md) y [GitHub Issues](https://github.com/emiees/niwamiri-bonsai/issues). No se agregan plantillas, campos obligatorios ni automatizaciones de sincronización. Esta guía no reemplaza ninguno de los registros.

1. Revisar si el problema ya está registrado y reutilizar su ID. Si es nuevo, usar el siguiente ID libre dentro de su categoría; no derivarlo del número del issue de GitHub.
2. Entender el caso reportado y revisar el módulo correspondiente. Reproducir mediante tests de código cuando sea posible; las pruebas usando la app las realiza el usuario.
3. Pasar a `en progreso` al comenzar la implementación y hacer una corrección acotada.
4. Ejecutar las verificaciones aplicables y actualizar la nota existente del backlog con la solución, siguiendo su formato actual.
5. Dejar el ítem `en revisión` para la prueba y confirmación del usuario.
6. Pasar a `resuelto` y completar la fecha de resolución solo después de su confirmación explícita. Si la prueba falla, continuar el trabajo sobre el mismo ítem.

Las categorías y prioridades son las definidas en el backlog. La expresión histórica «implementado por Claude» incluye también cambios realizados por otro agente o desarrollador. Se conserva la estructura del registro.

Un cambio puede estar publicado y seguir `en revisión`. No cerrar automáticamente un issue por haber compilado, publicado o pasado tests. Las acciones sobre GitHub se realizan cuando el usuario pide trabajar también sobre ese registro; una tarea documental local no implica editarlo.

## 5. Verificaciones

Para cambios de código, ejecutar desde la raíz:

```bash
npm run test
npm run lint
npm run build
```

El build incluye TypeScript (`tsc -b`) y Vite. El agente realiza exclusivamente validaciones de código: tests unitarios, integración con servicios simulados/jsdom, análisis estático, lint y build. Por decisión del usuario del 2026-10-27, no abre Chrome u otros navegadores, automatiza la aplicación, toma capturas ni inicia servidores para probarla, salvo un pedido explícito posterior del usuario.

El usuario realiza todas las pruebas usando la app y confirma el resultado durante el estado `en revisión`. Si necesita servir el resultado de producción localmente, puede ejecutar:

```bash
npm run preview
```

La suite usa Vitest, jsdom y fake-indexeddb. `src/test/storage.test.ts` cubre almacenamiento y relaciones de cuidados con eventos, fotos y notas. `src/test/care-history.test.tsx` verifica los flujos del historial y otros listados resumidos mediante componentes React y navegación en memoria, con servicios simulados. `src/test/care-details.test.ts`, `src/test/bulk-care.test.tsx` y `src/test/care-backup.test.ts` cubren detalles, selección y borradores masivos, filtros y compatibilidad de exportación/restauración. `src/test/care-components.test.tsx` cubre cantidades, unidades, limpieza y respuestas tardías de IA; `src/test/reminder-ai.test.ts` prueba los tres proveedores con red simulada. `src/test/inventory-visibility.test.tsx` cubre fallecidos ocultos, filtros combinados, limpieza, cancelación y ambas vistas de Mi Colección. `src/test/startup-notices.test.tsx` cubre novedades por versión, reconocimiento local, secuencia con bienvenida, temporizador, idiomas y navegación, también bajo StrictMode. Los tests de almacenamiento incluyen rollback de cargas masivas. Pasar la suite no prueba dispositivos reales ni proveedores externos.

Agregar tests de regresión cuando ayuden a proteger una corrección lógica, especialmente fechas y persistencia. En problemas de interfaz o de plataforma, cubrir con tests de componentes lo que corresponda y dejar la prueba real del recorrido y sus flujos vecinos al usuario. Para cambios solo documentales basta revisar enlaces y referencias y ejecutar `git diff --check`.

### Estado de partida verificado el 2026-10-23

| Comando | Resultado anterior a las correcciones nuevas |
|---|---|
| `npm run test` | 26 tests pasan, en un archivo de almacenamiento |
| `npm run build` | Pasa; advierte sobre tamaño del bundle, imports dinámicos que también son estáticos y datos de Browserslist antiguos |
| `npm run lint` | Falla con 15 errores y 7 advertencias |

Estos resultados son una referencia fechada, no una garantía permanente. Las fallas de lint incluyen reglas de hooks/pureza y expresiones, variables o escapes señalados por ESLint. Comparar con el estado de partida para distinguir problemas nuevos de los existentes; no desactivar reglas ni reformatear todo el código como parte incidental de otro bug.

### Validación manual a cargo del usuario

Esta lista orienta la prueba del usuario; no es una tarea que deba ejecutar el agente:

- UI móvil: safe areas, teclado, sheets por encima del BottomNav y botones visibles con imágenes altas.
- Fotos: cámara y galería por separado, selección múltiple donde exista, fecha EXIF, portada y eliminación.
- Fechas y calendario: conservar el día local, recordatorios, edición de cuidados y eventos asociados.
- Persistencia y backup: recarga, exportación y restauración con datos de prueba. Probar `Reemplazar` en un perfil de navegador aislado; no sobre la colección personal.
- IA: proveedor y modelo configurados, idioma y manejo de errores. Una prueba real requiere red y una clave del usuario; no afirmar que se ejecutó si no se hizo.
- Offline/PWA: probar el build servido y previamente cargado; distinguir datos locales de las funciones de IA que requieren conexión.

El agente entrega los resultados de las validaciones de código y una indicación breve del recorrido que necesita comprobar el usuario. Seleccionar lo pertinente al cambio, sin añadir una ronda de uso de la app por parte del agente.

## 6. Versiones y publicación

La versión de referencia es `1.6.0` (2026-10-28). Una edición exclusivamente documental no requiere cambiar la versión de la aplicación.

Cuando el usuario solicite publicar una versión:

1. Revisar los cambios que se integrarán desde `develop` y ejecutar las verificaciones aplicables. Si existen fallas previas, informarlas y no presentar el resultado como completamente limpio.
2. Actualizar la versión en `package.json` y la metadata correspondiente de `package-lock.json`. La bienvenida, el modal de novedades y Ajustes consumen `APP_VERSION` desde `src/utils/appVersion.ts`, que obtiene la versión de `package.json`; no mantener números de versión duplicados en esas pantallas.
3. Actualizar [CHANGELOG.md](CHANGELOG.md) con la fecha real y el comportamiento de esa versión, sin convertir automáticamente los ítems `en revisión` en `resuelto`. Preparar el resumen `releaseNotes.bullets` en `src/i18n/es.json` y `src/i18n/en.json`, correspondiente a esa entrega. **El usuario debe revisar y aprobar el texto del modal antes de publicar**: presentar el texto completo si todavía no lo aprobó; conservar literalmente el español aprobado y su traducción fiel. No generar el resumen automáticamente desde el changelog ni cambiarlo después de la aprobación sin volver a presentarlo. Si ya aprobó el texto de esa entrega y no cambió, no pedir la misma aprobación de nuevo.
4. Integrar `develop` en `main` y publicar los commits como parte de la tarea de release. Si se crea un tag, asociarlo al commit que contiene la versión publicada; no hay automatización de tags ni de GitHub Releases en el workflow actual.
5. Comprobar el resultado de GitHub Actions. El usuario prueba la URL publicada, incluida la carga/actualización de la PWA. Revisar la wiki si cambian las instrucciones para usuarios.

El workflow [deploy.yml](../.github/workflows/deploy.yml) ejecuta `npm ci --legacy-peer-deps` y `npm run build`, y publica `dist/` en GitHub Pages. Actualmente no ejecuta tests ni lint, y no se dispara por cambios en `develop`. Incorporar esos controles a CI queda para un cambio posterior junto con el tratamiento del lint existente; esta mejora documental no modifica el despliegue.

## 7. Mantenimiento de documentos

La regla de reutilización y consistencia de componentes está en [AGENTS.md](../AGENTS.md#convenciones-y-arquitectura). Antes de implementar un cambio de interfaz, identificar la referencia existente y sus consumidores; extraer y compartir la implementación cuando esté inline, respetando su presentación y comportamiento. Las diferencias entre pantallas deben responder a una necesidad funcional, sin crear diseños independientes para la misma tarea.

- Cambios de proceso: esta guía y, si cambia una regla para agentes, `AGENTS.md`.
- Cambios técnicos: `SPEC.md`; usar enlaces al código en vez de copiar interfaces completas.
- Cambios de comportamiento o alcance: módulo correspondiente de `FUNCTIONAL_SPEC.md`. Distinguir implementado, previsto y pendiente de validación.
- Correcciones y pedidos: backlog con su estructura actual; conservar el historial y la confirmación del usuario.
- Publicaciones: changelog, versión declarada y textos visibles.

Actualizar únicamente lo afectado por la tarea. No se exige un informe adicional ni un documento por bug.
