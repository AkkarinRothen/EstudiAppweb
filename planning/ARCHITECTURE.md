# Arquitectura de EstudiApp Web

Este documento describe la arquitectura técnica del portal web de EstudiApp, basado en módulos nativos de JavaScript (ES6) y un sistema de generación de presets "Thin Client".

## Principios Fundamentales

1. **Modularización Estricta (ES6):** Toda la lógica de negocio y de UI debe residir en `js/modules/`. Los archivos HTML y los puntos de entrada (`main.js`, `admin.js`) deben ser lo más ligeros posible.
2. **"Thin Client" para Presets:** Los archivos HTML en `presets/` no contienen lógica. Importan `preset-runner.js` que se encarga de renderizar la interactividad basándose en los metadatos y datos del pack.
3. **Fuente de Verdad:** 
   - **Configuración:** `data/packs.json` define los packs disponibles.
   - **Persistencia:** `localStorage` (gestionado por `storage.js`) guarda el progreso del usuario (SRS) y preferencias.
4. **Sin Dependencias Externas:** Se prioriza el uso de APIs nativas del navegador (Fetch, SpeechSynthesis, Crypto, ES Modules) para garantizar velocidad y portabilidad.

## Estructura de Capas

### 1. Capa de Módulos (`js/modules/`)
- `storage.js`: Centraliza el acceso a `localStorage` y define las claves globales.
- `srs.js`: Algoritmo de Repetición Espaciada (SRS).
- `speech.js`: Motor de Text-to-Speech (TTS).
- `fx.js`: Gestor centralizado de efectos visuales (Anime.js, Confetti) y sonidos (Howler.js). Incluye animaciones premium de subida de nivel.
- `gamification.js`: Motor de XP, niveles y lógica de logros.
- `difficulty-manager.js`: Centraliza la lógica de dificultad adaptativa (Lineal vs Progresiva).
- `supabase-sync.js`: Sincronización bidireccional en tiempo real con Supabase (Nube).
- `ui-gamification.js`: Componentes visuales de progreso (Barra XP, Nivel).
- `utils.js`: Utilidades compartidas (limpieza de texto, hashes, counter animations).
- `github.js`: Integración con la API de GitHub para publicación.
- `parser.js`: Procesamiento de datos CSV/TSV.
- `library.js`: Gestión de la biblioteca de mazos locales/personalizados.
- `template.js`: Generador de HTML para los presets.
- `preset-runner.js`: Inicializador unificado para el funcionamiento de cualquier pack.
- `study-engine.js`: Orquestador principal. Integra SRS, Gamificación y Modos de Juego.
- `ui-portal.js`: Renderizado y filtrado del portal principal.
- `ui-modal.js`: Dashboard interactivo de práctica.
- **`games/` (Subdirectorio):** Lógica aislada de minijuegos con gestión de ciclo de vida (`start`/`stop`) y limpieza de memoria.

### 2. Capa de Persistencia y Sincronización
- **Local:** `localStorage` como caché primaria y modo offline.
- **Nube:** `Supabase` para persistencia multi-dispositivo de SRS, estadísticas, logros y configuración de dificultad.
- **Integridad:** Sincronización automática tras cambios locales (debounce de 2.5s).

### 2. Puntos de Entrada
- `js/main.js`: Orquestador del portal (`index.html`).
- `js/admin.js`: Orquestador del panel de administración (`admin.html`).

### 3. Capa de Construcción (`scripts/`)
- `build_presets.js`: Script Node.js que regenera los archivos en `presets/` usando `data/packs.json`.
- `lib/presets_template.js`: Plantilla CommonJS utilizada por el script de construcción.

## Flujo de Datos

1. `index.html` carga `main.js` como módulo.
2. `main.js` usa `ui-portal.js` para leer `data/packs.json`.
3. El usuario elige un pack, que redirige a `presets/nombre.html`.
4. El preset carga `preset-runner.js`, que recupera los datos y activa el `ui-modal.js`.
5. El progreso se guarda mediante `srs.js` y `storage.js`.
