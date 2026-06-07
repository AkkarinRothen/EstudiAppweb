import * as Utils from '../utils.js';
import * as Fx from '../fx.js';
import * as Storage from '../storage.js';
import * as Difficulty from '../difficulty-manager.js';

export class SniperGame {
    constructor(engine) {
        this.engine = engine;
        this.sniperSpawnTimeout = null;
        this._sniperTarget = null;
        this.sniperLives = 3;
        this.sniperScore = 0;

        // Canvas Game State
        this.canvas = null;
        this.ctx = null;
        this.enemies = [];
        this.lasers = [];
        this.particles = [];
        this.stars = [];
        this.ship = { angle: 0, targetAngle: 0 };
        this.isRunning = false;
        this.animationId = null;
    }

    start() {
        const sniperArea = this.engine.elements.sniperArea;
        if (!sniperArea) return;

        this.stop();

        if (this.engine.entries.length < 2) {
            sniperArea.innerHTML = '<div class="info">Se necesitan al menos 2 vocablos para jugar al Sniper.</div>';
            sniperArea.style.display = 'flex';
            return;
        }

        this.sniperLives = 3;
        this.sniperScore = 0;

        const best = Storage.getHighScore(this.engine.packId, 'sniper');

        sniperArea.innerHTML = `
            <div class="sniper-hud">
                <span class="sniper-lives-display" id="sniperLives">❤️❤️❤️</span>
                <span class="sniper-score-display" id="sniperScore">🎯 0 disparos</span>
                <span class="sniper-highscore-display" id="sniperHighScore">🏆 Récord: ${best}</span>
            </div>
            <div class="sniper-target-box" id="sniperTarget">Cargando...</div>
            <div class="sniper-lanes crt" id="sniperLanes" style="padding:0; position:relative;">
                <canvas id="sniperCanvas" style="display:block; width:100%; height:100%; border-radius:14px; background:#141218;"></canvas>
            </div>
            <div class="sniper-input-row">
                <input type="text" class="sniper-input" id="sniperInput" placeholder="Escribe la traducción en español y pulsa Enter..." autocomplete="off">
            </div>
        `;
        sniperArea.style.display = 'flex';

        if (this.engine.elements.subContainer) this.engine.elements.subContainer.style.display = 'none';
        if (this.engine.elements.btnReveal) this.engine.elements.btnReveal.style.display = 'none';
        if (this.engine.elements.rollVal) this.engine.elements.rollVal.style.display = 'none';
        if (this.engine.elements.imgContainer) this.engine.elements.imgContainer.style.display = 'none';
        if (this.engine.elements.mainText) this.engine.elements.mainText.innerText = '';

        this._pickNextTarget();

        const input = sniperArea.querySelector('#sniperInput');
        if (input) {
            input.focus();
            this.keydownHandler = (e) => {
                if (e.key === 'Enter') {
                    const val = Utils.cleanText(input.value);
                    if (!val) return;
                    this._checkAnswer(val);
                    input.value = '';
                }
            };
            input.addEventListener('keydown', this.keydownHandler);
        }

        // Setup HTML5 Canvas 2D engine
        const canvas = sniperArea.querySelector('#sniperCanvas');
        const lanes = sniperArea.querySelector('#sniperLanes');
        
        setTimeout(() => {
            if (!canvas) return;
            const rect = lanes.getBoundingClientRect();
            canvas.width = rect.width || lanes.clientWidth || 400;
            canvas.height = rect.height || lanes.clientHeight || 180;
            
            this.canvas = canvas;
            this.ctx = canvas.getContext('2d');
            
            this._initGameEngine();
            
            // Start dynamic spawns
            this._scheduleNextSpawn();
        }, 50);
    }

    _initGameEngine() {
        this.enemies = [];
        this.lasers = [];
        this.particles = [];
        this.stars = [];
        this.ship = { angle: 0, targetAngle: 0 };

        // Generate initial starfield
        for (let i = 0; i < 45; i++) {
            this.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 2 + 0.5,
                speed: Math.random() * 0.9 + 0.3
            });
        }

        this.isRunning = true;
        this._tick();
    }

    _tick() {
        if (!this.isRunning) return;

        this._update();
        this._draw();

        this.animationId = requestAnimationFrame(() => this._tick());
    }

    _update() {
        const canvas = this.canvas;
        if (!canvas) return;

        // 1. Update starfield (speed multiplies based on score)
        const starSpeedMultiplier = 1 + this.sniperScore * 0.05;
        this.stars.forEach(star => {
            star.y += star.speed * starSpeedMultiplier;
            if (star.y > canvas.height) {
                star.y = 0;
                star.x = Math.random() * canvas.width;
            }
        });

        // 2. Update enemies
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            
            if (enemy.hit) {
                enemy.opacity -= 0.15;
                if (enemy.opacity <= 0) {
                    this.enemies.splice(i, 1);
                    continue;
                }
            } else {
                enemy.y += enemy.speed;
                // Check bottom boundary hit
                if (enemy.y >= canvas.height - 15) {
                    this.enemies.splice(i, 1);
                    if (enemy.correct) {
                        this._loseLife();
                    }
                    continue;
                }
            }
        }

        // 3. Update lasers
        for (let i = this.lasers.length - 1; i >= 0; i--) {
            const laser = this.lasers[i];
            laser.timer--;
            if (laser.timer <= 0) {
                this.lasers.splice(i, 1);
            }
        }

        // 4. Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.06; // slight gravity
            p.life--;
            p.alpha = Math.max(0, p.life / p.maxLife);
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }

        // 5. Rotate player ship towards target
        const diff = this.ship.targetAngle - this.ship.angle;
        this.ship.angle += diff * 0.2;
    }

    _draw() {
        const canvas = this.canvas;
        const ctx = this.ctx;
        if (!canvas || !ctx) return;

        // Clear canvas
        ctx.fillStyle = '#141218';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 1. Draw starfield
        ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
        this.stars.forEach(star => {
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fill();
        });

        // 2. Draw lasers
        this.lasers.forEach(laser => {
            ctx.strokeStyle = 'var(--primary, #D0BCFF)';
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(laser.startX, laser.startY);
            ctx.lineTo(laser.endX, laser.endY);
            ctx.stroke();

            // Inner glowing core
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(laser.startX, laser.startY);
            ctx.lineTo(laser.endX, laser.endY);
            ctx.stroke();
        });

        // 3. Draw particles
        this.particles.forEach(p => {
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.alpha;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1.0; // Reset alpha

        // 4. Draw player ship (bottom center)
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height - 12);
        ctx.rotate(this.ship.angle);

        // Ship geometry
        ctx.fillStyle = 'var(--primary, #D0BCFF)';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, -14);  // nose
        ctx.lineTo(-10, 8);  // bottom left
        ctx.lineTo(10, 8);   // bottom right
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Ship thruster fire animation
        if (Math.random() > 0.3) {
            ctx.fillStyle = '#ff9800';
            ctx.beginPath();
            ctx.moveTo(-3, 8);
            ctx.lineTo(0, 15 + Math.random() * 5);
            ctx.lineTo(3, 8);
            ctx.closePath();
            ctx.fill();
        }
        ctx.restore();

        // 5. Draw alien enemies
        this.enemies.forEach(enemy => {
            ctx.save();
            ctx.globalAlpha = enemy.opacity;

            // Draw a retro alien invader ship geometry
            ctx.fillStyle = enemy.correct ? 'var(--primary, #D0BCFF)' : 'var(--outline, #938F99)';
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;

            ctx.beginPath();
            ctx.moveTo(enemy.x, enemy.y - 10);
            ctx.lineTo(enemy.x - 12, enemy.y + 2);
            ctx.lineTo(enemy.x - 6, enemy.y + 6);
            ctx.lineTo(enemy.x + 6, enemy.y + 6);
            ctx.lineTo(enemy.x + 12, enemy.y + 2);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Glow core
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(enemy.x, enemy.y, 3.5, 0, Math.PI * 2);
            ctx.fill();

            // Draw Spanish word tag
            ctx.font = 'bold 12px Outfit, sans-serif';
            const textWidth = ctx.measureText(enemy.text).width;

            // Draw tag rounded rect background
            ctx.fillStyle = 'rgba(29, 27, 32, 0.85)';
            ctx.strokeStyle = enemy.correct ? 'var(--primary, #D0BCFF)' : 'var(--outline-variant, #cac4d0)';
            ctx.lineWidth = 1.5;
            
            ctx.beginPath();
            ctx.roundRect(enemy.x - textWidth / 2 - 8, enemy.y + 12, textWidth + 16, 22, 11);
            ctx.fill();
            ctx.stroke();

            // Draw text inside tag
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(enemy.text, enemy.x, enemy.y + 23);

            ctx.restore();
        });
    }

    _scheduleNextSpawn() {
        if (!this.isRunning) return;
        if (this.sniperSpawnTimeout) clearTimeout(this.sniperSpawnTimeout);

        // Difficulty adjustment based on session score and target word SRS box
        const wordKey = this._sniperTarget ? this._sniperTarget.es : '';
        const factor = Difficulty.getCombinedDifficultyFactor(this.sniperScore, this.engine.packId, wordKey);
        const params = Difficulty.lerpParams(
            { spawnDelay: 2800 }, // Easy (0.0)
            { spawnDelay: 800 },  // Hard (1.0)
            factor
        );

        this.sniperSpawnTimeout = setTimeout(() => {
            this._spawnWord();
            this._scheduleNextSpawn();
        }, params.spawnDelay);
    }

    _pickNextTarget() {
        if (!this.engine.entries || this.engine.entries.length === 0) return;
        const rand = this.engine.entries[Math.floor(Math.random() * this.engine.entries.length)];
        const parts = rand.text.split('->');
        this._sniperTarget = {
            es: parts[0].trim(),
            en: parts[1]?.split('||')[0].trim() || ''
        };
        const box = document.getElementById('sniperTarget');
        if (box) {
            box.innerHTML = `
                <svg class="sniper-crosshair" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2" fill="none" />
                    <line x1="12" y1="1" x2="12" y2="23" stroke="currentColor" stroke-width="2" />
                    <line x1="1" y1="12" x2="23" y2="12" stroke="currentColor" stroke-width="2" />
                    <circle cx="12" cy="12" r="3" fill="currentColor" />
                </svg>
                <span>OBJETIVO: "${this._sniperTarget.en}"</span>
            `;
        }
    }

    _spawnWord() {
        if (!this.canvas) return;

        const isCorrect = Math.random() < 0.4;
        let wordText = '';

        if (isCorrect) {
            wordText = this._sniperTarget.es;
        } else {
            const distractors = this.engine.entries.filter(e => {
                const p = e.text.split('->');
                return p[0].trim() !== this._sniperTarget.es;
            });
            if (distractors.length === 0) wordText = this._sniperTarget.es;
            else {
                const d = distractors[Math.floor(Math.random() * distractors.length)];
                wordText = d.text.split('->')[0].trim();
            }
        }

        // Calculate fall speed using DifficultyManager and word-specific SRS box
        const factor = Difficulty.getCombinedDifficultyFactor(this.sniperScore, this.engine.packId, wordText);
        const params = Difficulty.lerpParams(
            { duration: 5.0 }, // Easy (0.0) -> 5 seconds
            { duration: 1.5 }, // Hard (1.0) -> 1.5 seconds
            factor
        );
        
        // Speed per frame
        const speed = (this.canvas.height / params.duration) / 60;

        const enemy = {
            x: 40 + Math.random() * (this.canvas.width - 80),
            y: -20,
            text: wordText,
            correct: isCorrect,
            speed: speed,
            hit: false,
            opacity: 1
        };

        this.enemies.push(enemy);
    }

    _checkAnswer(val) {
        if (!this._sniperTarget || !this.canvas) return;
        const target = Utils.cleanText(this._sniperTarget.es);

        if (Utils.compareText(val, target)) {
            // Find correct target enemy
            const targetEnemy = this.enemies.find(e => e.correct && !e.hit);

            if (targetEnemy) {
                targetEnemy.hit = true;
                this.sniperScore++;
                const scoreEl = document.getElementById('sniperScore');
                if (scoreEl) scoreEl.innerText = `🎯 ${this.sniperScore} disparos`;

                // Calculate angle to target enemy from ship coordinates
                const dx = targetEnemy.x - (this.canvas.width / 2);
                const dy = targetEnemy.y - (this.canvas.height - 12);
                this.ship.targetAngle = Math.atan2(dy, dx) + Math.PI / 2;

                // Trigger laser line
                this.lasers.push({
                    startX: this.canvas.width / 2,
                    startY: this.canvas.height - 12,
                    endX: targetEnemy.x,
                    endY: targetEnemy.y,
                    timer: 8
                });

                // Spawn explosion particles
                this._spawnExplosion(targetEnemy.x, targetEnemy.y, 'var(--primary)');

                // Play sound effects and update state
                Fx.playSound('laser');
                this.engine.rateSrs(true);
                this.engine.speak();
                this._pickNextTarget();
            }
        } else {
            const input = document.getElementById('sniperInput');
            if (input) {
                input.classList.add('sniper-wrong');
                Fx.shake(input);
                setTimeout(() => input.classList.remove('sniper-wrong'), 600);
            }
        }
    }

    _spawnExplosion(x, y, color) {
        // Resolve CSS color variables if needed
        let resolvedColor = color || '#6750A4';
        if (color && color.startsWith('var(')) {
            const varName = color.slice(4, -1);
            resolvedColor = getComputedStyle(this.canvas || document.body).getPropertyValue(varName).trim() || '#6750A4';
        }

        const count = 18;
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 3.5 + 1.2;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 0.8,
                size: Math.random() * 4.5 + 1.5,
                color: resolvedColor,
                maxLife: Math.floor(Math.random() * 20) + 20,
                life: Math.floor(Math.random() * 20) + 20,
                alpha: 1
            });
        }
    }

    _loseLife() {
        if (!this.sniperLives) return;
        this.sniperLives--;
        const livesEl = document.getElementById('sniperLives');
        if (livesEl) {
            livesEl.innerText = '❤️'.repeat(this.sniperLives) + '🖤'.repeat(3 - this.sniperLives);
        }
        if (this.sniperLives <= 0) {
            this.stop();
            const newRecord = Storage.saveHighScore(this.engine.packId, 'sniper', this.sniperScore);
            const best = Storage.getHighScore(this.engine.packId, 'sniper');

            if (newRecord) {
                Fx.playSound('victory');
            }

            const sniperArea = this.engine.elements.sniperArea;
            if (sniperArea) {
                sniperArea.innerHTML = `
                    <div class="sniper-gameover">
                        <div style="font-size:48px;">${newRecord ? '🏆' : '💀'}</div>
                        <h3>${newRecord ? '¡Nuevo Récord!' : 'Game Over'}</h3>
                        <p class="info">Disparos acertados: <strong>${this.sniperScore}</strong></p>
                        <p class="info" style="font-size:12px;opacity:0.8;margin-bottom:12px;">Récord actual: <strong>${best}</strong></p>
                        
                        <div class="form-group" style="margin-top:10px;width:100%;text-align:left;border-top:1px dashed var(--outline);padding-top:12px;">
                            <label style="font-size:12px;font-family:'Outfit',sans-serif;">¿Deseas código de tarea para tu profesor?</label>
                            <div style="display:flex;gap:8px;margin-top:6px;">
                                <input type="text" id="studentNameInput" class="write-input" style="padding:8px;font-size:13px;font-family:'Outfit',sans-serif;" placeholder="Apellido_Nombre (ej: Perez_Juan)" />
                                <button id="btnGenTaskCode" role="button" tabindex="0" class="srs-btn srs-btn-good" style="padding:8px;font-size:13px;width:auto;font-family:'Outfit',sans-serif;margin-top:0;">Generar</button>
                            </div>
                            <div id="taskCodeResult" style="display:none;margin-top:10px;">
                                <textarea id="taskCodeTextarea" readonly style="width:100%;height:60px;font-family:monospace;font-size:11px;padding:6px;border-radius:6px;border:1px solid var(--outline);background:var(--surface-variant);color:var(--on-surface-variant);box-sizing:border-box;resize:none;"></textarea>
                                <button id="btnCopyTaskCode" role="button" tabindex="0" class="srs-btn" style="padding:6px;font-size:11px;width:100%;margin-top:4px;background:var(--secondary-container);color:var(--on-secondary-container);">📋 Copiar Código</button>
                            </div>
                        </div>

                        <button id="btnRetrySniper" role="button" tabindex="0" class="srs-btn srs-btn-good" style="width:auto;padding:12px 24px;margin-top:15px;">Jugar de nuevo</button>
                    </div>
                `;
                
                // Play again action
                sniperArea.querySelector('#btnRetrySniper').onclick = () => this.start();

                // Code generation action
                const btnGen = sniperArea.querySelector('#btnGenTaskCode');
                if (btnGen) {
                    btnGen.onclick = async () => {
                        const nameInput = sniperArea.querySelector('#studentNameInput');
                        const nameVal = nameInput ? nameInput.value.trim() : "";

                        // Validation format: Apellido_Nombre with initial upper-case letter
                        const regexNombre = /^[A-ZÁÉÍÓÚ][a-zñáéíóú]+_[A-ZÁÉÍÓÚ][a-zñáéíóú]+$/;
                        if (!regexNombre.test(nameVal)) {
                            alert("Por favor, introduce tu nombre en el formato: Apellido_Nombre (ej: Perez_Juan) con mayúscula inicial.");
                            return;
                        }

                        // Basic profanity list filter
                        const badWords = ["mierda", "puto", "puta", "joder", "cabron", "pendejo", "concha", "culiao", "fuck", "shit"];
                        const lowerName = nameVal.toLowerCase();
                        const hasBadWord = badWords.some(w => lowerName.includes(w));
                        if (hasBadWord) {
                            alert("El nombre contiene palabras no permitidas. Por favor utiliza tu nombre real.");
                            return;
                        }

                        // Generate verification code: studentName-gameId-packId-score-hash
                        const rawData = `${nameVal}|sniper|${this.engine.packId}|${this.sniperScore}`;
                        const hash = await Utils.sha256(rawData + "|estudiapp_secret_salt_2026");
                        const verifCode = `${nameVal}-sniper-${this.engine.packId}-${this.sniperScore}-${hash.substring(0, 16)}`;

                        const resultDiv = sniperArea.querySelector('#taskCodeResult');
                        const textCode = sniperArea.querySelector('#taskCodeTextarea');
                        if (resultDiv && textCode) {
                            textCode.value = verifCode;
                            resultDiv.style.display = 'block';
                        }
                    };
                }

                // Copy code action
                const btnCopy = sniperArea.querySelector('#btnCopyTaskCode');
                if (btnCopy) {
                    btnCopy.onclick = () => {
                        const textCode = sniperArea.querySelector('#taskCodeTextarea');
                        if (textCode) {
                            textCode.select();
                            document.execCommand('copy');
                            btnCopy.innerText = "¡Copiado! ✓";
                            setTimeout(() => btnCopy.innerText = "📋 Copiar Código", 2000);
                        }
                    };
                }
            }
        }
    }

    stop() {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        if (this.sniperSpawnTimeout) {
            clearTimeout(this.sniperSpawnTimeout);
            this.sniperSpawnTimeout = null;
        }

        const sniperArea = this.engine.elements.sniperArea;
        const input = sniperArea?.querySelector('#sniperInput');
        if (input && this.keydownHandler) {
            input.removeEventListener('keydown', this.keydownHandler);
        }

        this._sniperTarget = null;
        this.enemies = [];
        this.lasers = [];
        this.particles = [];
        this.stars = [];
        this.canvas = null;
        this.ctx = null;
    }
}
