# Epic: Editor Avanzado y Cerebro Digital (Zettelkasten)

Este documento detalla el plan de implementación para evolucionar el editor de notas de EstudiApp, basado en las sugerencias de la IA y aprobadas por el usuario.

## Fase 1: Formato y Productividad (Editor Base)
**Objetivo:** Mejorar la velocidad de captura de información estructurada sin distracciones.

1. **Plantillas Académicas Inteligentes**
   - Actualizar `EstudiRichEditor` y `SlashCommand`.
   - Añadir comandos:
     - `/cornell` -> Inserta una estructura de Título, Palabras Clave, Notas y Resumen.
     - `/esquema` -> Inserta una plantilla jerárquica para clases.
     - `/bitacora` -> Inserta un registro de sesión de estudio.
2. **Modo Enfoque (Focus Mode)**
   - Añadir botón de "pantalla completa" en `NoteEditorComponent` que oculte la barra de navegación y las pestañas.
3. **Exportación y Formato**
   - Implementar soporte básico para parsear tablas Markdown en `MarkdownVisualTransformation`.
   - Añadir función para exportar/compartir el contenido del Tab actual como texto plano (MD).

## Fase 2: Organización Avanzada (Zettelkasten y Pestañas)
**Objetivo:** Mejorar la navegación y estructuración de documentos grandes.

1. **Personalización de Pestañas**
   - Actualizar `StudyNoteTab` (Model, Entity, Mapper).
   - Añadir campos `colorCode` y `iconType`.
   - Crear migración Room.
   - Actualizar UI en `ScrollableTabRow` para mostrar colores e iconos.
2. **Búsqueda Global entre Pestañas**
   - Integrar un campo de búsqueda en la cabecera que filtre texto en todos los tabs del `MaterialViewerViewModel`.
3. **Panel de Backlinks**
   - Consultar en Room otros materiales o tareas que referencien `[[TituloDelMaterialActual]]`.
   - Mostrar en un panel lateral o *bottom sheet* las menciones.

## Fase 3: Multimedia y Ecuaciones
**Objetivo:** Permitir contenido científico y visual rico.

1. **Soporte LaTeX/Ecuaciones**
   - Integrar librería externa (ej. KaTeX via WebView) o formateo visual si la nota tiene bloques de matemáticas.
2. **Imágenes en línea**
   - Explorar soporte de URI locales en el editor.

## Fase 4: Copilot Educativo Avanzado
**Objetivo:** IA contextual.

1. **Autocompletado basado en base de datos**
   - Mejorar el OnDeviceAiEngine para sugerir completados leyendo otras notas de la misma materia.
2. **Cuestionarios multi-tab**
   - Leer todo el contenido de los tabs unidos para generar simulacros de examen más completos.
