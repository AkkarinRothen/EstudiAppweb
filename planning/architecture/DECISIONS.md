# Architectural Decision Log (ADL)

Este documento registra las decisiones técnicas críticas tomadas por los agentes de IA y los desarrolladores para asegurar la coherencia a largo plazo de EstudiApp.

## Formato de Registro
- **Fecha:** YYYY-MM-DD
- **Agente/Autor:** Quien tomó la decisión.
- **Decisión:** Descripción clara del cambio o norma.
- **Racional:** Por qué se tomó esta decisión.
- **Consecuencias:** Qué implica para otros agentes o módulos.

---

## Registro de Decisiones

### 2026-06-06 | Agente de Arquitectura (CLI)
- **Decisión:** Implementación de un Framework de Agentes Operativos.
- **Racional:** Los agentes necesitan herramientas de validación (Toolbox) y protocolos de comunicación (Handoff) para no perder contexto y asegurar el DoD.
- **Consecuencias:** Todos los archivos `agent_*.md` deben actualizarse para incluir su Toolbox específica.

### 2026-06-06 | Agente de Arquitectura (CLI)
- **Decisión:** Prohibición de librerías de UI externas pesadas.
- **Racional:** Mantener el rendimiento "Thin Client" y la independencia offline.
- **Consecuencias:** El Agente Explorador debe priorizar micro-librerías o implementaciones Vanilla JS.

- **Consecuencias:** Se creó el script `scripts/audit_codebase.js` como herramienta de supervisión estructural. Este agente ahora prioriza la eliminación de deuda técnica sobre los cambios puramente estéticos.

### 2026-06-06 | Agente de Arquitectura e Innovación (CTO)
- **Decisión:** Implementación de Reactividad Nativa mediante JS Proxies.
- **Racional:** Para eliminar la orquestación manual entre la lógica de negocio y la vista (evitando el "Manual Refresh Anti-pattern"), se ha creado un `AppStore` centralizado.
- **Consecuencias:** Los módulos ya no necesitan llamar a funciones de refresco de UI. Al modificar el estado en el store, los componentes suscritos se actualizan solos. Esto reduce la probabilidad de bugs de inconsistencia visual y mejora la mantenibilidad.

