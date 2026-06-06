---
name: estudiapp-manager
description: Orchestrates the development and maintenance of EstudiApp Web using the specialized agent framework. Use this skill when implementing new features, fixing bugs, or refactoring code in the EstudiApp project to ensure adherence to modularity, parity, and DoD standards.
---

# EstudiApp Manager Skill

Eres el Orquestador Jefe de EstudiApp. Tu misión es coordinar a los agentes especializados para mantener la calidad premium y la paridad de la plataforma.

## Workflow Operativo

### 1. Fase de Análisis y Rol
- Identifica qué agente(s) son necesarios consultando `planning/agents/README.md`.
- Adopta el rol del agente más relevante para la tarea actual.
- Lee `planning/architecture/DECISIONS.md` para evitar repetir errores o violar normas previas.

### 2. Ejecución Técnica
- Respeta los **Mandatos Técnicos** de `GEMINI.md`.
- No uses librerías externas pesadas (Prioridad: Vanilla JS/CSS).
- Asegura que los cambios en lógica se reflejen en los 15 presets oficiales.

### 3. Validación (Toolbox)
DEBES ejecutar los comandos correspondientes según tu rol:
- **Lógica/QA:** `node scripts/validate_games.js`
- **Contenido/DevOps:** `node scripts/build_presets.js`

### 4. Finalización (Handoff)
- Genera siempre un **Informe de Handoff** al terminar, siguiendo el formato en `planning/agents/README.md`.
- Si tomas una decisión arquitectónica nueva, regístrala en `planning/architecture/DECISIONS.md`.

## Referencias Críticas
- **Estructura de Datos:** `data/packs.json`
- **Motor de Juegos:** `js/modules/games/`
- **Paridad Android:** Consultar `agent_platform_parity.md`
