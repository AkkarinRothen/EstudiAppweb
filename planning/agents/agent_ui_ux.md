# Actualización de la Interfaz (UX/UI)

EstudiApp Web prioriza una interfaz limpia, reactiva y centrada en el contenido. Cualquier modificación a la UI debe alinearse con estos principios.

Si eres un asistente IA encargado de modificar la apariencia o el flujo de la aplicación, sigue estas guías:

## 1. Archivos Clave
- **Estilos Principales:** `assets/css/theme.css` (Variables, tipografía, portal general).
- **Estilos de Estudio:** `assets/css/ui-modal.css` (Todo lo relacionado con el área de práctica, Launchpad y juegos).
- **Plantillas HTML:**
  - `index.html`: Estructura principal del portal y el modal de práctica base.
  - `scripts/lib/presets_template.js`: Estructura de los mazos estáticos generados automáticamente.
  - `js/modules/template.js`: Estructura utilizada por el panel de administración al crear mazos personalizados.

## 2. El "Mission Launchpad"
El componente de selección de modos de juego está centralizado. Para modificar la disposición, iconos o descripciones de los modos:
- Edita el método `_renderLaunchpad()` en `js/modules/study-engine.js`.
- Los estilos visuales del Launchpad están en `assets/css/ui-modal.css` bajo el comentario `/* 🚀 MISSION LAUNCHPAD */`.
- El flujo de abrir/cerrar el Launchpad es manejado por `toggleLaunchpad()` y `setMode()` en `StudyEngine.js`.

## 3. Feedback Interactivo (FX)
El proyecto cuenta con un módulo dedicado para efectos audiovisuales: `js/modules/fx.js`.
- **NUNCA** implementes animaciones complejas usando CSS manual si `Anime.js` puede hacerlo mejor. Llama a `Fx.animate()` o métodos predefinidos como `Fx.animateEntrance()` o `Fx.shake()`.
- Para celebraciones, usa `Fx.celebrate('simple')` o `Fx.celebrate('burst')`.
- Para respuestas táctiles o auditivas, llama a `Fx.playSound(key)`.

## 4. Consistencia entre el Portal y los Presets
Al modificar la interfaz de la tarjeta de estudio o el área de resultados, asegúrate de aplicar los mismos cambios a:
1. Las clases CSS en `ui-modal.css`.
2. La estructura del modal en `index.html`.
3. La plantilla de presets en `scripts/lib/presets_template.js`.
4. El generador del panel de admin en `js/modules/template.js`.

## 5. Validación
Tras cualquier cambio en la estructura HTML de los presets, ejecuta el script de reconstrucción en la terminal:
`node scripts/build_presets.js`
