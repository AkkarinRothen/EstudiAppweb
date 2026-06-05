# GEMINI.md - Guía Operativa de EstudiApp Web

Este documento es la fuente de verdad operativa del proyecto web. Debe leerse al inicio de cada tarea para mantener la coherencia de la arquitectura modular y la calidad del producto.

Para el roadmap y el alcance funcional, consultar `planning/README.md`. Para la arquitectura técnica, consultar `planning/ARCHITECTURE.md`. Para procedimientos operativos, consultar `planning/WORKFLOW.md`.

## Estado Actual

- **Fase:** Modularización completada. El proyecto utiliza módulos ES6 nativos y un sistema de generación de presets automatizado.
- **Arquitectura:** Web estática modular con "Thin Clients" para los presets interactivos.
- **Fuente de Verdad:** `data/packs.json` para el catálogo y `localStorage` para el progreso del usuario.
- **Objetivo:** Proveer una herramienta de estudio ligera, accesible y sincronizada con la lógica de la aplicación principal.

## Mandamientos Técnicos

1. **Modularidad ES6 Obligatoria:** No escribir lógica compleja en archivos HTML. Toda la funcionalidad debe residir en `js/modules/` y exportarse/importarse de forma explícita.
2. **Presets "Thin Client":** Los archivos en `presets/` deben ser generados automáticamente y actuar como contenedores mínimos que invocan a `preset-runner.js`. No editar manualmente los presets si el cambio puede aplicarse globalmente.
3. **Paridad de Funciones:** Cualquier cambio en el algoritmo SRS (`srs.js`) o en el sistema de TTS (`speech.js`) debe ser compatible con la visión del proyecto EstudiApp (Android).
4. **Persistencia Centralizada:** Usar exclusivamente `storage.js` para interactuar con `localStorage`. Mantener una estructura de claves limpia y consistente.
5. **Validación de Build:** Al añadir o modificar packs de vocabulario en `data/packs.json`, ejecutar siempre `node scripts/build_presets.js` para actualizar los archivos físicos.
6. **Sin Frameworks Pesados:** Mantener el proyecto ligero. No introducir React, Vue o similares a menos que sea estrictamente necesario y aprobado.
7. **UI Reactiva y Limpia:** Los componentes de la interfaz (modales, portal) deben ser reactivos al estado y evitar la manipulación directa del DOM fuera de sus módulos correspondientes (`ui-portal.js`, `ui-modal.js`).
8. **Servidor Local Obligatorio:** Debido al uso intensivo de módulos ES6 nativos, la aplicación **no funciona** abriéndola directamente como archivo (`file://`). Es imperativo iniciar un servidor local (ej: Live Server, `python -m http.server`, `npx serve`) para visualizar e interactuar con los cambios.

## Flujo de Trabajo Obligatorio

1. **Leer este archivo** y revisar `planning/README.md` antes de empezar cualquier tarea.
2. **Identificar el módulo** responsable del cambio (ver `planning/ARCHITECTURE.md`).
3. **Realizar cambios quirúrgicos** en los módulos de `js/modules/`.
4. **Si el cambio afecta a los packs oficiales:**
   - Actualizar `data/packs.json`.
   - Ejecutar `node scripts/build_presets.js`.
5. **Validación:**
   - Probar en un servidor local (ej. Live Server).
   - Verificar la carga de módulos en la consola del navegador.
   - Confirmar que el SRS guarda el progreso correctamente.
6. **Documentación:** Actualizar `planning/` si se introduce un nuevo patrón arquitectónico o un cambio en el flujo de trabajo.

## Definition of Done

Un cambio se considera terminado cuando:
- El código es modular y sigue las convenciones ES6.
- No hay errores de carga de módulos en la consola.
- Los presets generados funcionan correctamente con la nueva lógica.
- La persistencia en `localStorage` es consistente.
- Se mantiene la compatibilidad visual y funcional con el resto del ecosistema EstudiApp.
