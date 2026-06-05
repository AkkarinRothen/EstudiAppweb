# UX_SUGGESTIONS.md - Evaluacion de Mejoras de Interfaz e Interaccion

Este documento complementa `AI_SUGGESTIONS.md` para evaluar propuestas de UX/UI antes de implementarlas.

## Regla de Oro

No se aceptan mejoras UI basadas solo en estetica. Deben reducir friccion, mejorar comprension, acelerar una tarea, prevenir errores o hacer mas clara una decision.

## Momentos de Uso

Clasificar la propuesta segun el momento principal:

- **Captura rapida:** cargar tarea, material, asistencia, nota o clase con pocos pasos.
- **Planificacion profunda:** organizar clases, secuencias, evaluaciones o semanas.
- **Revision:** repasar tarjetas, materiales, pendientes o recomendaciones.
- **Clase en vivo:** tomar asistencia, registrar trabajo, consultar legajos o ajustar plan.
- **Analisis posterior:** revisar reportes, metricas, riesgo academico o progreso.
- **Mantenimiento:** configurar, importar, exportar, limpiar o corregir datos.

## Criterios UX

- **Tarea del usuario:** que intenta completar y con que urgencia.
- **Friccion actual:** demasiados toques, lectura pesada, decision confusa, formulario largo o feedback debil.
- **Mejora esperada:** menos pasos, mejor jerarquia, accion primaria mas clara o menor carga cognitiva.
- **Costo de interaccion:** cuantos toques, pantallas, decisiones o campos reduce.
- **Estados cubiertos:** vacio, loading, error, datos parciales, muchos datos, edicion y confirmacion.
- **Accesibilidad:** contraste, tamano tactil, texto claro, foco predecible y lectura rapida.
- **Consistencia:** reusa patrones y componentes de `:core:ui`.
- **Contexto real:** funciona en uso apurado, en clase o con muchos datos.
- **Validabilidad:** se puede confirmar con un flujo manual, comparacion de pasos o checklist visual.

## Formato Obligatorio para Propuestas UI

```md
## Propuesta UI
Una frase clara.

## Usuario y momento
Estudiante/docente/mantenedor + momento de uso.

## Accion que mejora
Tarea concreta que se vuelve mas facil.

## Friccion actual
Que duele hoy.

## Cambio minimo
Version S sin redisenar todo.

## Estados afectados
Vacio / loading / error / muchos datos / edicion / confirmacion.

## Componentes existentes
Que se puede reutilizar de `:core:ui` o de `components/`.

## Costo de interaccion
Antes vs despues: toques, pantallas, campos o decisiones.

## Riesgo UX
Que podria empeorar o confundir.

## Validacion
Flujo manual, checklist o metrica que confirma la mejora.

## Decision
Hacer ahora / Prototipar / Posponer / Descartar.
```

## Checklist Visual

Antes de aceptar una mejora UI:

- La accion primaria es obvia.
- El usuario entiende que paso despues de tocar.
- Hay salida, cancelacion o deshacer cuando corresponde.
- El texto ayuda a decidir, no solo describe.
- El layout aguanta muchos datos.
- La UI funciona en uso rapido o en clase.
- No agrega una tarjeta, sheet o dialog innecesario.
- No duplica un componente existente.
- No mueve reglas de negocio al composable.

## Anti-patrones UX

- Redisenar una pantalla completa para corregir una friccion pequena.
- Agregar metricas que no sugieren accion.
- Ocultar acciones frecuentes detras de demasiados menus.
- Convertir formularios rapidos en flujos largos.
- Agregar colores o badges sin significado operativo.
- Mejorar una vista rompiendo consistencia con el resto de la app.
- Optimizar para datos de ejemplo y olvidar listas largas o estados vacios.

## Validaciones Recomendadas

- Comparar pasos antes/despues para la accion principal.
- Revisar estados vacios y con muchos datos.
- Confirmar que la accion primaria queda visible.
- Confirmar que cancelacion/deshacer existe cuando el cambio es destructivo o facil de tocar por error.
- Ejecutar `./scripts/sanity-check.ps1` y validacion Gradle segun `WORKFLOW.md` si hay cambios de codigo.

