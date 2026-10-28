# NiwaMirî — Especificación Funcional

> **Aplicación de referencia:** 1.6.0 — Revisión documental: 2026-10-28
>
> **Tipo de aplicación:** Progressive Web App (PWA)
>
> **Plataformas:** Android · iOS (instalable en pantalla de inicio)
>
> **Idiomas:** Español / Inglés (bilingüe)
>
> **Almacenamiento inicial:** Local — IndexedDB en el dispositivo
>
> **Almacenamiento futuro:** Supabase como alternativa prevista, sin implementación actual
>
> **Proveedor de IA:** Configurable — Gemini, OpenAI, Claude (Anthropic)

---

Este documento conserva requisitos del diseño inicial y los contrasta con la implementación 1.6.0. Los apartados marcados **previsto** no describen funciones disponibles ni comprometen una nueva entrega. Las diferencias se documentan para orientar el mantenimiento; no se eliminan requisitos para dar por resuelto un bug.

**Cambios incluidos en v1.5.0:** B026 (historial completo) y F033–F035 (carga masiva, filtros y detalles por tipo) fueron probados y confirmados por el usuario el 2026-10-28; están en estado `resuelto`.

**Cambios incluidos en v1.6.0:** B027–B029, M015 y F036–F038 están implementados y `en revisión`, pendientes de la prueba del usuario.

El procedimiento de trabajo está en [DEVELOPMENT.md](DEVELOPMENT.md), la arquitectura vigente en [SPEC.md](SPEC.md) y el estado de validación de los cambios en [BACKLOG.md](BACKLOG.md). Tener un módulo implementado no implica que todos sus requisitos originales estén completos o confirmados por el usuario.

## Índice

1. [Introducción](#1-introducción)
2. [Arquitectura General](#2-arquitectura-general)
3. [Módulos Funcionales](#3-módulos-funcionales)
4. [Especificación Detallada por Módulo](#4-especificación-detallada-por-módulo)
5. [Modelo de Datos](#5-modelo-de-datos)
6. [Integraciones de Inteligencia Artificial](#6-integraciones-de-inteligencia-artificial)
7. [Navegación y Estructura de Pantallas](#7-navegación-y-estructura-de-pantallas)
8. [Requerimientos No Funcionales](#8-requerimientos-no-funcionales)
9. [Stack Tecnológico](#9-stack-tecnológico)
10. [Glosario](#10-glosario)
11. [Pendientes y Decisiones Abiertas](#11-pendientes-y-decisiones-abiertas)

---

## 1. Introducción

### 1.1 Propósito del documento

Este documento describe la especificación funcional de NiwaMirî, una Progressive Web App (PWA) diseñada para la gestión integral de colecciones de árboles Bonsai. Está orientado a uso personal y grupal (compañeros de clase), permitiendo registrar el historial completo de cada ejemplar, gestionar cuidados, tomar notas de clases, y aprovechar inteligencia artificial para diagnósticos, recomendaciones y consultas especializadas.

### 1.2 Contexto y motivación

El cultivo de Bonsai es una disciplina que combina técnica, arte y ciencia. Cada árbol requiere un seguimiento personalizado a lo largo de años o décadas: registro de podas, riegos, alambrados, trasplantes, tratamientos, y evolución fotográfica. Hoy este seguimiento se hace en anotaciones dispersas, sin estructura ni acceso fácil desde el celular.

NiwaMirî nace para centralizar todo ese conocimiento en una app mobile-first, sin necesidad de infraestructura propia, con inteligencia artificial integrada que acompaña al cultivador en cada decisión.

### 1.3 Alcance

- Gestión completa del inventario de ejemplares Bonsai
- Registro histórico de todos los tipos de cuidados por árbol
- Galería fotográfica por ejemplar con soporte para fotos desde cámara
- Identificación de especie por fotografía mediante visión por IA
- Notas de clases por especie con resúmenes inteligentes contextuales
- Consultas libres a IA en el contexto de cada ejemplar
- Calendario de cuidados con recordatorios manuales y propuestas de seguimiento por IA a pedido del usuario
- Ficha técnica por especie generada por IA o creada manualmente; catálogo precargado previsto
- Onboarding guiado para configuración de API key de IA
- Backup y restauración de datos en formato portable
- Interfaz bilingüe (español / inglés)

### 1.4 Usuarios objetivo

| Perfil | Descripción |
|---|---|
| Usuario primario | Cultivador de Bonsai con conocimiento técnico medio-avanzado, estudiante de clases formales de Bonsai |
| Usuario secundario | Compañeros de clase con perfil similar, que instalan la app en su propio dispositivo y configuran su propia API key |
| Perfil técnico | Ingenieros / profesionales con comodidad para seguir guías de configuración |

---

## 2. Arquitectura General

### 2.1 Tipo de aplicación

NiwaMirî es una Progressive Web App (PWA). Funciona como un sitio web avanzado que puede instalarse en la pantalla de inicio del teléfono y comportarse como una app nativa. No requiere publicación en App Store ni Play Store.

- ✅ Sin servidores propios — toda la lógica corre en el dispositivo del usuario
- ✅ Gestión local offline tras la carga inicial; las operaciones de IA requieren conexión
- ✅ Instalable en Android e iOS desde el navegador
- Compatibilidad objetivo del diseño: Chrome 90+ en Android y Safari 16.4+ en iOS; requiere validación con el build y los dispositivos usados
- ✅ Diseñada para migración futura a almacenamiento en la nube (Supabase)

### 2.2 Principio de capa de abstracción de datos

El objetivo arquitectónico es que la UI acceda mediante `StorageService`. La implementación actual tiene accesos directos heredados para conversaciones y contadores, además de las utilidades de backup. Las excepciones están detalladas en [SPEC.md](SPEC.md); una migración a la nube requeriría tratarlas y completar el contrato de almacenamiento.

```
[ UI / Componentes ]
        ↓
[ StorageService ]   ← capa abstracta, único punto de acceso
        ↓
[ IndexedDB ]  →  (futuro)  →  [ Supabase / Firebase ]
```

| Capa | Responsabilidad | Tecnología inicial | Tecnología futura |
|---|---|---|---|
| UI / Componentes | Pantallas e interacción | React | Sin cambios |
| StorageService | Abstracción de datos | Interfaz TS y métodos adicionales en la implementación | Completar contrato y cubrir excepciones |
| Implementación local | Persistencia en dispositivo | Dexie.js / IndexedDB | Reemplazable |
| Implementación nube | Sincronización multi-dispositivo | — | Supabase / Firebase |

### 2.3 Principio de capa de abstracción de IA

Todas las funciones de IA pasan por un `AIService` que delega en el proveedor configurado por el usuario. Agregar un nuevo proveedor en el futuro no requiere modificar ninguna pantalla.

| Proveedor | Configuración en la aplicación | Visión |
|---|---|---|
| Google Gemini | API key y modelo del usuario | Sí |
| OpenAI | API key y modelo del usuario | Sí |
| Anthropic Claude | API key y modelo del usuario | Sí |

Las opciones de modelos y sus defaults se consultan en Configuración, onboarding y proveedores del código. Las listas iniciales incluían modelos antiguos; su disponibilidad, cuotas y costos deben comprobarse con el proveedor cuando se cambie la integración. No se presupone que un plan gratuito siga vigente.

---

### 2.4 Distribución de la aplicación

La app se distribuye como archivos estáticos:
- GitHub Pages — publicación configurada desde `main` mediante GitHub Actions
- Netlify / Vercel — alternativas de hosting estático, sin configuración de despliegue en este repositorio

Cada usuario comparte la misma URL, instala la PWA, y configura su propia API key. Los datos de cada usuario son estrictamente locales a su dispositivo.

---

## 3. Módulos Funcionales

| # | Módulo | Descripción |
|---|---|---|
| M1 | Onboarding y Configuración | Primera experiencia de usuario, setup de API key, idioma |
| M2 | Inventario de Ejemplares | Alta, edición y listado de árboles Bonsai |
| M3 | Ficha del Ejemplar | Vista detallada con secciones colapsables |
| M4 | Registro de Cuidados | Log histórico de todos los cuidados por árbol |
| M5 | Galería Fotográfica | Fotos por árbol organizadas en línea de tiempo |
| M6 | Notas de Clases | Notas asociadas a especie + ejemplar + cuidado |
| M7 | Ficha Técnica de Especie | Información técnica editable, generada por IA o manual |
| M8 | Asistente IA por Ejemplar | Chat contextual con historial del árbol |
| M9 | Calendario y Recordatorios | Calendario, recordatorios y edición de eventos |
| M10 | Identificación por Foto | Identificación de especie mediante IA de visión |
| M11 | Backup y Restauración | Export/import de todos los datos |
| M12 | Configuración Global | Idioma, proveedor IA, API key, preferencias |
| M13 | Bitácora de Conocimiento | Notas generales de clase sin árbol de referencia, organizadas por etiquetas |
| M14 | Asistente IA General | Chat libre con IA con acceso al inventario y la bitácora del usuario |

---

## 4. Especificación Detallada por Módulo

### M1 — Onboarding y Configuración Inicial

Pantalla de bienvenida que aparece únicamente la primera vez que se abre la app. Guía al usuario a través de un asistente de 4 pasos.

#### Flujo del asistente

| Paso | Título | Contenido |
|---|---|---|
| 1 | Bienvenida | Nombre y logo de la app. Descripción breve. Botón Comenzar. |
| 2 | Elegir proveedor de IA | Tarjetas visuales con Gemini (recomendado / gratuito), OpenAI y Claude. |
| 3 | Obtener API Key | Instrucciones paso a paso con link directo a la consola del proveedor. |
| 4 | Verificar conexión | Campo para pegar la API key. Botón Verificar con llamado de prueba. |

#### Reglas de negocio

- Si ya completó el onboarding (flag en IndexedDB), no se muestra al abrir la app
- El usuario puede omitir el paso de API key y configurarla luego desde Ajustes
- La API key se guarda cifrada en IndexedDB — nunca en texto plano
- Si la verificación falla, se muestra el error específico del proveedor

#### Pantalla de bienvenida estacional (por sesión)

Al abrir la app en una sesión nueva (1 vez por sesión, no por día), se muestra una pantalla de bienvenida distinta al onboarding:

- Logo, versión, saludo y emoji de la estación actual
- Contador de eventos pendientes hasta el momento actual, con acceso al Calendario
- Aviso de backup si hay árboles y nunca se exportó, o si hay más de tres registros nuevos de cuidados/fotos/notas de clase desde el último backup
- Auto-cierre a los 10 segundos, suspendido cuando hay alerta de backup; también permite cierre manual

#### F038 — Modal de novedades por versión, previo a la bienvenida (implementado en v1.6.0, en revisión)

Mostrar dos modales en secuencia cuando haya novedades pendientes: primero «Novedades de esta versión», con 3–5 bullets breves orientados al usuario; al pulsar «Continuar», cerrarlo y mostrar la bienvenida habitual de `WelcomeScreen`. Solo un modal está abierto a la vez.

- Comparar la versión instalada con la última reconocida en ese dispositivo/navegador. Si son distintas, mostrar novedades; si aún no existe registro, mostrarlas una vez después del onboarding. Detectar la versión del código cargado, sin consultas remotas.
- El modal de novedades no tiene auto-cierre. Únicamente al pulsar «Continuar» se guarda la versión como vista y se pasa a la bienvenida. Una recarga previa a esa acción no debe marcar las novedades como leídas.
- La bienvenida posterior conserva su saludo, resumen, accesos a Calendario/Backup y reglas actuales. Su temporizador de 10 segundos comienza al mostrarse, y sigue suspendido cuando hay alerta de backup.
- Si la versión no cambió, mostrar únicamente la bienvenida habitual, con su frecuencia actual de una vez por sesión. No repetir el modal de novedades.
- Una actualización con novedades pendientes inicia la secuencia completa aunque la bienvenida ya se hubiera mostrado en esa sesión.
- Si se omitieron versiones intermedias, presentar únicamente el resumen de la versión instalada. Los textos se preparan en español e inglés durante la publicación y requieren revisión y aprobación del usuario antes de publicar. Respetar literalmente el texto aprobado; el changelog sirve como referencia, sin extracción automática. No mostrar IDs internos, pruebas ni detalles técnicos. El texto en español de v1.6.0 fue proporcionado y aprobado por el usuario; su fuente está en `releaseNotes.bullets` de [es.json](../src/i18n/es.json).
- El resumen se incluye en la aplicación y funciona offline. El registro de lectura es local al dispositivo y no forma parte del backup de la colección. Usar una única fuente de versión para el resumen y las versiones visibles de bienvenida/Ajustes.
- Ambos utilizan `StartupModal`, extraído de la bienvenida, como estructura visual compartida: overlay, tarjeta, cabecera y botón, conservando sus tokens, tipografía, espaciados y formato. El contenido de cada paso permanece separado. Permitir desplazamiento en pantallas pequeñas para que el contenido y los botones sean accesibles.

**Criterios cubiertos con pruebas de código (pendiente validación del usuario):** primera apertura sin registro, versión nueva y actualización dentro de la misma sesión muestran novedades y luego bienvenida; nunca se superponen; «Continuar» reconoce la versión y evita repeticiones; recargar sin continuar conserva el aviso; el temporizador de bienvenida comienza solo en su paso; omitir versiones muestra solo la actual; ambos idiomas y los accesos a Calendario/Backup mantienen su comportamiento. Cubrir estos casos mediante pruebas de código; la revisión visual corresponde al usuario.

---

### M2 — Inventario de Ejemplares

Pantalla principal de la app. Muestra la colección en grilla de tarjetas o lista; F037 (v1.6.0) oculta los fallecidos por defecto y permite mostrarlos desde filtros.

#### Funcionalidades

- Listado en grilla con foto arriba y datos abajo (nombre, especie en itálica, edad calculada, último cuidado)
- Alternancia entre vista grilla y vista lista
- Buscador por nombre o especie
- Filtro por especie: chips horizontales con selección múltiple, generados de la colección. Muestran el nombre común si existe y filtran por la especie almacenada
- Filtro por etiquetas: chips `#tag` que se generan a partir de los tags asignados a los árboles; selección múltiple AND (solo muestra árboles que tengan todos los tags seleccionados)
- Panel avanzado con estado, estilo, tamaño, rango de edad y antigüedad de adquisición. Se combina con búsqueda y filtros rápidos; el badge cuenta grupos de filtros avanzados activos
- Estación y chip de pendientes en el header compartido. El chip considera vencidos y próximos siete días
- Indicador visual de árboles con cuidados pendientes: círculo naranja sobre la foto (top-left)
- FAB (+) expandible: al tocar muestra dos opciones — **Nuevo bonsai** (abre el sheet de alta) e **Identificar con IA** (navega a M10). El ícono rota 45° al expandirse para indicar cierre

#### F037 — Ocultar fallecidos por defecto (implementado en v1.6.0, en revisión)

- En Mi Colección, excluir inicialmente solo los árboles con estado `dead`, tanto en grilla como en lista. Los demás estados mantienen su comportamiento actual.
- Agregar el check **«Mostrar árboles fallecidos»** al panel de filtros avanzados existente, desmarcado al abrir la pantalla y al limpiar los filtros. Al marcarlo se permite incluir los fallecidos, combinando búsqueda, especies, etiquetas y los demás criterios habituales.
- Conservar el filtro de estado para consultar exclusivamente fallecidos. Elegir ese estado activa también el check; desmarcar el check retira «Fallecido/Muerto» de los estados seleccionados para evitar una combinación contradictoria, conservando los demás estados.
- El botón de filtros siempre abre el panel, incluso con filtros activos; mantiene el badge y la limpieza dentro del panel. Mostrar fallecidos cuenta dentro del grupo de estado/visibilidad, sin sumar dos veces por seleccionar también el estado fallecido.
- Si existen árboles pero todos quedan ocultos, informar que no hay coincidencias y permitir abrir los filtros; no mostrar la colección como si no se hubieran registrado árboles.
- Es un criterio de visualización de Mi Colección: se conservan los árboles y sus historiales, accesibles al mostrarlos. No filtrar globalmente el almacenamiento ni modificar el estado de los ejemplares.

Se reutilizan el panel y las tarjetas actuales. CheckboxRow comparte el check existente de la selección masiva con los filtros de Mi Colección, manteniendo su diseño. Las pruebas de componentes cubren exclusión inicial, activar/desactivar, estado fallecido sincronizado, combinación de filtros, limpieza, cancelación, ambas vistas, traducción y colección con solo fallecidos. Pendiente prueba y confirmación del usuario en la aplicación.

#### Datos del ejemplar

| Campo | Tipo | Requerido | Notas |
|---|---|---|---|
| Nombre / Apodo | Texto | Sí | Nombre que el usuario le da al árbol |
| Especie | Texto + autocompletar | Sí | Nombre científico; vincula con Ficha Técnica y Notas |
| Nombre común | Texto | No | Se muestra como nombre principal en tarjetas y ficha; la especie queda en itálica secundaria |
| Estilo de Bonsai | Lista | No | Chokkan, Moyogi, Shakan, Kengai, Han-Kengai, Hokidachi, Fukinagashi, Yose-ue, Literati, Otros |
| Fecha de adquisición | Fecha | No | Cuándo se incorporó a la colección |
| Año de germinación estimado | Año (número) | No | La app calcula y muestra edad automáticamente con prefijo `~` (ej: `~35 años`) |
| Origen | Lista | No | Prebonsai, Yamadori, Semilla, Esqueje, Regalo, Compra |
| Tamaño / Categoría | Lista | No | Shito (<5 cm), Mame (5–15 cm), Shohin (15–25 cm), Chuhin (25–45 cm), Dai (>45 cm) |
| Maceta / Sustrato | Texto | No | Descripción libre |
| Ubicación habitual | Texto | No | Interior, exterior, invernadero, etc. |
| Estado actual | Lista | Sí | En desarrollo, En mantenimiento, En recuperación, Donado, Muerto |
| Notas generales | Texto largo | No | Observaciones libres |
| Etiquetas | Tags libres | No | Chips editables; el usuario escribe sus propias etiquetas para clasificar y filtrar árboles |
| Foto principal | Imagen | No | Foto de portada del árbol |

---

### M3 — Ficha del Ejemplar

Vista detallada de un árbol, con seis secciones colapsables. El FAB (+) ofrece accesos a registrar cuidado, agregar nota de clase y agregar foto. También permite exportar un backup del ejemplar.

#### Secciones

| Sección | Contenido |
|---|---|
| Hero photo | Foto principal + edad calculada + estado del árbol |
| Stats rápidos | Cantidad de cuidados, fotos, notas, días desde último cuidado |
| 📋 Resumen | Datos principales del árbol en grilla de dos columnas + notas generales |
| ✂️ Cuidados | Hasta cinco cuidados recientes; «Ver todos» abre el listado completo con búsqueda, edición y eliminación |
| 📷 Galería | Grilla de miniaturas con contador de fotos restantes |
| 📝 Notas de Clase | Notas de especie y del ejemplar con tag de vínculo |
| 📖 Ficha Técnica | Información de la especie con badge de origen |
| ✨ Asistente IA | Chat contextual para consultas sobre este árbol |

#### Acciones disponibles

- Editar datos del ejemplar
- Registrar nuevo cuidado (FAB)
- Agregar foto nueva
- Eliminar ejemplar (con confirmación)

---

### M4 — Registro de Cuidados

Módulo central de la aplicación. Formulario con panel IA contextual integrado.

**Estado:** B026 y F033–F035 están incluidos en v1.5.0 y en estado `resuelto`. El usuario aprobó el diseño el 2026-10-27 y confirmó las pruebas de la aplicación el 2026-10-28.

#### Tipos de cuidados soportados

Están disponibles 14 tipos: Riego, Fertilización, Poda de mantenimiento, Poda estructural, Alambrado, Retiro de alambre, Trasplante, Poda de raíces, Defoliación, Tratamiento fitosanitario, Jin / Shari, Reubicación, Observación y Otro. Los formularios individual y masivo comparten campos comunes y detalles especializados opcionales, definidos en F035, más abajo.

#### Campos comunes a todos los tipos

- Fecha del cuidado (selector de día; el timestamp se ancla a mediodía local)
- Tipo de cuidado (selector chips)
- Descripción / observaciones (texto libre)
- Fotos adjuntas (0 a N, desde cámara o galería)
- Estado del árbol (Bien / Regular / Con problemas)
- Recordatorio de seguimiento — con botón **"✨ Sugerir con IA"**

#### Sugerencia de recordatorio por IA

Al tocar "Sugerir con IA", se envía al modelo el tipo de cuidado, especie y estación del año. La sugerencia se muestra como texto pre-cargado editable dentro del formulario. Ejemplos:

- Alambrado en primavera → *"Revisar que el alambre no muerda la corteza — en 3 semanas"*
- Poda estructural en verano → *"Verificar brotación y cicatrización de cortes — en 2 semanas"*
- Trasplante → *"Revisar estado de raíces y humedad del sustrato — en 10 días"*
- Tratamiento fitosanitario → *"Segunda aplicación de fungicida — en 7 días"*

#### Panel contextual de IA

Al expandir el panel, y si hay clave configurada, se solicita un resumen de las notas de clase de la especie y del ejemplar, unidas sin duplicados y con las del ejemplar primero. No bloquea el formulario.

**Previsto:** incorporar al resumen intervenciones del mismo tipo, contexto estacional adicional y notas de bitácora por etiqueta. La sugerencia de recordatorio usa los datos del cuidado, la especie, la condición del árbol y la estación. Enriquecer el prompt con cuidados recientes o notas sigue previsto.

#### Historial de cuidados

La ficha del árbol muestra hasta cinco cuidados recientes. «Ver todos» abre una pantalla completa con el mismo patrón visual de Notas de clase; el acceso también está disponible si hay cinco cuidados o menos (sin registros se muestra «Ver cuidados»).

- Listado completo en orden cronológico descendente, sin límite de cinco.
- Búsqueda por tipo de cuidado, observaciones y condición del árbol, con estado vacío y mensaje sin resultados.
- Cada tarjeta muestra tipo, fecha, condición y observaciones, y ofrece editar y eliminar.
- Editar abre el formulario existente; guardar vuelve al listado actualizado. Se conservan ID, fecha de creación y vínculos con fotos y notas, y se actualiza el calendario.
- Eliminar requiere confirmación. Quita el cuidado y sus eventos vinculados; conserva las fotos en la galería, la portada y las notas del árbol, retirando sus referencias al cuidado eliminado.
- Botón «+» para un nuevo cuidado; al guardar vuelve al listado.
- Los recordatorios nuevos incluyen el ID del cuidado. Los antiguos sin ID se asocian por tipo, fecha y descripción solo si hay un único cuidado coincidente; si la relación es ambigua se conservan para no borrar seguimientos de otros cuidados.

**Previsto:** las miniaturas de cada entrada se mantienen como mejora posterior. Los filtros implementados se detallan en F034, más abajo.

#### Alcance de la ampliación en v1.5.0

Registrar una misma intervención en varios árboles sin repetir el formulario, consultar después qué se hizo y conservar detalles como producto, dosis o calibre del alambre.

| Ítem | Funcionalidad | Estado de producto |
|---|---|---|
| F033 | Registrar cuidados en varios árboles | Implementado y validado |
| F034 | Filtros del historial de cuidados | Implementado y validado |
| F035 | Características específicas por tipo | Implementado y validado para los 14 tipos |

**Decisión del usuario:** en una carga masiva se puede asignar el mismo estado y observaciones a todos los árboles o elegirlos por árbol. El diseño completo fue aprobado antes de implementar.

Se mantienen los 14 tipos de cuidado actuales. Esta ampliación no reactiva F023, que fue descartado y trataba de tipos nuevos agrupados en subcategorías.

#### F033 — Cuidados masivos (implementado y validado)

##### Entrada y navegación

Desde el FAB expandible de **Colección**, «Registrar cuidados» abre un flujo de tres pasos, manteniendo el header con volver y los patrones visuales actuales:

```text
Seleccionar árboles → Completar cuidado → Revisar y guardar
```

El «+» del historial de un árbol conserva el registro individual. Ambos modos comparten campos, validaciones y presentación de los detalles de cada tipo.

##### Paso 1: seleccionar árboles

- Mostrar nombre, especie/nombre común y foto o ícono de cada ejemplar, con selección múltiple explícita.
- Buscar por nombre o especie y filtrar por especie y etiquetas, con los mismos criterios del Inventario.
- Mostrar inicialmente árboles en desarrollo, mantenimiento o recuperación. Una opción permite incluir donados o muertos para registrar intervenciones históricas.
- «Seleccionar visibles» afecta solo los resultados mostrados por la búsqueda/filtros. «Quitar selección» limpia la selección completa.
- Cambiar filtros no elimina los árboles seleccionados que queden ocultos. Mantener visible el contador y un acceso a la selección completa.
- Permitir continuar con al menos un árbol; no obligar a seleccionar dos si el usuario termina trabajando con uno.

##### Paso 2: completar el cuidado

Datos comunes de la carga:

| Dato | Regla |
|---|---|
| Tipo de cuidado | Uno para toda la carga |
| Fecha | Una fecha local, precargada con hoy y editable |
| Detalles del tipo | Mismo producto, dosis, método, calibres u otros detalles para todos |
| Estado y observaciones | Modo «Iguales para todos» o «Por árbol», según lo elegido |
| Seguimiento | Recordatorio común opcional, manual o con sugerencia de IA a pedido (F036, v1.6.0); cada cuidado tiene su evento vinculado al guardar |

El estado registrado es la condición del árbol en el cuidado (Bien/Regular/Problemático), no el estado del inventario (En desarrollo/Mantenimiento/etc.). No modificar automáticamente el estado del inventario.

###### Estado y observaciones iguales para todos

Mostrar una condición y un texto de observaciones. Aplicarlos a todos los seleccionados. La condición requiere una elección explícita en el modo masivo; no asumir que todos están «Bien».

###### Estado y observaciones por árbol

- Mostrar tarjetas o filas expandibles con nombre del árbol, condición y resumen de observaciones.
- Ofrecer valores comunes y «Aplicar a todos» para completar rápidamente la carga; luego permitir ajustar cada excepción.
- Cada árbol necesita una condición. Sus observaciones son opcionales y pueden quedar vacías.
- Al pasar del modo común al individual, iniciar los registros con los valores comunes ya ingresados.
- Si se vuelve al modo común y hay diferencias, confirmar antes de reemplazar los ajustes individuales. Mantenerlos mientras no se confirme.
- Conservar el trabajo al plegar una tarjeta, cambiar de paso o ajustar la selección. Un árbol agregado más tarde toma los valores comunes disponibles y queda pendiente si aún no tiene condición.

En el primer alcance, las fotos se agregan después desde cada árbol/cuidado; no se duplican adjuntos en todos los ejemplares. La carga masiva admite seguimiento manual y, con F036 en v1.6.0, una sugerencia común de IA a pedido. No dispara consultas automáticas por cada árbol.

##### Paso 3: revisar y guardar

Mostrar tipo, fecha, detalles comunes, cantidad de árboles y listado de destinatarios. En modo individual, cada fila resume también su condición y observaciones y permite volver a corregirlas.

La acción final indica el alcance: **«Guardar en N árboles»**. Hasta ese momento no se escriben registros. Al completar, informar cuántos cuidados se registraron y volver a Colección.

##### Resultado y reglas de guardado

- Crear un cuidado independiente por árbol, cada uno con ID propio y su evento de calendario; agregar seguimiento vinculado si se solicitó.
- Los registros aparecen en cada historial, en sus contadores y en Calendario igual que un cuidado individual.
- Editar o eliminar después afecta solo al cuidado elegido. La primera versión no ofrece edición ni eliminación conjunta de una carga ya guardada.
- Guardar cuidados y eventos de toda la selección en una única transacción. Si algo falla, no conservar una carga parcial y mantener el borrador para reintentar.
- Quitar IDs repetidos de la selección y bloquear doble envío mientras se guarda. No prohibir intervenciones legítimas con el mismo tipo y fecha.
- Volver a validar que existan los destinatarios y los datos requeridos al guardar. Un error identifica qué hay que corregir antes de escribir.
- No crear una tabla de lotes ni un catálogo de productos para este primer alcance: cada cuidado conserva una copia de sus datos.

#### F034 — Filtros del historial (implementado y validado)

Aplicar en la pantalla **Cuidados de un árbol**, sobre el historial completo y junto al buscador que ya existe. Mantener el patrón del Inventario: botón de filtros, sheet inferior, badge, chips activos removibles y acción de limpieza.

| Filtro | Control y comportamiento |
|---|---|
| Tipo de cuidado | Chips de selección múltiple; sin selección equivale a todos |
| Fecha | Todo el historial, últimos 7/30/90 días o rango personalizado |
| Fotos | Todos / Con fotos / Sin fotos |

- Combinar grupos con AND; los tipos seleccionados se combinan con OR.
- Un rango incluye completos el día inicial y el final, en horario local. Permitir límites abiertos; rechazar un inicio posterior al final.
- Los períodos rápidos incluyen hoy. Calcular por días de calendario locales, sin conversiones UTC ni asumir que todos los días duran 24 horas.
- «Con fotos» usa fotos vinculadas al cuidado, no cualquier foto de la galería del árbol.
- La búsqueda combina los filtros y contempla tipo, condición, observaciones y los detalles guardados (por ejemplo producto o calibre).
- Mostrar «X de Y cuidados», conservando orden del más reciente al más antiguo.
- «Limpiar filtros» restablece los filtros y conserva el texto de búsqueda; la búsqueda tiene su propia limpieza.
- Diferenciar historial vacío de búsqueda/filtros sin coincidencias. Ofrecer limpiar filtros en el segundo caso.
- Conservar búsqueda y filtros al abrir un cuidado, guardar cambios y volver. Si el registro deja de cumplir el filtro, desaparece de ese resultado y se informa que fue actualizado.
- Eliminar actualiza resultados y contadores conservando los filtros; no ofrece operaciones sobre todos los resultados.

Los filtros por producto específico o por origen masivo pueden evaluarse después. El buscador permite localizar productos sin agregar un catálogo ni más controles.

#### F035 — Detalles por tipo de cuidado (implementado y validado)

##### Presentación y captura

La sección **«Detalles del cuidado»** se muestra debajo de tipo y fecha, con campos que cambian según el tipo seleccionado. Los controles usan el mismo diseño del formulario actual: chips para opciones breves, selectores cuando hay muchas opciones e inputs con unidad para cantidades.

Los detalles son opcionales para conservar el registro rápido y permitir datos antiguos incompletos. Si se completa una cantidad/dosis, exigir su unidad; los números deben ser válidos y no negativos (dosis y calibres, mayores que cero). Aceptar coma decimal del teclado en español. Los porcentajes se limitan a 0–100.

La sección se utiliza tanto en cuidados individuales como masivos. En el historial, cada tarjeta muestra un resumen compacto de los detalles; al editar se recuperan todos.

##### Catálogo de los 14 tipos

| Tipo actual | Características implementadas | Controles principales |
|---|---|---|
| Riego | Método, volumen aplicado por árbol, drenaje observado | Método: regadera/inmersión/aspersión/otro; número + ml/L; texto opcional |
| Fertilización | Producto, presentación, dosis y unidad, método, NPK opcional, cantidad aplicada por árbol opcional | Producto con autocompletado; sólido/líquido/otro; dosis numérica + unidad; método; NPK como texto de etiqueta |
| Poda de mantenimiento | Zona trabajada, objetivo, intensidad, herramienta opcional | Texto de zona/objetivo; ligera/media/fuerte; texto de herramienta |
| Poda estructural | Ramas o zonas intervenidas, cambio buscado, intensidad, sellador utilizado si corresponde | Textos; intensidad; producto opcional |
| Alambrado | Material, uno o varios calibres en mm, zona trabajada y fecha prevista de revisión/retiro | Aluminio/cobre/otro; lista repetible de calibre + zona; fecha opcional |
| Retiro de alambre | Zona, material/calibres retirados, tiempo aproximado colocado y resultado observado | Textos, calibres numéricos, duración + unidad |
| Trasplante | Maceta anterior/nueva, sustrato utilizado, porcentaje estimado de raíces retiradas, estado de las raíces | Textos; porcentaje; observaciones de raíces |
| Poda de raíces | Porcentaje estimado retirado, zona trabajada, estado observado, sustrato renovado y herramienta opcional | Porcentaje y textos |
| Defoliación | Parcial/total, zona trabajada, porcentaje estimado si fue parcial, objetivo y fecha esperada de rebrote | Selector, texto, porcentaje condicional, texto y fecha opcional |
| Tratamiento de plagas | Plaga/enfermedad observada, producto, dosis y unidad, método de aplicación | Textos y producto con autocompletado; dosis + unidad; método |
| Jin / Shari | Técnica, zona intervenida y producto aplicado si corresponde | Jin/shari/ambos; texto de zona; producto opcional |
| Reubicación | Ubicación anterior/nueva, motivo, condiciones de luz si se quieren registrar | Textos; selector de luz con opción «Otro» |
| Observación | Zona observada y síntoma/evolución a seguir | Textos opcionales, manteniendo las observaciones comunes |
| Otro | Nombre de la intervención y detalles libres | Texto opcional, sin crear un tipo nuevo automáticamente |

Los controles registran lo realizado; no calculan ni recomiendan dosis o calibres. En fertilización/tratamientos, unidades iniciales como ml/L, g/L, ml/árbol y g/árbol distinguen concentración de cantidad aplicada. El selector de unidad ofrece opciones explícitas y «Otra unidad» para escribir una personalizada (B028, v1.6.0). La dosis es opcional: se puede guardar solo el producto; al ingresar dosis, su unidad es obligatoria. La cantidad aplicada por árbol es un dato separado y opcional, desplegable para una concentración; los datos anteriores se recuperan al editar. No multiplicar ni convertir automáticamente.

En Alambrado, se admite más de un calibre porque un mismo cuidado puede intervenir varias zonas. Los valores son ingresados por el usuario, sin limitarse a un listado fijo de medidas.

La fecha de revisión/retiro reutiliza el recordatorio de seguimiento existente si el usuario decide crearlo; no genera un segundo recordatorio oculto. Vincular automáticamente el retiro a un alambrado anterior, o guardar fotos clasificadas «antes/después», continúa como mejora futura del diseño original.

##### Productos reutilizables sin administrar un catálogo

- Escribir un nombre nuevo o elegir uno usado anteriormente en cuidados de la colección.
- Conservar el nombre escrito como dato histórico del cuidado. No modificar registros anteriores si se usa otro nombre más tarde.
- No guardar ni aplicar automáticamente una dosis anterior al elegir el producto. La dosis se introduce para esta intervención.
- No incorporar inventario, existencias, precios ni gestión de insumos en esta etapa.

##### Cambios de tipo y compatibilidad

- Al editar un cuidado antiguo sin detalles, mostrar campos vacíos y conservar el resto del registro y sus vínculos.
- Si se cambia el tipo con detalles ya cargados, explicar que al guardar se reemplazarán por los correspondientes al nuevo tipo. Conservar el borrador anterior mientras se decide o se cancela.
- No guardar detalles del tipo anterior como si pertenecieran al nuevo.
- Mantener campos desconocidos de un backup cuando el tipo no cambie, aunque esta versión no pueda editarlos.
- Registrar una reubicación no cambia automáticamente la ubicación habitual del inventario.

#### Ajustes del 2026-10-28 — implementados, en revisión (v1.6.0)

La validación de B026 y F029–F035 se conserva como historial. Los siguientes ajustes se registran por separado en B027–B029, M015 y F036. La solución fue aprobada e incluida en v1.6.0; estos nuevos ítems quedan `en revisión` y no reabren los ítems validados.

- **Navegación (B027):** al avanzar o volver entre pasos de la carga masiva, mostrar el inicio del paso. Al entrar a completar, el selector de tipo debe quedar visible debajo del encabezado, sin foco automático que desplace hacia campos inferiores. Conservar selección y borrador.
- **Tarjetas y títulos (M015):** tomar como referencia el recordatorio individual: tarjeta redondeada con borde, título interior en mayúsculas, tamaño y peso actuales, color secundario, espaciado uniforme. Extraer esa presentación compartida para Detalles y Recordatorio; mantener la agrupación accesible sin usar el texto de legend como título visual sobre el borde.
- **Dosis y cantidades (M015):** en Fertilización, mostrar juntos el valor de dosis y su selector de unidad, sin etiquetas «Unidad» repetidas que parezcan pedir el mismo dato. Mantener un único renglón «Dosis de producto» con valor y selector de unidad; el texto de ayuda distingue preparación (ml/L, g/L) de aplicación directa (ml/árbol, g/árbol). Permitir «Otra unidad» y conservar valores históricos. La cantidad realmente aplicada es un dato distinto: ofrecer «Agregar cantidad de preparado aplicada por árbol (opcional)» cuando la dosis sea una concentración, y mostrar su valor/unidad solo al activarlo. Si un registro anterior ya contiene cantidad aplicada, mostrarla y conservarla siempre al editar, aunque utilice otra unidad. Explicar la diferencia sin convertir ni calcular cantidades automáticamente. Revisar el mismo patrón en Tratamiento de plagas y en todos los campos con unidades de los 14 tipos.
- **Unidades visibles (B028):** usar el selector existente del proyecto, con opciones explícitas y «Otra unidad» que habilita texto. La elección debe poder abrirse sin escribir. Conservar las unidades libres de registros antiguos y el autocompletado de productos como función distinta.
- **Recordatorio compartido (B029/M015):** una única implementación para cuidados individuales y masivos, con el diseño del recordatorio individual. Fecha a ancho y altura estables tanto vacía como completa; el botón de IA puede pasar a otra fila en pantallas pequeñas. Agregar «Quitar recordatorio» cuando haya fecha o descripción: limpia ambos valores y deja guardar el cuidado sin seguimiento. Conservar el resto del borrador. Si se intenta guardar un recordatorio incompleto, mostrar qué falta sin crear eventos vacíos; quitar uno existente al editar elimina el seguimiento pendiente conforme a las reglas vigentes.
- **Sugerencia de IA (F036):** incluir el mismo botón, estados de carga, disponibilidad según la clave configurada y error visible en ambos flujos. En masivo, solicitar una sugerencia común para el conjunto seleccionado mediante una consulta explícita, considerando especies, tipo/fecha/detalles del cuidado y condiciones/observaciones registradas. No usar silenciosamente el primer árbol como si representara a todos. Mostrar la propuesta como editable y su alcance de N árboles antes de guardar. Solicitar la sugerencia no guarda eventos. Si falla o se descarta, conservar los datos anteriores; no consultar automáticamente por cada destinatario. Esto amplía el seguimiento exclusivamente manual de la versión publicada v1.5.0.

Criterios cubiertos por pruebas de código: posición y foco al cambiar de paso; mismos componentes/títulos en ambos flujos; unidades seleccionables sin escritura y compatibilidad de unidades personalizadas; recuperación de dosis/cantidad previa al editar; fecha vacía con dimensiones declaradas; limpieza completa del recordatorio y eliminación del pendiente al editar; bloqueo del guardado incompleto; sugerencia masiva con una consulta y contexto del conjunto; fallos y respuestas tardías de IA sin sobrescribir cambios recientes o restaurar un recordatorio quitado. Las pruebas usando la aplicación las realiza el usuario.

#### Entregas y verificación

Se implementaron las cuatro etapas del diseño aprobado:

1. Base compartida de detalles y campos de **fertilización y alambrado** (primer tramo de F035).
2. Carga masiva con ambos modos de estado/observaciones (F033).
3. Filtros del historial (F034; puede implementarse independientemente).
4. Completar el catálogo de los demás tipos (resto de F035).

F035 incluye los 14 tipos acordados. F033, F034 y F035 están en estado `resuelto`, tras la confirmación del usuario el 2026-10-28.

##### Pruebas de código

- Selección de uno/muchos árboles, sin repetidos; persistencia al cambiar filtros y pasos.
- Estados y observaciones comunes e individuales; herencia de valores comunes, nuevas selecciones y cambio de modo con diferencias.
- Un cuidado/evento/seguimiento por destinatario; rollback de toda la carga ante un error y protección contra doble envío.
- Edición/eliminación individual posterior sin modificar los demás árboles ni perder fotos/notas.
- Combinación de búsqueda y filtros, límites de fechas locales, rangos inválidos y relación real de fotos por cuidado.
- Validación de detalles, unidades y decimales; más de un calibre; detalles visibles y recuperables al editar.
- Backups con y sin detalles, y conservación de datos desconocidos compatibles.
- Tests unitarios/integración, TypeScript, lint y build; sin navegador, automatización de la app ni pruebas manuales del agente.

Las pruebas de código cubren selección y borradores, ambos modos, guardado transaccional y rollback, edición, filtros y compatibilidad de backups. El usuario confirmó las pruebas usando la aplicación el 2026-10-28.

Las decisiones técnicas para estas funcionalidades se documentan en [SPEC.md](SPEC.md#cuidados-masivos-filtros-y-detalles-f033f035).

---

### M5 — Galería Fotográfica

| Funcionalidad | Detalle |
|---|---|
| Vista grilla | Miniaturas en 3 columnas ordenadas por fecha |
| Vista línea de tiempo | Fotos agrupadas por mes/año |
| Foto ampliada | Lightbox con zoom 1×–4× por botones, paneo, flechas entre fotos, contador y edición de descripción y fecha/hora |
| Nueva foto | Inputs separados de cámara y galería, selección múltiple con cola de previsualización. Se precarga fecha/hora EXIF; sin EXIF se usa el día actual a mediodía local. Permite ajustar la fecha antes de guardar |
| Foto de portada | El usuario puede marcar cualquier foto como principal del árbol |
| Eliminación | Confirmación en dos pasos; se cancela al cerrar o cambiar de foto. Acciones ancladas al pie del lightbox |
| Compresión | Automática antes de guardar: máximo habitual 1200 px y calidad según configuración (alta 85%, media 75%, baja 60%) |

---

### M6 — Notas de Clases

#### Modelo de vínculos (Modelo C)

Cada nota tiene **especie como ancla obligatoria** más vínculos opcionales:

| Vínculo | Tipo | Descripción |
|---|---|---|
| Especie | Obligatorio | Ancla principal. Garantiza que la nota aparezca en el contexto de cualquier árbol de esa especie. |
| Ejemplar | Opcional | Vincula la nota a un árbol específico de la colección. |
| Cuidado | Opcional | Vincula la nota a una intervención concreta. |

**Ejemplo:** una nota tomada durante el pinzado de "mi Ficus del rincón" se vincula a: especie *Ficus retusa* + ejemplar *Ficus del rincón* + cuidado *Pinzado del 15/03*. La IA la usa tanto al registrar pinzados en cualquier Ficus como en el contexto específico de ese árbol.

#### Funcionalidades

- Cada nota tiene: especie (obligatorio), fecha de la clase, título opcional, texto libre
- Al crear desde un árbol se guarda su vínculo a ejemplar; al editar se conserva el original. **Previsto:** selector de vínculos opcionales a ejemplar/cuidado desde el formulario
- Vista de lista por especie ordenada por fecha
- La vista del árbol une notas de su especie y del ejemplar sin duplicados. **Previsto:** filtros independientes por especie, ejemplar y tipo de cuidado
- Buscador de texto dentro de las notas
- Edición y eliminación

#### Creación desde el formulario de cuidado (M4)

**Previsto:** crear una nota desde M4 y vincularla automáticamente al cuidado en curso. Actualmente las notas se crean desde la ficha del árbol o su sección Notas de Clase y se vinculan a especie/ejemplar; no hay creación inline desde CareForm.

#### Integración con IA — Resumen contextual

Al registrar un cuidado, el sistema:
1. Recupera todas las notas asociadas a la especie
2. Une sin duplicados las notas de especie y ejemplar, colocando primero las del ejemplar. La priorización por cuidado relacionado sigue prevista
3. Envía al modelo de IA las notas priorizadas, tipo de cuidado y especie mediante `summarizeNotesForCare`
4. La IA devuelve un resumen relevante para el tipo de cuidado; el prompt actual no etiqueta explícitamente el alcance de cada nota
5. El resumen se muestra en el panel contextual del formulario de cuidado

---

### M7 — Ficha Técnica de Especie

#### Fuentes y origen de la ficha

| Fuente | Cuándo se usa |
|---|---|
| Base de datos local | **Previsto:** catálogo precargado de especies; el tipo `local-db` existe pero los seeds actuales no cargan fichas |
| Generación por IA | Bajo demanda para la especie del árbol, con clave configurada; se guarda localmente. |
| Creación manual | Especies muy exóticas, locales o poco documentadas. |
| Edición del usuario | Cualquier ficha puede editarse libremente para corregir errores o adaptar al contexto local. |

Cada ficha muestra un badge de origen: `Base local` · `Generada por IA` · `Editada` · `Manual`.

#### Contenido de la ficha

El contenido se almacena como campos de texto. La edición manual actual ofrece origen, clima, luz, riego, fertilización, poda, trasplante, sustrato, plagas y observaciones. La lista siguiente conserva el alcance temático del diseño, sin implicar campos separados para cada punto:

- Nombre científico y nombres comunes
- Familia botánica y origen geográfico
- Tipo: conífera, caducifolia, tropical, subtropical, broadleaf evergreen
- Requerimientos de luz y temperatura
- Riego: frecuencia, sensibilidad a la sequía y al encharcamiento
- Fertilización: calendario recomendado por estación
- Poda: mejor época, consideraciones específicas
- Alambrado: mejor época, velocidad de engrosamiento de ramas
- Trasplante: frecuencia recomendada, mejor época del año
- Plagas y enfermedades comunes
- Estilos de Bonsai más adecuados
- Observaciones generales y curiosidades

#### Acciones

- Ver ficha en pantalla
- Editar ficha — cualquier campo es editable. Al guardar el primer cambio, el badge cambia a "Editada"
- Crear ficha manual — formulario en blanco
- Abrir versión de impresión en otra pestaña; el diálogo del navegador permite guardar como PDF
- Regenerar con IA — reemplaza el contenido existente. **Previsto:** confirmación antes de sobrescribir cambios manuales

> **Idea futura sin versión comprometida:** Considerar capa de anotaciones del usuario sobre la ficha base, diferenciando visualmente el contenido original del conocimiento propio del cultivador.

---

### M8 — Asistente IA por Ejemplar

Chat de IA contextualizado para un árbol específico. La pantalla prepara hasta diez cuidados recientes y notas de la especie; los proveedores actuales incluyen en el prompt nombre, especie, estado, estación y hasta siete cuidados. Las notas de clase todavía no se incorporan al prompt del chat.

#### Contexto que recibe la IA en cada consulta

- Nombre, especie y estado del árbol
- Hasta siete cuidados, con fecha, tipo, condición y descripción
- Estación según hemisferio configurado
- Historial del chat, consulta e imagen adjunta cuando corresponda

**Previsto:** incorporar estilo, tamaño y notas de clase priorizadas al prompt. Su presencia en `BonsaiContext` no implica que los proveedores actuales los usen.

#### Casos de uso típicos

- Diagnóstico: *"Veo manchas amarillas en las hojas, ¿qué puede ser?"*
- Planificación: *"¿Cuándo debería hacer la próxima poda estructural?"*
- Tratamientos: *"¿Qué fungicida me recomendás?"*
- Técnica: *"¿Cómo alambro una rama en 90 grados sin quebrarla?"*
- Interpretación: *"¿Es normal que pierda hojas en esta época?"*

#### Funcionalidades

- Historial de conversación visible por árbol (guardado en IndexedDB)
- Botón para limpiar el historial
- Soporte para adjuntar foto en la consulta
- Indicador de carga mientras la IA procesa

---

### M9 — Calendario y Recordatorios

#### Vistas

- **Vista mensual:** grilla con mini íconos por tipo de cuidado en cada día. Al tocar un día se muestran sus eventos en panel inferior.
- **Vista lista:** secciones Vencidos y Próximos 30 días, agrupadas por día, con historial de eventos pasados completados desplegable.
- Toggle para cambiar entre vistas.

#### Filtros combinables

En la vista lista se combinan filtros por tipo de evento y por un árbol:

| Filtro disponible | Valores |
|---|---|
| Tipo de evento | Todos, cuidado, recordatorio manual y recordatorio de seguimiento |
| Árbol | Todos o un ejemplar |

**Previsto:** selección de varios árboles, filtro por tipo de cuidado y chips removibles con limpieza global. `ai-suggestion` se conserva en el modelo pero está oculto en los filtros y la leyenda porque no hay un flujo que cree esos eventos (F008).

#### Código de colores por tipo de evento

- 🟢 Verde — cuidados registrados
- 🟡 Dorado — recordatorios manuales
- 🟣 Violeta — reservado para sugerencias IA, oculto de la leyenda actual
- 🟠 Naranja — recordatorios de seguimiento / alertas

#### Tipos de eventos

| Tipo | Origen | Descripción |
|---|---|---|
| Cuidado registrado | Manual | Aparece automáticamente al registrar un cuidado en M4 |
| Recordatorio manual | Manual | El usuario crea un recordatorio para fecha futura |
| Recordatorio de seguimiento | Manual | Se crea desde el formulario de cuidado |
| Sugerencia por IA | **Previsto** | Tipo reservado, sin generación automática actual |

#### Sugerencias automáticas por IA

**Previsto:** analizar periódicamente la colección considerando: especie y requerimientos estacionales, fecha del último cuidado de cada tipo, estación del año actual (según hemisferio), y estado del árbol.

#### Notificaciones push

**Previsto:** notificaciones del sistema mediante Web Push y badge del ícono. La implementación actual guarda `pushNotifications` como preferencia, pero no tiene suscripción ni envío push. Los pendientes se muestran dentro de la app, en el calendario y el header; no equivalen a notificaciones del sistema.

---

### M10 — Identificación de Especie por Foto

#### Flujo

1. El usuario accede desde el FAB expandible del Inventario (opción "Identificar con IA")
2. Selecciona una foto desde cámara o galería
3. La app envía la imagen al modelo de visión del proveedor configurado
4. La IA devuelve: nombre científico probable, nombre común, nivel de confianza, observaciones
5. El usuario acepta o descarta. Al aceptar, navega al Inventario con los campos **especie** y **nombre común** pre-cargados en el sheet de nuevo árbol

#### Consideraciones

- Se recomienda Gemini por su excelente desempeño en identificación de plantas
- La identificación no es 100% precisa — siempre se muestra con disclaimer de confirmación
- Si el proveedor no soporta visión, se muestra aviso y se sugiere cambiar a Gemini u OpenAI

---

### M11 — Backup y Restauración

#### Exportar backup

- Genera un archivo `.zip`: JSON con todos los datos + carpeta con todas las imágenes
- Nombre automático: `niwamiri_backup_YYYY-MM-DD.zip`
- El usuario lo guarda donde quiera (Descargas, Google Drive, iCloud, etc.)
- Indicador de carga durante la generación y estado de éxito/error; no hay porcentaje de progreso
- En móvil intenta compartir el ZIP con el selector nativo, con fallback a descarga directa

#### Importar / Restaurar

- El usuario selecciona un archivo `.zip` de backup
- Se comprueba que el ZIP contenga `data.json` y se parsea su JSON; no hay validación exhaustiva de estructura
- **Modo Reemplazar:** pide confirmación, limpia las colecciones de dominio e importa el backup; actualiza configuración si viene incluida
- **Modo Fusionar:** conserva registros no incluidos y agrega o sobrescribe por ID mediante `bulkPut`; no compara contenido ni fecha de modificación
- **Previsto:** resumen de registros a importar antes de confirmar y validación completa del archivo

#### Backup parcial

El usuario puede exportar solo un ejemplar (ficha + historial + fotos) para compartir con otro usuario.

---

### M12 — Configuración Global

| Ajuste | Descripción | Valores |
|---|---|---|
| Idioma de interfaz | Idioma de todos los textos | Español / English |
| Hemisferio | Afecta cálculo de estaciones para IA | Norte / Sur |
| Proveedor de IA | Motor de IA activo | Gemini / OpenAI / Claude |
| API Key | Clave del proveedor (campo oculto con opción de revelar) | Texto cifrado |
| Modelo de IA | Modelo específico dentro del proveedor | Según proveedor |
| Calidad de fotos | Balance calidad / almacenamiento | Alta / Media / Baja |
| Notificaciones push | Preferencia persistida; servicio push aún no implementado | On / Off |
| Tema visual | Modo claro u oscuro | Claro / Oscuro |
| Tamaño de letra | Opción de accesibilidad | Normal / Grande |

---

### M13 — Bitácora de Conocimiento

Módulo para capturar conocimiento general aprendido en clase que no está atado a ningún árbol ni especie específica. Cubre técnicas transversales (propagación por esquejes, acodos, preparación de sustratos, teoría de poda, etc.) que son útiles para consultar en cualquier momento y para cualquier árbol.

#### Diferencia con M6 (Notas de Clases)

| — | M6 Notas de Clases | M13 Bitácora |
|---|---|---|
| Ancla obligatoria | Especie | Ninguna |
| Uso típico | Nota sobre cómo podar este Ficus | Cómo hacer un acodo aéreo en general |
| Contexto de la IA | Panel de cuidado de un árbol específico | Asistente General; integración con panel de cuidado prevista |

#### Funcionalidades

- Lista cronológica de notas con buscador de texto libre
- Filtro por etiquetas (chips deslizables): `esquejes · acodos · sustratos · poda · fertilización · plagas · otros…`
- Etiquetas libres: el usuario escribe sus propias tags, con sugerencias automáticas a partir de las ya usadas
- Cada nota: fecha de la clase, título opcional, texto libre, etiquetas, fotos adjuntas opcionales
- Edición y eliminación de notas
- FAB (+) para nueva nota
- **Previsto:** vista agrupada por etiqueta (toggle lista / por etiqueta)

#### Formulario de nueva nota

| Campo | Tipo | Requerido |
|---|---|---|
| Título | Texto corto | No |
| Texto | Texto largo | Sí |
| Fecha | Fecha | Sí (default: hoy) |
| Etiquetas | Tags libres con autocompletar | No |
| Fotos adjuntas | Desde cámara o galería | No |

#### Integración con IA

- **Previsto:** enriquecer el panel contextual de M4 con notas de Bitácora cuya etiqueta coincida con el cuidado; actualmente CareForm usa notas de clase
- La pantalla del Asistente General prepara hasta diez notas de Bitácora. Los proveedores actuales usan las cinco primeras, con hasta 120 caracteres de contenido por nota, para contextualizar la respuesta

---

### M14 — Asistente IA General

Chat libre con IA sin árbol de referencia. El asistente conoce el inventario completo del usuario y su Bitácora, lo que le permite dar respuestas contextualizadas a su colección sin estar limitado a un árbol específico.

#### Diferencia con M8 (Asistente IA por Ejemplar)

| — | M8 Asistente por Ejemplar | M14 Asistente General |
|---|---|---|
| Contexto principal | Datos del árbol y cuidados recientes | Inventario completo + notas recientes de Bitácora |
| Acceso | Desde la ficha del árbol | Tab dedicado en BottomNav |
| Historial | Una conversación por árbol | Una conversación general persistida |
| Uso típico | "¿Cuándo podo este Ficus?" | "¿Qué especie elijo para mi próximo proyecto?" |

#### Contexto que recibe la IA en cada consulta

- Inventario del usuario: nombre, especie, nombre común si existe y estado de cada árbol
- Estación del año actual (según hemisferio configurado)
- Notas recientes de Bitácora: la pantalla prepara diez; el prompt usa hasta cinco, con contenido abreviado a 120 caracteres por nota
- Historial de la conversación activa
- Mensaje y foto adjunta del usuario (si corresponde)

#### Casos de uso típicos

- Exploración de ideas: *"Tengo un plantín de Olmo chino, ¿qué forma le doy? [foto]"*
- Nuevo proyecto: *"Quiero empezar un Bonsai nuevo, ¿qué especie me recomendás para clima templado?"*
- Técnica general: *"¿Cómo hago un acodo aéreo paso a paso?"*
- Planificación: *"¿Es compatible hacer poda estructural y trasplante el mismo año?"*
- Diagnóstico sin árbol específico: *"Vi esta planta en vivero y me parece interesante para Bonsai [foto], ¿qué me decís?"*

#### Funcionalidades

- Una conversación general persistida en IndexedDB mediante `bonsaiId = 'general'`
- Adjuntar una foto desde cámara o galería en una consulta
- Indicador de carga y errores del proveedor
- Respuestas del asistente renderizadas como Markdown
- Limpiar el historial mediante el botón correspondiente; actualmente sin confirmación

**Previsto:** múltiples conversaciones independientes, listado por última interacción, títulos editables o automáticos y confirmación al eliminar una conversación.

---

## 5. Modelo de Datos

Los nombres de las tablas conceptuales siguientes se presentan en español cuando ayudan a leer el diseño. Los campos TypeScript e índices vigentes se consultan en [schema.ts](../src/db/schema.ts); no son traducciones que deban implementarse como campos nuevos.

### 5.1 Entidades principales

| Entidad | Descripción | Relaciones |
|---|---|---|
| Bonsai | Árbol de la colección | 1 → N Cuidados, N Fotos, N Conversaciones |
| Care | Registro de intervención | N:1 con Bonsai, N Fotos adjuntas |
| Photo | Imagen de galería o cuidado | N:1 con Bonsai; Care opcional. La bitácora guarda sus fotos inline |
| ClassNote | Nota con ancla en especie + vínculos opcionales | Especie (obligatorio) + Ejemplar + Cuidado (opcionales) |
| JournalNote | Nota de bitácora sin ancla obligatoria | Fotos base64 inline opcionales, etiquetas libres |
| SpeciesSheet | Ficha técnica cacheada de una especie | Vinculada por nombre de especie |
| CalendarEvent | Evento futuro en el calendario | N:1 con Bonsai (opcional) |
| AIConversation | Historial de chat IA | N:1 con Bonsai (ejemplar) o sin Bonsai (general) |
| AppConfig | Ajustes globales del usuario | Entidad única (singleton) |

### 5.2 Entidad Bonsai

| Campo | Tipo | Notas |
|---|---|---|
| id | UUID | Generado automáticamente |
| nombre | string | Nombre o apodo del árbol |
| especie | string | Nombre científico; `commonName` es el nombre común opcional |
| nombreComun | string? | Campo `commonName` opcional |
| etiquetas | string[]? | Campo `tags` opcional |
| estilo | string (enum) | Chokkan, Moyogi, etc. |
| fechaAdquisicion | date | Opcional |
| anioGerminacionEstimado | number | Opcional. Edad = año actual − este campo |
| origen | string (enum) | Prebonsai, Yamadori, etc. |
| categoria | string (enum) | Shito, Mame, Shohin, Chuhin, Dai |
| macetaSustrato | string | Descripción libre |
| ubicacion | string | Descripción libre |
| estado | string (enum) | En desarrollo, En mantenimiento, etc. |
| notasGenerales | string | Texto libre |
| fotoPrincipalId | UUID ref | Referencia a la foto de portada |
| creadoEn | timestamp | Fecha de creación |
| actualizadoEn | timestamp | Última modificación |

### 5.3 Entidad JournalNote (Bitácora)

| Campo | Tipo | Notas |
|---|---|---|
| id | UUID | Generado automáticamente |
| titulo | string? | Opcional |
| texto | string | Contenido principal |
| fecha | date | Fecha de la clase o experiencia (default: hoy) |
| etiquetas | string[] | Tags libres definidos por el usuario |
| fotosAdjuntas | string[]? | Campo `photos`: imágenes base64 comprimidas inline, no IDs de Photo |
| creadoEn | timestamp | Fecha de creación del registro |
| actualizadoEn | timestamp | Última modificación |

### 5.4 Entidad Care (Cuidado)

| Campo | Tipo | Notas |
|---|---|---|
| id | UUID | Generado automáticamente |
| bonsaiId | UUID ref | Árbol al que pertenece |
| tipo | string (enum) | Riego, Fertilización, Poda, etc. |
| fecha | timestamp | Fecha y hora del cuidado |
| descripcion | string | Observaciones libres |
| estadoArbol | string (enum) | Bien, Regular, Con problemas |
| camposEspecificos | JSON object? | Detalles opcionales por tipo en `specificFields`, compartidos por carga individual y masiva (F035, v1.5.0) |
| recordatorioSeguimiento | object | Fecha + descripción (opcional) |
| creadoEn | timestamp | Fecha de creación |

### 5.5 Entidad AIConversation vigente

| Campo real | Tipo | Notas |
|---|---|---|
| id | string | UUID generado automáticamente |
| bonsaiId | string | ID del árbol o literal `general` para M14 |
| messages | Array | Mensajes con rol, contenido y timestamp |
| createdAt | number | Fecha de creación |
| updatedAt | number | Última actualización |

El esquema vigente no contiene título ni catálogo de conversaciones generales. Esos campos pertenecían al diseño extendido aún pendiente.

---

## 6. Integraciones de Inteligencia Artificial

### 6.1 Operaciones del AIService

| Operación | Descripción | Usa visión |
|---|---|---|
| `identifySpecies(imageBase64, lang?)` | Identifica especie a partir de imagen | Sí |
| `generateSpeciesSheet(species)` | Genera ficha técnica estructurada | No |
| `summarizeNotesForCare(notes, careType, species)` | Resumen contextual para formulario de cuidado | No |
| `chat(messages, context)` | Chat libre con contexto del árbol (M8) | Opcional |
| `chatGeneral(messages, context)` | Chat libre con contexto de inventario + bitácora (M14) | Opcional |
| `suggestNextCares(context)` | Contrato disponible; sin planificación periódica de eventos en la UI | No |
| `suggestReminder(care, context)` | Fecha y descripción sugerida para seguimiento | No |
| `verifyConnection(apiKey)` | Prueba validez de la API key | No |

### 6.2 Construcción del contexto

**Contexto por ejemplar (M8):** para consultas libres y sugerencias sobre un árbol específico:
- Nombre y especie del árbol
- Estilo, tamaño y estado actual
- La pantalla prepara diez cuidados; los proveedores incluyen hasta siete en el prompt
- Notas de clase recuperadas por la pantalla, aún sin uso en los prompts de chat
- Estación del año actual según hemisferio configurado

**Contexto general (M14):** para consultas sin árbol de referencia:
- Inventario completo: nombre, especie, nombre común opcional y estado de cada árbol
- La pantalla prepara diez notas de Bitácora; los proveedores incluyen hasta cinco con contenido abreviado
- Estación del año actual según hemisferio configurado

### 6.3 Modelo BYOK (Bring Your Own Key)

Cada usuario configura su propia API key durante el onboarding. La key se guarda cifrada en IndexedDB usando Web Crypto API (AES-GCM). Nunca se transmite a servidores propios — solo a los endpoints de los proveedores de IA.

---

## 7. Navegación y Estructura de Pantallas

### 7.1 Barra de navegación inferior

4 tabs principales con acceso a las secciones de uso frecuente:

| Tab | Destino | Módulo |
|---|---|---|
| 🌳 Colección | Inventario de Ejemplares | M2 |
| 📓 Bitácora | Notas generales de conocimiento | M13 |
| ✨ Asistente | Chat IA general | M14 |
| 📅 Calendario | Calendario y Recordatorios | M9 |

**Ajustes (M12)** se accede desde el ícono ⚙️ del header compartido en las pantallas que lo muestran. Se oculta en Ajustes y Backup para evitar circularidad; no ocupa un tab propio.

**Identificar (M10)** se accede desde:
- El botón "+" de nuevo árbol en el Inventario (M2)
- **Previsto:** acceso dedicado desde el Asistente General; sus botones actuales adjuntan una foto al chat, no navegan al flujo M10

### 7.2 Navegación dentro de la Ficha del Ejemplar

Scroll vertical con 6 secciones colapsables:
- 📋 Resumen
- ✂️ Cuidados
- 📷 Galería
- 📝 Notas de Clase
- 📖 Ficha Técnica
- ✨ Asistente IA

---

## 8. Requerimientos No Funcionales

Los límites de rendimiento, compatibilidad, tamaño de imagen, accesibilidad y volumen de backup son **objetivos del diseño**, no resultados medidos por la suite actual. La verificación de almacenamiento no certifica esos objetivos. La compresión depende de dimensiones y calidad, sin tope garantizado de 300 KB. La migración remota debe contemplar las excepciones de arquitectura detalladas en SPEC.md.

| Categoría | Requerimiento |
|---|---|
| Rendimiento | Carga e interactividad en menos de 3 segundos en conexión 4G |
| Offline | Ver árboles, registrar cuidados, historial y galería funcionan sin internet |
| Almacenamiento | Imágenes comprimidas automáticamente, máximo ~300KB por foto almacenada |
| Seguridad | API key cifrada localmente (AES-GCM). Nunca se transmite a servidores propios |
| Compatibilidad | Chrome 90+ en Android · Safari 16.4+ en iOS |
| Instalabilidad | PWA instalable en Android e iOS con manifest y service worker correctamente configurados |
| Internacionalización | Todos los textos externalizados en archivos i18n. Idiomas: `es`, `en` |
| Accesibilidad | Contraste mínimo WCAG AA · Toques mínimo 44×44px · Opción de fuente grande |
| Backup | Export/import de colecciones de hasta 500 fotos sin errores |
| Escalabilidad | StorageService permite migrar a Supabase cambiando únicamente la implementación |

---

## 9. Stack Tecnológico

### Decisión: React + Vite (desde cero)

Se eligió arrancar desde cero con Vite en lugar de usar un template pre-configurado para mantener control total sobre cada decisión arquitectónica y facilitar la comprensión y modificación futura.

| Necesidad | Librería | Justificación |
|---|---|---|
| UI Framework | React 19 | Implementación actual del proyecto |
| Bundler | Vite 8 | Desarrollo y build del sitio estático |
| PWA | vite-plugin-pwa | Integración nativa con Vite |
| Routing | React Router 7 / HashRouter | Navegación compatible con hosting estático |
| Estado global | Zustand | Simple, sin boilerplate, ideal para escala personal |
| Base de datos local | Dexie.js 4 | Persistencia IndexedDB con soporte TypeScript |
| i18n | react-i18next | Estándar para i18n en React |
| Componentes UI | Componentes propios, configuración shadcn/ui y Radix Slider | Componentes reutilizables y slider de rango |
| Íconos | Lucide React | Consistente, liviano, compatible con React |
| Calendario | Vistas propias + date-fns | react-big-calendar permanece como dependencia, sin uso en Calendar.tsx |
| Fechas | date-fns | Liviana, funcional, tree-shakeable |
| Estilos | Tailwind CSS | Utility-first, mobile-first, integración con shadcn/ui |

### Decisiones arquitectónicas cerradas

| Decisión | Opción elegida | Alternativa descartada |
|---|---|---|
| Tipo de app | PWA | App nativa (React Native / Flutter) |
| Almacenamiento v1 | IndexedDB via Dexie.js | Backend + nube |
| Almacenamiento futuro | Supabase previsto; requiere cubrir excepciones de acceso directo | Firebase |
| Proveedor IA | Multi-proveedor: Gemini, OpenAI, Claude | Gemini exclusivo |
| Modelo de API key | BYOK — cada usuario configura la suya | API key compartida en backend |
| UI Framework | React 19 + Vite 8 | Vue 3, Svelte, Angular |
| Gestión de estado | Zustand | Redux, Context API |
| Nombre de la app | NiwaMirî | BonsaiTracker, Raíces, Ceiwa |

---

## 10. Glosario

| Término | Definición |
|---|---|
| Bonsai | Arte japonés de cultivar árboles miniaturizados en macetas mediante técnicas específicas |
| PWA | Progressive Web App — aplicación web instalable que se comporta como app nativa |
| IndexedDB | Base de datos local del navegador para grandes volúmenes de datos estructurados |
| StorageService | Capa de abstracción que desacopla la UI del mecanismo de persistencia de datos |
| AIService | Capa de abstracción que desacopla la lógica de la app del proveedor de IA |
| BYOK | Bring Your Own Key — cada usuario aporta su propia API key del servicio de IA |
| Alambrado | Técnica de enrollar alambre en ramas para guiar su crecimiento |
| Repotting / Trasplante | Cambio de maceta con poda de raíces para renovar el sustrato |
| Jin | Técnica de madera muerta en ramas para efecto de envejecimiento natural |
| Shari | Técnica de madera muerta aplicada sobre el tronco del árbol |
| Yamadori | Recolección de árboles silvestres de la naturaleza para cultivarlos como Bonsai |
| Defoliación | Técnica de verano de retirar todas las hojas para reducir su tamaño en la próxima brotación |
| Chokkan | Estilo formal vertical recto |
| Moyogi | Estilo informal vertical con tronco en "S", el más común |
| Kengai | Estilo cascada — ramas caen por debajo de la base de la maceta |
| Nebari | Raíces superficiales visibles que aportan equilibrio visual al árbol |
| Service Worker | Script del navegador que permite offline y notificaciones push |
| i18n | Internacionalización — sistema para soportar múltiples idiomas |
| AES-GCM | Algoritmo de cifrado simétrico usado para proteger la API key localmente |

---

## 11. Pendientes y Decisiones Abiertas

Se conserva la numeración histórica para las decisiones iniciales. Los requisitos adicionales marcados **previsto** en cada módulo no comprometen nuevas actualizaciones ni reemplazan el backlog de bugs.

| # | Tema | Situación en la implementación de referencia |
|---|---|---|
| P2 | Tema visual | Implementados temas claro/oscuro y tokens; las pruebas de accesibilidad siguen siendo necesarias |
| P4 | Base de datos de especies | Previsto: definir catálogo precargado; no hay fichas cargadas en seeds |
| P5 | Cifrado de API key | Implementado con AES-GCM; ver alcance técnico en SPEC.md |
| P6 | Hemisferio por defecto | Definido e implementado: Sur, configurable |
| P7 | Límite de fotos por árbol | No se impone un límite de cantidad; permanece como decisión abierta |
| P8 | Modo de fusión en backup | Implementado por ID mediante `bulkPut`; conciliación por contenido/conflictos no implementada |

Otras funciones del diseño aún previstas: push, planificación automática de cuidados, campos especializados de cuidados, filtros ampliados, integración Bitácora–CareForm, confirmación al regenerar fichas y múltiples conversaciones generales. Su descripción detallada permanece en el módulo correspondiente.

---

*FUNCTIONAL_SPEC.md — Referencia de aplicación 1.6.0, revisión documental 2026-10-28. Actualizar al cambiar el comportamiento o tomar decisiones nuevas.*
