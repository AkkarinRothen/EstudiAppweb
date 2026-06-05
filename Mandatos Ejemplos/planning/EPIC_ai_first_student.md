# Epic: El Estudiante AI-First (Transcripción y Conexiones Sugeridas)

Este documento detalla la integración de audio y descubrimiento automático de conocimiento.

## Fase 1: Transcriptor de Clase (Voice-to-Note)
**Objetivo:** Capturar contenido hablado sin distracciones.

1. **Integración de Grabación:**
   - Añadir icono de micrófono en la barra de herramientas del editor.
   - Usar `SpeechRecognizer` de Android (o ML Kit Speech-to-Text) para transcripción local.
2. **Streaming a Pestaña:**
   - Inyectar el texto transcrito en tiempo real en la pestaña activa.
3. **Resumen Post-Clase:**
   - Al finalizar la grabación, ofrecer un "Resumen de IA" automático de lo capturado.

## Fase 2: Descubrimiento de Conexiones (AI-Graph)
**Objetivo:** Encontrar relaciones que el estudiante no ha visto.

1. **Escáner de Similitud Semántica:**
   - Usar el motor de IA local para comparar fragmentos de diferentes notas.
   - Identificar palabras clave compartidas entre materias.
2. **Visualización en el Mapa:**
   - Mostrar líneas punteadas o de color "IA" (púrpura sutil) para conexiones sugeridas.
   - Al tocar la conexión, explicar por qué la IA cree que están relacionadas.

## Fase 3: "Ask my Notes" (Búsqueda Conversacional)
**Objetivo:** Chat local con tus propios apuntes.

1. **Indexación Local:**
   - Crear un índice de palabras clave mejorado.
2. **Modo Chat:**
   - Poder preguntarle a la app: "¿Qué dijo el profesor sobre [Tema] hace 3 clases?" y que responda usando los tabs de notas.
