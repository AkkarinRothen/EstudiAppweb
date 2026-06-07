# FLOWS.md - Mapa de Comportamiento y Flujos de EstudiApp

Este documento describe cómo fluyen los datos y los eventos a través de los módulos de la aplicación. Es la referencia principal para diagnosticar bugs de interacción y optimizar la UX.

## 1. Ciclo de Vida Global (Bootstrap)

1.  **Carga de DOM:** `main.js` escucha `DOMContentLoaded`.
2.  **Hidratación de Estado:** `state.js` inicializa el `AppStore` leyendo de `storage.js`.
3.  **Registro de Servicios:** Se registra el Service Worker (`sw.js`) y se inicializa el sistema de voz (`speech.js`).
4.  **Renderizado Inicial:** `DecksPage` renderiza la rejilla de mazos (oficiales + personalizados).
5.  **Suscripción Reactiva:** La UI se suscribe al `AppStore` para actualizar estadísticas (`updateStatsUI`) en tiempo real.

## 2. Flujo del Motor de Estudio (Study Engine)

Cuando un usuario abre un mazo para estudiar:

1.  **Activación:** `UiModal.openPracticeModal(deckData)` es llamado.
2.  **Preparación:** `StudyEngine` recibe el mazo, mezcla las palabras y determina el modo de juego inicial.
3.  **Renderizado de Escena:** Se ocultan los elementos del portal y se muestra el `resultArea` con la animación `Fx.animateCardIn`.
4.  **Ciclo de Interacción:**
    *   **Entrada:** Usuario interactúa (clic, swipe, teclado o input).
    *   **Validación:** El juego actual (`wordle.js`, `quiz.js`, etc.) valida la respuesta.
    *   **Feedback:** `Fx` dispara efectos visuales/hápticos. `speech.js` reproduce el audio si está activo.
    *   **Progreso:** Si es un acierto, `StudyEngine` actualiza el SRS vía `srs.js`.
5.  **Persistencia:** `srs.js` actualiza el estado -> `AppStore` detecta el cambio -> `storage.js` guarda en disco.

## 3. Matriz de Interacciones y Feedback

| Acción | Módulo Responsable | Feedback Visual | Feedback Táctil |
| :--- | :--- | :--- | :--- |
| **Clic Botón** | `theme.css` | Efecto 3D (Push) | - |
| **Acierto** | `fx.js` | Confeti / Flash Verde | 50ms Vibración |
| **Error** | `fx.js` | Shake / Flash Rojo | [100, 50, 100] Vibración |
| **Swipe Card** | `study-engine.js` | Desplazamiento + Rotación | - |
| **Subida Nivel** | `ui-gamification.js` | Splash Screen + Glow | Vibración Larga |

## 4. Estrategia de Debugging para Agentes

Ante un bug en el frontend, sigue este orden de investigación:

1.  **Verificar el Estado:** ¿El cambio se refleja en `AppStore.state`? (Usa la consola para inspeccionar `window.AppStore`).
2.  **Identificar el Módulo:**
    *   ¿Es visual? -> Revisa `assets/css/` o `fx.js`.
    *   ¿Es de lógica de juego? -> Revisa `js/modules/games/`.
    *   ¿Es de persistencia? -> Revisa `storage.js` o `srs.js`.
3.  **Analizar la Cadena de Eventos:** Usa `console.trace()` en el punto del error para ver qué módulo disparó la acción original.
4.  **Validar DOM:** ¿El elemento existe en el momento del acceso? (Muchos errores ocurren por intentar acceder a botones del modal antes de que `UiModal.init()` termine).

## 5. Convenciones de UX (Desktop vs Mobile)

*   **Mobile:** Priorizar gestos (swipe), Bottom Sheets y feedback háptico.
*   **Desktop:** Priorizar atajos de teclado (`Space`, `1`, `2`), estados `:hover` y layouts multicolumna.
*   **Accesibilidad:** Todo botón interactivo debe tener un estado `:active` claro y ser navegable vía teclado.

## 6. Flujo de Sincronización en la Nube (SupabaseSync)

El sistema de sincronización asegura la paridad entre el progreso local (navegador) y la nube, permitiendo al usuario continuar su estudio en otros dispositivos.

1.  **Gatillo de Sincronización (Trigger):**
    *   **Automático:** Ocurre 5 segundos después de que `storage.js` guarda un cambio local (ej. después de estudiar una palabra). Esto se gestiona mediante un "debounce" en `SupabaseSync.queueAutoSync()` para evitar saturar la red.
    *   **Manual:** El usuario hace clic en el botón de estado de sincronización (la nubecita en la UI).
2.  **Autenticación:**
    *   `SupabaseSync` verifica si hay una sesión activa (`supabase.auth.getSession()`). Si no hay sesión, aborta la sincronización.
3.  **Proceso de Subida (Upload):**
    *   Extrae el estado completo (Progresión, Estadísticas y Preferencias) desde `storage.js`.
    *   Hace un `upsert` a la tabla `user_progress` en Supabase, vinculando los datos al ID del usuario autenticado.
4.  **Proceso de Descarga (Download / Merge):**
    *   Al iniciar sesión en un nuevo dispositivo, se descarga el estado desde Supabase.
    *   Se sobreescribe el estado local (`localStorage`) con el estado de la nube.
    *   Se notifica al `AppStore` para que la UI (logros, racha, progreso) se refresque instantáneamente.
5.  **Feedback en UI:**
    *   El botón de sincronización cambia de estado:
        *   Gris: Desconectado.
        *   Animación giratoria: Sincronizando.
        *   Verde: Conectado y actualizado.
