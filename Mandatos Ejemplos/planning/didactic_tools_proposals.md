# Propuestas de Mejora: Herramientas Didácticas

Este documento detalla tres propuestas estratégicas para continuar expandiendo y perfeccionando el módulo de **Herramientas Didácticas** (`:feature:didactic_tools`), alineándolas con la visión de "Study First", "Premium Calm UI" y las directrices técnicas del proyecto.

---

## 1. Puente de Aprendizaje Activo: Integración Mazo -> Cola de Repaso (SRS)

### Propuesta
Permitir que las cartas de un mazo didáctico visual (`Card` / `Deck`) se agreguen a la cola de repetición espaciada (`Flashcard` en `:feature:review`), posibilitando que el estudio visual e inteligente se convierta en parte de la rutina diaria de repaso con el algoritmo SM-2.

### Problema que resuelve
Actualmente, las herramientas de creación de mazos (recorte visual de PDF, importación OCR) y la cola de repaso (`:feature:review`) están completamente desconectadas. El estudiante tiene que crear tarjetas de texto manuales en la cola de repaso, perdiendo el beneficio de las tarjetas visuales o de vocabulario que ya generó en la sección didáctica.

### Valor
**Alto**. Une dos pilares del aprendizaje: la captura/organización visual y la retención a largo plazo.

### Costo
**Medio**. Requiere un caso de uso de mapeo/inserción en dominio, añadir la navegación correspondiente, y relacionar los modelos de cartas con flashcards.

### Riesgo
**Bajo**. Es un flujo puramente aditivo; no afecta la persistencia de datos actuales del planner o del docente.

### Score: 31/35
*   **Valor de producto:** 5/5 (Impacto directo en estudio y retención).
*   **Urgencia:** 4/5 (Cierra la brecha entre herramientas visuales y de estudio).
*   **Reducción de fricción:** 5/5 (Evita duplicar la creación de tarjetas).
*   **Reutilización:** 4/5 (Reutiliza el flujo de tarjetas y el motor de repaso SM-2).
*   **Validabilidad:** 4/5 (Se puede validar con un flujo manual de agregar y verificar en la cola).
*   **Bajo riesgo:** 5/5 (Muy bajo riesgo de colisión de datos).
*   **Bajo costo:** 4/5 (La lógica de persistencia es directa).

### Tipo
Product / UX / Architecture.

### Capas afectadas
*   `model`: Vincular referencias de mazos a flashcards o habilitar un tipo de flashcard visual.
*   `domain`: Nuevo use case `AddDeckToReviewQueueUseCase`.
*   `data`: Actualización de la base de datos para admitir referencias cruzadas opcionales.
*   `ui` / `navigation`: Añadir botón de "Activar Repaso Espaciado" en la pantalla de gestión del mazo.

### Tamaños
*   **S:** Añadir un botón "Programar para repaso" en la pantalla de detalle del mazo que inserte todas las cartas textuales del mazo como `Flashcards` clásicas en la base de datos de repetición espaciada.
*   **M:** Permitir el repaso de cartas puramente visuales dentro del motor de `:feature:review`, cargando la imagen frontal/dorso del mazo didáctico en el diálogo de repaso.
*   **L:** Sincronización bidireccional donde modificar una carta del mazo actualiza automáticamente la flashcard correspondiente en la cola de repaso, manteniendo el historial del algoritmo SM-2.

### Implementación mínima (S)
Añadir la opción en `CardListScreen.kt` para enviar cartas seleccionadas al repositorio de flashcards con intervalo inicial de 1 día (Caja 1), convirtiendo `faces[0].name` en el frente y `faces.getOrNull(1)?.name` o sus notas en el reverso.

### Validación
1. Crear un mazo de vocabulario.
2. Tocar "Enviar a cola de repaso".
3. Navegar a la cola de repaso y verificar que las nuevas tarjetas aparezcan en las tareas pendientes de hoy con el algoritmo de repetición inicializado.

### Decisión recomendada
**Hacer ahora** (Planificar para el próximo bloque).

---

## 2. Tiradas en Cascada: Ejecución Interactiva de Tablas Anidadas

### Propuesta
Habilitar una UI interactiva para que las tablas didácticas ejecuten y muestren tiradas consecutivas de forma automatizada cuando una entrada referencia a otra tabla (uso de `subTableId` o `subTableRef`).

### Problema que resuelve
El modelo `DidacticTableEntry` contempla los campos `subTableRef` y `subTableId` para estructurar temas complejos (ej. tirar para elegir tipo de ejercicio, y luego tirar en una subtabla de verbos, y finalmente tirar en una subtabla de tiempos verbales). Sin embargo, la UI actual solo hace una tirada simple y no gestiona ni anima la resolución en cadena del flujo completo.

### Valor
**Medio-Alto**. Muy útil para autoevaluaciones activas, aprendizaje de idiomas (speaking drills aleatorios) e itinerarios didácticos no lineales.

### Costo
**Bajo-Medio**. La estructura de datos ya soporta referencias a subtablas. Requiere lógica interactiva en el ViewModel de detalle de tabla y animación de dados en cascada.

### Riesgo
**Bajo**. Cambios acotados al flujo de tiradas del módulo `:feature:didactic_tools`.

### Score: 29/35
*   **Valor de producto:** 4/5 (Crea dinámicas de estudio interactivas y retadoras).
*   **Urgencia:** 3/5 (Es una capacidad avanzada del modelo actual que hoy está inactiva).
*   **Reducción de fricción:** 4/5 (Evita que el usuario tenga que salir de la pantalla, buscar la otra tabla y tirar manualmente).
*   **Reutilización:** 5/5 (Usa el modelo y la base de datos Room actuales sin cambios de entidad).
*   **Validabilidad:** 4/5 (Verificable con un flujo de prueba de dos niveles).
*   **Bajo riesgo:** 5/5 (Lógica aislada).
*   **Bajo costo:** 4/5 (Sólo UI y use case).

### Tipo
Product / UX.

### Capas afectadas
*   `domain`: Refinar `RollTableUseCase` para resolver subtablas de forma recursiva o paso a paso.
*   `ui`: Crear un componente visual en `TableDetailScreen.kt` que muestre el "camino" o "árbol de tiradas" de forma limpia (ej. `Tabla Principal` -> `Tirada: Verbos (8)` -> `Subtabla Verbos` -> `Tirada: Ir (3)`).

### Tamaños
*   **S:** Al caer en una entrada con `subTableId`, mostrar un botón "Tirar en subtabla [Nombre]" al lado del resultado, permitiendo al usuario hacer la segunda tirada con un solo toque.
*   **M:** Automatizar la cadena completa con animaciones sucesivas de dados, mostrando el resultado consolidado (ej. "Tirada: Pasado simple - Comer - Negativo").
*   **L:** Permitir la edición del árbol de relaciones entre tablas con un editor visual interactivo en `TableEditorScreen.kt`.

### Implementación mínima (S)
En `TableDetailScreen.kt`, si `state.lastRollEntry` tiene un `subTableId` válido, renderizar un botón primario "Tirar en subtabla asociada". Al tocarlo, ejecutar el lanzamiento sobre esa subtabla y agregar el resultado a un historial temporal en la pantalla.

### Validación
1. Crear la Tabla A con una entrada que apunte a la Tabla B.
2. Tirar en la Tabla A hasta obtener dicha entrada.
3. Confirmar que aparece la opción de tirar en la Tabla B y que el resultado final combina ambos datos correctamente.

### Decisión recomendada
**Hacer ahora** / **Prototipar**.

---

## 3. Captura Rápida de Tarjetas Físicas (Multi-Crop Flow)

### Propuesta
Optimizar el flujo de `Importar Mazo Visual` permitiendo al usuario tomar una sola foto de múltiples tarjetas físicas (por ejemplo, organizadas sobre una mesa o en un libro) y aplicar un auto-recorte por detección de contornos para separar y crear múltiples cartas de una sola vez.

### Problema que resuelve
Actualmente, para importar cartas visuales desde fotos o imágenes de la cámara, el usuario debe realizar recortes manuales de cada carta uno por uno, o calibrar grillas exactas si provienen de un PDF. Si el material de origen son tarjetas de vocabulario físicas o capturas de apuntes manuscritos, la calibración de la grilla no es precisa y la fricción de recorte manual es muy alta.

### Valor
**Alto**. Reduce drásticamente el tiempo de digitalización de material de estudio físico.

### Costo
**Medio-Alto**. Requiere procesar la imagen con algoritmos sencillos de detección de bordes o contornos en local (se puede usar la detección de objetos u OCR de ML Kit para identificar agrupaciones de texto que representen cada tarjeta).

### Riesgo
**Medio**. Puede fallar si las condiciones de luz o el fondo no son óptimos, por lo que siempre debe haber una opción de ajuste manual.

### Score: 25/35
*   **Valor de producto:** 4/5 (Digitaliza apuntes físicos al instante).
*   **Urgencia:** 2/5 (El recorte manual y de grilla PDF ya cubren los casos de uso básicos).
*   **Reducción de fricción:** 5/5 (Pasa de N recortes manuales a un solo disparo de cámara).
*   **Reutilización:** 4/5 (Reutiliza el flujo de almacenamiento de imágenes local y base de datos).
*   **Validabilidad:** 3/5 (Depende del entorno de prueba físico/imagen de muestra).
*   **Bajo riesgo:** 4/5 (Siempre ofrece el editor manual como fallback).
*   **Bajo costo:** 3/5 (Requiere calibración del procesador de imágenes local).

### Tipo
UX / Product.

### Capas afectadas
*   `ui` / `components`: Pantalla de preprocesamiento de imagen con detección visual de cajas de recorte sugeridas.
*   `data`: Helper de procesamiento de imágenes para realizar el sub-recorte y guardado en archivos locales.

### Tamaños
*   **S:** Permitir al usuario dibujar rápidamente N rectángulos táctiles sobre la foto de una vez en un lienzo interactivo, y generar las cartas al confirmar, sin tener que entrar y salir de una pantalla por cada recorte.
*   **M:** Utilizar ML Kit para proponer automáticamente cajas de recorte basadas en bloques de texto detectados en la imagen, permitiendo al usuario redimensionarlas antes de importar.
*   **L:** Detección automática en tiempo real mediante la cámara, capturando las cartas y aislándolas de forma automática con corrección de perspectiva.

### Implementación mínima (S)
Crear un visor interactivo de recorte múltiple donde el usuario hace toques sucesivos para marcar esquinas opuestas de cartas. Al presionar "Importar todo", el sistema recorta y guarda cada sección como una carta individual en el mazo.

### Validación
1. Cargar una imagen con 4 tarjetas de vocabulario físicas.
2. Marcar las áreas o usar las cajas autodetectadas.
3. Verificar que se generan 4 cartas bien encuadradas en el mazo final de forma instantánea.

### Decisión recomendada
**Posponer** / **Investigar** (Hacer primero la unificación con la cola de repaso, ya que tiene un costo menor y un valor de retención más alto).
