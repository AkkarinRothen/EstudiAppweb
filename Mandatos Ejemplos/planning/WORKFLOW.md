# WORKFLOW.md - Flujo de Trabajo de EstudiApp

Este documento convierte las reglas de `GEMINI.md` en rutinas concretas para trabajar sobre el proyecto.

## Pre-flight Checklist

Antes de editar codigo:

- Leer `GEMINI.md`.
- Identificar el tipo de cambio: docs, UI, bugfix, feature, Room, navegacion, refactor o arquitectura.
- Si el cambio nace de una sugerencia de IA, evaluarla con `planning/AI_SUGGESTIONS.md`.
- Revisar `planning/ARCHITECTURE.md` si hay dudas de capas, ownership o ubicacion de archivos.
- Identificar el modulo dueno del cambio.
- Buscar patrones existentes con `rg` antes de crear modelos, componentes, rutas o use cases nuevos.
- Confirmar que la direccion de dependencias se mantiene.
- Elegir el nivel de validacion final.
- Decidir si el cambio amerita entrada en `DEVLOG.md`.

## Niveles de Validacion

- **Nivel 0 - Documentacion:** no requiere Gradle. Usar para cambios en `.md` sin codigo.
- **Nivel 1 - Sanity + compilacion Kotlin:** `./scripts/sanity-check.ps1` y `./gradlew.bat :app:compileDebugKotlin --console=plain --no-daemon`.
- **Nivel 2 - Sanity + build de app:** `./scripts/sanity-check.ps1` y `./gradlew.bat :app:assembleDebug --console=plain --no-daemon`.
- **Nivel 3 - Tests + build:** ejecutar tests del modulo afectado y luego `:app:assembleDebug`.
- **Nivel 4 - Flujo critico:** Nivel 3 mas revision manual del flujo afectado en app/emulador cuando corresponda.

Usar el nivel mas bajo que cubra el riesgo real del cambio. Subir de nivel si toca Room, navegacion, DI, contratos compartidos o pantallas criticas.

## Sanity Check Automatico

Ejecutar `./scripts/sanity-check.ps1` antes de cerrar cambios de codigo. Usar `./scripts/sanity-check.ps1 -Strict` cuando se quiera tratar advertencias como fallos.

El script revisa:

- imports directos de `:core:data` desde `:feature:*`;
- pantallas `*Screen.kt` demasiado grandes;
- marcadores `TODO`/`FIXME`;
- version de Room contra migraciones declaradas;
- literales de rutas fuera de la navegacion de `:app`.

## Rutina para Feature Nueva

1. Definir la pregunta de producto que responde: que estudiar, cuando, como, con que material o que seguimiento docente requiere.
2. Revisar `planning/02_feature_map.md` para confirmar encaje.
3. Modelar primero en `:core:model` si aparece un concepto nuevo.
4. Agregar contratos/use cases en `:core:domain` si hay regla de negocio.
5. Implementar persistencia en `:core:data` solo si el dato debe sobrevivir reinicios.
6. Construir UI en la feature duena, reutilizando `:core:ui`.
7. Agregar navegacion desde `:app` solo cuando la feature tenga un destino real.
8. Validar con Nivel 2 o superior.
9. Registrar hito en `DEVLOG.md`.

## Rutina para Cambios Room

1. Actualizar modelo de dominio.
2. Actualizar entidad Room.
3. Actualizar DAO si cambia consulta, insercion o relacion.
4. Actualizar mapper.
5. Actualizar repository.
6. Subir version de base de datos.
7. Agregar migracion explicita con defaults seguros.
8. Revisar codecs si hay estructuras complejas.
9. Validar con Nivel 2 como minimo.
10. Registrar hito en `DEVLOG.md`.

## Rutina para UI Compose

1. Buscar componentes existentes en `:core:ui` y en `components/` de la feature.
2. Si el cambio nace de una sugerencia UX, evaluarla con `planning/UX_SUGGESTIONS.md`.
3. Mantener la pantalla como orquestadora; mover secciones densas a componentes.
4. Evitar que composables decidan reglas de negocio o persistencia.
5. Usar estado inmutable y eventos claros desde ViewModel.
6. Cuidar estados vacios, loading, error y accion primaria.
7. Mantener jerarquia visual calmada: densidad util, poco ruido, acciones obvias.
8. Validar con Nivel 1 para cambios pequenos y Nivel 2 para refactors grandes.

## Rutina para Navegacion

1. Centralizar rutas y argumentos.
2. Evitar strings magicos dispersos.
3. Verificar entradas desde pantallas que ya enlazan conceptos relacionados: dashboard, planner, search, reports y detalle.
4. Mantener `:app` como orquestador, no como dueno de reglas.
5. Validar con Nivel 2 como minimo.

## Rutina para Refactor

1. Definir el objetivo del refactor en una frase: legibilidad, modularidad, dependencia, duplicacion o testabilidad.
2. Evitar cambios funcionales mezclados salvo que sean necesarios.
3. Mover codigo en pasos pequenos y compilar cuando el riesgo suba.
4. Preservar nombres publicos si no hay razon clara para cambiarlos.
5. Si se extrae UI, respetar el `Extraction Mandate`.
6. Validar con Nivel 1 para refactor local y Nivel 2 para refactor transversal.
7. Registrar en `DEVLOG.md` si reduce deuda importante o cambia estructura modular.

## Rutina para Bugfix

1. Reproducir o explicar la causa probable antes de editar.
2. Encontrar el dueno real del bug: UI, ViewModel, UseCase, Repository, DAO o mapper.
3. Corregir en la capa mas baja que resuelva la causa.
4. Agregar o ajustar test cuando el bug este en dominio o transformacion de datos.
5. Validar el flujo afectado con el nivel correspondiente.
6. En la respuesta final, explicar causa, cambio y validacion.

## Rutina para Limpieza Modular

1. Revisar dependencias entre modulos.
2. Mover componentes compartidos a `:core:ui` solo si ya tienen uso real o reutilizacion clara.
3. Mover reglas de negocio a `:core:domain`.
4. Mantener modelos puros en `:core:model`.
5. Eliminar dependencias feature-to-feature salvo que exista una razon arquitectonica explicita.
6. Validar con Nivel 2.
7. Registrar hito en `DEVLOG.md`.

## Post-flight Checklist

Antes de cerrar una tarea:

- El cambio compila con el nivel elegido o se informa claramente por que no se pudo validar.
- `./scripts/sanity-check.ps1` pasa para cambios de codigo, salvo que se informe una excepcion concreta.
- No hay imports indebidos hacia `:core:data` desde features.
- No quedo una pantalla monolitica nueva.
- No se duplicaron componentes que ya existian.
- Los cambios de Room tienen migracion.
- Los estados/rutas/tipos nuevos son tipados.
- `DEVLOG.md` fue actualizado si el cambio fue un hito.
- La respuesta final menciona archivos tocados y validacion realizada.
