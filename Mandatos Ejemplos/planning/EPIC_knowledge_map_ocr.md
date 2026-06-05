# Epic: Mapa de Conocimiento y Captura Inteligente (OCR)

Este documento detalla la implementación de la Vista de Grafo y la mejora del escaneo de notas.

## Fase 1: Extracción de Conexiones (Cerebro de Datos)
**Objetivo:** Mapear todas las relaciones `[[ ]]` entre materiales, tareas y conceptos.

1.  **Modelo de Grafo:**
    - Crear `KnowledgeNode` y `KnowledgeEdge` en `:feature:search`.
2.  **Lógica de Escaneo:**
    - Implementar en `SearchViewModel` un escaneo de fondo que recorra todos los materiales y pestañas de notas para extraer wikilinks.
3.  **Filtrado por Materia:**
    - Permitir ver el mapa completo o filtrado por una materia específica.

## Fase 2: Vista de Grafo Interactiva (UI)
**Objetivo:** Una interfaz fluida y visual para navegar el conocimiento.

1.  **Canvas de Grafo:**
    - Implementar un componente `KnowledgeGraph` usando `Canvas` de Compose.
    - Lógica simple de posicionamiento (fuerzas de repulsión básicas o círculos concéntricos).
2.  **Interacción:**
    - Zoom, arrastre y click en nodos para navegar al material original.
3.  **Modo Grafo en Búsqueda:**
    - Botón para alternar entre "Lista" y "Mapa" en la pantalla de búsqueda.

## Fase 3: Escaneo OCR a Nota
**Objetivo:** Convertir apuntes físicos en pestañas digitales.

1.  **Flujo de Escaneo:**
    - Integrar la cámara con ML Kit (ya disponible en el proyecto) para detectar bloques de texto.
2.  **Importación Directa:**
    - Botón "Escanear a Nueva Pestaña" dentro de `NoteEditorComponent`.
    - Opción de "Limpiar Formato" (IA ligera para estructurar el texto plano del OCR).

## Fase 4: Pulido Estético
**Objetivo:** Que el grafo se sienta "premium".

1.  **Colores por Materia:**
    - Los nodos heredan el color de la materia.
2.  **Animaciones:**
    - Transiciones suaves al filtrar o añadir nuevas notas.
