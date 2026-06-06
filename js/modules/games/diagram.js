import * as Speech from '../speech.js';
import * as Fx from '../fx.js';

export class DiagramGame {
    constructor(engine) {
        this.engine = engine;
        this.activeLabels = [];
        this.hotspots = [];
        this.matchedCount = 0;
        this.currentDraggingLabel = null;
        this.dragState = null;
    }

    start() {
        const diagramArea = this.engine.elements.diagramArea;
        if (!diagramArea) return;

        diagramArea.innerHTML = '';
        diagramArea.style.display = 'flex';

        // Hide standard study UI elements
        if (this.engine.elements.subContainer) this.engine.elements.subContainer.style.display = 'none';
        if (this.engine.elements.btnReveal) this.engine.elements.btnReveal.style.display = 'none';
        if (this.engine.elements.rollVal) this.engine.elements.rollVal.style.display = 'none';
        if (this.engine.elements.imgContainer) this.engine.elements.imgContainer.style.display = 'none';
        if (this.engine.elements.exampleText) this.engine.elements.exampleText.style.display = 'none';
        if (this.engine.elements.mainText) this.engine.elements.mainText.innerText = 'Arrastra cada etiqueta a su posición en el diagrama';

        if (this.engine.entries.length < 2) {
            diagramArea.innerHTML = '<div class="info">Se necesitan al menos 2 vocablos para jugar al Diagrama.</div>';
            return;
        }

        // Define our fallback blueprint rooms
        const defaultHotspots = [
            { id: 'bedroom', nameEs: 'Dormitorio', nameEn: 'Bedroom', left: 22.5, top: 35, keywords: ['bedroom', 'dormitorio', 'habitación', 'cama', 'bed', 'pillow', 'almohada', 'sábana', 'sheet', 'wardrobe', 'armario', 'closet'] },
            { id: 'dining', nameEs: 'Comedor', nameEn: 'Dining Room', left: 50, top: 35, keywords: ['dining', 'comedor', 'table', 'mesa', 'chair', 'silla', 'plate', 'plato', 'fork', 'tenedor', 'knife', 'cuchillo'] },
            { id: 'bathroom', nameEs: 'Baño', nameEn: 'Bathroom', left: 77.5, top: 35, keywords: ['bathroom', 'baño', 'shower', 'ducha', 'toilet', 'inodoro', 'espejo', 'mirror', 'soap', 'jabón', 'towel', 'toalla'] },
            { id: 'kitchen', nameEs: 'Cocina', nameEn: 'Kitchen', left: 22.5, top: 75, keywords: ['kitchen', 'cocina', 'fridge', 'nevera', 'refrigerador', 'stove', 'estufa', 'horno', 'oven', 'cook', 'cocinar', 'sink', 'fregadero'] },
            { id: 'hallway', nameEs: 'Pasillo', nameEn: 'Hallway', left: 50, top: 75, keywords: ['hallway', 'pasillo', 'entrance', 'entrada', 'corredor', 'door', 'puerta', 'hall', 'lobby'] },
            { id: 'living', nameEs: 'Salón', nameEn: 'Living Room', left: 77.5, top: 75, keywords: ['living', 'salón', 'sala', 'sofa', 'tv', 'television', 'couch', 'sillón', 'armchair', 'rug', 'alfombra'] },
            { id: 'garden', nameEs: 'Jardín', nameEn: 'Garden', left: 50, top: 10, keywords: ['garden', 'jardín', 'patio', 'tree', 'árbol', 'plant', 'planta', 'flower', 'flor', 'grass', 'césped'] },
            { id: 'garage', nameEs: 'Garaje', nameEn: 'Garage', left: 5, top: 50, keywords: ['garage', 'garaje', 'car', 'coche', 'auto', 'bicycle', 'bicicleta', 'tool', 'herramienta'] }
        ];

        // Select a pool of vocabulary entries (up to 8, at least 2)
        const maxHotspots = Math.min(8, this.engine.entries.length);
        const selectedEntries = [...this.engine.entries]
            .sort(() => Math.random() - 0.5)
            .slice(0, maxHotspots);

        // Map entries to the hotspots based on keywords
        const gameHotspots = [];
        const unmatchedEntries = [];

        // Track used hotspot definitions
        const availableDefs = [...defaultHotspots];

        selectedEntries.forEach(entry => {
            const spanish = entry.text.split('->')[0].trim();
            const english = (entry.text.split('->')[1] || '').split('||')[0].trim();
            const spanishLower = spanish.toLowerCase();
            const englishLower = english.toLowerCase();

            // Try to find a matching hotspot definition
            const foundIndex = availableDefs.findIndex(def => {
                return def.keywords.some(keyword => spanishLower.includes(keyword) || englishLower.includes(keyword));
            });

            if (foundIndex !== -1) {
                const def = availableDefs.splice(foundIndex, 1)[0];
                gameHotspots.push({
                    ...def,
                    entry: entry,
                    spanish: spanish,
                    english: english
                });
            } else {
                unmatchedEntries.push(entry);
            }
        });

        // For unmatched entries, map them to remaining available hotspots
        unmatchedEntries.forEach(entry => {
            if (availableDefs.length > 0) {
                const def = availableDefs.shift();
                const spanish = entry.text.split('->')[0].trim();
                const english = (entry.text.split('->')[1] || '').split('||')[0].trim();
                gameHotspots.push({
                    ...def,
                    entry: entry,
                    spanish: spanish,
                    english: english
                });
            }
        });

        // Initialize state
        this.hotspots = gameHotspots;
        this.matchedCount = 0;

        // Render main layout
        diagramArea.innerHTML = `
            <div class="diagram-game-container">
                <div class="diagram-wrapper" id="diagramWrapper">
                    <div class="diagram-svg-container" id="diagramSvgContainer"></div>
                    <!-- Hotspots will be added dynamically -->
                </div>
                <div class="diagram-labels-container" id="diagramLabels">
                    <!-- Labels will be added dynamically -->
                </div>
            </div>
        `;

        const wrapper = diagramArea.querySelector('#diagramWrapper');
        const svgContainer = diagramArea.querySelector('#diagramSvgContainer');
        const labelsContainer = diagramArea.querySelector('#diagramLabels');

        // Draw blueprint house SVG in svgContainer
        svgContainer.innerHTML = this.getBlueprintSvg();

        // Create hotspot elements in wrapper
        this.hotspots.forEach(hotspot => {
            const el = document.createElement('div');
            el.className = 'diagram-hotspot';
            el.style.left = `${hotspot.left}%`;
            el.style.top = `${hotspot.top}%`;
            el.title = `Destino para: ${hotspot.nameEs}`;
            wrapper.appendChild(el);
            hotspot.el = el;
        });

        // Shuffle English words for the labels dock
        const labelsData = this.hotspots.map(h => ({
            id: h.id,
            english: h.english,
            spanish: h.spanish,
            hotspot: h
        }));
        const shuffledLabels = [...labelsData].sort(() => Math.random() - 0.5);

        // Populate labels dock
        shuffledLabels.forEach(data => {
            const labelEl = document.createElement('div');
            labelEl.className = 'diagram-label';
            labelEl.innerText = data.english;
            labelEl.dataset.id = data.id;

            // Store original data
            labelEl.hotspot = data.hotspot;

            // Attach drag events
            this.setupDragEvents(labelEl, wrapper, labelsContainer);

            labelsContainer.appendChild(labelEl);
        });
    }

    setupDragEvents(labelEl, wrapper, labelsContainer) {
        labelEl.addEventListener('pointerdown', (e) => {
            if (labelEl.classList.contains('matched') || labelEl.classList.contains('animating-back')) return;

            // Select this label
            this.currentDraggingLabel = labelEl;
            labelEl.classList.add('dragging');

            // Record client offsets
            const rectLabel = labelEl.getBoundingClientRect();
            const rectWrapper = wrapper.getBoundingClientRect();

            // Create placeholder in labels dock to prevent jumpy layout shifts
            const placeholder = document.createElement('div');
            placeholder.className = 'diagram-label-placeholder';
            placeholder.style.width = `${rectLabel.width}px`;
            placeholder.style.height = `${rectLabel.height}px`;
            
            // Insert placeholder right before label
            labelEl.parentNode.insertBefore(placeholder, labelEl);

            // Temporarily append label to wrapper for free-floating movement
            wrapper.appendChild(labelEl);

            // Compute initial offsets relative to wrapper
            const initialLeft = rectLabel.left - rectWrapper.left;
            const initialTop = rectLabel.top - rectWrapper.top;

            labelEl.style.position = 'absolute';
            labelEl.style.left = `${initialLeft}px`;
            labelEl.style.top = `${initialTop}px`;
            labelEl.style.width = `${rectLabel.width}px`;
            labelEl.style.height = `${rectLabel.height}px`;
            labelEl.style.margin = '0';

            // Store drag state
            this.dragState = {
                placeholder: placeholder,
                rectWrapper: rectWrapper,
                labelWidth: rectLabel.width,
                labelHeight: rectLabel.height,
                startX: e.clientX,
                startY: e.clientY,
                initialLeft: initialLeft,
                initialTop: initialTop
            };

            // Set pointer capture
            labelEl.setPointerCapture(e.pointerId);
            
            // Visual feedback on pointer down
            Fx.playSound('click');
        });

        labelEl.addEventListener('pointermove', (e) => {
            if (this.currentDraggingLabel !== labelEl || !this.dragState) return;

            // Calculate delta
            const dx = e.clientX - this.dragState.startX;
            const dy = e.clientY - this.dragState.startY;

            // Calculate new position
            let newLeft = this.dragState.initialLeft + dx;
            let newTop = this.dragState.initialTop + dy;

            // Update style
            labelEl.style.left = `${newLeft}px`;
            labelEl.style.top = `${newTop}px`;
        });

        const handlePointerUp = (e) => {
            if (this.currentDraggingLabel !== labelEl || !this.dragState) return;

            labelEl.releasePointerCapture(e.pointerId);
            labelEl.classList.remove('dragging');

            const rectWrapper = wrapper.getBoundingClientRect();
            
            // Calculate label center coordinates relative to wrapper
            const labelWidth = labelEl.offsetWidth;
            const labelHeight = labelEl.offsetHeight;
            const labelCenterX = labelEl.offsetLeft + labelWidth / 2;
            const labelCenterY = labelEl.offsetTop + labelHeight / 2;

            // Get target hotspot info
            const targetHotspot = labelEl.hotspot;
            const hotspotX = (targetHotspot.left / 100) * rectWrapper.width;
            const hotspotY = (targetHotspot.top / 100) * rectWrapper.height;

            // Calculate distance to correct hotspot
            const distDx = labelCenterX - hotspotX;
            const distDy = labelCenterY - hotspotY;
            const distance = Math.sqrt(distDx * distDx + distDy * distDy);

            const snapThreshold = 45; // pixels

            if (distance < snapThreshold) {
                // Correct match!
                labelEl.classList.add('matched');
                targetHotspot.el.classList.add('matched');

                // Align label perfectly with hotspot
                const targetLeft = hotspotX - labelWidth / 2;
                const targetTop = hotspotY - labelHeight / 2;
                labelEl.style.left = `${targetLeft}px`;
                labelEl.style.top = `${targetTop}px`;

                // Speak and rate SRS
                this.engine.rateSrs(true);
                this.engine.lastEnglishText = targetHotspot.english;
                this.engine.lastSpanishText = targetHotspot.spanish;
                if (this.engine.elements.mainText) {
                    this.engine.elements.mainText.innerText = `${targetHotspot.spanish} -> ${targetHotspot.english}`;
                }
                this.engine.speak();

                // Play success sound
                Fx.playSound('success');

                // Clean up placeholder
                if (this.dragState.placeholder) {
                    this.dragState.placeholder.remove();
                }

                this.matchedCount++;
                this.checkWinCondition(labelsContainer);
            } else {
                // Incorrect match!
                Fx.playSound('error');
                Fx.shake(labelEl);
                this.engine.rateSrs(false);

                // Animate fly-back to placeholder
                labelEl.classList.add('animating-back');
                labelEl.style.transition = 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)';

                const placeholder = this.dragState.placeholder;
                const rectPlaceholder = placeholder.getBoundingClientRect();
                const rectWrapperNow = wrapper.getBoundingClientRect();

                const targetLeft = rectPlaceholder.left - rectWrapperNow.left;
                const targetTop = rectPlaceholder.top - rectWrapperNow.top;

                labelEl.style.left = `${targetLeft}px`;
                labelEl.style.top = `${targetTop}px`;

                setTimeout(() => {
                    // Re-insert into labels dock and clear styling
                    placeholder.parentNode.insertBefore(labelEl, placeholder);
                    labelEl.classList.remove('animating-back');
                    labelEl.style.position = '';
                    labelEl.style.left = '';
                    labelEl.style.top = '';
                    labelEl.style.width = '';
                    labelEl.style.height = '';
                    labelEl.style.margin = '';
                    labelEl.style.transition = '';

                    placeholder.remove();
                }, 300);
            }

            // Reset drag state
            this.currentDraggingLabel = null;
            this.dragState = null;
        };

        labelEl.addEventListener('pointerup', handlePointerUp);
        labelEl.addEventListener('pointercancel', handlePointerUp);
    }

    checkWinCondition(labelsContainer) {
        if (this.matchedCount === this.hotspots.length) {
            setTimeout(() => {
                Fx.playSound('victory');
                Fx.celebrate('burst');

                const diagramArea = this.engine.elements.diagramArea;
                diagramArea.innerHTML = `
                    <div class="match-win-screen">
                        <h3 style="color:var(--success,#4CAF50);font-size:24px;margin:0;">¡Felicidades! 🎉</h3>
                        <p class="info" style="margin: 5px 0 15px 0;">Has etiquetado todo el diagrama correctamente.</p>
                        <button class="srs-btn srs-btn-good" style="margin-top:10px;width:auto;padding:12px 24px;">Volver a Jugar</button>
                    </div>
                `;
                diagramArea.querySelector('button').onclick = () => this.start();
            }, 600);
        }
    }

    stop() {
        this.currentDraggingLabel = null;
        this.dragState = null;
    }

    getBlueprintSvg() {
        return `
        <svg viewBox="0 0 800 500" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" class="diagram-svg">
          <defs>
            <filter id="neon-glow-primary" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="neon-glow-secondary" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <!-- Background grid for tech aesthetic -->
          <rect width="800" height="500" fill="#0f0e13" />
          <g stroke="#1a1823" stroke-width="1">
            <line x1="100" y1="0" x2="100" y2="500" />
            <line x1="200" y1="0" x2="200" y2="500" />
            <line x1="300" y1="0" x2="300" y2="500" />
            <line x1="400" y1="0" x2="400" y2="500" />
            <line x1="500" y1="0" x2="500" y2="500" />
            <line x1="600" y1="0" x2="600" y2="500" />
            <line x1="700" y1="0" x2="700" y2="500" />
            <line x1="0" y1="100" x2="800" y2="100" />
            <line x1="0" y1="200" x2="800" y2="200" />
            <line x1="0" y1="300" x2="800" y2="300" />
            <line x1="0" y1="400" x2="800" y2="400" />
          </g>

          <!-- Outer Walls (Cyan Neon) -->
          <rect x="80" y="60" width="640" height="380" rx="16" fill="none" stroke="#00f2fe" stroke-width="4" filter="url(#neon-glow-primary)" opacity="0.8" />
          
          <!-- Internal Walls -->
          <line x1="80" y1="250" x2="720" y2="250" stroke="#00f2fe" stroke-width="3" filter="url(#neon-glow-primary)" opacity="0.6" />
          <line x1="280" y1="60" x2="280" y2="440" stroke="#00f2fe" stroke-width="3" filter="url(#neon-glow-primary)" opacity="0.6" />
          <line x1="520" y1="60" x2="520" y2="440" stroke="#00f2fe" stroke-width="3" filter="url(#neon-glow-primary)" opacity="0.6" />

          <!-- Room labels and minimal icons inside SVG -->
          <!-- Bedroom (Top Left) -->
          <text x="180" y="110" fill="#fff" font-family="'Inter', sans-serif" font-size="14" font-weight="bold" letter-spacing="1" opacity="0.4" text-anchor="middle">BEDROOM</text>
          <rect x="100" y="130" width="80" height="90" rx="8" fill="none" stroke="#ff007f" stroke-width="2" opacity="0.4" />
          <rect x="110" y="140" width="60" height="20" rx="4" fill="none" stroke="#ff007f" stroke-width="2" opacity="0.4" />
          <line x1="100" y1="170" x2="180" y2="170" stroke="#ff007f" stroke-width="2" opacity="0.4" />

          <!-- Bathroom (Top Right) -->
          <text x="620" y="110" fill="#fff" font-family="'Inter', sans-serif" font-size="14" font-weight="bold" letter-spacing="1" opacity="0.4" text-anchor="middle">BATHROOM</text>
          <rect x="580" y="130" width="90" height="50" rx="20" fill="none" stroke="#00f2fe" stroke-width="2" opacity="0.4" />
          <circle cx="595" cy="155" r="4" fill="none" stroke="#00f2fe" stroke-width="2" opacity="0.4" />

          <!-- Kitchen (Bottom Left) -->
          <text x="180" y="290" fill="#fff" font-family="'Inter', sans-serif" font-size="14" font-weight="bold" letter-spacing="1" opacity="0.4" text-anchor="middle">KITCHEN</text>
          <rect x="100" y="360" width="130" height="50" fill="none" stroke="#ff007f" stroke-width="2" opacity="0.4" />
          <circle cx="130" cy="385" r="12" fill="none" stroke="#ff007f" stroke-width="2" opacity="0.4" />
          <circle cx="190" cy="385" r="12" fill="none" stroke="#ff007f" stroke-width="2" opacity="0.4" />

          <!-- Living Room (Bottom Right) -->
          <text x="620" y="290" fill="#fff" font-family="'Inter', sans-serif" font-size="14" font-weight="bold" letter-spacing="1" opacity="0.4" text-anchor="middle">LIVING ROOM</text>
          <path d="M 560 380 L 560 410 L 680 410 L 680 380 Q 680 360 660 360 L 580 360 Q 560 360 560 380 Z" fill="none" stroke="#00f2fe" stroke-width="2" opacity="0.4" />

          <!-- Dining Room (Middle Top) -->
          <text x="400" y="110" fill="#fff" font-family="'Inter', sans-serif" font-size="14" font-weight="bold" letter-spacing="1" opacity="0.4" text-anchor="middle">DINING ROOM</text>
          <rect x="350" y="140" width="100" height="60" rx="8" fill="none" stroke="#ff007f" stroke-width="2" opacity="0.4" />
          <circle cx="400" cy="170" r="10" fill="none" stroke="#ff007f" stroke-width="2" opacity="0.3" />

          <!-- Hallway (Middle Bottom) -->
          <text x="400" y="290" fill="#fff" font-family="'Inter', sans-serif" font-size="14" font-weight="bold" letter-spacing="1" opacity="0.4" text-anchor="middle">HALLWAY</text>

          <!-- Garden (Top area exterior) -->
          <text x="400" y="35" fill="#fff" font-family="'Inter', sans-serif" font-size="12" font-weight="bold" letter-spacing="2" opacity="0.4" text-anchor="middle">GARDEN</text>
          <path d="M 395 45 L 405 45 L 405 35 L 415 35 L 400 20 L 385 35 L 395 35 Z" fill="none" stroke="#00ff66" stroke-width="2" opacity="0.4" />

          <!-- Garage (Left area exterior/interior) -->
          <text x="40" y="250" fill="#fff" font-family="'Inter', sans-serif" font-size="12" font-weight="bold" letter-spacing="2" opacity="0.4" text-anchor="middle" transform="rotate(-90 40 250)">GARAGE</text>
        </svg>
        `;
    }
}
