# NiwaMirî — Especificación Funcional

> **Versión:** 1.0 — Primera emisión  
> **Tipo de aplicación:** Progressive Web App (PWA)  
> **Plataformas:** Android · iOS (instalable en pantalla de inicio)  
> **Idiomas:** Español / Inglés (bilingüe)  
> **Almacenamiento inicial:** Local — IndexedDB en el dispositivo  
> **Almacenamiento futuro:** Compatible con migración a Supabase / Firebase  
> **Proveedor de IA:** Configurable — Gemini, OpenAI, Claude (Anthropic)  

---

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
- Calendario de cuidados con recordatorios y sugerencias automáticas por IA
- Ficha técnica por especie generada por IA o desde base de datos local
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
- ✅ Funciona offline — los datos se almacenan localmente en el teléfono
- ✅ Instalable en Android e iOS desde el navegador
- ✅ Compatible con Chrome 90+ en Android y Safari 16.4+ en iOS
- ✅ Diseñada para migración futura a almacenamiento en la nube (Supabase)

### 2.2 Principio de capa de abstracción de datos

La interfaz de usuario nunca accede directamente a la base de datos. Todo pasa por un servicio intermedio (`StorageService`) que puede intercambiar su implementación interna sin afectar el resto de la aplicación. Esto garantiza la migración futura a la nube con cambios mínimos.

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
| StorageService | Abstracción de datos | Interfaz TS | Sin cambios |
| Implementación local | Persistencia en dispositivo | Dexie.js / IndexedDB | Reemplazable |
| Implementación nube | Sincronización multi-dispositivo | — | Supabase / Firebase |

### 2.3 Principio de capa de abstracción de IA

Todas las funciones de IA pasan por un `AIService` que delega en el proveedor configurado por el usuario. Agregar un nuevo proveedor en el futuro no requiere modificar ninguna pantalla.

| Proveedor | Modelos sugeridos | Tier gratuito | Visión |
|---|---|---|---|
| Google Gemini | gemini-1.5-flash / gemini-1.5-pro | Sí — recomendado | Sí |
| OpenAI | gpt-4o / gpt-4o-mini | No | Sí |
| Anthropic Claude | claude-3-5-haiku / claude-3-5-sonnet | No | Sí |

### 2.4 Distribución de la aplicación

La app se distribuye como archivos estáticos:
- GitHub Pages — gratuito, ideal para uso personal y grupal
- Netlify / Vercel — gratuitos, con deploy automático desde repositorio

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
| M9 | Calendario y Recordatorios | Calendario con filtros combinables y sugerencias IA |
| M10 | Identificación por Foto | Identificación de especie mediante IA de visión |
| M11 | Backup y Restauración | Export/import de todos los datos |
| M12 | Configuración Global | Idioma, proveedor IA, API key, preferencias |
| M13 | Bitácora de Conocimiento | Notas generales de clase sin árbol de referencia, organizadas por etiquetas |
| M14 | Asistente IA General | Chat libre con IA con acceso al inventario y la bitácora del usuario |

---

## 4. Especificación Detallada por Módulo

### M1 — Onboarding y Configuración Inicial

Pantalla de bienvenida que aparece únicamente la primera vez. Guía al usuario a través de un asistente de 4 pasos.

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

---

### M2 — Inventario de Ejemplares

Pantalla principal de la app. Muestra la colección completa en grilla de tarjetas.

#### Funcionalidades

- Listado en grilla con foto arriba y datos abajo (nombre, especie en itálica, edad calculada, último cuidado)
- Alternancia entre vista grilla y vista lista
- Buscador por nombre o especie
- Filtro por especie: chips horizontales deslizables con selección múltiple (`Todos · Ficus · Arce · Pino…`). Los chips se generan automáticamente a partir de las especies de la colección
- Chips de estación del año actual y alertas pendientes
- Indicador visual de árboles con cuidados pendientes: círculo naranja sobre la foto (top-left)
- Botón flotante (+) para agregar nuevo ejemplar

#### Datos del ejemplar

| Campo | Tipo | Requerido | Notas |
|---|---|---|---|
| Nombre / Apodo | Texto | Sí | Nombre que el usuario le da al árbol |
| Especie | Texto + autocompletar | Sí | Vincula con Ficha Técnica y Notas |
| Estilo de Bonsai | Lista | No | Chokkan, Moyogi, Shakan, Kengai, Han-Kengai, Hokidachi, Fukinagashi, Yose-ue, Literati, Otros |
| Fecha de adquisición | Fecha | No | Cuándo se incorporó a la colección |
| Año de germinación estimado | Año (número) | No | La app calcula y muestra edad automáticamente con prefijo `~` (ej: `~35 años`) |
| Origen | Lista | No | Prebonsai, Yamadori, Semilla, Esqueje, Regalo, Compra |
| Tamaño / Categoría | Lista | No | Mame (<15cm), Shohin (15-25cm), Chuhin (25-46cm), Dai (>46cm) |
| Maceta / Sustrato | Texto | No | Descripción libre |
| Ubicación habitual | Texto | No | Interior, exterior, invernadero, etc. |
| Estado actual | Lista | Sí | En desarrollo, En mantenimiento, En recuperación, Donado, Muerto |
| Notas generales | Texto largo | No | Observaciones libres |
| Foto principal | Imagen | No | Foto de portada del árbol |

---

### M3 — Ficha del Ejemplar

Vista detallada de un árbol. Navegación mediante scroll vertical con secciones colapsables. FAB (+) para registrar nuevo cuidado sin salir de la ficha.

#### Secciones

| Sección | Contenido |
|---|---|
| Hero photo | Foto principal + edad calculada + estado del árbol |
| Stats rápidos | Cantidad de cuidados, fotos, notas, días desde último cuidado |
| 📋 Resumen | Datos principales del árbol en grilla de dos columnas + notas generales |
| ✂️ Cuidados | Últimas entradas del historial con link a ver todos |
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

#### Tipos de cuidados soportados

| Tipo | Campos específicos adicionales |
|---|---|
| Riego | Cantidad de agua, método (inmersión / aspersor / regadera), observaciones sobre drenaje |
| Fertilización | Producto utilizado, dosis, método, tipo NPK predominante |
| Poda de mantenimiento | Ramas podadas, objetivo, herramientas |
| Poda estructural | Ramas principales modificadas, cambios en estructura, fotos antes/después |
| Alambrado | Calibre del alambre, ramas alambradas, fecha estimada de retiro |
| Retiro de alambre | Referencia al alambrado original, resultado |
| Trasplante / Repotting | Maceta nueva, sustrato utilizado, raíces podadas (%), estado de raíces |
| Poda de raíces | Porcentaje podado, estado observado, sustrato renovado |
| Defoliación | Parcial o total, objetivo, fecha esperada de rebrote |
| Tratamiento fitosanitario | Plaga o enfermedad tratada, producto, dosis, método, seguimiento |
| Jin / Shari (deadwood) | Tipo de técnica, zona intervenida, productos aplicados |
| Exposición / Cambio de ubicación | Ubicación anterior y nueva, motivo |
| Observación general | Registro libre sin intervención |
| Otro | Descripción libre |

#### Campos comunes a todos los tipos

- Fecha y hora del cuidado
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

Al abrir el formulario se muestra automáticamente un panel expandible con:
- Resumen de notas de clase relevantes, priorizando las vinculadas al ejemplar específico sobre las genéricas de la especie
- Últimas intervenciones del mismo tipo en ese árbol
- Recomendación contextual según estación del año actual

El panel es informativo y no interfiere con el formulario.

#### Historial de cuidados

- Vista cronológica descendente
- Filtros: por tipo, rango de fechas, presencia de fotos
- Buscador de texto en observaciones
- Cada entrada muestra: tipo, fecha, resumen, foto miniatura si tiene

---

### M5 — Galería Fotográfica

| Funcionalidad | Detalle |
|---|---|
| Vista grilla | Miniaturas en 3 columnas ordenadas por fecha |
| Vista línea de tiempo | Fotos agrupadas por mes/año |
| Foto ampliada | Zoom, fecha, descripción del cuidado asociado si corresponde |
| Nueva foto | Desde cámara del dispositivo o desde galería del sistema |
| Foto de portada | El usuario puede marcar cualquier foto como principal del árbol |
| Eliminación | Con confirmación |
| Compresión | Automática antes de guardar: máximo 1200px en el lado mayor, calidad 85% |

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
- Vínculos opcionales a ejemplar y/o cuidado desde el formulario
- Vista de lista por especie ordenada por fecha
- Filtros: por especie, por ejemplar, por tipo de cuidado relacionado
- Buscador de texto dentro de las notas
- Edición y eliminación

#### Creación desde el formulario de cuidado (M4)

Desde M4 se puede crear una nota directamente sin salir del flujo. Se pre-vincula automáticamente a la especie del árbol, el ejemplar y el cuidado en curso.

#### Integración con IA — Resumen contextual

Al registrar un cuidado, el sistema:
1. Recupera todas las notas asociadas a la especie
2. Prioriza las que además estén vinculadas al ejemplar específico o a cuidados del mismo tipo
3. Envía al modelo de IA: notas priorizadas + tipo de cuidado + especie + ejemplar
4. La IA devuelve un resumen con mayor peso en las notas del ejemplar específico
5. El resumen se muestra en el panel contextual del formulario de cuidado

---

### M7 — Ficha Técnica de Especie

#### Fuentes y origen de la ficha

| Fuente | Cuándo se usa |
|---|---|
| Base de datos local | Especies más comunes (Ficus, Olmo, Arce, Junípero, Pino, Azalea, Portulacaria, etc.) |
| Generación por IA | Cualquier especie no incluida en la base local. Bajo demanda, se cachea localmente. |
| Creación manual | Especies muy exóticas, locales o poco documentadas. |
| Edición del usuario | Cualquier ficha puede editarse libremente para corregir errores o adaptar al contexto local. |

Cada ficha muestra un badge de origen: `Base local` · `Generada por IA` · `Editada` · `Manual`.

#### Contenido de la ficha

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
- Descargar ficha como PDF formateado
- Regenerar con IA — muestra aviso de confirmación antes de sobreescribir cambios manuales

> **Roadmap v2:** Considerar capa de anotaciones del usuario sobre la ficha base, diferenciando visualmente el contenido original del conocimiento propio del cultivador.

---

### M8 — Asistente IA por Ejemplar

Chat de IA contextualizado para un árbol específico. El asistente conoce el historial completo del árbol.

#### Contexto que recibe la IA en cada consulta

- Nombre y especie del árbol
- Estilo de Bonsai, tamaño y estado actual
- Últimos N cuidados registrados
- Notas de clase asociadas a la especie, priorizando las vinculadas al ejemplar
- Estación del año actual según hemisferio configurado
- Pregunta o descripción del usuario

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
- **Vista de próximos 30 días:** lista cronológica agrupada por semana/mes.
- Toggle para cambiar entre vistas.

#### Filtros combinables

Los tres filtros pueden combinarse simultáneamente:

| Filtro | Valores posibles |
|---|---|
| Tipo de evento | Cuidado registrado · Recordatorio manual · Recordatorio de seguimiento · Sugerencia IA |
| Árbol | Uno o varios ejemplares (selector múltiple) |
| Tipo de cuidado | Riego · Poda · Alambrado · Fertilización · Trasplante · etc. |

Los filtros activos se muestran como chips removibles. Botón "Limpiar filtros" restablece la vista completa.

#### Código de colores por tipo de evento

- 🟢 Verde — cuidados registrados
- 🟡 Dorado — recordatorios manuales
- 🟣 Violeta — sugerencias IA
- 🟠 Naranja — recordatorios de seguimiento / alertas

#### Tipos de eventos

| Tipo | Origen | Descripción |
|---|---|---|
| Cuidado registrado | Manual | Aparece automáticamente al registrar un cuidado en M4 |
| Recordatorio manual | Manual | El usuario crea un recordatorio para fecha futura |
| Recordatorio de seguimiento | Manual | Se crea desde el formulario de cuidado |
| Sugerencia por IA | Automático | La app genera sugerencias por árbol y especie |

#### Sugerencias automáticas por IA

La app analiza periódicamente la colección considerando: especie y requerimientos estacionales, fecha del último cuidado de cada tipo, estación del año actual (según hemisferio), y estado del árbol.

#### Notificaciones push

- En Android: notificaciones nativas a través de Web Push API
- En iOS: requiere PWA instalada en pantalla de inicio (iOS 16.4+)
- Si no hay soporte, se muestra badge visual en el ícono de la app

---

### M10 — Identificación de Especie por Foto

#### Flujo

1. El usuario accede desde botón en "crear nuevo ejemplar" o desde el menú
2. Selecciona una foto desde cámara o galería
3. La app envía la imagen al modelo de visión del proveedor configurado
4. La IA devuelve: nombre científico probable, nombre común, nivel de confianza, observaciones
5. El usuario acepta (pre-rellena el campo especie) o descarta

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
- Barra de progreso durante la generación

#### Importar / Restaurar

- El usuario selecciona un archivo `.zip` de backup
- La app valida el formato antes de proceder
- **Modo Reemplazar:** borra datos actuales e importa el backup
- **Modo Fusionar:** agrega los datos importados sin borrar los existentes, con detección de duplicados
- Se muestra resumen de lo que se importará antes de confirmar

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
| Notificaciones push | Activar/desactivar | On / Off |
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
| Contexto de la IA | Panel de cuidado de un árbol específico | Asistente General + panel de cuidado |

#### Funcionalidades

- Lista cronológica de notas con buscador de texto libre
- Filtro por etiquetas (chips deslizables): `esquejes · acodos · sustratos · poda · fertilización · plagas · otros…`
- Etiquetas libres: el usuario escribe sus propias tags, con sugerencias automáticas a partir de las ya usadas
- Cada nota: fecha de la clase, título opcional, texto libre, etiquetas, fotos adjuntas opcionales
- Edición y eliminación de notas
- FAB (+) para nueva nota
- Vista agrupada por etiqueta (toggle lista / por etiqueta)

#### Formulario de nueva nota

| Campo | Tipo | Requerido |
|---|---|---|
| Título | Texto corto | No |
| Texto | Texto largo | Sí |
| Fecha | Fecha | Sí (default: hoy) |
| Etiquetas | Tags libres con autocompletar | No |
| Fotos adjuntas | Desde cámara o galería | No |

#### Integración con IA

- Las notas de la Bitácora enriquecen el panel contextual de M4 (registro de cuidados): si la etiqueta de una nota coincide con el tipo de cuidado en curso, se incluye como contexto adicional
- El Asistente IA General (M14) recibe las últimas N notas de la Bitácora como parte de su contexto para dar respuestas más personalizadas al conocimiento del usuario

---

### M14 — Asistente IA General

Chat libre con IA sin árbol de referencia. El asistente conoce el inventario completo del usuario y su Bitácora, lo que le permite dar respuestas contextualizadas a su colección sin estar limitado a un árbol específico.

#### Diferencia con M8 (Asistente IA por Ejemplar)

| — | M8 Asistente por Ejemplar | M14 Asistente General |
|---|---|---|
| Contexto principal | Historial completo de un árbol | Inventario completo + Bitácora |
| Acceso | Desde la ficha del árbol | Tab dedicado en BottomNav |
| Historial | Por árbol | Por conversación, independiente |
| Uso típico | "¿Cuándo podo este Ficus?" | "¿Qué especie elijo para mi próximo proyecto?" |

#### Contexto que recibe la IA en cada consulta

- Inventario del usuario: nombre, especie, estado y estilo de cada árbol
- Estación del año actual (según hemisferio configurado)
- Últimas N notas de la Bitácora (M13) como conocimiento técnico del usuario
- Historial de la conversación activa
- Mensaje y foto adjunta del usuario (si corresponde)

#### Casos de uso típicos

- Exploración de ideas: *"Tengo un plantín de Olmo chino, ¿qué forma le doy? [foto]"*
- Nuevo proyecto: *"Quiero empezar un Bonsai nuevo, ¿qué especie me recomendás para clima templado?"*
- Técnica general: *"¿Cómo hago un acodo aéreo paso a paso?"*
- Planificación: *"¿Es compatible hacer poda estructural y trasplante el mismo año?"*
- Diagnóstico sin árbol específico: *"Vi esta planta en vivero y me parece interesante para Bonsai [foto], ¿qué me decís?"*

#### Funcionalidades

- Lista de conversaciones pasadas ordenadas por última interacción (título + fecha)
- Múltiples conversaciones independientes persistidas en IndexedDB
- Título de conversación: editable manualmente o auto-generado a partir del primer mensaje
- Adjuntar foto en cualquier mensaje (desde cámara o galería)
- Indicador de carga mientras la IA procesa
- Crear nueva conversación
- Eliminar conversación (con confirmación)

---

## 5. Modelo de Datos

### 5.1 Entidades principales

| Entidad | Descripción | Relaciones |
|---|---|---|
| Bonsai | Árbol de la colección | 1 → N Cuidados, N Fotos, N Conversaciones |
| Care | Registro de intervención | N:1 con Bonsai, N Fotos adjuntas |
| Photo | Imagen asociada a árbol, cuidado o nota de bitácora | N:1 con Bonsai, Care o JournalNote |
| ClassNote | Nota con ancla en especie + vínculos opcionales | Especie (obligatorio) + Ejemplar + Cuidado (opcionales) |
| JournalNote | Nota de bitácora sin ancla obligatoria | Fotos opcionales, etiquetas libres |
| SpeciesSheet | Ficha técnica cacheada de una especie | Vinculada por nombre de especie |
| CalendarEvent | Evento futuro en el calendario | N:1 con Bonsai (opcional) |
| AIConversation | Historial de chat IA | N:1 con Bonsai (ejemplar) o sin Bonsai (general) |
| AppConfig | Ajustes globales del usuario | Entidad única (singleton) |

### 5.2 Entidad Bonsai

| Campo | Tipo | Notas |
|---|---|---|
| id | UUID | Generado automáticamente |
| nombre | string | Nombre o apodo del árbol |
| especie | string | Nombre científico o común |
| estilo | string (enum) | Chokkan, Moyogi, etc. |
| fechaAdquisicion | date | Opcional |
| anioGerminacionEstimado | number | Opcional. Edad = año actual − este campo |
| origen | string (enum) | Prebonsai, Yamadori, etc. |
| categoria | string (enum) | Mame, Shohin, Chuhin, Dai |
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
| fotosAdjuntas | UUID[] | Referencias a fotos (tabla Photo) |
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
| camposEspecificos | JSON object | Campos variables según tipo de cuidado |
| recordatorioSeguimiento | object | Fecha + descripción (opcional) |
| creadoEn | timestamp | Fecha de creación |

### 5.5 Entidad AIConversation (extendida)

| Campo | Tipo | Notas |
|---|---|---|
| id | UUID | Generado automáticamente |
| bonsaiId | UUID? | `null` para conversaciones generales (M14); UUID para conversaciones por ejemplar (M8) |
| titulo | string | Editable o auto-generado a partir del primer mensaje |
| mensajes | Message[] | Historial completo de la conversación |
| fechaUltimaInteraccion | timestamp | Para ordenar la lista de conversaciones |
| creadoEn | timestamp | Fecha de creación |

---

## 6. Integraciones de Inteligencia Artificial

### 6.1 Operaciones del AIService

| Operación | Descripción | Usa visión |
|---|---|---|
| `identificarEspecie(foto)` | Identifica especie a partir de imagen | Sí |
| `generarFichaTecnica(especie)` | Genera ficha técnica estructurada | No |
| `resumirNotasParaCuidado(notas, tipoCuidado, especie)` | Resumen contextual para formulario de cuidado | No |
| `consultarAsistente(mensajes, contextoArbol)` | Chat libre con contexto del árbol (M8) | Opcional |
| `consultarAsistenteGeneral(mensajes, contextoGeneral)` | Chat libre con contexto de inventario + bitácora (M14) | Opcional |
| `sugerirProximosCuidados(bonsai, estacion)` | Lista de cuidados recomendados | No |
| `sugerirRecordatorio(cuidado, contexto)` | Fecha y descripción sugerida para seguimiento | No |
| `verificarConexion(apiKey)` | Prueba validez de la API key | No |

### 6.2 Construcción del contexto

**Contexto por ejemplar (M8):** para consultas libres y sugerencias sobre un árbol específico:
- Nombre y especie del árbol
- Estilo, tamaño y estado actual
- Historial de los últimos 10 cuidados registrados
- Notas de clase disponibles para la especie (priorizando las del ejemplar)
- Estación del año actual según hemisferio configurado

**Contexto general (M14):** para consultas sin árbol de referencia:
- Inventario completo: nombre, especie, estado y estilo de cada árbol de la colección
- Últimas N notas de la Bitácora (M13) del usuario
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

**Ajustes (M12)** se accede mediante el ícono ⚙️ en la esquina superior derecha del header de la pantalla Colección. No ocupa un tab propio ya que es una sección de configuración de uso esporádico.

**Identificar (M10)** se accede desde:
- El botón "+" de nuevo árbol en el Inventario (M2)
- Un botón dentro del Asistente General (M14) para adjuntar foto con intención de identificar especie

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

### Decisión: React 18 + Vite (desde cero)

Se eligió arrancar desde cero con Vite en lugar de usar un template pre-configurado para mantener control total sobre cada decisión arquitectónica y facilitar la comprensión y modificación futura.

| Necesidad | Librería | Justificación |
|---|---|---|
| UI Framework | React 18 | Ecosistema más amplio, mayor disponibilidad de recursos |
| Bundler | Vite | Build ultrarrápido, excelente experiencia en MAC |
| PWA | vite-plugin-pwa | Integración nativa con Vite |
| Routing | React Router v6 | Estándar de facto para React |
| Estado global | Zustand | Simple, sin boilerplate, ideal para escala personal |
| Base de datos local | Dexie.js | Wrapper elegante sobre IndexedDB con soporte TypeScript |
| i18n | react-i18next | Estándar para i18n en React |
| Componentes UI | shadcn/ui | Accesibles, customizables, sin dependencia cerrada |
| Íconos | Lucide React | Consistente, liviano, compatible con React |
| Calendario | react-big-calendar | Vistas mensual, semanal y agenda |
| Fechas | date-fns | Liviana, funcional, tree-shakeable |
| Estilos | Tailwind CSS | Utility-first, mobile-first, integración con shadcn/ui |

### Decisiones arquitectónicas cerradas

| Decisión | Opción elegida | Alternativa descartada |
|---|---|---|
| Tipo de app | PWA | App nativa (React Native / Flutter) |
| Almacenamiento v1 | IndexedDB via Dexie.js | Backend + nube |
| Almacenamiento futuro | Supabase (migración sin cambios en UI) | Firebase |
| Proveedor IA | Multi-proveedor: Gemini, OpenAI, Claude | Gemini exclusivo |
| Modelo de API key | BYOK — cada usuario configura la suya | API key compartida en backend |
| UI Framework | React 18 + Vite | Vue 3, Svelte, Angular |
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

| # | Tema | Descripción | Estado |
|---|---|---|---|
| P2 | Tema visual | Paleta cerrada, tipografía cerrada. Pendiente implementación completa en código | En curso |
| P4 | Base de datos de especies | Definir qué especies estarán precargadas y con qué nivel de detalle | Pendiente |
| P5 | Cifrado de API key | Implementar con Web Crypto API (AES-GCM) | Pendiente |
| P6 | Hemisferio por defecto | Sur (Argentina) — confirmar al implementar | Pendiente |
| P7 | Límite de fotos por árbol | ¿Se impone algún límite para proteger el almacenamiento? | Pendiente |
| P8 | Modo de fusión en backup | Definir reglas de detección de duplicados en importación modo fusión | Pendiente |

---

*FUNCTIONAL_SPEC.md — NiwaMirî v1.0 — Documento vivo, actualizar al tomar decisiones nuevas*
