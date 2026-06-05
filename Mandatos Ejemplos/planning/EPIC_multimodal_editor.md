# Epic: Editor Multimodal (Pestañas de Dibujo y Vista Dividida)

Este documento detalla la evolución del editor hacia un sistema híbrido texto/visual con herramientas de comparación.

## Fase 1: Estructura Multimodal y Split View
**Objetivo:** Permitir ver dos pestañas a la vez y preparar el terreno para diferentes tipos de contenido.

1. **Evolución del Modelo:**
   - Añadir `tabType` (Enum: `TEXT`, `DRAWING`) a `StudyNoteTab` (Migración Room v39).
2. **Interfaz de Vista Dividida (Split View):**
   - Añadir botón "Dividir Pantalla" en la barra de herramientas.
   - Implementar un estado `secondaryTabIndex` en `NoteEditorComponent`.
   - Modificar el layout para mostrar dos paneles verticales (o horizontales) si Split View está activo.

## Fase 2: Pizarrón de Dibujo (Infinite Canvas)
**Objetivo:** Integrar toma de notas manual y diagramas.

1. **Componente EstudiCanvas:**
   - Crear un lienzo interactivo usando `Canvas` de Compose.
   - Herramientas básicas: Lápiz, Borrador, Color.
2. **Serialización de Trazos:**
   - Convertir los trazos del dibujo a una cadena JSON para guardarlos en el campo `content` de la pestaña.
3. **Pestañas de Dibujo:**
   - Al crear una nueva pestaña, permitir elegir entre "Texto" o "Dibujo".

## Fase 3: Interacción entre Paneles
**Objetivo:** Flujo de trabajo fluido.

1. **Sincronización:**
   - Permitir tener una pestaña de Dibujo en un lado y una de Texto en el otro.
2. **Captura de Pantalla:**
   - Botón para "Insertar Dibujo en Texto" que tome una captura del lienzo y genere el código Markdown de imagen `![dibujo](uri)` en la pestaña de texto.

## Fase 4: Pulido de UX
**Objetivo:** Que se sienta como una herramienta nativa de diseño.

1. **Presión y Suavizado:**
   - Aplicar algoritmos de suavizado de líneas para los dibujos.
2. **Zoom en Dibujo:**
   - Soporte para gestos de zoom y desplazamiento en el lienzo.
