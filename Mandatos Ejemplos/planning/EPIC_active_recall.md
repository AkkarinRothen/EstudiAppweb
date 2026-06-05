# Epic: De la Nota al Planificador (Active Recall)

Este documento detalla el plan para convertir fragmentos de notas en tareas de estudio programadas.

## Fase 1: Enlaces Profundos (Deep Links) a Fragmentos
**Objetivo:** Identificar y navegar a partes específicas de un documento.

1. **Protocolo de Enlace:**
   - Definir un formato de URI para fragmentos: `estudiapp://material/{id}/tab/{tabId}?text={searchQuery}`.
2. **Navegación por Ancla:**
   - Actualizar `MaterialViewerScreen` para recibir un "query" inicial. Si existe, buscar ese texto en las pestañas y desplazarse automáticamente hasta él.

## Fase 2: Extensión del Planificador (Persistencia)
**Objetivo:** Permitir que las tareas guarden la referencia a la nota.

1. **Actualización de Base de Datos:**
   - Añadir campo `linkedMaterialId`, `linkedTabId` y `linkedTextAnchor` a `StudyTaskEntity` (Migración Room v38).
2. **Actualización de Modelos:**
   - Reflejar estos campos en `StudyTask` (Domain y Model).

## Fase 3: Interfaz de Selección en el Editor
**Objetivo:** UX fluida para crear tareas desde el apunte.

1. **Menú Contextual de Selección:**
   - Al seleccionar texto en `EstudiRichEditor`, mostrar una opción "📅 Repasar fragmento".
2. **Diálogo de Programación Rápida:**
   - Al tocar "Repasar", abrir un diálogo pequeño para elegir fecha (Mañana, 3 días, 1 semana) y prioridad.
3. **Creación Automática:**
   - Generar la tarea con el título del fragmento y el Deep Link guardado.

## Fase 4: Cierre del Círculo (UX)
**Objetivo:** Facilitar el repaso.

1. **Botón "Estudiar ahora" en la Tarea:**
   - En la lista de tareas del dashboard o planner, si una tarea tiene un enlace a nota, mostrar un icono de "📄 Ir al apunte".
2. **Validación Visual:**
   - Al abrir la nota desde una tarea, resaltar temporalmente el fragmento con un color de fondo (amarillo suave) para captar la atención del estudiante.
