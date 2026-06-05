# AI_IDEAS_BACKLOG.md - Backlog de Ideas Propuestas por IA

Este backlog guarda sugerencias de IA evaluadas o pendientes de evaluar. No reemplaza `planning/02_feature_map.md`; solo captura candidatos hasta que se acepten, descarten o implementen.

## Estados

- **Candidate:** idea capturada, falta evaluacion.
- **Accepted:** aprobada para planificar o implementar.
- **Needs Research:** requiere mas contexto tecnico/producto.
- **Deferred:** valida, pero no prioritaria.
- **Rejected:** descartada con motivo.
- **Implemented:** ya realizada y registrada si corresponde.

## Como Usarlo

1. Toda sugerencia debe resumirse con el formato de `AI_SUGGESTIONS.md`.
2. Registrar score, tipo, costo, riesgo, modulo dueno y proximo paso.
3. Las ideas aceptadas deben moverse al plan o implementarse con `WORKFLOW.md`.
4. Las ideas implementadas deben referenciar archivos/cambio y, si fue hito, `DEVLOG.md`.
5. Las ideas rechazadas deben conservar el motivo para evitar repetir discusiones.

## Vista Priorizable

| Estado | Score | Tipo | Propuesta | Valor | Costo | Riesgo | Modulo dueno | Proximo paso |
|---|---:|---|---|---|---|---|---|---|
| Implemented | 32 | Product / UX | Consolidación Feynman Post-Foco | Alto | Bajo | Bajo | `:feature:timer` | Completado (Fase I) |
| Implemented | 30 | Product / UX | Repetición Espaciada Activa (SM-2) | Alto | Medio | Bajo | `:feature:review` | Completado (Fase III) |
| Implemented | 30 | Product / UX | Digitalización OCR con ML Kit (Local) | Alto | Medio | Bajo | `:feature:teaching` | Completado (Fase IV-VIII) |
| Implemented | 29 | Product / UX | Simulador de Exámenes con IA Local | Alto | Medio-Alto | Bajo | `:feature:techniques` | Completado (ExamSimulatorScreen) |
| Implemented | 28 | Product / UX | Línea de Tiempo Didáctica y Logro de Objetivos | Alto | Bajo-Medio | Bajo | `:feature:teaching` | Completado (Secuencia Vertical) |
| Implemented | 35 | Product / Logic | Índice de Dominio y Refuerzo Crítico | Muy Alto | Bajo | Bajo | `:core:domain` | Completado (GetTopicMasteryUseCase) |
| Implemented | 32 | Product / UX | Modo Pánico (Panic Mode) | Alto | Bajo | Bajo | `:feature:dashboard` | Completado (ObservePanicModeUseCase) |
| Implemented | 28 | Product / Logic | Grafo de Conocimientos (Conexiones) | Medio-Alto | Medio | Bajo | `:core:data` | Completado (StudyConnectionEntity) |
| Implemented | 24 | Product / UX | Asistente Pedagógico (Inicio-Desarrollo-Cierre) | Alto | Medio | Bajo | `:feature:teaching` | Completado (EstudiRichEditor) |
| Implemented | 22 | Product / UX | Desplazamiento de Fechas en Cascada | Medio-Alto | Medio | Bajo | `:feature:teaching` | Completado (TeachingViewModel) |
| Implemented | 22 | Product / Cloud | Importador desde Google Docs (Online) | Medio-Alto | Alto | Medio | `:feature:review` | Completado (Fase II) |
| Implemented | 20 | Product / UX | Integración de Bitácora Inmediata | Medio | Bajo | Bajo | `:feature:teaching` | Completado (ClassPresentationDialog) |

## Candidate

| Score | Tipo | Propuesta | Valor | Costo | Riesgo | Modulo dueno | Proximo paso |
|---:|---|---|---|---|---|---|---|
| 31 | Product / UX | Puente Mazo -> Cola de Repaso (SRS) | Alto | Medio | Bajo | `:feature:didactic_tools` | Crear use case y UI para exportar cartas a Flashcards (SM-2). |
| 29 | Product / UX | Tiradas en Cascada (Tablas Anidadas) | Medio-Alto | Bajo-Medio | Bajo | `:feature:didactic_tools` | Implementar resolución recursiva y UI de tiradas en cadena. |
| 25 | UX / Product | Captura de Tarjetas Físicas (Multi-Crop) | Alto | Medio-Alto | Medio | `:feature:didactic_tools` | Diseñar lienzo interactivo para recortar múltiples cartas de una foto. |
| 20 | Product / UX | Indicador de Cobertura Curricular | Medio | Bajo | Bajo | `:feature:reports` | Crear barra/gráfico de completitud del temario. |
| 22 | Product / UX | Exportación Pedagógica Formal (PDF/MD) | Medio-Alto | Bajo | Bajo | `:feature:reports` | Definir plantillas imprimibles de secuencias didácticas. |

## Accepted

| Score | Tipo | Propuesta | Valor | Costo | Riesgo | Modulo dueno | Proximo paso |
|---:|---|---|---|---|---|---|---|
| - | - | _Sin ideas aceptadas._ | - | - | - | - | - |

## Needs Research

| Score | Tipo | Propuesta | Valor | Costo | Riesgo | Modulo dueno | Proximo paso |
|---:|---|---|---|---|---|---|---|
| - | - | _Sin ideas en investigación pendientes._ | - | - | - | - | - |

## Deferred

| Score | Tipo | Propuesta | Valor | Costo | Riesgo | Modulo dueno | Proximo paso |
|---:|---|---|---|---|---|---|---|
| 24 | Product / UX | Detección de Bloqueos Pedagógicos | Medio-Alto | Medio | Bajo | `:feature:planner` | Alertas si la clase anterior no cumplió el objetivo. |
| 22 | Product / UX | Bitácora y Cierre Automatizado | Medio | Bajo | Bajo | `:feature:teaching` | Autogenerar observaciones basadas en Necesario/Habilita. |

## Rejected

| Score | Tipo | Propuesta | Valor | Costo | Riesgo | Modulo dueno | Motivo |
|---:|---|---|---|---|---|---|---|
| - | - | _Sin ideas rechazadas._ | - | - | - | - | - |

## Implemented

| Score | Tipo | Propuesta | Valor | Costo | Riesgo | Modulo dueno | Referencia |
|---:|---|---|---|---|---|---|---|
| 32 | Product / UX | Consolidación Feynman Post-Foco | Alto | Bajo | Bajo | `:feature:timer` | [walkthrough.md](file:///C:/Users/Giise/.gemini/antigravity-ide/brain/0f795738-738a-4c9f-8ca2-b705e7e75820/walkthrough.md#L7) |
| 30 | Product / UX | Repetición Espaciada Activa (SM-2) | Alto | Medio | Bajo | `:feature:review` | [walkthrough.md](file:///C:/Users/Giise/.gemini/antigravity-ide/brain/0f795738-738a-4c9f-8ca2-b705e7e75820/walkthrough.md#L49) |
| 30 | Product / UX | Digitalización OCR con ML Kit (Local) | Alto | Medio | Bajo | `:feature:teaching` | [walkthrough.md](file:///C:/Users/Giise/.gemini/antigravity-ide/brain/0f795738-738a-4c9f-8ca2-b705e7e75820/walkthrough.md#L65) |
| 29 | Product / UX | Simulador de Exámenes con IA Local | Alto | Medio-Alto | Bajo | `:feature:techniques` | `ExamSimulatorScreen.kt` |
| 28 | Product / UX | Línea de Tiempo Didáctica y Logro de Objetivos | Alto | Bajo-Medio | Bajo | `:feature:teaching` | [walkthrough.md](file:///C:/Users/Giise/.gemini/antigravity-ide/brain/fd7be3d4-b16e-44e2-9c53-62f068dc5e2d/walkthrough.md) |
| 24 | Product / UX | Asistente Pedagógico (Inicio-Desarrollo-Cierre) | Alto | Medio | Bajo | `:feature:teaching` | [walkthrough.md](file:///C:/Users/Giise/.gemini/antigravity-ide/brain/fd7be3d4-b16e-44e2-9c53-62f068dc5e2d/walkthrough.md#L28) |
| 22 | Product / UX | Desplazamiento de Fechas en Cascada | Medio-Alto | Medio | Bajo | `:feature:teaching` | [walkthrough.md](file:///C:/Users/Giise/.gemini/antigravity-ide/brain/fd7be3d4-b16e-44e2-9c53-62f068dc5e2d/walkthrough.md#L37) |
| 22 | Product / Cloud | Importador desde Google Docs (Online) | Medio-Alto | Alto | Medio | `:feature:review` | [walkthrough.md](file:///C:/Users/Giise/.gemini/antigravity-ide/brain/0f795738-738a-4c9f-8ca2-b705e7e75820/walkthrough.md#L25) |
| 20 | Product / UX | Integración de Bitácora Inmediata | Medio | Bajo | Bajo | `:feature:teaching` | [walkthrough.md](file:///C:/Users/Giise/.gemini/antigravity-ide/brain/fd7be3d4-b16e-44e2-9c53-62f068dc5e2d/walkthrough.md#L19) |

