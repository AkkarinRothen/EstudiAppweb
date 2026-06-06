# Flujo de Trabajo EstudiApp Web

Este documento describe las rutinas operativas para el mantenimiento y expansión del portal web.

## 1. Añadir un Nuevo Pack de Vocabulario

Para añadir un nuevo pack oficial al catálogo:
1. Editar `data/packs.json`.
2. Añadir un nuevo objeto al array `packs` con:
   - `id`: Nombre de archivo (sin extensión).
   - `title`: Título visible.
   - `icon`: Emoji o icono representativo.
   - `description`: Breve descripción.
   - `data`: Datos en formato TSV (Word \t Translation).
3. Ejecutar el script de construcción:
   ```bash
   node scripts/build_presets.js
   ```
4. Verificar que el archivo `.html` se haya generado correctamente en la carpeta `presets/`.

## 2. Modificar la Lógica Compartida

Si se desea cambiar el comportamiento de todos los packs (ej. cambiar el algoritmo SRS):
1. Editar el módulo correspondiente en `js/modules/` (ej. `srs.js`).
2. **NO** es necesario reconstruir los presets, ya que estos importan los módulos dinámicamente al cargar en el navegador.
3. Probar los cambios en al menos un preset y en el portal principal.

## 3. Publicación (GitHub Pages)

El proyecto está configurado para servirse mediante GitHub Pages:
1. Hacer commit y push de los cambios (incluyendo los presets generados) a la rama `main`.
2. GitHub Actions o la configuración de Pages servirá el contenido automáticamente.
3. **Nota:** Si se usa el Panel de Administración para publicar, este usará el token de GitHub configurado para subir los cambios directamente al repositorio.

## 4. Desarrollo Local

Para probar el sistema de módulos ES6 localmente, se requiere un servidor web (no funciona abriendo el archivo HTML directamente por restricciones de CORS en módulos):
- Usar la extensión "Live Server" de VS Code.
- O usar Python: `python -m http.server 8000`.
- O usar Node: `npx serve`.

## 6. Ciclo de Vida del Desarrollo con Agentes

EstudiApp utiliza un **Framework de Agentes Operativos** para asegurar la calidad y coherencia técnica:

### 🛠️ La Toolbox del Desarrollador (Scripts Críticos)
Antes de marcar una tarea como terminada (DoD), se DEBEN ejecutar los siguientes comandos según el área afectada:
- **Lógica de Juegos:** `node scripts/validate_games.js` (Verifica estructura, memoria y accesibilidad).
- **Contenido/Presets:** `node scripts/build_presets.js` (Sincroniza presets físicos con `data/packs.json`).

### 🔄 Protocolo de Handoff
Al finalizar cualquier intervención, el responsable (humano o agente IA) debe dejar un **Informe de Handoff** en el chat o en un log temporal que detalle:
- **Cambios Realizados:** Módulos tocados.
- **Decisiones Arquitectónicas:** Referenciar a `planning/architecture/DECISIONS.md` si se cambió una norma.
- **Validación:** Confirmar qué scripts de la Toolbox pasaron con éxito.
- **Pendientes:** Qué debe hacer el siguiente perfil (ej. "Mecánicas listas, falta Estética").

### 🧠 Registro de Decisiones (ADL)
Cualquier cambio que afecte a la estructura global (ej. prohibición de librerías externas, cambio en la racha de estudio) debe registrarse en `planning/architecture/DECISIONS.md`. Esto sirve como memoria a largo plazo del proyecto.

## 7. Validación de Paridad (Android)

Cualquier mejora en el algoritmo de aprendizaje, sistema de gamificación o gestión de mazos debe ser comunicada o implementada de forma análoga en la aplicación Android (`StudiApp`) para mantener la experiencia de usuario consistente.
