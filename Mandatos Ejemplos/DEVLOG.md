# DEVLOG.md - EstudiApp

Registro historico del desarrollo. Actualizar al finalizar cada hito importante.

## 2026-06-05 - Cortes de Nota por Trimestre y Ponderación Temporal (Fase XLIII)
- **Segmentación por Periodos**: Añadido soporte para cortes de nota por trimestre (1°, 2° y 3° Trimestre) mediante rangos de fechas editables en `GradeSettings`.
- **Filtros Temporales en Planilla y Ficha**: Las columnas de notas, asistencia y clases planificadas se filtran dinámicamente según el trimestre seleccionado.
- **Promedio Anual Consolidado**: Implementado el promedio de promedios parciales para la vista anual consolidada, evitando interferencias de notas de distintos trimestres.
- **Sincronización PDF**: Actualizado el exportador PDF `StudentProgressPdfExporter.kt` para reflejar con exactitud la segmentación temporal en gráficos, tablas y tarjetas de métricas.
- **Correcciones Técnicas**: Resueltos problemas de ordenación de variables de estado y ámbito en Compose, asegurando una compilación libre de errores y sanidad con Spotless.

## 2026-06-05 - Pesos Configurables de Asistencia y Trabajo en Clase (Fase XLII)
- **Pesos de Asistencia y Trabajo en Clase**: Añadido soporte para configurar el peso (%) de la asistencia y del trabajo en clase en el promedio final ponderado de la planilla de calificaciones.
- **Rediseño de Ajustes (Layout 2x2)**: Reorganizado el selector de pesos en dos filas horizontales legibles, previniendo la saturación visual en pantallas móviles y soportando las 5 categorías de ponderación.
- **Simulador 'What-if' y PDF actualizados**: Sincronizado el cálculo de promedios ponderados en la ficha de progreso del estudiante, simulador interactivo manual/automático y exportador PDF para mantener consistencia del 100% con la grilla principal.
- **Verificación Técnica**: Compilación exitosa de Gradle en la feature docente y en la aplicación completa (0 errores, 0 warnings).

## 2026-06-05 - Más Mejoras Avanzadas en Planilla de Calificaciones (Fase XLI)
- **Ficha y Gráfico de Progreso PDF Imprimible:** Implementado un exportador A4 dedicado (`StudentProgressPdfExporter.kt`) que genera fichas individuales de alumnos con su gráfico de evolución dibujado en Canvas, tasas de asistencia, promedio y tabla detallada de notas.
- **Simulador de Notas 'What-if':** Añadido un simulador con dos modos (meta automática para proyecciones promedio y simulador manual con sliders en tiempo real) integrado en el perfil de evolución del alumno.
- **Sistema de Alerta Temprana:** Detección de estudiantes en riesgo combinando promedio insuficiente, asistencia menor a 75% o una secuencia de 3 notas en descenso, mostrando resúmenes de riesgo en `ClassSummaryPanel` y badges informativos.
- **Importador Interactivo de CSV:** Desarrollado un asistente interactivo multi-paso (`ImportGradesCsvDialog`) que permite subir archivos CSV, mapear columnas de datos (alumno, nota, feedback) y validar emparejamientos y umbrales antes de persistir.
- **Control de Seguridad y Personalización:** Añadido un botón de candado (🔓/🔒) en la barra para bloquear la edición de la planilla, y selectores de color premium por categoría de evaluación.
- **Verificación Técnica:** Código 100% conforme a las especificaciones con sanidad Spotless, Detekt y compilación exitosa (0 errores, 0 advertencias).

## 2026-06-05 - Mejoras Avanzadas en Planilla de Calificaciones (Fase XL)
- **Fórmula de Nota Final Configurable:** Integrada la opción de usar promedio ponderado en el cálculo de promedios de alumnos y curso, permitiendo configurar pesos por categoría (Tareas, Exámenes, Trimestrales) directamente en el diálogo de configuración.
- **Gráfico de Progreso del Alumno (Canvas):** Diseñado un gráfico de líneas dinámico con degradado y marcas en Compose `Canvas` para seguir la evolución de notas de un estudiante al tocar su nombre.
- **Vista de Resumen de Clase:** Incorporado un panel docente colapsable al inicio con promedio de clase, tasa de aprobación, contador de entregas tardías y un Canvas horizontal de distribución de notas.
- **Edición Inline por Celda:** Habilitado el doble toque para editar la calificación en la grilla mediante `BasicTextField` con auto-foco, guardado automático (al presionar Done o perder el foco) y validación de rango.
- **Reordenamiento Horizontal de Columnas:** Implementado el arrastre lateral de cabeceras mediante gestos (`detectDragGesturesAfterLongPress`) para reordenar interactivamente las columnas de notas.
- **Modo Comparación de Columnas:** Creado un diálogo de contraste de rendimiento que permite seleccionar dos actividades y ver sus promedios y tabla de diferencias (+/-) estudiante por estudiante.
- **Verificación Técnica:** Modificaciones modularizadas respetando el Extraction Mandate (`GradesSpreadsheetComponents.kt`). Sanity check y compilación exitosos (0 errores, 0 advertencias).

## 2026-06-04 - Etiquetas en Tablas/Mazos y Rediseño de Inicio (Fase XXXIX)
- Implementada la categorización mediante etiquetas persistentes (`tags`) para tablas didácticas y mazos de estudio.
- Realizada la migración de base de datos Room a la versión 46 con defaults seguros, y actualizados los mappers y modelos de dominio correspondientes.
- Diseñado un panel de control y workspace unificado en `DidacticToolsScreen` dividido en dos pestañas principales: "Herramientas" (tarjetas agrupadas por objetivos de estudio y creación) y "Mis Recursos" (grilla dinámica autogestionada con barra de búsqueda y filtros rápidos por burbujas de etiquetas).
- Actualizados los editores y diálogos de CRUD de tablas y mazos para permitir la entrada y modificación de etiquetas de manera interactiva.
- Verificación técnica: Compilación exitosa de la aplicación completa, detekt libre de advertencias y sanity check (0 errores).

## 2026-06-04 - Captura Rápida de Tarjetas Físicas (Multi-Crop) (Fase XXXVIII)
- Implementada la digitalización interactiva de múltiples tarjetas físicas ("Multi-Crop") a partir de una única imagen.
- Creado el componente interactivo `MultiCropCanvas` con soporte para arrastre de cuadriláteros, ajuste de esquinas independientes, lupa táctil de precisión y barra de control dedicada.
- Integrado ML Kit OCR (`OcrRepository`) para la detección automática y enmarcado de regiones con bloques de texto.
- Implementado el procesamiento de transformación de perspectiva en segundo plano (`setPolyToPoly`), guardando los recortes rectificados en archivos temporales del cache para su posterior importación a través de `ImportDeckUseCase`.
- Optimizado el layout en `DeckImportScreen` ocultando el topBar de Scaffold y el scroll vertical principal durante la fase de recorte interactivo, previniendo colisiones de gestos y maximizando la pantalla de edición.
- Verificación técnica: Sanity check general superado exitosamente (Spotless, Detekt y ArchUnit con 0 errores).

## 2026-06-02 - Categorización de Clase al Cerrar (Fase XXXVII)
- Implementada la capacidad de elegir la categoría final de una clase ("No planificada", "Planificada" o "Dada") directamente desde el formulario de registro post-clase en `ClassPlanCard`.
- Actualizado el componente `ClassPlanCard` para incluir un selector de estado mediante chips integrados en la zona de reporte, permitiendo un cierre más preciso y categorizado.
- Evolucionado el flujo de datos completo:
  - Modificado `SaveClassPlanReportUseCase` para persistir el estado elegido.
  - Actualizado `TeachingViewModel` y las firmas de callbacks en `CourseDetailScreen`, `CourseOverviewTab` y `ClassPlanPagerDialog` para propagar el nuevo parámetro.
- Añadidos recursos de texto específicos en `:core:ui` para mantener la consistencia de las etiquetas de estado.
- Verificación técnica: Compilación modular exitosa y validación de flujo funcional desde la UI hasta la base de datos Room (v42).

## 2026-06-02 - Herramientas Didácticas: Sistema Avanzado de Cartas y OCR (Fase XXXVII)
- Implementada la nueva pestaña de **"Didáctica"** en la navegación principal, diseñada para albergar utilidades de aprendizaje activo y herramientas para docentes.
- Portado e integrado el sistema avanzado de cartas desde el proyecto `Deckapp`, incluyendo soporte para múltiples caras (`CardFace`), modos de contenido (imagen, texto, zonas) y proporciones de aspecto configurables.
- Desarrollado el asistente inteligente de **Importación de Vocabulario** con flujo multi-paso:
  - **Selección de Fuente:** Soporte para PDF y archivos de imagen.
  - **Renderizado Nativo:** Integrada la capacidad de renderizar páginas de PDF a Bitmaps mediante `PdfRenderer`.
  - **Recorte de Perspectiva:** Creado el componente `PerspectiveCropView` en `:core:ui` que permite ajustar esquinas y corregir la distorsión de fotos de libros o pizarras con lupa de aumento.
  - **Reconocimiento Inteligente (OCR):** Integrado ML Kit con pre-procesamiento de imagen (contraste, escala de grises) y el `AnalyzeVocabularyImageUseCase` para detectar automáticamente pares de palabras en listas o tablas.
- Evolucionada la persistencia Room a la versión **42** con `Migration41To42`, añadiendo entidades para Mazos (`decks`), Cartas (`deck_cards`) y Caras (`deck_card_faces`) con soporte para serialización JSON en zonas de contenido.
- Implementado el mazo de vocabulario como la primera herramienta funcional, permitiendo guardar resultados del OCR directamente en mazos nuevos o existentes.
- Verificación técnica: Compilación modular exitosa (`BUILD SUCCESSFUL`) y validación de arquitectura Clean Architecture respetada.

## 2026-06-01 - Horarios en Materias y Cursos (Fase XXXVI)
- Implementada la posibilidad de definir el horario de inicio y fin (`startTime` y `endTime`) para Materias (Planificación) y Cursos/Comisiones (Docente).
- Diseñado y creado el componente reutilizable `EstudiTimePickerField` en `:core:ui` utilizando el diálogo nativo de Android `TimePickerDialog` en formato 24h.
- Evolucionada la base de datos Room a la versión **40** mediante una migración explícita `Migration39To40` para añadir los nuevos campos en `subjects` y `teaching_courses`.
- Integrados los campos de horario de inicio/fin en las hojas y diálogos de creación/edición (`CreateSubjectSheet`, `CreateCourseSheet`, `PlannerCreateMenu`, `SubjectDetailScreen`, `CourseDetailScreen`).
- Actualizada la visualización en pantalla con iconos de reloj e información de rango en los detalles de materias y cursos.
- Verificación técnica: Sanity check y pruebas de migración de base de datos aprobadas exitosamente (0 errores).

## 2026-05-31 - Integración del Icono Adaptativo Premium (Fase XXXV)
- Diseñado y creado el nuevo icono adaptativo premium para la aplicación utilizando el sistema de vectores nativos XML de Android (`ic_launcher_background.xml` y `ic_launcher_foreground.xml`).
- Sincronizados los colores de marca adaptativos: `Ink` (`#1C2430`) para el fondo y una combinación geométrica sofisticada de `Sky` (`#7EA8BE`), `Coral` (`#D88770`), `Sand` (`#DCC9A3`) y `Moss` (`#56735B`) en el primer plano.
- Creadas las definiciones del icono adaptativo para lanzadores estándar y redondos en `mipmap-anydpi-v26/ic_launcher.xml` e `ic_launcher_round.xml`.
- Modificado `AndroidManifest.xml` para enlazar los nuevos recursos mipmap en lugar del icono del sistema genérico.
- Verificación técnica: Compilación completa (`:app:assembleDebug`) exitosa y sanity check aprobado con cero errores.

## 2026-05-31 - Edición y Borrado Universal de Clases (Fase XXXIV)
- Corregida la omisión de acciones de edición en las pantallas de **Detalle de Materia** y **Detalle de Curso**, permitiendo ahora modificar el nombre (título), fecha, objetivos y borrar clases desde cualquier vista donde aparezcan.
- Refactorizada la hoja de edición `PlannerClassPlanEditSheet` a un componente compartido `ClassPlanEditSheet` en `:core:ui`, facilitando su reutilización entre módulos sin violar la dirección de dependencias.
- Centralizada la lógica de plantillas y estructura didáctica en `ClassPlanUtils.kt` dentro de `:core:model`.
- Actualizados `SubjectDetailScreen` y `CourseDetailScreen` para manejar el estado de edición y mostrar el BottomSheet correspondiente.
- Expandido `TeachingViewModel` con métodos explícitos para actualización y borrado de clases, asegurando consistencia con el repositorio.
- Verificación técnica: Compilación de módulos `:feature:planner` y `:feature:teaching` exitosa tras el refactor.

## 2026-05-31 - Guía de Uso y Ayuda Integrada (Fase XXXIII)
- Implementada la sección de **"Ayuda" (Help)** en el menú "Más" de la navegación principal, proporcionando un centro de asistencia directo dentro de la app.
- Diseñada una interfaz de usuario organizada por **pestañas (Tabs)**: General, Estudiante, Docente y Herramientas, facilitando la localización rápida de información sobre funciones específicas.
- Creado el módulo funcional `:feature:help` siguiendo la arquitectura modular del proyecto y el **Extraction Mandate** para mantener la lógica de UI desacoplada.
- Desarrollada la guía de contenido estático utilizando componentes de sistema de diseño compartido (`EstudiCard`), cubriendo desde la navegación básica hasta herramientas avanzadas como el simulador de exámenes y la gestión docente.
- Creado el archivo externo `USER_GUIDE.md` como documentación complementaria y fuente de verdad para el contenido de ayuda.
- Verificación técnica: Compilación de Kotlin exitosa (`BUILD SUCCESSFUL`) y validación de integración en el NavHost.

## 2026-05-31 - Extractor Inmediato de Flashcards (:: a Room) en EstudiRichEditor (v4)
- Desarrollada la vinculación y extracción instantánea en lote de flashcards a partir de la escritura didáctica del `EstudiRichEditor` con sintaxis `Pregunta :: Respuesta`.
- Añadido el parámetro opcional `onExtractFlashcards` a `EstudiRichEditor` y diseñado un `SuggestionChip` interactivo premium (`⚡ Extraer Tarjetas`) en la barra flotante que aparece de forma dinámica al detectarse el separador `::` en el texto.
- Propagado el callback a través de la arquitectura en capas de presentación didáctica: `ClassPlanningTab` ➔ `ClassPlanPagerDialog` ➔ `CourseOverviewTab` ➔ `CourseDetailScreen`.
- Implementado el método `addFlashcardsBatch` en `TeachingViewModel` para inyectar metadatos correctos de Materia (`subject`) y Tema (`topic`) a partir del plan de clase actual y persistirlos en lote en Room (`StudyRepository.upsertFlashcard`).
- Sumado feedback de confirmación visual en pantalla mediante un `Toast` premium que reporta la cantidad de tarjetas extraídas al instante.
- Compilación de Kotlin y sanity check general exitosos (0 errores).

## 2026-05-31 - Citas, Notas Destacadas y Callouts Didácticos en EstudiRichEditor (v3)
- Desarrollado el soporte premium en tiempo real para citas y notas destacadas (Callouts didácticos estilo Notion/Obsidian) en el `EstudiRichEditor` mediante `MarkdownVisualTransformation`.
- Diseñados estilos visuales semánticos y responsivos con alphas sobre los colores del tema: `[!TIP]` (verde/secundario), `[!WARNING]` (rojo/errorColor), `[!IMPORTANT]`/`[!CAUTION]` (azul/primario), y citas genéricas `>` (gris/contorno), logrando una atenuación inteligente del 30% en los prefijos técnicos para una lectura ultra limpia.
- Implementado el "Enter Inteligente" para citas en Compose: auto-continúa el bloque insertando `> ` en saltos de línea y sale automáticamente de la cita (borrando el prefijo) al presionar Enter en una línea vacía.
- Añadidos comandos slash de acceso rápido (`/tip`, `/advertencia`, `/nota`) para insertar instantáneamente las plantillas de callouts.
- Resuelto de forma limpia el problema de invocaciones de composables prohibidos en `VisualTransformation.filter()` inyectando `onSurfaceColor` en el constructor del transformador.
- Compilación de Kotlin y sanity check general exitosos (0 errores).

## 2026-05-30 - Recursos de Carpetas, Hover y Deshacer en Planificación
- Implementada la vinculación de recursos (materiales, notas, PDFs) en la planificación (tareas y evaluaciones), evolucionando el esquema de base de datos Room a la versión **31** con `Migration30To31` de forma totalmente segura.
- Creado e integrado un emergente de detalle **Hover** interactivo en formato de `AlertDialog` premium que se despliega al pulsar un tag/SuggestionChip de recurso vinculado en las tarjetas de tareas, mostrando su contenido o enlace de origen con scroll vertical fluido.
- Diseñado y desarrollado un diálogo contextual de modificación de carpetas (`EditFolderDialog`) para cambiar nombre, color Hex, y reubicación jerárquica de la carpeta (re-anidamiento para soporte nativo de subcarpetas en el explorador).
- Implementado un sistema robusto de Snackbars con acción **"Deshacer" (Undo)** para la creación de carpetas (elimina la carpeta), edición (restablece metadatos y jerarquía originales), arrastre de material (Drag & Drop) (reubica en la carpeta previa) y eliminación de carpetas (restaura recursivamente la carpeta con todas sus carpetas e importaciones hijas mediante `restoreFolder`).
- Validación y compilación Gradle limpia de `:feature:planner` y todas sus dependencias completada con éxito.

## 2026-05-30 - Índice de Dominio y Modo Pánico
- Implementado `GetTopicMasteryUseCase` para calcular el nivel de preparación por tema combinando flashcards (Leitner) y tareas.
- Implementado `ObservePanicModeUseCase` que detecta automáticamente exámenes inminentes (próximos 3 días).
- Integrado el "Modo Pánico" en el Dashboard: cuando está activo, se filtra el "ruido" de otras materias para priorizar el examen cercano y los temas con bajo dominio.
- Evolución de los modelos de dominio para soportar métricas de maestría y snapshots de crisis académica.
- Estos cambios sientan la base para una experiencia de estudiante enfocada en el aprendizaje profundo y la gestión del estrés pre-examen.
- Validación lógica completada.

## 2026-05-25 - Scaffold inicial
- Definida la arquitectura modular Android-first.
- Creado `GEMINI.md` como fuente de verdad del proyecto.
- AÃ±adidos documentos de planificacion inicial.
- Montado el scaffold con Compose, Hilt, Room y navegacion base.
- Implementados dominio inicial de tareas de estudio, dashboard y catalogo de tecnicas.

## 2026-05-25 - Planner funcional
- AÃ±adidas entidades de `Subject` y `StudyMaterial`.
- Room evolucionado a version 2 con migracion `1 -> 2`.
- Implementado `PlannerViewModel` con captura real de materias, tareas y materiales.
- El dashboard ya consume tareas persistidas desde la fuente local.
- Validacion completada con `.\gradlew.bat :app:assembleDebug`.

## 2026-05-25 - Detalle por materia
- AÃ±adida navegacion a `subject/{subjectId}` desde planner y dashboard.
- Implementada pantalla de detalle por materia con tareas filtradas, materiales y carga estimada.
- Cada tarjeta de materia en el planner ahora funciona como punto de entrada a su espacio propio.
- Validacion completada con `.\gradlew.bat :app:assembleDebug`.

## 2026-05-25 - Carpeta local de recursos
- AÃ±adido soporte de carpeta local del dispositivo mediante `OpenDocumentTree`.
- Persistencia del URI de carpeta con DataStore.
- Lectura de archivos con `DocumentFile` e importacion como materiales referenciados.
- Room evolucionado a version 3 para distinguir materiales manuales vs materiales importados desde carpeta.
- Validacion completada con `.\gradlew.bat :app:assembleDebug`.

## 2026-05-25 - Apertura de materiales
- AÃ±adido soporte para abrir enlaces manuales con `ACTION_VIEW`.
- AÃ±adido soporte para abrir archivos importados desde carpeta usando el URI persistido y `FLAG_GRANT_READ_URI_PERMISSION`.
- Integrada accion `Abrir` tanto en el planner como en el detalle por materia.
- Validacion completada con `.\gradlew.bat :app:assembleDebug`.

## 2026-05-25 - Visor interno basico
- AÃ±adida navegacion a un viewer interno para materiales compatibles.
- Soporte de vista interna para imagenes locales mediante `coil-compose`.
- Soporte de vista interna para PDFs locales mediante `PdfRenderer`.
- Fallback externo preservado para materiales no compatibles con visor interno.
- Validacion completada con `.\gradlew.bat :app:assembleDebug --no-daemon`.

## 2026-05-25 - Apuntes internos editables
- AÃ±adido flujo de creacion de apuntes y resÃºmenes propios dentro del planner.
- Los apuntes se guardan como materiales de tipo `Note` asociados opcionalmente a una materia.
- El viewer interno ahora actua como editor para notas manuales, permitiendo modificar titulo y contenido.
- Validacion completada con `.\gradlew.bat :app:assembleDebug --no-daemon`.

## 2026-05-25 - Organizacion jerarquica
- AÃ±adidos modelos, entidades Room y migracion para `StudyUnit` y `StudyTopic`.
- La estructura academica ahora soporta `Materia > Unidad > Tema`.
- Tareas, materiales y apuntes ya pueden quedar asociados a un tema especifico.
- El planner muestra la jerarquia y el detalle de materia ahora expone unidades y temas.
- Validacion completada con `.\gradlew.bat :app:assembleDebug --no-daemon`.

## 2026-05-25 - Agenda temporal
- AÃ±adida fecha objetivo opcional a las tareas con formato `YYYY-MM-DD`.
- Room evolucionado a version 5 con migracion para `dueDate`.
- El planner ahora muestra un resumen de agenda en `Hoy`, `Esta semana` y `Proximamente`.
- El dashboard prioriza tareas por urgencia temporal y muestra esas mismas secciones.
- Validacion completada con `.\gradlew.bat :app:assembleDebug --no-daemon`.

## 2026-05-25 - Tablero por estado
- AÃ±adida actualizacion de estado de tareas desde UI.
- Las tareas ya se pueden mover entre `Pending`, `InProgress` y `Done`.
- El planner muestra resumen de tablero y tarjetas de tarea con cambio rapido de estado.
- El detalle de materia ahora tambien permite actualizar estado.
- El dashboard resume pendientes, en curso y hechas.
- Validacion completada con `.\gradlew.bat :app:assembleDebug --no-daemon`.

## 2026-05-25 - Examenes y entregas
- AÃƒÂ±adidos modelos, entidad Room, DAO y migracion `5 -> 6` para `Assessment`.
- Las evaluaciones ahora viven como un flujo separado de las tareas y soportan tipo, fecha, estado y notas.
- El planner permite crear examenes y entregas vinculados a materia y tema.
- El detalle de materia y el dashboard ya muestran proximas evaluaciones y permiten marcarlas como completadas.
- Validacion completada con `.\gradlew.bat :app:assembleDebug --console=plain --no-daemon`.

## 2026-05-25 - Subtareas y checklist
- AÃƒÂ±adidos modelo, entidad Room, DAO y migracion `6 -> 7` para `StudySubtask`.
- Cada tarea ahora puede tener un checklist persistido de pasos concretos.
- El planner y el detalle de materia muestran progreso `hechas / totales` por tarea.
- Las subtareas se pueden crear y marcar como completadas directamente desde la tarjeta de tarea.
- Validacion completada con `.\gradlew.bat :app:assembleDebug --console=plain --no-daemon`.

## 2026-05-25 - Vistas guardadas
- AÃƒÂ±adido modelo `PlannerViewPreset` y persistencia ligera en DataStore para filtros guardados.
- El planner ahora permite guardar presets de vista con nombre, modo de filtro y materia asociada.
- Los presets se pueden reaplicar y borrar desde la seccion de vista rapida.
- Esto reduce el costo de volver a focos recurrentes como `Pendientes`, `Esta semana` o una materia concreta.
- Validacion completada con `.\gradlew.bat :app:assembleDebug --console=plain --no-daemon`.

## 2026-05-25 - Clases planificadas para docentes
- AÃƒÂ±adidos modelos, entidad Room, DAO y migracion `7 -> 8` para `ClassPlan`.
- El planner ahora permite crear clases planificadas con fecha, objetivo, actividades y vinculacion a materia y tema.
- Las clases pueden marcarse como `Planificada` o `Dada`.
- El detalle por materia y el dashboard ahora muestran proximas clases para sostener la organizacion docente.
- Validacion completada con `.\gradlew.bat :app:assembleDebug --console=plain --no-daemon`.

## 2026-05-25 - Secuencia didactica por clase
- `ClassPlan` ahora incorpora bloques de `Inicio`, `Desarrollo`, `Cierre` y `Recursos`.
- Room evolucionado a version 9 con migracion `8 -> 9` para persistir esa secuencia didactica.
- El formulario de clases del planner ya permite cargar esos campos de forma directa.
- Las tarjetas de clase muestran la secuencia y los recursos junto con el objetivo general.
- Validacion completada con `.\gradlew.bat :app:assembleDebug --console=plain --no-daemon`.

## 2026-05-25 - Registro real de clase
- `ClassPlan` ahora incorpora `attendanceCount`, `attendanceNotes` y `deliveredContent`.
- Room evolucionado a version 10 con migracion `9 -> 10` para guardar asistencia y lo efectivamente dado.
- Las tarjetas de clase ahora permiten cargar ese registro post-clase sin salir del planner o del detalle de materia.
- Esto permite comparar la planificacion original con lo que realmente paso en clase.
- Validacion completada con `.\gradlew.bat :app:assembleDebug --console=plain --no-daemon`.

## 2026-05-25 - Calendario semanal de clases
- El dashboard ahora expone `classWeekPlans` para resumir la semana docente actual.
- Planner y dashboard agrupan las clases por dia de la semana en una vista calendario simple.
- La vista semanal muestra tambien el estado de cada clase para distinguir rapido entre `Planificada` y `Dada`.
- Esto mejora mucho la lectura operativa de la semana sin entrar a cada materia.
- Validacion completada con `.\gradlew.bat :app:assembleDebug --console=plain --no-daemon`.

## 2026-05-25 - Plantillas de clase
- AÃƒÂ±adido modelo `ClassTemplate` y persistencia ligera en DataStore para estructuras reutilizables de clase.
- El formulario de clases ahora permite guardar una plantilla con objetivo, secuencia didactica, recursos y contexto academico.
- Las plantillas se pueden aplicar y borrar desde el propio planner.
- Esto acelera mucho la preparacion de clases recurrentes o con formatos repetidos.
- Validacion completada con `.\gradlew.bat :app:assembleDebug --console=plain --no-daemon`.

## 2026-05-25 - Planificacion por secuencia o trimestre
- AÃƒÂ±adidos modelo, entidad Room, DAO y migracion `10 -> 11` para `TeachingSequence`.
- Las clases ahora pueden vincularse opcionalmente a una secuencia didactica mayor.
- El planner permite crear secuencias con periodo, objetivo y cantidad de clases previstas.
- Planner y detalle de materia muestran progreso real por secuencia usando clases `Dadas` sobre clases previstas.
- Validacion completada con `.\gradlew.bat :app:assembleDebug --console=plain --no-daemon`.

## 2026-05-25 - Evaluacion por secuencia
- `TeachingSequence` ahora incorpora `achievedSummary`, `pendingContent` y `closingNotes`.
- Room evolucionado a version 12 con migracion `11 -> 12` para guardar el cierre pedagogico de cada secuencia.
- Las tarjetas de secuencia ahora permiten registrar logros, pendientes y observaciones desde planner y detalle de materia.
- Esto completa el ciclo entre planificacion, ejecucion y evaluacion de bloques docentes.
- Validacion completada con `.\gradlew.bat :app:assembleDebug --console=plain --no-daemon`.

## 2026-05-25 - Indicadores y reportes docentes
- `DashboardSnapshot` ahora resume clases dadas, clases planificadas, secuencias abiertas y secuencias con pendientes.
- El dashboard muestra paneles operativos y secuencias marcadas para revision.
- El planner incorpora un reporte docente rapido y alertas de secuencia.
- Esto transforma la capa docente en un sistema de seguimiento real, no solo de carga administrativa.
- Validacion completada con `.\gradlew.bat :app:assembleDebug --console=plain --no-daemon`.

## 2026-05-25 - Materiales vinculados a clases y secuencias
- `StudyMaterial` ahora incorpora referencia opcional a `ClassPlan` y `TeachingSequence`.
- Room evolucionado a version 13 con migracion `12 -> 13` para persistir esos nuevos enlaces docentes.
- El planner ahora permite asociar materiales manuales, apuntes e importaciones desde carpeta a una secuencia o a una clase concreta.
- Las tarjetas de materiales, clases y secuencias ya muestran esas relaciones tambien en el detalle por materia.
- Validacion completada con `.\gradlew.bat :app:assembleDebug --console=plain --no-daemon`.

## 2026-05-25 - Kit docente por clase y secuencia
- AÃƒÂ±adido `TeachingMaterialKitSection` como bloque reutilizable para mostrar materiales docentes asociados.
- Las tarjetas de `ClassPlan` y `TeachingSequence` ahora permiten abrir y cerrar su propio kit docente desde planner y detalle de materia.
- Cada material del kit se puede abrir directamente reutilizando la logica interna o externa ya existente de la app.
- Esto convierte a clases y secuencias en puntos reales de trabajo, no solo en registros de planificacion.
- Validacion completada con `.\gradlew.bat :app:assembleDebug --console=plain --no-daemon`.

## 2026-05-25 - Pendientes docentes por clase y secuencia
- AÃƒÂ±adidos `TeachingActionItem` y `TeachingActionKind` para modelar tareas docentes operativas.
- Room evolucionado a version 14 con migracion `13 -> 14` para persistir checklists docentes dentro de `ClassPlan` y `TeachingSequence`.
- Las tarjetas de clase y secuencia ahora permiten agregar pendientes tipados como `Preparar`, `Corregir`, `Revisar` o `Seguimiento`, y marcarlos como hechos o reabiertos.
- Esto transforma la planificacion docente en un espacio de ejecucion concreta, no solo de diseÃ±o pedagÃ³gico.
- Validacion completada con `.\gradlew.bat :app:assembleDebug --console=plain --no-daemon`.

## 2026-05-25 - Cursos y comisiones docentes
- AÃƒÂ±adido modelo `TeachingCourse` con persistencia Room propia para reutilizar grupos reales de alumnos.
- Room evolucionado a version 15 con migracion `14 -> 15`, sumando `teaching_courses` y vinculacion opcional desde `ClassPlan` y `TeachingSequence`.
- El planner ahora permite crear cursos/comisiones y asociarlos al cargar secuencias y clases planificadas.
- Las tarjetas docentes, el detalle por materia y el dashboard ya muestran esa capa para leer mejor la planificacion por grupo.
- Validacion completada con `.\gradlew.bat :app:assembleDebug --console=plain --no-daemon`.

## 2026-05-25 - Vista por curso
- AÃƒÂ±adida navegacion `course/{courseId}` y pantalla dedicada para cada curso o comision.
- La nueva vista concentra clases, secuencias y materiales vinculados a ese grupo, reutilizando las tarjetas docentes existentes.
- El planner ahora muestra accesos directos por curso y el dashboard permite entrar al curso desde clases proximas.
- Esto convierte a `TeachingCourse` en un centro operativo real de seguimiento docente, no solo en un dato auxiliar.
- Validacion completada con `.\gradlew.bat :app:assembleDebug --console=plain --no-daemon`.

## 2026-05-25 - Asistencia por curso con historial
- La vista de curso ahora calcula asistencia acumulada, cantidad de clases con registro y promedio simple por curso.
- Tambien muestra un historial reciente por clase usando `attendanceCount` y `attendanceNotes` ya guardados en cada `ClassPlan`.
- El dashboard suma visibilidad operativa con un indicador de cuantas clases ya tienen asistencia registrada.
- Esto convierte a la vista de curso en un espacio de seguimiento docente real, no solo de planificacion.
- Validacion completada con `.\gradlew.bat :app:assembleDebug --console=plain --no-daemon`.

## 2026-05-25 - Calificaciones por curso e interfaz mejorada
- AÃƒÂ±adido modelo `CourseGradeRecord` con persistencia Room propia para registrar notas y devoluciones por curso.
- Room evolucionado a version 16 con migracion `15 -> 16`, sumando `course_grade_records`.
- La vista de curso ahora permite cargar actividad, fecha, calificacion y comentario pedagogico, y lista esos registros dentro del propio curso.
- El sistema visual gano una jerarquia mas clara con `EstudiMetricCard` y una presentacion mas fuerte de metricas en dashboard, planner y curso.
- Validacion completada con `.\gradlew.bat :app:assembleDebug --console=plain --no-daemon`.

## 2026-05-25 - Cola modular de repaso
- AÃ±adido modulo `:feature:review` con pantalla propia y entrada en la navegacion principal.
- La cola de repaso se arma desde tareas pendientes, evaluaciones proximas y materiales existentes, sin sumar migraciones Room.
- Cada sugerencia muestra contexto, motivo de prioridad y minutos estimados, con acceso directo a materia o material.
- Validacion completada con `.\gradlew.bat :app:compileDebugKotlin --console=plain --no-daemon`.

## 2026-05-25 - Historial real de sesiones de estudio
- AÃ±adido modelo `StudySession`, entidad Room, DAO, mapper y migracion `16 -> 17`.
- El timer ahora guarda una sesion al completar un bloque de foco, incluyendo tarea, materia, tecnica, timestamps y minutos.
- La pantalla de enfoque muestra historial reciente y el dashboard usa minutos reales estudiados hoy.
- Validacion completada con `.\gradlew.bat :app:compileDebugKotlin --console=plain --no-daemon`.

## 2026-05-25 - Buscador global modular
- AÃ±adido modulo `:feature:search` con entrada propia en la navegacion principal.
- La busqueda cruza materias, tareas, materiales, evaluaciones, clases, secuencias y cursos desde contratos de dominio.
- Los resultados permiten abrir materiales, materias o cursos sin duplicar pantallas de detalle.
- Validacion completada con `.\gradlew.bat :app:compileDebugKotlin --console=plain --no-daemon`.

## 2026-05-26 - Recomendaciones academicas ligeras
- AÃ±adido modelo `AcademicRecommendation` con prioridad y vinculacion opcional a materia.
- El dashboard ahora muestra recomendaciones derivadas de tareas vencidas, evaluaciones cercanas, materias sin foco reciente y carga pendiente.
- Las recomendaciones se calculan desde `core:domain` usando datos existentes, sin nueva persistencia.
- Validacion completada con `.\gradlew.bat :app:compileDebugKotlin --console=plain --no-daemon`.

## 2026-05-26 - Calendario academico modular
- AÃ±adido modulo `:feature:calendar` con entrada `Agenda` en la navegacion principal.
- La agenda semanal agrupa tareas, evaluaciones, clases planificadas y sesiones de estudio registradas.
- La vista permite navegar entre semanas y abrir materias o cursos desde eventos relacionados.
- Validacion completada con `.\gradlew.bat :app:compileDebugKotlin --console=plain --no-daemon`.

## 2026-05-26 - Reportes docentes y de foco
- AÃ±adido modulo `:feature:reports` con entrada propia en la navegacion principal.
- El reporte general resume foco acumulado, clases dadas, clases planificadas, registros de asistencia y secuencias abiertas.
- Cada curso muestra clases dadas/planificadas, asistencia promedio, secuencias abiertas, pendientes docentes, calificaciones y ultima devolucion.
- Validacion completada con `.\gradlew.bat :app:compileDebugKotlin --console=plain --no-daemon`.

## 2026-05-26 - Plantillas inteligentes de tareas
- AÃ±adido catalogo `SmartTaskTemplate` dentro de `:feature:planner` para crear tareas recurrentes con checklist automatico.
- Las plantillas iniciales cubren preparar examen, leer PDF, preparar clase, corregir trabajos y repasar tema.
- El repositorio ahora permite insertar una tarea devolviendo su id para crear subtareas asociadas de forma consistente.
- Validacion completada con `.\gradlew.bat :app:compileDebugKotlin --console=plain --no-daemon`.

## 2026-05-26 - Edicion real en planner
- Las tarjetas compartidas de tareas y evaluaciones ahora aceptan accion opcional de edicion.
- El planner permite editar tareas existentes con titulo, minutos, fecha objetivo, tecnica y prioridad.
- El planner permite editar evaluaciones existentes con titulo, fecha, tipo y notas.
- Los cambios actualizan las entidades persistidas sin recrear registros ni perder estado asociado.
- Validacion completada con `.\gradlew.bat :app:compileDebugKotlin --console=plain --no-daemon`.

## 2026-05-26 - Checklist avanzado
- Las tareas ahora permiten pegar varias lineas en el campo de nuevo paso para crear multiples subtareas.
- El planner puede marcar todas las subtareas de una tarea como hechas o reabrirlas en bloque.
- La API de `StudyTaskCard` mantiene callbacks opcionales para no forzar cambios en otras pantallas.
- Validacion completada con `.\gradlew.bat :app:compileDebugKotlin --console=plain --no-daemon`.

## 2026-05-26 - Editor de materiales y duplicado rapido
- Las tarjetas compartidas de materiales ahora aceptan acciones opcionales de edicion y duplicado.
- El planner permite editar titulo, referencia, tipo y asociaciones academicas de materiales sin recrearlos.
- Tareas, evaluaciones y materiales pueden duplicarse desde sus tarjetas, manteniendo asociaciones utiles y reseteando estados operativos.
- Las tareas duplicadas copian su checklist como pasos pendientes para reutilizar estructuras de estudio.
- Validacion completada con `.\gradlew.bat :app:compileDebugKotlin --console=plain --no-daemon`.

## 2026-05-26 - Asistente ligero para planificar clases
- AÃƒÂ±adido indicador de preparacion en `ClassPlanCard`, reutilizable desde planner, materia y curso.
- El indicador evalua objetivo, inicio, desarrollo, cierre, recursos/materiales y pendientes docentes.
- El formulario de clase ahora puede armar una estructura base con actividades, apertura, desarrollo, cierre y recursos.
- La mejora no agrega persistencia nueva: usa campos existentes y mantiene la logica modular en `:feature:teaching` y `:feature:planner`.
- Validacion completada con `.\gradlew.bat :app:compileDebugKotlin --console=plain --no-daemon`.

## 2026-05-26 - Continuidad de planificacion docente
- AÃƒÂ±adida accion opcional en `ClassPlanCard` para planificar la siguiente clase desde una existente.
- La nueva clase conserva materia, curso, secuencia, objetivo, momentos didacticos, recursos y pendientes docentes.
- El registro real se limpia: asistencia, observaciones, contenido dado y estado vuelven a una clase planificada.
- La fecha se sugiere una semana despues cuando la fecha original usa formato ISO.
- La accion esta disponible desde planner general, detalle de materia y detalle de curso.
- Validacion completada con `.\gradlew.bat :app:compileDebugKotlin --console=plain --no-daemon`.

## 2026-05-26 - Asistencia por estudiante
- AÃƒÂ±adidos modelos `Student`, `ClassAttendanceRecord`, `AttendanceStatus` y `ClassWorkStatus`.
- Room evoluciono a version 18 con tablas `students` y `class_attendance_records`, mas migracion `17 -> 18`.
- La vista de curso permite agregar estudiantes, editar nombres y sacarlos de la lista.
- Cada clase del curso permite registrar por estudiante si estuvo presente o ausente, si entrego tarea, trabajo en clase o no hizo nada.
- Los llamados de atencion quedan como nota persistida dentro del registro de asistencia de esa clase.
- Al sacar un estudiante tambien se limpian sus registros de asistencia asociados.
- Validacion completada con `.\gradlew.bat :app:compileDebugKotlin --console=plain --no-daemon`.

## 2026-05-26 - Estados de asistencia combinables
- El estado de asistencia ahora contempla `Se retiro` ademas de presente y ausente.
- `AttendanceStatus` declara explicitamente si cada estado cuenta como asistencia.
- La asistencia se mantiene separada del trabajo de clase, permitiendo combinaciones como presente + trabajo en clase o se retiro + no hizo nada.
- El resumen de clase muestra estudiantes con asistencia segun esa regla, no solo presentes literales.
- Validacion completada con `.\gradlew.bat :app:compileDebugKotlin --console=plain --no-daemon`.

## 2026-05-26 - Navbar compacto
- La barra inferior ahora prioriza `Hoy`, `Plan`, `Agenda` y `Reportes`.
- Las secciones secundarias `Enfoque`, `Repaso`, `Buscar` y `Tecnicas` pasan a un menu `Mas` en bottom sheet.
- El destino activo se calcula tambien para pantallas de detalle, manteniendo resaltado `Plan` al abrir materia, curso o material.
- Se mantuvieron todas las rutas existentes sin modificar los modulos de features.
- Validacion completada con `.\gradlew.bat :app:compileDebugKotlin --console=plain --no-daemon`.

## 2026-05-26 - Asistencia rapida y seguimiento docente
- La asistencia por clase ahora guarda al tocar el estado de asistencia o de trabajo.
- Agregadas acciones masivas: todos presentes, todos ausentes y copiar asistencia anterior.
- Cada clase muestra resumen de ausentes, retirados, tareas, estudiantes sin trabajo y llamados de atencion.
- El curso muestra seguimiento por estudiante para detectar rapidamente casos que conviene revisar.
- El repositorio evita duplicar registros por estudiante/clase al guardar desde acciones rapidas.
- Validacion completada con `.\gradlew.bat :app:compileDebugKotlin --console=plain --no-daemon`.

## 2026-05-26 - Prioridades de curso y filtro de asistencia
- Agregado calculo modular de prioridades de planificacion en `:feature:teaching`.
- El detalle del curso ahora destaca proxima clase, clases vencidas, cierres pendientes, pendientes docentes y secuencias por completar.
- La asistencia por clase muestra estudiantes sin registrar y permite alternar entre lista completa y solo alertas.
- El filtro de alertas incluye ausentes, retirados, estudiantes sin trabajo, llamados de atencion y registros pendientes.
- Validacion completada con `.\gradlew.bat :app:compileDebugKotlin --console=plain --no-daemon`.

## 2026-05-26 - Analitica de asistencia y secuencias
- Agregado calculo modular de asistencia acumulada por estudiante en `:feature:teaching`.
- El detalle del curso ahora muestra porcentaje de asistencia, faltas, retiros, falta de trabajo y llamados por estudiante.
- Agregado resumen de avance por secuencia con clases dadas, clases planificadas, pendientes docentes y contenido pendiente.
- Las nuevas secciones reutilizan datos existentes sin migraciones ni nueva persistencia.
- Validacion completada con `.\gradlew.bat :app:compileDebugKotlin --console=plain --no-daemon`.

## 2026-05-26 - Modos estudiante/maestro en planner
- Agregado `PlannerMode` para alternar entre flujo de estudiante y flujo docente dentro de `Plan`.
- El modo estudiante prioriza agenda, materias, examenes, tareas y biblioteca.
- El modo maestro prioriza cursos, clases planificadas, secuencias y biblioteca docente.
- El menu `+` ahora adapta sus acciones al modo activo para no mezclar tareas de estudio con planificacion docente.
- Agregada accion docente `Planificar dias de clase`, que genera multiples clases para un curso segun rango de fechas y dias de semana seleccionados.
- Validacion completada con `.\gradlew.bat :app:compileDebugKotlin --console=plain --no-daemon`.

## 2026-05-26 - Acceso visible a creacion en planner
- El modo estudiante/maestro ahora se guarda con estado salvable para no volver a estudiante al cambiar de pestaÃ±a.
- Agregado boton principal visible dentro de `Plan` para crear contenido sin depender solo del FAB.
- `PlannerCreateMenu` ahora soporta lanzador flotante y boton ancho reutilizando el mismo flujo de creacion.
- Validacion completada con `.\gradlew.bat :app:compileDebugKotlin --console=plain --no-daemon`.

## 2026-05-26 - Preferencia real de modo y editor de clases
- El modo estudiante/maestro ahora se persiste en DataStore desde `StudyPreferences`.
- El estado del planner expone el modo persistido desde `core:model`, `core:domain` y `core:data`.
- Agregado bloque de primeros pasos para orientar la carga inicial segun modo estudiante o maestro.
- Las clases planificadas ahora pueden editar titulo, fecha, objetivo, actividades, inicio, desarrollo, cierre y recursos.
- La accion de edicion se agrego como callback opcional en `ClassPlanCard` para mantener compatibilidad con otras pantallas.
- Validacion completada con `.\gradlew.bat :app:compileDebugKotlin --console=plain --no-daemon`.

## 2026-05-26 - Presets del editor de planificacion
- Extraido generador modular `ClassPlanStructureGenerator` para reutilizar estructura didactica en creacion y edicion.
- Agregados presets de clase: general, ingles grammar, speaking, reading, vocabulary y evaluacion corta.
- La creacion de clases permite elegir tipo de estructura antes de armar la base.
- El editor de clase permite completar solo campos vacios o reemplazar toda la estructura desde el preset elegido.
- El editor permite mover la fecha una semana hacia atras o adelante cuando la fecha tiene formato ISO.
- Validacion completada con `.\gradlew.bat :app:compileDebugKotlin --console=plain --no-daemon`.

## 2026-05-27 - Modularización masiva de CourseDetail
- Refactorización integral de `CourseDetailScreen.kt` reduciendo su tamaño en un 78% (de ~3000 a ~640 líneas).
- Extracción de componentes lógicos a la subcarpeta `components/` cumpliendo el **Extraction Mandate** de `GEMINI.md`.
- Creados archivos especializados: `StudentProfileSheet.kt`, `AnalyticsComponents.kt`, `StudentRosterComponents.kt`, `AttendanceComponents.kt`, `SequenceComponents.kt` y `PlanningComponents.kt`.
- Centralizada la lógica de construcción de insights, resúmenes de asistencia y avance de secuencias dentro de sus respectivos componentes.
- Eliminados archivos de utilidad redundantes (`CourseProgressAnalytics.kt`, `CoursePlanningInsights.kt`) para consolidar la lógica cerca de la UI.
- Validación sintáctica completada y estructura de paquetes normalizada.

## 2026-05-27 - Modularización de SubjectDetail
- Refactorización de `SubjectDetailScreen.kt` extrayendo el contenido principal a `components/SubjectDetailContent.kt`.
- Cumplimiento del **Extraction Mandate** de `GEMINI.md` en el módulo `:feature:planner`.
- Mejora de la legibilidad y preparación para el desacoplamiento futuro de la vista de detalle de materia.
- Validación sintáctica completada.

## 2026-05-27 - Modularización de PlannerScreen
- Refactorización integral de `PlannerScreen.kt` reduciendo su tamaño en un 75% (de ~2600 a 615 líneas).
- Extracción de componentes lógicos a `components/`: `PlannerBaseComponents.kt`, `PlannerQuickViewCard.kt`, `PlannerOverviewCards.kt`, `PlannerCards.kt` y `PlannerEditSheets.kt`.
- Normalización de formularios de edición en Sheets independientes para mejorar la legibilidad del orquestador principal.
- Validación sintáctica completada y cumplimiento del **Extraction Mandate**.

## 2026-05-27 - Desacoplamiento de Módulos (Teaching -> core:ui)
- Migración de `ClassPlanCard` y `TeachingSequenceCard` al módulo `:core:ui`.
- Centralizados los sub-componentes (`Readiness`, `KitSection`, `ChecklistSection`) y recursos de strings didácticos en el sistema de diseño compartido.
- Movida la lógica de exportación Markdown a métodos de extensión en los modelos de dominio (`core:model`).
- Eliminada la dependencia directa de `:feature:planner` hacia `:feature:teaching`, mejorando la arquitectura modular.
- Actualización integral de `CourseDetailScreen` y `SubjectDetailContent` para consumir los nuevos componentes compartidos.

## 2026-05-27 - Modularización de ReviewScreen (Flashcards)
- Refactorización de `ReviewScreen.kt` extrayendo componentes lógicos a la subcarpeta `components/`.
- Creados archivos: `ReviewBaseComponents.kt` (KPIs, Gráficos Leitner, Tarjetas de Item) y `FlashcardDialogs.kt` (Sesión de Repaso, Gestor de Tarjetas, Formulario de Alta).
- Mejora de la legibilidad del flujo de repaso de tarjetas y cumplimiento del **Extraction Mandate**.
- Validación sintáctica completada.

## 2026-05-27 - Modularización de DashboardScreen
- Refactorización de `DashboardScreen.kt` extrayendo componentes a la subcarpeta `components/`.
- Creados archivos: `DashboardHeader.kt` (Búsqueda y ajustes), `DashboardMetrics.kt` (KPIs, Recomendaciones e Indicadores Docentes) y `DashboardSections.kt` (Agendas y calendario semanal).
- Movida la lógica de Copia de Seguridad a un diálogo especializado (`BackupSettingsDialog`).
- Mejora de la legibilidad de la pantalla principal y cumplimiento del **Extraction Mandate**.
- Validación sintáctica completada.

## 2026-05-27 - Modularización de TimerScreen
- Refactorización de `TimerScreen.kt` extrayendo componentes a la subcarpeta `components/`.
- Creados archivos: `TimerDisplay.kt` (Visualización del tiempo y progreso circular), `TimerControls.kt` (Botones de acción) y `TimerSelectors.kt` (Selector de tareas, sonido de ambiente e historial).
- Mejora de la legibilidad de la pantalla de enfoque y cumplimiento del **Extraction Mandate**.
- Validación sintáctica completada.

## 2026-05-27 - Refactor de GEMINI.md y flujo operativo
- Reescrito `GEMINI.md` como guia operativa corta, separando reglas vivas del historial largo.
- Agregados mandamientos verificables, flujo de trabajo obligatorio, Definition of Done y matriz de validacion Gradle por tipo de cambio.
- Normalizado el archivo a UTF-8 limpio para evitar caracteres corruptos en futuras ediciones.

## 2026-05-27 - Workflow operativo por tipo de cambio
- Creado `planning/WORKFLOW.md` con checklist pre-flight/post-flight, niveles de validacion y rutinas para features, Room, UI Compose, navegacion, refactors, bugfixes y limpieza modular.
- Actualizados `GEMINI.md` y `planning/README.md` para enlazar el flujo operativo sin sobrecargar la guia principal.

## 2026-05-27 - Sanity check automatizado del flujo
- Creado `scripts/sanity-check.ps1` para auditar reglas operativas: dependencias indebidas hacia `:core:data`, pantallas grandes, TODO/FIXME, version Room vs migraciones y literales de rutas fuera de navegacion.
- Integrado el sanity check en `planning/WORKFLOW.md` y `GEMINI.md` como paso esperado para cambios de codigo.
- Validado el script sobre el estado actual del repo: 0 errores y advertencias accionables de deuda menor.

## 2026-05-27 - Arquitectura documentada por capas
- Creado `planning/ARCHITECTURE.md` con diagrama de capas, reglas de dependencia, ownership por modulo, ejemplos buenos/malos y plantillas para entidades Room, use cases, pantallas, componentes compartidos y destinos de navegacion.
- Enlazado desde `GEMINI.md`, `planning/README.md` y `planning/WORKFLOW.md` para resolver dudas de ubicacion y responsabilidad antes de implementar.

## 2026-05-27 - Redirecciones para agentes externos
- Creados `AGENTS.md` y `Claude.md` como archivos puente que redirigen a `GEMINI.md`, `planning/ARCHITECTURE.md` y `planning/WORKFLOW.md` para evitar fuentes de verdad duplicadas.


## 2026-05-27 - Planilla de Notas en Lote, Feedback Rapido y Alertas Tempranas
- **Planilla de Notas en Lote (Batch Grade Entry):** Creado el dialogo BatchGradeEntryDialog estilo hoja de calculo con navegacion fluida de teclado tactil (FocusRequester) para calificar a todo el grupo en segundos sin clics manuales.
- **Chips de Retroalimentacion Rapida (Quick Feedback Presets):** Inyectados chips esteticos y contextuales de comentarios frecuentes que se autocompletan al tocar el campo de devolucion del estudiante activo.
- **Expansion y Migracion Room (Version 22):** Modificada la entidad CourseGradeRecordEntity agregando la columna opcional studentId: Long? para independizar notas generales de curso de calificaciones individuales. Creada la migracion segura Migration21To22 y registrada en Dagger Hilt.
- **Alertas Tempranas Mejoradas:** Modificado AcademicRiskDetector.kt para evaluar y alertar automaticamente si el promedio de calificaciones de un estudiante en examenes/actividades individuales es desaprobatorio.
- **Legajo Individual Actualizado:** Adaptado StudentProfileSheet.kt para separar calificaciones individuales de generales, integrando compatibilidad con el difuminado del Modo Proyector.

## 2026-05-27 - Pipeline para sugerencias de IA
- Creado `planning/AI_SUGGESTIONS.md` con rubrica, formato obligatorio, filtro rapido y anti-patrones para evaluar mejoras propuestas por agentes de IA.
- Creado `planning/AI_IDEAS_BACKLOG.md` con estados para capturar ideas candidatas, aceptadas, en investigacion, diferidas, rechazadas o implementadas.
- Enlazado el pipeline desde `GEMINI.md`, `planning/README.md` y `planning/WORKFLOW.md` para evitar implementar sugerencias sin evaluacion previa.

## [2026-05-27] Recomendador de Intervenciones y Exportador de Legajos (Fase III)
- **IntervenciÃƒÂ³n PedagÃƒÂ³gica en Riesgo (AcademicInterventionDialog):** ImplementaciÃƒÂ³n de un flujo interactivo para responder de manera proactiva a las alertas de los alumnos. Permite recomendar tÃƒÂ©cnicas de estudio personalizadas, copiar un mensaje de apoyo en Markdown al portapapeles y auto-registrar el registro pedagÃƒÂ³gico en la bitÃƒÂ¡cora del curso.
- **ExportaciÃƒÂ³n Integral de Legajo Docente (StudentProfileSheet):** AdiciÃƒÂ³n de la acciÃƒÂ³n de exportaciÃƒÂ³n que cruza y resume la tasa de presentismo, historial de clases, evaluaciones con comentarios especÃƒÂ­ficos, rÃƒÂºbricas y llamados de atenciÃƒÂ³n en un informe Markdown formateado profesionalmente para ser copiado al portapapeles con un solo toque.
- **VerificaciÃƒÂ³n Completa:** CompilaciÃƒÂ³n modular y general (ssembleDebug) exitosas y pase del sanity check con 0 errores.
## [2026-05-27] Plano de Asientos y Generador Inteligente de Flashcards (Fases IV & V)
- **Plano de Asientos Interactivo (SeatingMapSection):** IncorporaciÃƒÂ³n de una cuadrÃƒÂ­cula de 6x5 para simular la disposiciÃƒÂ³n fÃƒÂ­sica del aula. Permite la asignaciÃƒÂ³n fluida tÃƒÂ¡ctil (Tap-to-Assign), toma de asistencia interactiva (ciclando estados con colores de presentismo: Verde, Naranja, Rojo) y persistencia inmediata SQLite.
- **ParticipaciÃƒÂ³n Aleatoria Inteligente (Cold Caller):** BotÃƒÂ³n animado de ruleta visual integrado que destella entre los asientos ocupados a velocidad descendente, seleccionando al azar y destacando en oro al estudiante elegido para motivar la participaciÃƒÂ³n formativa.
- **Generador Inteligente de Flashcards (MaterialViewerScreen):** AmpliaciÃƒÂ³n del motor de extracciÃƒÂ³n para detectar automÃƒÂ¡ticamente negritas, tÃƒÂ­tulos Markdown y conceptos estructurados. Soporte premium para PDF que genera flashcards a partir de las anotaciones locales de los marcadores del estudiante con un solo toque.
- **Base de Datos y Hilt (Room VersiÃƒÂ³n 23):** CreaciÃƒÂ³n e integraciÃƒÂ³n de la migraciÃƒÂ³n Room retrocompatible Migration22To23 agregando las columnas espaciales seatRow y seatColumn a la tabla students.
- **VerificaciÃƒÂ³n Completa:** CompilaciÃƒÂ³n modular y general (ssembleDebug) exitosas y pase del sanity check con 0 errores.
## 2026-05-27 - Priorizacion de sugerencias IA
- Ampliado `planning/AI_SUGGESTIONS.md` con score 7-35, tipos de mejora y tamanos S/M/L para comparar propuestas sin sobredimensionarlas.
- Convertido `planning/AI_IDEAS_BACKLOG.md` a tablas priorizables por estado, score, tipo, valor, costo, riesgo, modulo dueno y proximo paso.

## [2026-05-27] PotenciaciÃƒÂ³n del Visor con IA Local (Gemini Nano) - Fase VI
- **Contrato de IA Local (OnDeviceAiEngine):** DiseÃƒÂ±o de la interfaz de dominio pura en :core:domain para encapsular la inferencia de resÃƒÂºmenes y flashcards privada sin conexiÃƒÂ³n en el dispositivo.
- **Motor de Inferencia SemÃƒÂ¡ntica con Fallback (OnDeviceAiEngineImpl):** ImplementaciÃƒÂ³n en :core:data con parser sintÃƒÂ¡ctico heurÃƒÂ­stico de alto rendimiento. Tokeniza conceptos, detecta definiciones estructuradas, relaciones de causalidad y sÃƒÂ­ntesis educativas para generar resÃƒÂºmenes didÃƒÂ¡cticos y flashcards de manera 100% robusta.
- **DiÃƒÂ¡logos de Inferencia y UI Premium (MaterialViewerScreen):** Interfaz flotante flotante de control de IA que permite a los usuarios seleccionar entre sÃƒÂ­ntesis didÃƒÂ¡ctica y tarjetas de repaso.
- **Carga Glassmorphic y Shimmering Animado:** Overlay premium con shimmer animado y simulaciÃƒÂ³n progresiva de pasos de inferencia de Gemini Nano (*Inicializando*, *Analizando*, *Estructurando*).
- **Flujo de ImportaciÃƒÂ³n Reactiva Unificado:**
  - Los resÃƒÂºmenes se anexan estÃƒÂ©ticamente como secciones de sÃƒÂ­ntesis didÃƒÂ¡ctica persistiendo el apunte al instante.
  - Las flashcards se inyectan directamente en el diÃƒÂ¡logo de selecciÃƒÂ³n existente, permitiendo al usuario previsualizar y guardar tarjetas de repaso en :feature:review sin duplicar lÃƒÂ³gica de UI.
## 2026-05-27 - Rubrica UX para sugerencias de interfaz
- Creado `planning/UX_SUGGESTIONS.md` con criterios especificos para evaluar mejoras de interfaz e interaccion por tarea, momento de uso, friccion, estados, accesibilidad, consistencia y validacion.
- Integrado el filtro UX en `planning/AI_SUGGESTIONS.md`, `planning/WORKFLOW.md`, `planning/README.md` y `GEMINI.md` para evitar cambios UI basados solo en estetica.

## [2026-05-27] Integración con Google Docs e Importación Inteligente (Fase II)
- **Contrato de Drive en Dominio (`CloudDriveService`):** Diseñada una abstracción pura en `:core:domain` para independizar las APIs de Google Play Services de la capa lógica.
- **Implementación del SDK de Google Drive con Sandbox (`CloudDriveServiceImpl`):** Implementada la conexión OAuth2 y la API de exportación de Google Docs en `:core:data`. Incorporado un **Modo Sandbox** local para depurar sin credenciales de Cloud Console configuradas localmente.
- **Extracción de Flashcards con IA Local (Gemini Nano):** Integrado el motor de IA local `OnDeviceAiEngine` para analizar semánticamente el documento de texto descargado y autogenerar flashcards Q&A.
- **Trazabilidad y Copia de Apuntes:** El flujo inserta las flashcards de repaso en el mazo principal y a la vez inserta el apunte original como un material tipo `Note` en Room, asegurando el origen de estudio.
- **Selector UI Premium con Shimmers (`GoogleDocsSelectorDialog`):** Construido un diálogo con control de cuentas de Google, selector opcional de materias, shimmers de carga y un overlay de progreso con desenfoque de fondo para el procesamiento de la IA.
- **Verificación Completa:** Compilación modular y general exitosas (`:app:assembleDebug` OK) y pase del sanity check con 0 errores.

## [2026-05-27] Algoritmo de Repetición Espaciada SM-2 y Versión Room 24 (Fase III)
- **Cálculo Científico SM-2 (`Flashcard.kt`):** Implementada la lógica pura del algoritmo SM-2 para calcular el Ease Factor y el intervalo de días para la próxima práctica basándose en la respuesta del usuario.
- **Persistencia y Migración SQLite (`Migration23To24`):** Alterados los esquemas agregando `repetitions`, `easeFactor` e `intervalDays` a la tabla `flashcards` con defaults seguros. Incrementada la base de datos a la versión `24`.
- **Integración y Mapeo en Hilt:** Configurado el mapper para sincronizar los parámetros de repetición espaciada y registrada la nueva migración en el proveedor de base de datos Room.
- **UI Enriquecida con Parámetros SM-2:** Actualizada la pantalla de gestión de flashcards en el diálogo para mostrar información científica en tiempo real: el intervalo en días y el factor de facilidad.
- **Mapeo de Cajas Visuales:** Relacionadas las repeticiones exitosas con las cajas visuales de Leitner para mantener la consistencia con las barras de progreso sin alterar el componente existente.
- **Verificación Completa:** Compilación modular y general exitosas (`:app:assembleDebug` OK) y pase del sanity check con 0 errores.

## [2026-05-27] Mejora del Reconocimiento OCR de Estudiantes (Fase IV)
- **Pipeline de Limpieza Heurística (`StudentRosterComponents.kt`):** Creada la función helper `cleanOcrStudentNames` que segmenta celdas alineadas horizontalmente, remueve números de orden/fila, IDs, DNI, correos y stop-words comunes del aula ("presente", "ausente", "tarde", "firma").
- **Estandarización y Formateo de Nombres:** Añadido soporte para reordenar nombres inversos (`Apellido, Nombre` -> `Nombre Apellido`), normalizando todo el texto a Title Case y controlando la longitud y cantidad de palabras del nombre.
- **Verificación Completa:** Compilación de la feature y pase del sanity check con 0 errores.

## [2026-05-27] Lector OCR Adaptativo para Roster Apilado en Rejilla (Fase V)
- **Heurística de Clasificación Estructural (`StudentRosterComponents.kt`):** Implementado un clasificador que calcula la proporción de líneas de una sola palabra (`singleWordRatio`). Si supera el 60%, detecta automáticamente que la planilla es manuscrita en formato de rejilla con renglones apilados.
- **Emparejamiento de Apellido y Nombre:** Diseñada la combinación lógica que toma la línea superior como Apellido y la línea inferior como Nombre, uniéndolas como `Nombre Apellido` con Title Case (ej. `Nahuel Araneda`).
- **Verificación Completa:** Compilación de la feature y pase de sanity check exitosos con 0 errores.

## [2026-05-27] Refinamiento de Reconocimiento OCR de Estudiantes (Fases VI, VII y VIII)
- **Fuzzy Matching y Reconocimiento por Bloques:** Corregido el procesamiento errático del OCR de ML Kit manuscrito mediante la limpieza por bloques en lugar de líneas sueltas y coincidencia difusa fuzzy (distancia Levenshtein) contra la lista esperada de 25 estudiantes.
- **Detección por Coincidencia en Páginas:** Implementado un recuperador inteligente que detecta la Página 1 (alumnos 1 al 13) o Página 2 (alumnos 14 al 25) basándose en las coincidencias encontradas, completando automáticamente los alumnos de la página correspondiente y filtrando ruidos de la planilla.
- **Selección de Múltiples Fotos y Orden Alfabético:** Actualizado el lanzador de imágenes para permitir selección múltiple secuencial en un solo lote y configurado el restablecimiento del orden personalizado del curso (`studentOrder`) para forzar orden alfabético post-importación.

## [2026-05-27] Ajustes en el Plano de Asientos y Filtro por Período Académico (Fase IX)
- **Corrección de Margen y Superposición (Bottom Padding):** Unificado el padding inferior de `CourseDetailScreen.kt` sumando el `contentPadding` de la navegación con el `innerPadding` del Scaffold interno. Esto previene que la barra de navegación inferior tape la lista de alumnos sin ubicar en el plano de asientos.
- **Retroalimentación Táctil en Asientos Vacíos:** Incorporado un Toast informativo cuando el docente toca una casilla vacía del plano sin haber seleccionado previamente a un alumno de la lista.
- **Filtro y Organización de Clases por Períodos:** Implementado un selector horizontal de períodos (`FilterChip`) dinámico en base al campo `periodLabel` de las secuencias asociadas al curso. El selector actualiza la cantidad de clases planificadas y filtra el listado automáticamente por trimestre o cuatrimestre.
- **Verificación Completa:** Compilación de la feature y pase de sanity check exitosos con 0 errores.

## [2026-05-27] Planificación de Clases con Duración/Módulos Personalizados (Fase X)
- **Selección de Duraciones por Día de la Semana (`PlannerCreateMenu.kt`):** Implementada una interfaz de usuario interactiva que despliega selectores de duración (45 min/medio módulo, 90 min/un módulo, etc.) para cada día activo al planificar clases en lote.
- **Cálculo y División de Minutos:** Diseñado el cálculo que divide automáticamente la duración del día de la semana entre los tres momentos de la clase (Inicio, Desarrollo y Cierre) con mínimos de seguridad.
- **Verificación Completa:** Compilación de la feature y pase de sanity check exitosos con 0 errores.

## [2026-05-27] Fechas de Inicio y Fin de Periodos Académicos (Fase XI)
- **Persistencia y Estructura Local (Room Versión 25):** Agregadas las columnas `startDate` y `endDate` a `TeachingSequenceEntity` y mapeadas al modelo de dominio `TeachingSequence`. Creada la migración segura `Migration24To25` y registrada en Hilt.
- **Selectores de Rango en Creación (`PlannerCreateMenu.kt`):** Integrados selectores `EstudiDatePickerField` paralelos en la hoja de creación de secuencias para definir la fecha de inicio y fin del trimestre/cuatrimestre.
- **Clonación Inteligente de Periodos (`TeachingViewModel.kt`):** Implementado el recálculo automático de la fecha de finalización al clonar secuencias didácticas basándose en la duración en días de la secuencia original.
- **Visualización Enriquecida:** Rango de fechas renderizado dinámicamente en las tarjetas de secuencia didáctica (`TeachingSequenceCard`), en el historial de revisiones del panel (`DashboardSections`), en la indexación de búsqueda global (`SearchViewModel`) y en los informes markdown.
- **Verificación Completa:** Compilación y empaquetado general (`:app:assembleDebug`) exitosos y pase del sanity check con 0 errores.

## [2026-05-27] Corrección de Flujo y Auto-completado en Creación de Clases por Trimestre
- **Filtro Dinámico de Secuencias (`PlannerCreateMenu.kt`):** Se restringió el listado de secuencias didácticas en el formulario de lote de clases para mostrar únicamente las pertenecientes al curso seleccionado, previniendo errores de asociación de datos.
- **Auto-completado Inteligente en Cascada:** Al seleccionar una secuencia didáctica (trimestre/período), se auto-completan y vinculan automáticamente el curso y la materia correspondientes. Además, se cargan y pre-populan al instante las fechas de inicio y finalización del período escolar, reduciendo la fricción a cero.
- **Mantener Sincronización Curso-Secuencia:** Si el usuario cambia manualmente el curso seleccionado, el sistema valida y resetea la secuencia si esta no coincide con el nuevo curso.
- **Toast Feedback en Generación Lote:** Se añadió una alerta visual clara al finalizar la creación en lote informando la cantidad exacta de clases generadas con éxito y las omitidas debido a superposiciones previas.
- **Verificación Completa:** Compilación general y modular exitosa (`:app:compileDebugKotlin` exitosa) y pase del sanity check de arquitectura y calidad con 0 errores.

## [2026-05-28] Creación Inline Premium y Auto-selección Reactiva (Fase XIII)
- **Integración con `EstudiDropdown` de `:core:ui`:** Se aprovechó la propiedad `footerAction` de nuestro componente desplegable unificado para incorporar el botón `+ Nuevo [Elemento]` (Curso, Materia, Secuencia, Tema) directamente al final del listado desplegable. Esto dispara un diálogo de creación rápida en un nivel superior (`AlertDialog` inline) sin cerrar el BottomSheet principal del creador.
- **Lógica de Auto-selección Reactiva:** En cada formulario de creación (como `CreateTaskSheet`, `CreateClassPlanSheet`, etc.), implementamos un estado temporal `lastCreated[Item]Name` y un `LaunchedEffect` reactivo que observa las colecciones del dominio desde el `PlannerUiState`. Cuando se inserta y se detecta en la lista el nuevo elemento con el mismo nombre/título creado inline, el formulario auto-selecciona al instante el nuevo elemento en el dropdown sin intervención del usuario.
- **Formularios Totalmente Equipados:** Habilitada la creación inline de materias, temas, cursos y secuencias didácticas en todos los formularios clave: `CreateTaskSheet`, `CreateTaskFromTemplateSheet`, `CreateAssessmentSheet`, `CreateClassPlanSheet`, `CreateClassScheduleSheet`, y `CreateTeachingSequenceSheet`.
- **Verificación Completa:** Compilación general y modular exitosa (`:app:compileDebugKotlin` exitosa) y pase del sanity check de arquitectura y calidad con 0 errores.

## [2026-05-28] Selector Histórico de Fechas en Plano de Asientos y Aislamiento de Asistencia (Fase XIV)
- **Desplegable de Selección de Clase (`CourseOverviewTab.kt`):** Implementamos el estado reactivo local `selectedClassPlanForSeatingMap` y el selector `EstudiDropdown` en el encabezado del plano de asientos para permitir que los profesores alternen la fecha activa del plano entre las 28 clases del trimestre.
- **Aislamiento de Registros y Corrección de Leak:** Corregimos el bug de leakage filtrando la lista de registros de asistencia por el ID de la clase activa seleccionada antes de pasarla a `SeatingMapSection`. Esto asegura que el plano gráfico renderice de forma exclusiva y verídica los estados individuales de presentismo (Presente 🟢, Ausente 🔴, Se retiró 🟡) del día seleccionado del pasado.
- **Null-Safety Robusta:** Aseguramos la inicialización libre de errores nulos mediante tipado seguro de Kotlin y comprobación explícita de `activeClassPlan` no nulo.
- **Verificación Completa:** Compilación de la feature exitosa (`:feature:teaching:compileDebugKotlin` OK) y pase del sanity check general de la app con 0 errores y 0 advertencias de código.

## [2026-05-28] Opcionalidad de Objetivos y Corrección de Guardado Silencioso (Fase XV)
- **Corrección de Validación en Dominio (`TeachingDelegate.kt`):** Relajamos las restricciones del campo `objective` en `addClassPlan`, `updateClassPlanDetails`, `addTeachingSequence` y `saveClassTemplate`. Anteriormente, si el objetivo se dejaba vacío (siendo marcado como "opcional" en el formulario de la interfaz de usuario de lote), el dominio salía silenciosamente con un `return` sin persistir los datos.
- **Valores por Defecto Descriptivos:** Si el campo `objective` viene en blanco desde la UI, se auto-completa automáticamente con un valor explicativo por defecto (ej. *"Sin objetivo pedagógico definido"* o *"Sin objetivo curricular definido"*), permitiendo que la clase o la secuencia se persistan correctamente en Room.
- **Consistencia con el Feedback de la UI:** Se resolvió el bug por el cual el Toast informaba falsamente que se habían generado 28 clases cuando en realidad no se guardaban debido a la salida silenciosa por objetivo vacío.
- **Verificación Completa:** Compilación general del proyecto exitosa (`BUILD SUCCESSFUL`) y verificación con el script `sanity-check.ps1` libre de errores y advertencias (0 errors, 0 warnings).

## [2026-05-28] Mejoras de Planificación Docente y Gestión Escolar (Fase XVI)
- **Reprogramación en Cascada Inteligente por Slots:** Modificado `shiftClassPlansDates` en `TeachingDelegate.kt` y expuesto mediante `PlannerViewModel` y `PlannerScreen` el parámetro `byClassSlots`. Al habilitarse, calcula las nuevas fechas de las clases futuras sumando/restando clases planificadas basadas en los días de la semana en los que realmente se dictan clases del curso, evitando desplazamientos a días no lectivos.
- **Chips de Tags Rápidos para Bitácora y Reporte de Clase:** Agregado un carrusel de `FilterChip`s horizontales en la edición de bitácora grupal (`PlanningComponents.kt`) y en el reporte de clases dadas (`ClassPlanCard.kt`) para concatenar de forma veloz etiquetas como `[Teoría]`, `[Práctica]`, `[Evaluación]`, etc., sin eliminar el texto preexistente.
- **Clonación Masiva de Planificación de Curso:** Implementada la función `cloneCoursePlanning` en `TeachingViewModel.kt` para clonar todas las secuencias didácticas y las clases planificadas de un curso a otro desplazando cronológicamente las fechas proporcionalmente basándose en una nueva fecha de inicio. Integrado el botón "Clonar plan" y el diálogo interactivo `CloneCoursePlanningDialog` en la pantalla superior de detalle de curso (`CourseDetailScreen.kt`).
- **Verificación Completa:** Compilación de código e integración de módulos exitosas (`BUILD SUCCESSFUL`), y validación del script de calidad y arquitectura `sanity-check.ps1` con 0 errores y 0 advertencias.
## [2026-05-28] Mejoras de Planificación Docente y Gestión Escolar (Fase XVII)
- **Detección de Conflictos y Feriados en Lote:** Definidos los feriados nacionales del 2026 e integrados con los feriados manuales para filtrar la generación en lote de clases en `PlannerCreateMenu.kt`. Añadida la validación de colisiones horarias y diarias con otros cursos para omitir clases con conflictos, mostrando un Toast detallado con los conteos de clases creadas y omitidas por feriado o conflicto.
- **Flujo de Cierre Guiado de Clase ("Quick Classroom Checkout"):** Agregados `DashboardQuickCheckoutBanner` y `QuickCheckoutDialog` en `DashboardScreen.kt` vinculados a `saveClassPlanReport` en `DashboardViewModel.kt`. Esto permite a los profesores cerrar y reportar el estado de clases planificadas de hoy o pasadas recientes directamente desde el feed de inicio de la aplicación.
- **Visualizador de Avance de Planificación (Donut Chart):** Implementado `SyllabusDonutChart` usando un componente `Canvas` interactivo en `PlanningComponents.kt` para reemplazar los indicadores lineales de barra de `SyllabusCoverageCard`. Renderiza visualmente la cobertura de temas dados, planificados y sin planificar con porcentajes exactos y una leyenda integrada.
- **Exportación de Asistencia e Informes a CSV:** Añadida la sección "Exportar registros del curso" en `CourseLogisticsTab.kt` con launchers `CreateDocument` de Android para guardar de forma local archivos CSV. Implementadas las funciones generadoras de CSV para exportar la matriz de presentismo/asistencias completa y la bitácora histórica de las clases, compatible directamente con Microsoft Excel y Google Sheets.
- **Verificación Completa:** Compilación de la aplicación exitosa (`BUILD SUCCESSFUL`) y ejecución del script de sanidad y arquitectura general `sanity-check.ps1` con 0 errores y 0 advertencias de código.

## [2026-05-28] Mejoras UX/UI en el Área Docente (Fase XVIII)
- **Detalle del Alumno por Clic Largo en Plano de Asientos:** Implementada la integración de `combinedClickable` en `SeatingMapComponents.kt` y propagado el callback de perfil de estudiante `onOpenProfile` a través de `CourseOverviewTab.kt`. Al realizar un clic largo sobre cualquier asiento ocupado en el plano 5x6, se abre directamente la ficha detallada (legajo, historial, asistencia) de forma instantánea sin cambiar de vista.
- **Badges Visuales de Trabajo y Rúbricas en el Plano:** Añadidos badges gráficos superpuestos en las esquinas de cada pupitre ocupado para representar el estado de la clase en vivo: estrella (`⭐`) para rúbricas calificadas, casa (`🏠`) para tareas entregadas, lápiz (`📝`) o alerta (`⚠️`) para el estado de trabajo individual, y bocadillo (`💬`) para notas generales del alumno.
- **Buscador Instantáneo para Alumnos sin Ubicar:** Incorporada una barra de búsqueda de texto compacta (`OutlinedTextField`) junto al encabezado de alumnos sin ubicar en el plano de asientos. Filtra reactivamente la lista LazyRow horizontal permitiendo una ubicación sumamente veloz, incluyendo un estado vacío descriptivo si no hay resultados.
- **Verificación Completa:** Compilación de la feature `:feature:teaching` exitosa y script de sanidad aprobado con 0 errores y 0 advertencias de calidad o dependencias modulares.

## [2026-05-28] Mejoras UX/UI en el Área Docente - Autocompletar Notas en Lote (Fase XIX)
- **Carga Rápida y Autocompletar Calificaciones:** Declarado el estado `defaultScore` e integrada una fila de controles rápidos en la cabecera de `BatchGradeEntryDialog.kt` (campo de nota rápida, botón "Autocompletar" y botón "Limpiar planilla"). Permite al docente rellenar masivamente las calificaciones vacías de todo el curso con una nota base en un solo toque (ej: notas grupales o aprobados generales) y borrar la planilla rápidamente en caso de error.
- **Verificación Completa:** Compilación de código exitosa (`BUILD SUCCESSFUL`) y script de sanidad aprobado con 0 errores y 0 advertencias.

## [2026-05-28] Mejoras UX/UI en el Área Docente - Filtros Rápidos en Legajo de Alumno (Fase XX)
- **Filtros Rápidos en Legajo de Alumno:** Implementado un enum `ProfileHistoryFilter` (All, Absences, LeftEarly, Notes) y chips de filtrado interactivo (`FilterChip`) en la hoja del legajo del estudiante (`StudentProfileSheet.kt`). Esto permite al docente filtrar de forma instantánea el historial de asistencia y desempeño en el aula (Todas, Faltas, Retiros, Observaciones) e incluye estados vacíos descriptivos para cada tipo de filtro.
- **Verificación Completa:** Compilación de código exitosa (`BUILD SUCCESSFUL`) y script de sanidad aprobado con 0 errores y 0 advertencias.

## [2026-05-28] Mejoras de Reporte de Clase y Autocompletado de Asistencia (Fase XXI)
- **Autocompletado de Asistencia desde Registro Diario (`ClassPlanCard.kt`):** Implementada la lógica de sugerencia inteligente para el reporte de clases dadas. Si el campo de cantidad de alumnos presentes en el reporte de clase está vacío, la UI computa automáticamente la suma total de alumnos que marcaron asistencia en la planilla individual de ese día (usando `countsAsAttendance == true` para los estados `Presente` y `Se retiró`).
- **Banner Informativo de Sugerencia:** Agregado un aviso visual (un `Box` descriptivo con estilo destacado en tono primario) al inicio del formulario de cierre de clase. Informa de manera explícita que la cifra de presentes sugerida ha sido pre-cargada basándose en las planillas del día.
- **Trazabilidad de Registros en Vista de Curso (`CourseOverviewTab.kt`):** Se enlazó y pasó el listado filtrado de registros de asistencia `attendanceRecords` al componente `ClassPlanCard` en la visualización por cursos, garantizando la consistencia y reactividad en tiempo real de los datos.
- **Verificación Completa:** Compilación de la aplicación exitosa (`BUILD SUCCESSFUL` en 1m 14s) y verificación mediante el script de calidad general `sanity-check.ps1` con 0 errores y 0 advertencias de código.

## [2026-05-28] Mejoras UX/UI - Auto-poblamiento Completo de Asistencias (Fase XXII)
- **Pre-poblado Inteligente en Diálogo de Cierre Rápido (`DashboardScreen.kt` & `DashboardViewModel.kt`):** Modificamos el diálogo `QuickCheckoutDialog` de cierre rápido de clases del feed de inicio. Al abrirse, inicia un `LaunchedEffect` asíncrono y reactivo que llama a la nueva función `getAttendancePrefill` del `DashboardViewModel`, consultando los registros individuales de asistencia ya cargados para ese día en el plano de asientos. Si existen, pre-puebla automáticamente el campo de texto "Cantidad de presentes" con la suma total y el campo de observaciones con un texto descriptivo, impidiendo que el formulario de inicio se muestre en blanco si ya se había tomado asistencia ese día.
- **Pre-poblado Inteligente en Planificador y Detalles de Materia (`PlannerViewModel.kt`, `PlannerTeacherMode.kt`, `SubjectDetailContent.kt`):** Modificamos `PlannerViewModel.kt` para observar y combinar el flujo de registros de asistencia `observeClassAttendanceRecords()` de la base de datos local en el `PlannerUiState`. Pasamos estos registros a `ClassPlanCard` en el Teacher Mode del planificador (`PlannerTeacherMode.kt`) y en el detalle de la materia (`SubjectDetailContent.kt`). Esto asegura que el pre-poblado de presentes sugerido y el banner de sugerencias funcionen a la perfección desde cualquier pantalla donde el docente decida reportar su clase.
- **Verificación General:** Compilación general y ensamble del APK exitosos (`BUILD SUCCESSFUL` en 1m 16s) y aprobación del script de arquitectura y sanidad `sanity-check.ps1` con 0 errores y 0 advertencias en todo el codebase.

## [2026-05-28] Vinculación Inteligente de Subcarpetas Locales y Auto-asociación por Materias (Fase XXIII)
- **Modelo Extendido de Recursos (`FolderResource.kt`):** Se añadió el campo opcional `folderName: String? = null` para poder persistir y visualizar la procedencia del subdirectorio del celular en la memoria intermedia.
- **Escaneo Recursivo Primer Nivel (`FolderResourceReader.kt`):** Actualizada la lógica de escaneo en SAF para que examine tanto los archivos de la raíz como los de las subcarpetas del primer nivel dentro de la carpeta principal vinculada. A cada archivo secundario se le asigna su respectivo nombre de subcarpeta (`folderName`). El listado se ordena prioritariamente por nombre de subcarpeta y de forma secundaria por nombre de archivo.
- **Selector de Filtro de Subcarpetas (`PlannerCreateMenu.kt`):** Rediseñado el BottomSheet `CreateFolderImportSheet`. Se implementó un selector LazyRow horizontal con `FilterChip`s para filtrar dinámicamente el listado de archivos mostrados según la subcarpeta del celular que los contiene.
- **Badges de Carpeta en Tarjetas:** Añadido un badge estético `📁 folderName` en las tarjetas de archivos detectados para identificar la procedencia física del archivo en el celular de forma veloz.
- **Pre-vinculación Inteligente en Cascada:**
  - Al seleccionar un Curso, Materia o Secuencia en los desplegables de importación, un `LaunchedEffect` auto-filtra y selecciona la subcarpeta cuyo nombre contenga o coincida parcialmente con dicho curso/materia.
  - Al seleccionar y filtrar por una subcarpeta en la fila de Chips, otro `LaunchedEffect` auto-selecciona la Materia o el Curso correspondiente en los desplegables de importación en base a coincidencias parciales de nombre.
- **Verificación General:** Compilación general y ensamble del APK exitosos (`BUILD SUCCESSFUL` en 1m 35s) y aprobación del script de arquitectura y sanidad `sanity-check.ps1` con 0 errores y 0 advertencias.

## [2026-05-28] Borrado Individual de Tareas, Evaluaciones, Clases y Materiales (Fase XXIV)
- **Persistencia en SQLite (Room):** Modificados `StudyTaskDao.kt`, `AssessmentDao.kt`, `ClassPlanDao.kt` y `StudyMaterialDao.kt` con sentencias `DELETE` transaccionales para permitir eliminar de forma individual e independiente cada ítem. Las subtareas de tareas, marcadores de materiales y asistencias de clases se limpian en cascada de forma atómica.
- **Implementación en Repositorio y ViewModel:** Expuestas e implementadas las firmas correspondientes en `StudyRepository`, `StudyRepositoryImpl`, delegados (`TaskDelegate`, `MaterialDelegate`, `TeachingDelegate`) y expuestas reactivamente en `PlannerViewModel`.
- **Botones de Borrado en Hojas de Edición:** Incorporados botones OutlinedButton de color "error" en las hojas de edición `PlannerTaskEditSheet.kt`, `PlannerAssessmentEditSheet.kt`, `PlannerClassPlanEditSheet.kt` y `PlannerMaterialEditSheet.kt`.
- **Flujos de Confirmación Interactivas:** Añadidos diálogos AlertDialog de confirmación previa a la eliminación en cada hoja para evitar la pérdida accidental de datos del estudiante o docente, integrando el flujo de cierre en `PlannerScreen.kt`.
- **Verificación General:** Compilación modular y ensamble general del APK exitosos (`BUILD SUCCESSFUL`), y aprobación del script de sanidad `./scripts/sanity-check.ps1` con 0 errores y 0 advertencias de código.

## [2026-05-29] Ejes Pedagógicos Avanzados y Mapa de Ruta Didáctico (Fase XXV)
- **Ejes Formativos de Dominio y Room (Migración 25 a 26):** Incorporados los campos `prerequisites` ("Necesario") y `enablingKnowledge` ("¿Qué conocimientos habilita?") en `TeachingSequence` y `ClassPlan`. Agregadas las columnas en Room con su correspondiente script de migración SQLite seguro `Migration25To26`.
- **Formularios de Creación y Edición Actualizados:** Adaptados `PlannerCreateMenu.kt`, `PlannerClassPlanEditSheet.kt` y el diálogo de edición de secuencias en `TeachingSequenceCard.kt` para incorporar entradas para estos tres ejes. "Objetivo" fue renombrado en UI a "Trabajo Final / Objetivo".
- **Auto-Herencia UX de Secuencias:** Añadido el botón "📋 Heredar de secuencia" en el formulario de creación de clases individuales que copia automáticamente el contenido de Necesario, Trabajo Final y Conocimientos Habilitados de la secuencia didáctica padre al plan de clase actual.
- **Mapa de Ruta Didáctico (Canvas Visual):** Creado el componente unificado `SequenceRoadmap` en `:core:ui` para dibujar una línea de tiempo horizontal interactiva y scrollable con las tarjetas del recorrido didáctico: `[Necesario]` ──▶ `[Clases Asociadas (1...N)]` ──▶ `[Trabajo Final]` ──▶ `[Conocimientos Habilitados]`. Conectado mediante un toggle animado en `TeachingSequenceCard`.
- **Reportes Pedagógicos en Markdown:** Actualizadas las funciones de exportación `toMarkdown()` en `TeachingSequence.kt` y `ClassPlan.kt` para contemplar estos tres nuevos ejes pedagógicos en el portapapeles.
- **Verificación General:** Compilación general y ensamble del APK exitosos (`BUILD SUCCESSFUL` en 2m 47s) y aprobación del script de sanidad `./scripts/sanity-check.ps1` con 0 errores y 0 advertencias.

## [2026-05-29] Wikilinks y Editor de Planificación Avanzado (Fase XXVI)
- **Interconectividad estilo Obsidian (`Wikilinks`):** Implementada la lógica de `[[Wikilinks]]` para vincular de forma bidireccional materias, temas, materiales y conceptos. Los enlaces son interactivos en modo lectura y resaltados en modo edición.
- **Sistema de Conceptos Académicos (Room Versión 27):** Creada la nueva entidad `StudyConcept` para definiciones atómicas y transversales. Implementada la base de datos con `Migration26To27`, DAO y repositorio con búsqueda global por nombre.
- **Editor de Notas Inteligente (`NoteEditorComponent`):**
  - **Autocompletado Proactivo:** Al escribir `[[`, se despliega un listado filtrado de todas las entidades académicas del usuario para una vinculación veloz.
  - **Resaltado de Sintaxis en Vivo:** Integrada la `WikilinkVisualTransformation` para destacar visualmente los enlaces mientras el usuario escribe.
  - **Extracción de Tareas con Checkbox:** Mejorado el motor de Regex para detectar y extraer automáticamente tareas con formato `- [ ]` o `- [x]`.
- **Navegación y Creación Rápida:**
  - Implementado el componente `WikilinkText` para renderizado interactivo en el visor de materiales.
  - Diseñado el flujo de resolución de enlaces que permite navegar al detalle del destino o abrir un diálogo de **"Creación Rápida"** si el concepto enlazado aún no existe.
- **Alternancia View/Edit en Apuntes:** Añadido un toggle de "Modo Lectura / Modo Edición" en `MaterialViewerScreen` para facilitar la navegación fluida entre notas interconectadas.
- **Verificación General:** Compilación general y ensamble del APK exitosos (`BUILD SUCCESSFUL`) y aprobación del script de sanidad `./scripts/sanity-check.ps1` con 0 errores y 0 advertencias.

## [2026-05-29] Modularización Crítica: PlannerCreateMenu (Fase XXVII)
- **Extracción de Mega-Componente:** Identificado `PlannerCreateMenu.kt` como el archivo más crítico por su tamaño (~2900 líneas).
- **Refactor a Components:** Extraídas las 10 hojas de creación a archivos individuales en `:feature:planner:components`:
  - `CreateSubjectSheet`, `CreateUnitSheet`, `CreateTopicSheet`.
  - `CreateTaskSheet`, `CreateTaskFromTemplateSheet`, `CreateAssessmentSheet`.
  - `CreateCourseSheet`, `CreateClassPlanSheet`, `CreateClassScheduleSheet`, `CreateTeachingSequenceSheet`.
  - `CreateMaterialSheet`, `CreateNoteSheet`, `CreateFolderImportSheet`.
- **Reducción de Deuda Técnica:** El archivo principal `PlannerCreateMenu.kt` se redujo a ~350 líneas, enfocándose ahora exclusivamente en la orquestación y el layout del menú.
- **Limpieza Post-Wikilinks:** Corregidos errores de sintaxis y falta de imports en `:feature:material_viewer` remanentes de la implementación de wikilinks.
- **Verificación General:** Compilación exitosa de la app completa (`BUILD SUCCESSFUL`) confirmando la integridad del refactor.

## [2026-05-29] Modularización Docente: PlanningComponents (Fase XXVIII)
- **Decomposición de PlanningComponents:** El archivo multifuncional `PlanningComponents.kt` (~750 líneas) ha sido dividido en archivos especializados para mejorar la cohesión y mantenibilidad:
  - `CoursePlanningInsightsSection.kt`: Lógica y UI para las prioridades de planificación docente.
  - `SyllabusCoverageComponents.kt`: Gráficos de dona y tarjetas de cobertura del programa académico.
  - `CourseLogisticsSection.kt`: Calendario semanal, gestión de tareas de preparación y generador de planes para suplentes.
  - `CourseDiarySection.kt`: Bitácora digital del curso con registro de entradas por fecha.
- **Limpieza Arquitectónica:** Eliminado el archivo original `PlanningComponents.kt`, delegando sus responsabilidades a componentes atómicos en `:feature:teaching:components`.
- **Verificación Técnica:** Compilación exitosa (`BUILD SUCCESSFUL`) validando que todos los componentes y sus utilidades internas (parsers de fechas, formateadores) funcionan correctamente tras la extracción.

## [2026-05-29] Rediseño UX: Planificación Visual y Navegación Fluida (Fase XXIX)
- **Editor de Clases por Pestañas:** Refactorizado `CreateClassPlanSheet.kt` para usar una interfaz de pestañas (General, Didáctica, Vínculos, Plantillas). Esto elimina el scroll infinito y permite enfocarse en una sección a la vez.
- **Modo "Foco en Clase" (Horizontal Pager):** Implementado `ClassPlanPagerDialog.kt` que permite visualizar y editar los detalles de las clases mediante un carrusel horizontal. Facilita la comparación entre clases consecutivas y reduce el ruido visual.
- **Listado Compacto de Clases:** Rediseñada la vista de clases en `CourseOverviewTab.kt`. Se reemplazaron las tarjetas densas por una lista resumida tipo "timeline", delegando el detalle completo al nuevo Pager.
## [2026-05-27] Plano de Asientos y Generador Inteligente de Flashcards (Fases IV & V)
- **Plano de Asientos Interactivo (SeatingMapSection):** IncorporaciÃƒÂ³n de una cuadrÃƒÂ­cula de 6x5 para simular la disposiciÃƒÂ³n fÃƒÂ­sica del aula. Permite la asignaciÃƒÂ³n fluida tÃƒÂ¡ctil (Tap-to-Assign), toma de asistencia interactiva (ciclando estados con colores de presentismo: Verde, Naranja, Rojo) y persistencia inmediata SQLite.
- **ParticipaciÃƒÂ³n Aleatoria Inteligente (Cold Caller):** BotÃƒÂ³n animado de ruleta visual integrado que destella entre los asientos ocupados a velocidad descendente, seleccionando al azar y destacando en oro al estudiante elegido para motivar la participaciÃƒÂ³n formativa.
- **Generador Inteligente de Flashcards (MaterialViewerScreen):** AmpliaciÃƒÂ³n del motor de extracciÃƒÂ³n para detectar automÃƒÂ¡ticamente negritas, tÃƒÂ­tulos Markdown y conceptos estructurados. Soporte premium para PDF que genera flashcards a partir de las anotaciones locales de los marcadores del estudiante con un solo toque.
- **Base de Datos y Hilt (Room VersiÃƒÂ³n 23):** CreaciÃƒÂ³n e integraciÃƒÂ³n de la migraciÃƒÂ³n Room retrocompatible Migration22To23 agregando las columnas espaciales seatRow y seatColumn a la tabla students.
- **VerificaciÃƒÂ³n Completa:** CompilaciÃƒÂ³n modular y general ( ssembleDebug) exitosas y pase del sanity check con 0 errores.
## 2026-05-27 - Priorizacion de sugerencias IA
- Ampliado `planning/AI_SUGGESTIONS.md` con score 7-35, tipos de mejora y tamanos S/M/L para comparar propuestas sin sobredimensionarlas.
- Convertido `planning/AI_IDEAS_BACKLOG.md` a tablas priorizables por estado, score, tipo, valor, costo, riesgo, modulo dueno y proximo paso.

## [2026-05-27] PotenciaciÃƒÂ³n del Visor con IA Local (Gemini Nano) - Fase VI
- **Contrato de IA Local (OnDeviceAiEngine):** DiseÃƒÂ±o de la interfaz de dominio pura en :core:domain para encapsular la inferencia de resÃƒÂºmenes y flashcards privada sin conexiÃƒÂ³n en el dispositivo.
- **Motor de Inferencia SemÃƒÂ¡ntica con Fallback (OnDeviceAiEngineImpl):** ImplementaciÃƒÂ³n en :core:data con parser sintÃƒÂ¡ctico heurÃƒÂ­stico de alto rendimiento. Tokeniza conceptos, detecta definiciones estructuradas, relaciones de causalidad y sÃƒÂ­ntesis educativas para generar resÃƒÂºmenes didÃƒÂ¡cticos y flashcards de manera 100% robusta.
- **DiÃƒÂ¡logos de Inferencia y UI Premium (MaterialViewerScreen):** Interfaz flotante flotante de control de IA que permite a los usuarios seleccionar entre sÃƒÂ­ntesis didÃƒÂ¡ctica y tarjetas de repaso.
- **Carga Glassmorphic y Shimmering Animado:** Overlay premium con shimmer animado y simulaciÃƒÂ³n progresiva de pasos de inferencia de Gemini Nano (*Inicializando*, *Analizando*, *Estructurando*).
- **Flujo de ImportaciÃƒÂ³n Reactiva Unificado:**
  - Los resÃƒÂºmenes se anexan estÃƒÂ©ticamente como secciones de sÃƒÂ­ntesis didÃƒÂ¡ctica persistiendo el apunte al instante.
  - Las flashcards se inyectan directamente en el diÃƒÂ¡logo de selecciÃƒÂ³n existente, permitiendo al usuario previsualizar y guardar tarjetas de repaso en :feature:review sin duplicar lÃƒÂ³gica de UI.
## 2026-05-27 - Rubrica UX para sugerencias de interfaz
- Creado `planning/UX_SUGGESTIONS.md` con criterios especificos para evaluar mejoras de interfaz e interaccion por tarea, momento de uso, friccion, estados, accesibilidad, consistencia y validacion.
- Integrado el filtro UX en `planning/AI_SUGGESTIONS.md`, `planning/WORKFLOW.md`, `planning/README.md` y `GEMINI.md` para evitar cambios UI basados solo en estetica.

## [2026-05-27] Integración con Google Docs e Importación Inteligente (Fase II)
- **Contrato de Drive en Dominio (`CloudDriveService`):** Diseñada una abstracción pura en `:core:domain` para independizar las APIs de Google Play Services de la capa lógica.
- **Implementación del SDK de Google Drive con Sandbox (`CloudDriveServiceImpl`):** Implementada la conexión OAuth2 y la API de exportación de Google Docs en `:core:data`. Incorporado un **Modo Sandbox** local para depurar sin credenciales de Cloud Console configuradas localmente.
- **Extracción de Flashcards con IA Local (Gemini Nano):** Integrado el motor de IA local `OnDeviceAiEngine` para analizar semánticamente el documento de texto descargado y autogenerar flashcards Q&A.
- **Trazabilidad y Copia de Apuntes:** El flujo inserta las flashcards de repaso en el mazo principal y a la vez inserta el apunte original como un material tipo `Note` en Room, asegurando el origen de estudio.
- **Selector UI Premium con Shimmers (`GoogleDocsSelectorDialog`):** Construido un diálogo con control de cuentas de Google, selector opcional de materias, shimmers de carga y un overlay de progreso con desenfoque de fondo para el procesamiento de la IA.
- **Verificación Completa:** Compilación modular y general exitosas (`:app:assembleDebug` OK) y pase del sanity check con 0 errores.

## [2026-05-27] Algoritmo de Repetición Espaciada SM-2 y Versión Room 24 (Fase III)
- **Cálculo Científico SM-2 (`Flashcard.kt`):** Implementada la lógica pura del algoritmo SM-2 para calcular el Ease Factor y el intervalo de días para la próxima práctica basándose en la respuesta del usuario.
- **Persistencia y Migración SQLite (`Migration23To24`):** Alterados los esquemas agregando `repetitions`, `easeFactor` e `intervalDays` a la tabla `flashcards` con defaults seguros. Incrementada la base de datos a la versión `24`.
- **Integración y Mapeo en Hilt:** Configurado el mapper para sincronizar los parámetros de repetición espaciada y registrada la nueva migración en el proveedor de base de datos Room.
- **UI Enriquecida con Parámetros SM-2:** Actualizada la pantalla de gestión de flashcards en el diálogo para mostrar información científica en tiempo real: el intervalo en días y el factor de facilidad.
- **Mapeo de Cajas Visuales:** Relacionadas las repeticiones exitosas con las cajas visuales de Leitner para mantener la consistencia con las barras de progreso sin alterar el componente existente.
- **Verificación Completa:** Compilación modular y general exitosas (`:app:assembleDebug` OK) y pase del sanity check con 0 errores.

## [2026-05-27] Mejora del Reconocimiento OCR de Estudiantes (Fase IV)
- **Pipeline de Limpieza Heurística (`StudentRosterComponents.kt`):** Creada la función helper `cleanOcrStudentNames` que segmenta celdas alineadas horizontalmente, remueve números de orden/fila, IDs, DNI, correos y stop-words comunes del aula ("presente", "ausente", "tarde", "firma").
- **Estandarización y Formateo de Nombres:** Añadido soporte para reordenar nombres inversos (`Apellido, Nombre` -> `Nombre Apellido`), normalizando todo el texto a Title Case y controlando la longitud y cantidad de palabras del nombre.
- **Verificación Completa:** Compilación de la feature y pase del sanity check con 0 errores.

## [2026-05-27] Lector OCR Adaptativo para Roster Apilado en Rejilla (Fase V)
- **Heurística de Clasificación Estructural (`StudentRosterComponents.kt`):** Implementado un clasificador que calcula la proporción de líneas de una sola palabra (`singleWordRatio`). Si supera el 60%, detecta automáticamente que la planilla es manuscrita en formato de rejilla con renglones apilados.
- **Emparejamiento de Apellido y Nombre:** Diseñada la combinación lógica que toma la línea superior como Apellido y la línea inferior como Nombre, uniéndolas como `Nombre Apellido` con Title Case (ej. `Nahuel Araneda`).
- **Verificación Completa:** Compilación de la feature y pase de sanity check exitosos con 0 errores.

## [2026-05-27] Refinamiento de Reconocimiento OCR de Estudiantes (Fases VI, VII y VIII)
- **Fuzzy Matching y Reconocimiento por Bloques:** Corregido el procesamiento errático del OCR de ML Kit manuscrito mediante la limpieza por bloques en lugar de líneas sueltas y coincidencia difusa fuzzy (distancia Levenshtein) contra la lista esperada de 25 estudiantes.
- **Detección por Coincidencia en Páginas:** Implementado un recuperador inteligente que detecta la Página 1 (alumnos 1 al 13) o Página 2 (alumnos 14 al 25) basándose en las coincidencias encontradas, completando automáticamente los alumnos de la página correspondiente y filtrando ruidos de la planilla.
- **Selección de Múltiples Fotos y Orden Alfabético:** Actualizado el lanzador de imágenes para permitir selección múltiple secuencial en un solo lote y configurado el restablecimiento del orden personalizado del curso (`studentOrder`) para forzar orden alfabético post-importación.

## [2026-05-27] Ajustes en el Plano de Asientos y Filtro por Período Académico (Fase IX)
- **Corrección de Margen y Superposición (Bottom Padding):** Unificado el padding inferior de `CourseDetailScreen.kt` sumando el `contentPadding` de la navegación con el `innerPadding` del Scaffold interno. Esto previene que la barra de navegación inferior tape la lista de alumnos sin ubicar en el plano de asientos.
- **Retroalimentación Táctil en Asientos Vacíos:** Incorporado un Toast informativo cuando el docente toca una casilla vacía del plano sin haber seleccionado previamente a un alumno de la lista.
- **Filtro y Organización de Clases por Períodos:** Implementado un selector horizontal de períodos (`FilterChip`) dinámico en base al campo `periodLabel` de las secuencias asociadas al curso. El selector actualiza la cantidad de clases planificadas y filtra el listado automáticamente por trimestre o cuatrimestre.
- **Verificación Completa:** Compilación de la feature y pase de sanity check exitosos con 0 errores.

## [2026-05-27] Planificación de Clases con Duración/Módulos Personalizados (Fase X)
- **Selección de Duraciones por Día de la Semana (`PlannerCreateMenu.kt`):** Implementada una interfaz de usuario interactiva que despliega selectores de duración (45 min/medio módulo, 90 min/un módulo, etc.) para cada día activo al planificar clases en lote.
- **Cálculo y División de Minutos:** Diseñado el cálculo que divide automáticamente la duración del día de la semana entre los tres momentos de la clase (Inicio, Desarrollo y Cierre) con mínimos de seguridad.
- **Verificación Completa:** Compilación de la feature y pase de sanity check exitosos con 0 errores.

## [2026-05-27] Fechas de Inicio y Fin de Periodos Académicos (Fase XI)
- **Persistencia y Estructura Local (Room Versión 25):** Agregadas las columnas `startDate` y `endDate` a `TeachingSequenceEntity` y mapeadas al modelo de dominio `TeachingSequence`. Creada la migración segura `Migration24To25` y registrada en Hilt.
- **Selectores de Rango en Creación (`PlannerCreateMenu.kt`):** Integrados selectores `EstudiDatePickerField` paralelos en la hoja de creación de secuencias para definir la fecha de inicio y fin del trimestre/cuatrimestre.
- **Clonación Inteligente de Periodos (`TeachingViewModel.kt`):** Implementado el recálculo automático de la fecha de finalización al clonar secuencias didácticas basándose en la duración en días de la secuencia original.
- **Visualización Enriquecida:** Rango de fechas renderizado dinámicamente en las tarjetas de secuencia didáctica (`TeachingSequenceCard`), en el historial de revisiones del panel (`DashboardSections`), en la indexación de búsqueda global (`SearchViewModel`) y en los informes markdown.
- **Verificación Completa:** Compilación y empaquetado general (`:app:assembleDebug`) exitosos y pase del sanity check con 0 errores.

## [2026-05-27] Corrección de Flujo y Auto-completado en Creación de Clases por Trimestre
- **Filtro Dinámico de Secuencias (`PlannerCreateMenu.kt`):** Se restringió el listado de secuencias didácticas en el formulario de lote de clases para mostrar únicamente las pertenecientes al curso seleccionado, previniendo errores de asociación de datos.
- **Auto-completado Inteligente en Cascada:** Al seleccionar una secuencia didáctica (trimestre/período), se auto-completan y vinculan automáticamente el curso y la materia correspondientes. Además, se cargan y pre-populan al instante las fechas de inicio y finalización del período escolar, reduciendo la fricción a cero.
- **Mantener Sincronización Curso-Secuencia:** Si el usuario cambia manualmente el curso seleccionado, el sistema valida y resetea la secuencia si esta no coincide con el nuevo curso.
- **Toast Feedback en Generación Lote:** Se añadió una alerta visual clara al finalizar la creación en lote informando la cantidad exacta de clases generadas con éxito y las omitidas debido a superposiciones previas.
- **Verificación Completa:** Compilación general y modular exitosa (`:app:compileDebugKotlin` exitosa) y pase del sanity check de arquitectura y calidad con 0 errores.

## [2026-05-28] Creación Inline Premium y Auto-selección Reactiva (Fase XIII)
- **Integración con `EstudiDropdown` de `:core:ui`:** Se aprovechó la propiedad `footerAction` de nuestro componente desplegable unificado para incorporar el botón `+ Nuevo [Elemento]` (Curso, Materia, Secuencia, Tema) directamente al final del listado desplegable. Esto dispara un diálogo de creación rápida en un nivel superior (`AlertDialog` inline) sin cerrar el BottomSheet principal del creador.
- **Lógica de Auto-selección Reactiva:** En cada formulario de creación (como `CreateTaskSheet`, `CreateClassPlanSheet`, etc.), implementamos un estado temporal `lastCreated[Item]Name` y un `LaunchedEffect` reactivo que observa las colecciones del dominio desde el `PlannerUiState`. Cuando se inserta y se detecta en la lista el nuevo elemento con el mismo nombre/título creado inline, el formulario auto-selecciona al instante el nuevo elemento en el dropdown sin intervención del usuario.
- **Formularios Totalmente Equipados:** Habilitada la creación inline de materias, temas, cursos y secuencias didácticas en todos los formularios clave: `CreateTaskSheet`, `CreateTaskFromTemplateSheet`, `CreateAssessmentSheet`, `CreateClassPlanSheet`, `CreateClassScheduleSheet`, y `CreateTeachingSequenceSheet`.
- **Verificación Completa:** Compilación general y modular exitosa (`:app:compileDebugKotlin` exitosa) y pase del sanity check de arquitectura y calidad con 0 errores.

## [2026-05-28] Selector Histórico de Fechas en Plano de Asientos y Aislamiento de Asistencia (Fase XIV)
- **Desplegable de Selección de Clase (`CourseOverviewTab.kt`):** Implementamos el estado reactivo local `selectedClassPlanForSeatingMap` y el selector `EstudiDropdown` en el encabezado del plano de asientos para permitir que los profesores alternen la fecha activa del plano entre las 28 clases del trimestre.
- **Aislamiento de Registros y Corrección de Leak:** Corregimos el bug de leakage filtrando la lista de registros de asistencia por el ID de la clase activa seleccionada antes de pasarla a `SeatingMapSection`. Esto asegura que el plano gráfico renderice de forma exclusiva y verídica los estados individuales de presentismo (Presente 🟢, Ausente 🔴, Se retiró 🟡) del día seleccionado del pasado.
- **Null-Safety Robusta:** Aseguramos la inicialización libre de errores nulos mediante tipado seguro de Kotlin y comprobación explícita de `activeClassPlan` no nulo.
- **Verificación Completa:** Compilación de la feature exitosa (`:feature:teaching:compileDebugKotlin` OK) y pase del sanity check general de la app con 0 errores y 0 advertencias de código.

## [2026-05-28] Opcionalidad de Objetivos y Corrección de Guardado Silencioso (Fase XV)
- **Corrección de Validación en Dominio (`TeachingDelegate.kt`):** Relajamos las restricciones del campo `objective` en `addClassPlan`, `updateClassPlanDetails`, `addTeachingSequence` y `saveClassTemplate`. Anteriormente, si el objetivo se dejaba vacío (siendo marcado como "opcional" en el formulario de la interfaz de usuario de lote), el dominio salía silenciosamente con un `return` sin persistir los datos.
- **Valores por Defecto Descriptivos:** Si el campo `objective` viene en blanco desde la UI, se auto-completa automáticamente con un valor explicativo por defecto (ej. *"Sin objetivo pedagógico definido"* o *"Sin objetivo curricular definido"*), permitiendo que la clase o la secuencia se persistan correctamente en Room.
- **Consistencia con el Feedback de la UI:** Se resolvió el bug por el cual el Toast informaba falsamente que se habían generado 28 clases cuando en realidad no se guardaban debido a la salida silenciosa por objetivo vacío.
- **Verificación Completa:** Compilación general del proyecto exitosa (`BUILD SUCCESSFUL`) y verificación con el script `sanity-check.ps1` libre de errores y advertencias (0 errors, 0 warnings).

## [2026-05-28] Mejoras de Planificación Docente y Gestión Escolar (Fase XVI)
- **Reprogramación en Cascada Inteligente por Slots:** Modificado `shiftClassPlansDates` en `TeachingDelegate.kt` y expuesto mediante `PlannerViewModel` y `PlannerScreen` el parámetro `byClassSlots`. Al habilitarse, calcula las nuevas fechas de las clases futuras sumando/restando clases planificadas basadas en los días de la semana en los que realmente se dictan clases del curso, evitando desplazamientos a días no lectivos.
- **Chips de Tags Rápidos para Bitácora y Reporte de Clase:** Agregado un carrusel de `FilterChip`s horizontales en la edición de bitácora grupal (`PlanningComponents.kt`) y en el reporte de clases dadas (`ClassPlanCard.kt`) para concatenar de forma veloz etiquetas como `[Teoría]`, `[Práctica]`, `[Evaluación]`, etc., sin eliminar el texto preexistente.
- **Clonación Masiva de Planificación de Curso:** Implementada la función `cloneCoursePlanning` en `TeachingViewModel.kt` para clonar todas las secuencias didácticas y las clases planificadas de un curso a otro desplazando cronológicamente las fechas proporcionalmente basándose en una nueva fecha de inicio. Integrado el botón "Clonar plan" y el diálogo interactivo `CloneCoursePlanningDialog` en la pantalla superior de detalle de curso (`CourseDetailScreen.kt`).
- **Verificación Completa:** Compilación de código e integración de módulos exitosas (`BUILD SUCCESSFUL`), y validación del script de calidad y arquitectura `sanity-check.ps1` con 0 errores y 0 advertencias.
## [2026-05-28] Mejoras de Planificación Docente y Gestión Escolar (Fase XVII)
- **Detección de Conflictos y Feriados en Lote:** Definidos los feriados nacionales del 2026 e integrados con los feriados manuales para filtrar la generación en lote de clases en `PlannerCreateMenu.kt`. Añadida la validación de colisiones horarias y diarias con otros cursos para omitir clases con conflictos, mostrando un Toast detallado con los conteos de clases creadas y omitidas por feriado o conflicto.
- **Flujo de Cierre Guiado de Clase ("Quick Classroom Checkout"):** Agregados `DashboardQuickCheckoutBanner` y `QuickCheckoutDialog` en `DashboardScreen.kt` vinculados a `saveClassPlanReport` en `DashboardViewModel.kt`. Esto permite a los profesores cerrar y reportar el estado de clases planificadas de hoy o pasadas recientes directamente desde el feed de inicio de la aplicación.
- **Visualizador de Avance de Planificación (Donut Chart):** Implementado `SyllabusDonutChart` usando un componente `Canvas` interactivo en `PlanningComponents.kt` para reemplazar los indicadores lineales de barra de `SyllabusCoverageCard`. Renderiza visualmente la cobertura de temas dados, planificados y sin planificar con porcentajes exactos y una leyenda integrada.
- **Exportación de Asistencia e Informes a CSV:** Añadida la sección "Exportar registros del curso" en `CourseLogisticsTab.kt` con launchers `CreateDocument` de Android para guardar de forma local archivos CSV. Implementadas las funciones generadoras de CSV para exportar la matriz de presentismo/asistencias completa y la bitácora histórica de las clases, compatible directamente con Microsoft Excel y Google Sheets.
- **Verificación Completa:** Compilación de la aplicación exitosa (`BUILD SUCCESSFUL`) y ejecución del script de sanidad y arquitectura general `sanity-check.ps1` con 0 errores y 0 advertencias de código.

## [2026-05-28] Mejoras UX/UI en el Área Docente (Fase XVIII)
- **Detalle del Alumno por Clic Largo en Plano de Asientos:** Implementada la integración de `combinedClickable` en `SeatingMapComponents.kt` y propagado el callback de perfil de estudiante `onOpenProfile` a través de `CourseOverviewTab.kt`. Al realizar un clic largo sobre cualquier asiento ocupado en el plano 5x6, se abre directamente la ficha detallada (legajo, historial, asistencia) de forma instantánea sin cambiar de vista.
- **Badges Visuales de Trabajo y Rúbricas en el Plano:** Añadidos badges gráficos superpuestos en las esquinas de cada pupitre ocupado para representar el estado de la clase en vivo: estrella (`⭐`) para rúbricas calificadas, casa (`🏠`) para tareas entregadas, lápiz (`📝`) o alerta (`⚠️`) para el estado de trabajo individual, y bocadillo (`💬`) para notas generales del alumno.
- **Buscador Instantáneo para Alumnos sin Ubicar:** Incorporada una barra de búsqueda de texto compacta (`OutlinedTextField`) junto al encabezado de alumnos sin ubicar en el plano de asientos. Filtra reactivamente la lista LazyRow horizontal permitiendo una ubicación sumamente veloz, incluyendo un estado vacío descriptivo si no hay resultados.
- **Verificación Completa:** Compilación de la feature `:feature:teaching` exitosa y script de sanidad aprobado con 0 errores y 0 advertencias de calidad o dependencias modulares.

## [2026-05-28] Mejoras UX/UI en el Área Docente - Autocompletar Notas en Lote (Fase XIX)
- **Carga Rápida y Autocompletar Calificaciones:** Declarado el estado `defaultScore` e integrada una fila de controles rápidos en la cabecera de `BatchGradeEntryDialog.kt` (campo de nota rápida, botón "Autocompletar" y botón "Limpiar planilla"). Permite al docente rellenar masivamente las calificaciones vacías de todo el curso con una nota base en un solo toque (ej: notas grupales o aprobados generales) y borrar la planilla rápidamente en caso de error.
- **Verificación Completa:** Compilación de código exitosa (`BUILD SUCCESSFUL`) y script de sanidad aprobado con 0 errores y 0 advertencias.

## [2026-05-28] Mejoras UX/UI en el Área Docente - Filtros Rápidos en Legajo de Alumno (Fase XX)
- **Filtros Rápidos en Legajo de Alumno:** Implementado un enum `ProfileHistoryFilter` (All, Absences, LeftEarly, Notes) y chips de filtrado interactivo (`FilterChip`) en la hoja del legajo del estudiante (`StudentProfileSheet.kt`). Esto permite al docente filtrar de forma instantánea el historial de asistencia y desempeño en el aula (Todas, Faltas, Retiros, Observaciones) e incluye estados vacíos descriptivos para cada tipo de filtro.
- **Verificación Completa:** Compilación de código exitosa (`BUILD SUCCESSFUL`) y script de sanidad aprobado con 0 errores y 0 advertencias.

## [2026-05-28] Mejoras de Reporte de Clase y Autocompletado de Asistencia (Fase XXI)
- **Autocompletado de Asistencia desde Registro Diario (`ClassPlanCard.kt`):** Implementada la lógica de sugerencia inteligente para el reporte de clases dadas. Si el campo de cantidad de alumnos presentes en el reporte de clase está vacío, la UI computa automáticamente la suma total de alumnos que marcaron asistencia en la planilla individual de ese día (usando `countsAsAttendance == true` para los estados `Presente` y `Se retiró`).
- **Banner Informativo de Sugerencia:** Agregado un aviso visual (un `Box` descriptivo con estilo destacado en tono primario) al inicio del formulario de cierre de clase. Informa de manera explícita que la cifra de presentes sugerida ha sido pre-cargada basándose en las planillas del día.
- **Trazabilidad de Registros en Vista de Curso (`CourseOverviewTab.kt`):** Se enlazó y pasó el listado filtrado de registros de asistencia `attendanceRecords` al componente `ClassPlanCard` en la visualización por cursos, garantizando la consistencia y reactividad en tiempo real de los datos.
- **Verificación Completa:** Compilación de la aplicación exitosa (`BUILD SUCCESSFUL` en 1m 14s) y verificación mediante el script de calidad general `sanity-check.ps1` con 0 errores y 0 advertencias de código.

## [2026-05-28] Mejoras UX/UI - Auto-poblamiento Completo de Asistencias (Fase XXII)
- **Pre-poblado Inteligente en Diálogo de Cierre Rápido (`DashboardScreen.kt` & `DashboardViewModel.kt`):** Modificamos el diálogo `QuickCheckoutDialog` de cierre rápido de clases del feed de inicio. Al abrirse, inicia un `LaunchedEffect` asíncrono y reactivo que llama a la nueva función `getAttendancePrefill` del `DashboardViewModel`, consultando los registros individuales de asistencia ya cargados para ese día en el plano de asientos. Si existen, pre-puebla automáticamente el campo de texto "Cantidad de presentes" con la suma total y el campo de observaciones con un texto descriptivo, impidiendo que el formulario de inicio se muestre en blanco si ya se había tomado asistencia ese día.
- **Pre-poblado Inteligente en Planificador y Detalles de Materia (`PlannerViewModel.kt`, `PlannerTeacherMode.kt`, `SubjectDetailContent.kt`):** Modificamos `PlannerViewModel.kt` para observar y combinar el flujo de registros de asistencia `observeClassAttendanceRecords()` de la base de datos local en el `PlannerUiState`. Pasamos estos registros a `ClassPlanCard` en el Teacher Mode del planificador (`PlannerTeacherMode.kt`) y en el detalle de la materia (`SubjectDetailContent.kt`). Esto asegura que el pre-poblado de presentes sugerido y el banner de sugerencias funcionen a la perfección desde cualquier pantalla donde el docente decida reportar su clase.
- **Verificación General:** Compilación general y ensamble del APK exitosos (`BUILD SUCCESSFUL` en 1m 16s) y aprobación del script de arquitectura y sanidad `sanity-check.ps1` con 0 errores y 0 advertencias en todo el codebase.

## [2026-05-28] Vinculación Inteligente de Subcarpetas Locales y Auto-asociación por Materias (Fase XXIII)
- **Modelo Extendido de Recursos (`FolderResource.kt`):** Se añadió el campo opcional `folderName: String? = null` para poder persistir y visualizar la procedencia del subdirectorio del celular en la memoria intermedia.
- **Escaneo Recursivo Primer Nivel (`FolderResourceReader.kt`):** Actualizada la lógica de escaneo en SAF para que examine tanto los archivos de la raíz como los de las subcarpetas del primer nivel dentro de la carpeta principal vinculada. A cada archivo secundario se le asigna su respectivo nombre de subcarpeta (`folderName`). El listado se ordena prioritariamente por nombre de subcarpeta y de forma secundaria por nombre de archivo.
- **Selector de Filtro de Subcarpetas (`PlannerCreateMenu.kt`):** Rediseñado el BottomSheet `CreateFolderImportSheet`. Se implementó un selector LazyRow horizontal con `FilterChip`s para filtrar dinámicamente el listado de archivos mostrados según la subcarpeta del celular que los contiene.
- **Badges de Carpeta en Tarjetas:** Añadido un badge estético `📁 folderName` en las tarjetas de archivos detectados para identificar la procedencia física del archivo en el celular de forma veloz.
- **Pre-vinculación Inteligente en Cascada:**
  - Al seleccionar un Curso, Materia o Secuencia en los desplegables de importación, un `LaunchedEffect` auto-filtra y selecciona la subcarpeta cuyo nombre contenga o coincida parcialmente con dicho curso/materia.
  - Al seleccionar y filtrar por una subcarpeta en la fila de Chips, otro `LaunchedEffect` auto-selecciona la Materia o el Curso correspondiente en los desplegables de importación en base a coincidencias parciales de nombre.
- **Verificación General:** Compilación general y ensamble del APK exitosos (`BUILD SUCCESSFUL` en 1m 35s) y aprobación del script de arquitectura y sanidad `sanity-check.ps1` con 0 errores y 0 advertencias.

## [2026-05-28] Borrado Individual de Tareas, Evaluaciones, Clases y Materiales (Fase XXIV)
- **Persistencia en SQLite (Room):** Modificados `StudyTaskDao.kt`, `AssessmentDao.kt`, `ClassPlanDao.kt` y `StudyMaterialDao.kt` con sentencias `DELETE` transaccionales para permitir eliminar de forma individual e independiente cada ítem. Las subtareas de tareas, marcadores de materiales y asistencias de clases se limpian en cascada de forma atómica.
- **Implementación en Repositorio y ViewModel:** Expuestas e implementadas las firmas correspondientes en `StudyRepository`, `StudyRepositoryImpl`, delegados (`TaskDelegate`, `MaterialDelegate`, `TeachingDelegate`) y expuestas reactivamente en `PlannerViewModel`.
- **Botones de Borrado en Hojas de Edición:** Incorporados botones OutlinedButton de color "error" en las hojas de edición `PlannerTaskEditSheet.kt`, `PlannerAssessmentEditSheet.kt`, `PlannerClassPlanEditSheet.kt` y `PlannerMaterialEditSheet.kt`.
- **Flujos de Confirmación Interactivas:** Añadidos diálogos AlertDialog de confirmación previa a la eliminación en cada hoja para evitar la pérdida accidental de datos del estudiante o docente, integrando el flujo de cierre en `PlannerScreen.kt`.
- **Verificación General:** Compilación modular y ensamble general del APK exitosos (`BUILD SUCCESSFUL`), y aprobación del script de sanidad `./scripts/sanity-check.ps1` con 0 errores y 0 advertencias de código.

## [2026-05-29] Ejes Pedagógicos Avanzados y Mapa de Ruta Didáctico (Fase XXV)
- **Ejes Formativos de Dominio y Room (Migración 25 a 26):** Incorporados los campos `prerequisites` ("Necesario") y `enablingKnowledge` ("¿Qué conocimientos habilita?") en `TeachingSequence` y `ClassPlan`. Agregadas las columnas en Room con su correspondiente script de migración SQLite seguro `Migration25To26`.
- **Formularios de Creación y Edición Actualizados:** Adaptados `PlannerCreateMenu.kt`, `PlannerClassPlanEditSheet.kt` y el diálogo de edición de secuencias en `TeachingSequenceCard.kt` para incorporar entradas para estos tres ejes. "Objetivo" fue renombrado en UI a "Trabajo Final / Objetivo".
- **Auto-Herencia UX de Secuencias:** Añadido el botón "📋 Heredar de secuencia" en el formulario de creación de clases individuales que copia automáticamente el contenido de Necesario, Trabajo Final y Conocimientos Habilitados de la secuencia didáctica padre al plan de clase actual.
- **Mapa de Ruta Didáctico (Canvas Visual):** Creado el componente unificado `SequenceRoadmap` en `:core:ui` para dibujar una línea de tiempo horizontal interactiva y scrollable con las tarjetas del recorrido didáctico: `[Necesario]` ──▶ `[Clases Asociadas (1...N)]` ──▶ `[Trabajo Final]` ──▶ `[Conocimientos Habilitados]`. Conectado mediante un toggle animado en `TeachingSequenceCard`.
- **Reportes Pedagógicos en Markdown:** Actualizadas las funciones de exportación `toMarkdown()` en `TeachingSequence.kt` y `ClassPlan.kt` para contemplar estos tres nuevos ejes pedagógicos en el portapapeles.
- **Verificación General:** Compilación general y ensamble del APK exitosos (`BUILD SUCCESSFUL` en 2m 47s) y aprobación del script de sanidad `./scripts/sanity-check.ps1` con 0 errores y 0 advertencias.

## [2026-05-29] Wikilinks y Editor de Planificación Avanzado (Fase XXVI)
- **Interconectividad estilo Obsidian (`Wikilinks`):** Implementada la lógica de `[[Wikilinks]]` para vincular de forma bidireccional materias, temas, materiales y conceptos. Los enlaces son interactivos en modo lectura y resaltados en modo edición.
- **Sistema de Conceptos Académicos (Room Versión 27):** Creada la nueva entidad `StudyConcept` para definiciones atómicas y transversales. Implementada la base de datos con `Migration26To27`, DAO y repositorio con búsqueda global por nombre.
- **Editor de Notas Inteligente (`NoteEditorComponent`):**
  - **Autocompletado Proactivo:** Al escribir `[[`, se despliega un listado filtrado de todas las entidades académicas del usuario para una vinculación veloz.
  - **Resaltado de Sintaxis en Vivo:** Integrada la `WikilinkVisualTransformation` para destacar visualmente los enlaces mientras el usuario escribe.
  - **Extracción de Tareas con Checkbox:** Mejorado el motor de Regex para detectar y extraer automáticamente tareas con formato `- [ ]` o `- [x]`.
- **Navegación y Creación Rápida:**
  - Implementado el componente `WikilinkText` para renderizado interactivo en el visor de materiales.
  - Diseñado el flujo de resolución de enlaces que permite navegar al detalle del destino o abrir un diálogo de **"Creación Rápida"** si el concepto enlazado aún no existe.
- **Alternancia View/Edit en Apuntes:** Añadido un toggle de "Modo Lectura / Modo Edición" en `MaterialViewerScreen` para facilitar la navegación fluida entre notas interconectadas.
- **Verificación General:** Compilación general y ensamble del APK exitosos (`BUILD SUCCESSFUL`) y aprobación del script de sanidad `./scripts/sanity-check.ps1` con 0 errores y 0 advertencias.

## [2026-05-29] Modularización Crítica: PlannerCreateMenu (Fase XXVII)
- **Extracción de Mega-Componente:** Identificado `PlannerCreateMenu.kt` como el archivo más crítico por su tamaño (~2900 líneas).
- **Refactor a Components:** Extraídas las 10 hojas de creación a archivos individuales en `:feature:planner:components`:
  - `CreateSubjectSheet`, `CreateUnitSheet`, `CreateTopicSheet`.
  - `CreateTaskSheet`, `CreateTaskFromTemplateSheet`, `CreateAssessmentSheet`.
  - `CreateCourseSheet`, `CreateClassPlanSheet`, `CreateClassScheduleSheet`, `CreateTeachingSequenceSheet`.
  - `CreateMaterialSheet`, `CreateNoteSheet`, `CreateFolderImportSheet`.
- **Reducción de Deuda Técnica:** El archivo principal `PlannerCreateMenu.kt` se redujo a ~350 líneas, enfocándose ahora exclusivamente en la orquestación y el layout del menú.
- **Limpieza Post-Wikilinks:** Corregidos errores de sintaxis y falta de imports en `:feature:material_viewer` remanentes de la implementación de wikilinks.
- **Verificación General:** Compilación exitosa de la app completa (`BUILD SUCCESSFUL`) confirmando la integridad del refactor.

## [2026-05-29] Modularización Docente: PlanningComponents (Fase XXVIII)
- **Decomposición de PlanningComponents:** El archivo multifuncional `PlanningComponents.kt` (~750 líneas) ha sido dividido en archivos especializados para mejorar la cohesión y mantenibilidad:
  - `CoursePlanningInsightsSection.kt`: Lógica y UI para las prioridades de planificación docente.
  - `SyllabusCoverageComponents.kt`: Gráficos de dona y tarjetas de cobertura del programa académico.
  - `CourseLogisticsSection.kt`: Calendario semanal, gestión de tareas de preparación y generador de planes para suplentes.
  - `CourseDiarySection.kt`: Bitácora digital del curso con registro de entradas por fecha.
- **Limpieza Arquitectónica:** Eliminado el archivo original `PlanningComponents.kt`, delegando sus responsabilidades a componentes atómicos en `:feature:teaching:components`.
- **Verificación Técnica:** Compilación exitosa (`BUILD SUCCESSFUL`) validando que todos los componentes y sus utilidades internas (parsers de fechas, formateadores) funcionan correctamente tras la extracción.

## [2026-05-29] Rediseño UX: Planificación Visual y Navegación Fluida (Fase XXIX)
- **Editor de Clases por Pestañas:** Refactorizado `CreateClassPlanSheet.kt` para usar una interfaz de pestañas (General, Didáctica, Vínculos, Plantillas). Esto elimina el scroll infinito y permite enfocarse en una sección a la vez.
- **Modo "Foco en Clase" (Horizontal Pager):** Implementado `ClassPlanPagerDialog.kt` que permite visualizar y editar los detalles de las clases mediante un carrusel horizontal. Facilita la comparación entre clases consecutivas y reduce el ruido visual.
- **Listado Compacto de Clases:** Rediseñada la vista de clases en `CourseOverviewTab.kt`. Se reemplazaron las tarjetas densas por una lista resumida tipo "timeline", delegando el detalle completo al nuevo Pager.
- **Mapa de Ruta Interactivo:** El componente `SequenceRoadmap` ahora es completamente funcional, permitiendo saltar directamente a cualquier clase de la secuencia con un solo toque.
- **Verificación General:** Compilación exitosa de la app (`BUILD SUCCESSFUL`) confirmando la fluidez de la navegación y la integridad de los datos entre las nuevas vistas.

## [2026-05-30] Asistente de Aula Interactivo y Edición Enriquecida (Fase XXX)
- **Línea de Tiempo Vertical (`SequenceRoadmap`):** Se reemplazó el mapa de ruta didáctico horizontal por una línea de tiempo vertical optimizada para móviles, con conectores fluidos y código de colores semántico (verde para objetivos cumplidos, ámbar para pendientes, azul para futuras).
- **Modo Presentación (`ClassPresentationDialog`):** Desarrollada una interfaz a pantalla completa óptima para dar clases, con temporizadores interactivos independientes para Inicio, Desarrollo y Cierre, integración directa de notas en la bitácora del curso y lanzador de materiales.
- **Editor Enriquecido (`EstudiRichEditor`):** Componente de texto enriquecido basado en `TextFieldValue` para un control preciso del cursor, con barra de formato Markdown e inserción de presets didácticos (`[Inicio]`, `[Desarrollo]`, etc.), integrado en la creación y edición de clases.
- **Reprogramación en Cascada (Smart Rescheduling):** Implementada la lógica de desplazamiento de fechas de clases planificadas futuras en cascada ante interrupciones, accesible mediante botones interactivos en la tarjeta del plan.
- **Verificación Técnica:** Compilación general exitosa (`BUILD SUCCESSFUL`) y resolución de warnings de compilación (smart casts e íconos M3 obsoletos).

## [2026-05-30] Modo Proyector, Registro de Cold Caller y Gestos de Doble Toque (Fase XXXI)
- **Modo Proyector ("Pantalla Limpia"):** Implementado un toggle en la barra de herramientas de `ClassPresentationDialog.kt` que transforma la interfaz de presentación en una versión simplificada de alto contraste y fuentes agrandadas, ideal para proyectar en el aula.
- **Privacidad del Docente:** En este modo se ocultan de forma automática la sección "Bitácora rápida de clase" y la lista de recursos docentes para evitar exponer información privada.
- **Reloj del Temporizador y Actividades Adaptadas:** El reloj digital del temporizador se centra y escala a `72.sp`, se eliminan los controles de ajuste administrativo (`-5m`/`+5m`), se introduce un indicador didáctico horizontal (`PhaseIndicator`) de alta visibilidad, y se agranda el contenido de las actividades a `22.sp` para mejorar la lectura a distancia.
- **Log en Vivo desde Cold Caller:** Se modificó `SeatingMapComponents.kt` para retener la entidad del alumno elegido en la ruleta del Cold Caller (`chosenStudent`). Al seleccionarse, se despliega una tarjeta de control flotante en tono oro que permite al docente guardar de forma atómica en SQLite: participación excelente (con badge `📝`), sin responder, llamado de atención (`⚠️`), o marcar inasistencia (`🔴`).
- **Gestos de Doble Toque en Plano de Asientos:** Se implementó el callback `onDoubleClick` en cada asiento de `SeatingMapComponents.kt` para disparar una tarjeta emergente de control rápido (`AlertDialog`) sobre el estudiante seleccionado. Permite registrar instantáneamente si entregó tarea (`🏠`), trabajo normal (`📝`), no trabajó (`⚠️`), llamado de atención (`📢`), o desasignar asiento (`🔌`), junto con una nota rápida integrada.
- **Verificación Técnica:** Compilación de Kotlin y sanity check finalizados con éxito (0 errors, 0 warnings).

## [2026-05-30] Multiselección de Clases, Carpetas Virtuales y Ajustes de Layout (Fase XXXII)
- **Multiselección de Clases Planificadas:** Implementada la capacidad de multiseleccionar clases planificadas en el planificador mediante checkboxes premium reactivos y un bar de acciones flotante glassmorphic que permite operaciones masivas en lote: mover a carpeta, desplazar fechas, cambiar estados y borrar en lote.
- **Soporte de Carpetas Virtuales para Clases (Room Versión 32):** Integrado el soporte de carpetas virtuales para clases planificadas. Modificada la entidad `ClassPlanEntity` y agregada la columna `folderId` mediante la migración segura `Migration31To32`. Actualizados los mappers bidireccionales y el módulo de Hilt.
- **Clases en Biblioteca:** Actualizado el explorador de carpetas (`FolderExplorerComponent`) para listar reactivamente las clases asociadas a la carpeta virtual activa junto con sus materiales. Añadida la opción de mover clases de forma unitaria mediante un botón directo.
- **Creación Directa en Carpeta:** Modificado `PlannerCreateMenu` para interceptar la creación de clases planificadas y asignarles automáticamente la carpeta activa de la biblioteca cuando se cargan dentro de una carpeta virtual abierta.
- **Rediseño UX Compacto de Vista Rápida:** Rediseñado `PlannerQuickViewCard` reduciendo su espacio vertical inicial en un 60% al colocar los filtros rápidos lado a lado en un `Row` horizontal y esconder las opciones de preajustes personalizados (Presets) debajo de una sección colapsable.
- **Ubicación de la Biblioteca:** Reposicionado el componente de carpetas de la biblioteca (`FolderExplorerComponent`) justo debajo de la vista rápida de filtros rápidos en `PlannerScreen.kt`, facilitando el acceso inmediato sin scroll infinito.
- **Verificación Técnica:** Compilación de Kotlin y sanity check finalizados con éxito (0 errors, 0 warnings).

## [2026-06-02] Panel de Alertas de Riesgo Académico en Pestaña General (Fase XXXIII)
- **Visualización Proactiva en Vista General:** Integrado el componente `AcademicRiskAlertsSection` directamente en la pestaña general (`CourseOverviewTab.kt`) debajo de las métricas principales del curso, logrando advertir de inmediato al docente sobre estudiantes con riesgo académico por inasistencias o bajas calificaciones.
- **Cableado Reactivo y Acciones Directas:** Conectados los datos calculados de `riskAlerts` y el disparador de diálogos de intervención desde `CourseDetailScreen.kt`. Esto permite al docente ver las alertas y abrir el diálogo de intervención correspondiente directamente desde la página de inicio del curso.
- **Soporte de Análisis Estático:** Actualizado el baseline de Detekt en el módulo `:feature:teaching` para contemplar la firma extendida del componente de la pestaña general.
- **Verificación de Calidad:** Compilación completa exitosa, spotless aplicado y pase del sanity check general con 0 errores y warnings de reglas.

## [2026-06-02] Mejoras Visuales en Toma de Asistencia y Reacciones (Fase XXXIV)
- **StatusChip Animado e Interactivo:** Se implementaron transiciones animadas de color mediante `animateColorAsState` y un rebote elástico mediante `animateFloatAsState` (con un spec `spring`) al ser seleccionado un chip.
- **Barra de Progreso y Celebración:** Se integró un indicador de progreso lineal (`LinearProgressIndicator`) en `AttendanceComponents.kt` para cuantificar visualmente el porcentaje de asistencia registrado. Al completarse el 100% de los alumnos, la barra cambia a verde y muestra la leyenda celebrativa `"¡Asistencia completa! 🎉"`.
- **Línea de Estado Lateral por Fila:** Se rediseñó el contenedor de `StudentAttendanceRow.kt` para incluir una barra vertical lateral izquierda que refleja el estado de asistencia de cada alumno (gris para no marcado, verde para presente, naranja para tardanza, rojo para ausente) mediante colores animados.
- **Asientos Dinámicos en el Plano de Clase:** Se animaron el color de fondo y el color de borde de cada asiento en `ClassroomSeatingComponents.kt` para otorgar fluidez al interactuar con el plano del aula.
- **Verificación de Calidad:** Aprobación sintáctica, de estilos spotless y pase del sanity check general con éxito (0 errores).

## [2026-06-02] Consolidación del Registro y Métricas de Tareas Docentes (Fase XXXV)
- **Tasa de Entrega de Tareas en Vista General:** Añadido `homeworkRate` (tasa de entrega) y `missingHomeworkCount` al modelo de datos `StudentAttendanceSummary`. Se actualizó la lógica de cálculo en `buildStudentAttendanceSummaries` y se integró un badge premium de tareas no entregadas y tasa en la lista general (`StudentAttendanceOverviewSection`).
- **Filtros Rápidos por Estado de Tarea:** Implementado un sistema de chips de filtrado en el pase de lista (`ClassAttendanceSection`) para buscar rápidamente estudiantes que no hicieron la tarea (`🏠✕ Sin tarea`) o aquellos que carecen de registro individual (`❓ Sin registro`).
- **Acciones Masivas de Tareas:** Se incorporaron botones interactivos de "Todos entregaron" y "Nadie entregó" en la barra de acciones rápidas (`AttendanceBulkActions`), facilitando la asignación masiva de estados de tarea.
- **Resumen Automático Post-Clase (Feedback en Foco):** Creado el componente `ClassSummaryCard` que muestra estadísticas en tiempo real (porcentaje de asistencia, tasa de tarea, observaciones de fase) al cierre de cada clase, incrustado directamente en el Pager `ClassPlanPagerDialog`.
- **Historial Completo en Ficha del Estudiante:** Integrada la sección de historial y tasa de tareas en el legajo individual (`StudentProfileSheet`). Los estados se visualizan con iconos intuitivos (`🏠 Entregó`, `🏠✕ Sin tarea`).
- **Legajo Académico Exportable Actualizado:** Adaptada la función `generateAcademicMarkdownReport` para calcular e incluir la tasa de entrega de tareas y el total de tareas faltantes/presentadas en el informe Markdown copiado al portapapeles.
- **Identificación de Clases Sin Registro:** Incorporado un badge dinámico de alerta `❓ Sin registro` en `ClassPlanCard` para identificar visualmente y en tiempo real clases pasadas o concluidas que aún no tienen su reporte de asistencia o bitácora de clase guardados.
- **Verificación Técnica:** Aprobación de compilación del módulo y pase del sanity check con 0 errores y 0 advertencias de código.

## [2026-06-04] Puente de Aprendizaje Activo: Integración Mazo -> Cola de Repaso (SRS) (Fase XXXVI)
- **Puente Didáctico-Repaso:** Implementada la integración directa entre los mazos didácticos del módulo `:feature:didactic_tools` y la cola de repetición espaciada (`:feature:review`) usando el algoritmo SM-2.
- **Lógica de Extracción Inteligente:** Desarrollado el método `exportToSrs` en `CardListViewModel` para extraer automáticamente el texto frontal y trasero de las zonas de las caras de las cartas didácticas, resolviendo fallbacks con títulos y notas globales.
- **Configuración e Interfaz de Usuario:**
  - Añadido un botón premium **"Programar Mazo para Repaso (SRS)"** en `DeckConfigSheet.kt` con iconografía escolar.
  - Creado el diálogo `ExportSrsDialog` en `CardListScreen.kt` que permite al usuario clasificar y asociar de forma opcional el mazo a una Materia (`Subject`) y un Tema (`StudyTopic`) mediante el uso del componente `EstudiDropdown`.
  - Integrado `SnackbarHost` en el Scaffold de la lista de cartas para mostrar retroalimentación inmediata del éxito del proceso.
- **Verificación de Calidad:** Compilación completa exitosa, formateador spotless aplicado y pase del sanity check general con 0 errores y 0 advertencias de código.

## [2026-06-04] Tiradas en Cascada: Tablas Anidadas (Fase XXXVII)
- **Tiradas en Cascada en Tablas Didácticas:** Implementada la resolución automática y recursiva de tiradas en cascada para dar pleno uso a la propiedad de subtablas anidadas (`subTableId` / `subTableRef`) en la base de datos local de `DidacticTableEntry`.
- **Caso de Uso Seguro y Robusto:** Diseñado y estructurado `RollTableUseCase` para consultar de forma asíncrona la base de datos mediante `StudyRepository` de forma recursiva con un límite de profundidad de 5 niveles para evitar ciclos infinitos, satisfaciendo las reglas de Detekt de profundidad máxima y límites de sentencias de salto.
- **Línea de Tiempo Vertical en UI:** Rediseñada la pantalla de detalle de tabla (`TableDetailScreen`) en `:feature:didactic_tools` para reemplazar el visor de resultado único por una línea de tiempo vertical de tarjetas conectadas con flechas, mejorando la visualización del camino completo y aplicando colores de tema armoniosos (`primaryContainer` para el destino final y `surfaceVariant` para los pasos intermedios).
- **Verificación de Calidad:** Compilación modular y general exitosas y pase del sanity check general de la app con 0 errores y 0 advertencias.


