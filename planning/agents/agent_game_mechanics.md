# Añadiendo Nuevos Modos de Juego

EstudiApp Web utiliza una arquitectura modular (ES6) para aislar la lógica de cada modo de juego, evitando que el archivo principal `StudyEngine.js` se convierta en un monolito inmanejable.

Si eres un asistente IA encargado de implementar un nuevo modo de juego (ej. Sopa de Letras, Ahorcado), debes seguir **estrictamente** este flujo de trabajo.

## 🛠️ Toolbox de Validación
Antes de terminar, DEBES:
1. Ejecutar `node scripts/validate_games.js` para asegurar que la clase cumple el DoD.
2. Verificar que todos los `eventListeners` se limpien en el método `stop()`.
3. Comprobar que se use `this.engine.rateSrs(isCorrect)` para la persistencia del progreso.

## 🔄 Protocolo de Handoff
Al finalizar, entrega un informe siguiendo el formato de `planning/agents/README.md`. Indica si el juego requiere una intervención del **Agente de Estética** para pulir la UI o del **Agente de Audio** para efectos específicos.

## 1. Estilos y Contenedores (UI)
1. **CSS:** Añade los estilos del nuevo juego en `assets/css/ui-modal.css`. Crea una sección comentada clara (ej. `/* 🔤 AHORCADO */`).
2. **Plantillas HTML:** Añade un contenedor vacío para el juego (ej. `<div id="hangmanArea" class="hangman-container" style="display:none"></div>`) en **tres** lugares:
   - `index.html` (dentro de `#modalResultArea`, usualmente con el prefijo `modal`, ej. `modalHangmanArea`).
   - `scripts/lib/presets_template.js` (dentro de `#resultArea`).
   - `js/modules/template.js` (dentro de `#resultArea`).

## 2. Orquestación y Mapeo
1. **Mapeo de Elementos:** Añade la referencia al nuevo contenedor en el objeto `elements` de:
   - `js/modules/ui-modal.js`
   - `js/modules/preset-runner.js`
2. **Launchpad:** Añade la configuración del juego en el método `_renderLaunchpad()` dentro de `js/modules/study-engine.js`. Asegúrate de colocarlo en el grupo lógico adecuado (Repaso, Escritura, Lógica, Desafío).

## 3. Lógica del Juego (El Módulo)
1. Crea un nuevo archivo en `js/modules/games/` (ej. `hangman.js`).
2. Exporta una clase (ej. `export class HangmanGame`).
3. El constructor debe recibir la instancia del motor principal: `constructor(engine) { this.engine = engine; }`.
4. Implementa un método `start()` que se encargue de:
   - Limpiar y mostrar el área del juego.
   - Ocultar otras áreas de la UI (usando el estado de `this.engine.elements`).
   - Obtener la siguiente palabra usando `Srs.selectNextSrsEntry()`.
   - Inicializar el estado interno del juego y los *event listeners*.
5. Usa `this.engine.rateSrs(isCorrect)` cuando el usuario acierte o falle la palabra.
6. Usa `Fx.playSound()`, `Fx.celebrate()`, o `Speech.speak()` importándolos desde sus módulos para dar feedback.

## 4. Integración Final
1. En `js/modules/study-engine.js`, importa tu nueva clase.
2. Instánciala en el `constructor` (ej. `this.hangmanGame = new HangmanGame(this);`).
3. Modifica el método `setMode(mode)` de `StudyEngine` para:
   - Ocultar tu nueva área de juego durante el reseteo de estilos.
   - Detener tu juego si tiene un estado activo continuo (ej. `this.hangmanGame.stop()`).
   - Capturar el modo y ejecutar tu método `start()` (ej. `} else if (mode === 'hangman') { this.hangmanGame.start(); }`).

## 5. Validación Obligatoria
Tras cualquier cambio estructural, **debes ejecutar** el script de regeneración de presets en la terminal para aplicar los cambios a los 15 mazos oficiales:
`node scripts/build_presets.js`
