# AI_SUGGESTIONS.md - Evaluacion de Sugerencias de IA

Este documento define como evaluar sugerencias propuestas por agentes de IA antes de convertirlas en trabajo real.

## Regla de Oro

Ninguna sugerencia de IA se implementa solo porque suena bien. Debe mejorar una accion concreta del estudiante/docente o reducir deuda verificable del proyecto.

## Criterios de Evaluacion

- **Valor de producto:** ayuda a estudiar, ensenar, planificar, revisar, decidir o hacer seguimiento.
- **Encaje arquitectonico:** respeta `GEMINI.md`, `planning/ARCHITECTURE.md` y `planning/WORKFLOW.md`.
- **Costo real:** estima cuantas capas toca y si requiere migracion, navegacion, DI o refactor transversal.
- **Riesgo:** identifica posible perdida de datos, deuda UI, complejidad o regresiones.
- **Reutilizacion:** aprovecha modelos, use cases, componentes o patrones existentes.
- **Validabilidad:** se puede compilar, probar o revisar con un flujo claro.
- **Simplicidad:** existe una version minima que capture la mayor parte del valor.

## Escala Recomendada

Usar `Alto`, `Medio` o `Bajo` para valor, costo y riesgo.

- **Hacer ahora:** valor alto, costo/riesgo razonable, validacion clara.
- **Posponer:** valor real pero depende de otra base o tiene costo alto.
- **Investigar:** falta informacion o hay incertidumbre tecnica/producto.
- **Descartar:** bajo valor, alto ruido, rompe arquitectura o duplica algo existente.

## Score de Priorizacion

Puntuar cada criterio de 1 a 5:

- **Valor de producto:** impacto sobre estudio, docencia, planificacion o seguimiento.
- **Urgencia:** cuanto duele no resolverlo ahora.
- **Reduccion de friccion:** cuanto simplifica una accion frecuente.
- **Reutilizacion:** cuanto aprovecha piezas existentes.
- **Validabilidad:** que tan facil es confirmar que funciona.
- **Bajo riesgo:** 5 significa riesgo bajo; 1 significa riesgo alto.
- **Bajo costo:** 5 significa costo bajo; 1 significa costo alto.

Score sugerido:

`valor + urgencia + friccion + reutilizacion + validabilidad + bajo riesgo + bajo costo`

Interpretacion:

- **28-35:** hacer ahora o planificar para el proximo bloque.
- **21-27:** buena candidata, requiere alcance claro.
- **14-20:** investigar, reducir alcance o diferir.
- **Menos de 14:** descartar salvo que desbloquee algo critico.

Un score alto no aprueba automaticamente una idea. Solo ayuda a ordenarla. La decision final sigue dependiendo de arquitectura, foco de producto y riesgo de datos.

## Tipo de Mejora

Clasificar cada sugerencia con uno o mas tipos:

- **Product:** mejora capacidad funcional.
- **UX:** reduce friccion o mejora claridad visual/interactiva.
- **Architecture:** mejora capas, dependencias o ownership.
- **Performance:** mejora velocidad, memoria, recomposicion o IO.
- **Quality:** mejora tests, validacion, seguridad o robustez.
- **Docs:** mejora documentacion y transferencia de contexto.
- **Tooling:** mejora scripts, checks o automatizacion de desarrollo.

Las sugerencias de tipo **UX** deben evaluarse tambien con `planning/UX_SUGGESTIONS.md`.

## Tamanos de Implementacion

Toda sugerencia no trivial debe incluir tres tamanos:

- **S:** version minima, idealmente 1-2 archivos, valida el valor principal.
- **M:** version completa acotada, lista para uso real sin expandirse demasiado.
- **L:** version ambiciosa, solo si el valor justifica el costo.

Preferir S o M. La version L debe tratarse como roadmap, no como implementacion por defecto.

## Formato Obligatorio de Propuesta

```md
## Propuesta
Una frase clara.

## Problema que resuelve
Friccion real que elimina o deuda que reduce.

## Valor
Alto / Medio / Bajo.

## Costo
Bajo / Medio / Alto.

## Riesgo
Bajo / Medio / Alto.

## Score
Numero 7-35 y breve justificacion.

## Tipo
Product / UX / Architecture / Performance / Quality / Docs / Tooling.

## Capas afectadas
model / domain / data / ui / navigation / docs.

## Tamanos
S:
M:
L:

## Implementacion minima
La version mas chica que ya seria util.

## Validacion
Comando, test o flujo manual que confirma que funciona.

## Decision recomendada
Hacer ahora / Posponer / Investigar / Descartar.
```

## Filtro Rapido

Antes de aceptar una sugerencia, responder:

1. Que usuario se beneficia: estudiante, docente o mantenedor.
2. Que accion mejora.
3. Que modulo es dueno.
4. Que pieza existente puede reutilizarse.
5. Que riesgo introduce.
6. Como se valida.

Si no se puede responder en pocas lineas, la sugerencia debe ir a `Needs Research` en `AI_IDEAS_BACKLOG.md`.

Si la sugerencia cambia interfaz o interaccion, aplicar ademas el filtro de `planning/UX_SUGGESTIONS.md`.

## Anti-patrones

- Agregar dashboards sin accion asociada.
- Agregar automatizaciones sin control manual.
- Crear nuevas abstracciones para un solo caso.
- Meter reglas de negocio en composables.
- Proponer migraciones Room sin justificar datos persistidos.
- Duplicar componentes existentes de `:core:ui`.
- Mezclar feature nueva con refactor grande sin necesidad.
- Implementar una idea amplia sin una version minima primero.
