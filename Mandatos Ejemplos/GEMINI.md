# GEMINI.md - Guia Operativa de EstudiApp

Este documento es la fuente de verdad operativa del proyecto. Debe leerse al inicio de cada tarea para mantener coherencia de producto, arquitectura y calidad.

Para historial detallado usar `DEVLOG.md`. Para roadmap y alcance funcional usar `planning/`. Para arquitectura modular usar `planning/ARCHITECTURE.md`. Para rutinas paso a paso usar `planning/WORKFLOW.md`. Para evaluar sugerencias de IA usar `planning/AI_SUGGESTIONS.md`. Para mejoras UX/UI usar `planning/UX_SUGGESTIONS.md`.

## Estado Actual

- **Fase:** Cimentacion avanzada con modulos funcionales de estudio, planificacion, docencia, revision, busqueda, reportes y temporizador.
- **Arquitectura:** Android nativo modular con Clean Architecture, Hilt, Compose, Room y Navigation Compose.
- **Fuente de verdad:** Persistencia local con Room. Futuras sincronizaciones deben ser secundarias.
- **Objetivo del producto:** Ayudar a estudiantes y docentes a convertir informacion academica en acciones concretas: que estudiar, cuando, como y con que seguimiento.

## Vision de Producto

- Centralizar materias, temas, tareas, evaluaciones, materiales, clases, cursos y registros docentes.
- Recomendar tecnicas segun contexto: repaso activo, repeticion espaciada, Pomodoro, Feynman y examenes simulados.
- Convertir la planificacion en ejecucion diaria: prioridades claras, sesiones de foco, pendientes accionables y seguimiento historico.
- Mantener una experiencia calmada, legible y operacional: menos ruido, mas decision.

## Mapa de Modulos

- `:app` -> Application, Activity principal, navegacion, DI y wiring general.
- `:core:model` -> Modelos de dominio puros, enums y tipos compartidos.
- `:core:domain` -> Contratos de repositorio, use cases y reglas de negocio.
- `:core:data` -> Room, DAO, entidades, mappers, migraciones e implementaciones.
- `:core:ui` -> Tema visual, componentes reutilizables y sistema de diseno.
- `:feature:dashboard` -> Resumen operativo, prioridades, metricas y recomendaciones.
- `:feature:planner` -> Agenda, tareas, evaluaciones, materiales y planificacion base.
- `:feature:techniques` -> Biblioteca de tecnicas y examenes simulados.
- `:feature:material_viewer` -> Visor/editor interno de archivos, imagenes, PDFs y notas.
- `:feature:teaching` -> Gestion docente: cursos, secuencias, clases, asistencia, calificaciones y seguimiento.
- `:feature:timer` -> Temporizador Pomodoro, sesiones de foco y audio de ambiente.
- `:feature:review` -> Cola de repaso, flashcards y repeticion espaciada.
- `:feature:search` -> Busqueda global sobre datos de dominio.
- `:feature:reports` -> Reportes academicos y docentes.
- `:feature:didactic_tools` -> Herramientas didácticas: sistema avanzado de cartas, reconocimiento OCR, recorte y gestion de mazos para vocabulario.

## Mandamientos Tecnicos

1. **Modularidad estricta:** Ningun modulo `:feature:*` puede importar `:core:data` directamente. Las features consumen `:core:model`, `:core:domain` y `:core:ui`.
2. **App liviana:** `:app` orquesta navegacion, DI y arranque. No debe contener reglas de negocio ni UI compleja.
3. **Room como fuente primaria:** La base local es el source of truth. Cualquier sincronizacion futura debe leer/escribir respetando ese contrato.
4. **Dominio antes que UI:** Toda regla de negocio nueva debe vivir en modelos, use cases o repositorios; no escondida en composables.
5. **Tipos explicitos:** Estados, prioridades, modos, rutas y tipos academicos deben modelarse con `enum class`, `sealed interface`, value objects o constantes tipadas. Evitar strings magicos.
6. **UI reactiva:** Las pantallas consumen `StateFlow`/`Flow`. La UI renderiza estado y envia eventos; no decide persistencia ni reglas.
7. **IO fuera del Main Thread:** Escrituras a DB, archivos, SAF, backup o importaciones deben ejecutarse fuera del hilo principal.
8. **Un dueno por comportamiento:** UI muestra, ViewModel coordina estado, UseCase decide, Repository persiste, DAO consulta.
9. **Extraction Mandate:** Composables con estado, logica, dialogs, sheets, listas densas o secciones repetibles deben extraerse a `components/`.
10. **No Mega Screens:** Evitar pantallas monoliticas. Una pantalla debe leer como composicion de secciones claras.
11. **Componentes compartidos primero:** Antes de crear UI nueva, revisar `:core:ui` y reutilizar `EstudiCard`, `EstudiDropdown`, tarjetas compartidas y tokens existentes.
12. **Migration Discipline:** Cualquier cambio en entidades Room exige version nueva, migracion, mapper actualizado y validacion de build.
13. **Build Validation:** Al cerrar hitos relevantes ejecutar validacion Gradle adecuada. Para cambios grandes usar `:app:assembleDebug`.
14. **Sanity Check:** Para cambios de codigo ejecutar `./scripts/sanity-check.ps1` antes de cerrar, salvo excepcion explicita.
15. **Premium Calm UI:** La interfaz debe ser clara, enfocada, densa pero respirable. Priorizar legibilidad, jerarquia y acciones obvias.
16. **Study First:** Cada feature nueva debe responder una pregunta concreta: que estudiar, cuando, como, con que material o que seguimiento docente requiere.
17. **Log Only Milestones:** `DEVLOG.md` registra hitos relevantes. No registrar microcambios cosmeticos o refactors triviales.
18. **AI Suggestions Filter:** Toda mejora propuesta por IA debe evaluarse con `planning/AI_SUGGESTIONS.md` antes de entrar al plan o al codigo.
19. **UX Before Aesthetics:** Toda mejora de interfaz debe demostrar reduccion de friccion, claridad o prevencion de errores usando `planning/UX_SUGGESTIONS.md`.

## Flujo de Trabajo Obligatorio

1. Leer este archivo y, si la tarea toca alcance funcional, revisar `planning/README.md`.
2. Revisar `planning/ARCHITECTURE.md` si la tarea toca modulos, dependencias o ubicacion de responsabilidades.
3. Revisar `planning/WORKFLOW.md` para elegir la rutina y nivel de validacion adecuados.
4. Identificar el modulo dueno del cambio antes de editar.
5. Buscar componentes, modelos, use cases y patrones existentes antes de crear otros nuevos.
6. Hacer cambios acotados al modulo correcto, respetando las dependencias permitidas.
7. Si cambia persistencia:
   - actualizar modelo, entidad, DAO, mapper y repositorio segun corresponda;
   - subir version de Room;
   - agregar migracion explicita;
   - validar que los datos existentes tengan defaults seguros.
8. Si cambia UI:
   - reutilizar `:core:ui` cuando exista una pieza equivalente;
   - extraer componentes con estado/logica a `components/`;
   - mantener textos visibles en resources cuando aplique;
   - evitar duplicar sheets, dialogs o tarjetas similares.
9. Si cambia navegacion:
   - mantener rutas tipadas o centralizadas;
   - evitar strings magicos dispersos;
   - verificar entradas desde dashboard, planner, search y pantallas de detalle cuando corresponda.
10. Ejecutar la validacion Gradle minima razonable.
11. Actualizar `DEVLOG.md` solo si el cambio agrega una capacidad de producto, migracion, refactor grande o hito tecnico.

## Definition of Done

Un cambio se considera terminado cuando:

- Compila el modulo afectado o la app completa.
- El sanity check pasa para cambios de codigo.
- No rompe la direccion de dependencias modular.
- Las reglas de negocio quedan fuera de composables.
- La UI reutiliza componentes existentes o justifica una pieza nueva.
- Los cambios Room incluyen migracion y mappers coherentes.
- Los estados nuevos son tipados, no strings sueltos.
- Los flujos principales afectados tienen una ruta de uso clara.
- `DEVLOG.md` se actualiza si el cambio es un hito.

## Validacion Recomendada

- Cambio pequeno de UI o ViewModel:
  `./gradlew.bat :app:compileDebugKotlin --console=plain --no-daemon`

- Cambio de navegacion, DI o wiring entre modulos:
  `./gradlew.bat :app:assembleDebug --console=plain --no-daemon`

- Cambio en dominio/use cases:
  `./gradlew.bat :core:domain:testDebugUnitTest --console=plain --no-daemon`

- Cambio en Room, entidades, DAO, migraciones o repositorios:
  `./gradlew.bat :app:assembleDebug --console=plain --no-daemon`

- Refactor grande de pantallas o componentes compartidos:
  `./gradlew.bat :app:assembleDebug --console=plain --no-daemon`

## Reglas de Producto

- Priorizar accion sobre informacion pasiva.
- Reducir friccion al capturar tareas, materiales, clases y asistencia.
- Mantener separadas las necesidades de estudiante y docente, pero permitir cruces utiles.
- Toda metrica debe sugerir una accion o ayudar a decidir prioridad.
- Toda automatizacion debe dejar control manual claro.

## Reglas de UI Compose

- Usar Material 3 y tokens de `:core:ui`.
- Mantener jerarquia visual consistente entre dashboard, planner, teaching, review y timer.
- Extraer listas densas, tarjetas, formularios, sheets, dialogs y controles reutilizables.
- Evitar decoracion sin funcion. La app debe sentirse premium por claridad, no por ruido.
- Cuidar estados vacios, loading, errores y acciones primarias.

## Reglas de Datos y Room

- Toda entidad nueva debe tener modelo de dominio, mapper y DAO si corresponde.
- Toda columna nueva debe tener default seguro en migracion.
- No borrar datos existentes sin una migracion deliberada.
- Mantener codecs para estructuras complejas cuando Room no deba conocer tipos de UI o dominio ricos.
- Repositories implementan contratos de `:core:domain`; las features no acceden a DAO.

## Reglas de Documentacion

- `GEMINI.md` mantiene reglas vivas y flujo operativo.
- `DEVLOG.md` mantiene historial cronologico de hitos.
- `planning/01_implementation_plan.md` mantiene fases y estrategia.
- `planning/02_feature_map.md` mantiene mapa funcional esperado.
- `planning/ARCHITECTURE.md` mantiene reglas de capas, ownership y plantillas de implementacion.
- `planning/WORKFLOW.md` mantiene rutinas operativas por tipo de cambio.
- `planning/AI_SUGGESTIONS.md` mantiene la rubrica para evaluar propuestas de IA.
- `planning/AI_IDEAS_BACKLOG.md` mantiene ideas candidatas, aceptadas, diferidas, rechazadas o implementadas.
- `planning/UX_SUGGESTIONS.md` mantiene la rubrica para mejoras de interfaz e interaccion.
- Si una decision cambia la arquitectura, actualizar este documento.

## Ultimos Hitos Relevantes

- Modularizacion fuerte de pantallas grandes en `:feature:planner`, `:feature:teaching`, `:feature:dashboard`, `:feature:review` y `:feature:timer`.
- Consolidacion de `:core:ui` como base compartida para tarjetas, dropdowns, tema y componentes reutilizables.
- Incorporacion de flujos docentes avanzados: cursos, asistencia, calificaciones, rubricas, secuencias, bitacora, reportes y mapa de asientos.
- Incorporacion de flujos de estudio avanzados: Pomodoro, sesiones reales, flashcards, repeticion espaciada, revision, busqueda y recomendaciones.
