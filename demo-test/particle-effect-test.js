// Particle class (adapted for use inside ParticleEffect)
class Particle {
    // Constructor takes settings from the ParticleEffect instance
    constructor(canvas, ctx, settings) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.settings = settings; // Save settings
        this.reset(true); // Initialize state
    }

    reset(isFirstReset = false) {
        // Calculate spawn area with margins
        const spawnAreaWidth = Math.max(0, this.canvas.width - 2 * this.settings.particleSpawnMargin);
        const spawnAreaHeight = Math.max(0, this.canvas.height - 2 * this.settings.particleSpawnMargin);

        // Initial position within spawn area
        this.x = this.settings.particleSpawnMargin + Math.random() * spawnAreaWidth;
        this.y = this.settings.particleSpawnMargin + Math.random() * spawnAreaHeight;
        // Ensure position is within canvas bounds
        this.x = Math.max(0, Math.min(this.x, this.canvas.width));
        this.y = Math.max(0, Math.min(this.y, this.canvas.height));

        // Random radius
        this.radius = Math.random() * (this.settings.maxRadius - this.settings.minRadius) + this.settings.minRadius;

        // Random direction and speed
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * (this.settings.maxSpeed - this.settings.minSpeed) + this.settings.minSpeed;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;

        // Initial opacity (black or semi-transparent)
        if (Math.random() < this.settings.blackRatioPercent / 100.0) {
            this.initialOpacity = 1.0; // Black (opaque)
        } else {
            this.initialOpacity = Math.random() * (this.settings.maxSemiTransparentOpacity - this.settings.minSemiTransparentOpacity) + this.settings.minSemiTransparentOpacity;
        }

        // Random lifetime
        this.lifetimeSeconds = Math.random() * (this.settings.maxLifetimeSeconds - this.settings.minLifetimeSeconds) + this.settings.minLifetimeSeconds;

        // Initial age and opacity
        if (isFirstReset) {
            // On first reset, give a random age for diversity
            this.ageSeconds = Math.random() * this.lifetimeSeconds;
            this.calculateCurrentOpacity(); // Calculate initial opacity
        } else {
            // On subsequent resets, age and opacity are reset (for fadeIn)
            this.ageSeconds = 0;
            this.currentOpacity = 0;
        }
    }

    // Calculate current opacity based on fadeIn, lifetime, and fadeOut
    calculateCurrentOpacity() {
         const fadeInEndTime = this.settings.fadeInDurationSeconds;
         const fadeOutStartTime = Math.max(fadeInEndTime, this.lifetimeSeconds - this.settings.fadeOutDurationSeconds);

         if (this.ageSeconds < fadeInEndTime) {
             // Fade In phase
             const effectiveFadeInDuration = Math.max(0.001, fadeInEndTime); // Avoid division by zero
             const fadeInProgress = Math.max(0, Math.min(1, this.ageSeconds / effectiveFadeInDuration));
             this.currentOpacity = this.initialOpacity * fadeInProgress;
         } else if (this.ageSeconds < fadeOutStartTime) {
             // Full visibility phase
             this.currentOpacity = this.initialOpacity;
         } else {
             // Fade Out phase
             const effectiveFadeOutDuration = Math.max(0.001, this.settings.fadeOutDurationSeconds); // Avoid division by zero
             const timeIntoFadeOut = this.ageSeconds - fadeOutStartTime;
             const fadeOutProgress = Math.min(1, timeIntoFadeOut / effectiveFadeOutDuration);
             this.currentOpacity = this.initialOpacity * (1 - fadeOutProgress);
         }
         // Limit opacity between 0 and initial value
         this.currentOpacity = Math.max(0, Math.min(this.initialOpacity, this.currentOpacity));
    }

    // Update particle state for elapsed time
    update(deltaTimeSeconds) {
        this.ageSeconds += deltaTimeSeconds;

        // If the particle has lived its lifetime, reset it
        if (this.ageSeconds >= this.lifetimeSeconds) {
            this.reset(false);
            return;
        }

        // Move the particle
        this.x += this.vx;
        this.y += this.vy;

        // Update opacity
        this.calculateCurrentOpacity();

        // If the particle has completely gone outside the canvas, reset it
        // Only check if it's visible (currentOpacity > 0)
         if (this.currentOpacity > 0 && (this.x + this.radius < 0 ||
            this.x - this.radius > this.canvas.width ||
            this.y + this.radius < 0 ||
            this.y - this.radius > this.canvas.height))
        {
            this.reset(false);
        }
    }

    // Draw the particle
    draw() {
        // Don't draw if completely transparent
        if (this.currentOpacity <= 0) return;

        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);

        // Base opacity from lifetime calculation
        let baseAlpha = Math.max(0, Math.min(1, this.currentOpacity));

        // --- Calculate edge fading ---
        const smallerDim = Math.min(this.canvas.width, this.canvas.height);
        const fadeDistancePx = smallerDim * (this.settings.edgeFadePercent / 100.0);

        const distX = Math.min(this.x, this.canvas.width - this.x);
        const distY = Math.min(this.y, this.canvas.height - this.y);
        const minDist = Math.min(distX, distY);
        let edgeFadeFactor = 1.0;

        if (fadeDistancePx > 0 && minDist < fadeDistancePx) {
            // Use quadratic fade for smoothness
            const normalizedDist = Math.max(0, Math.min(1, minDist / fadeDistancePx));
            edgeFadeFactor = normalizedDist * normalizedDist;
        }

        // Final opacity with edge fading
        const finalAlpha = Math.max(0, Math.min(1, baseAlpha * edgeFadeFactor));

        // Don't draw if final opacity is zero
        if (finalAlpha <= 0) return;

        // Set color and opacity
        const baseRgb = this.settings.particleColor.substring(this.settings.particleColor.indexOf('(') + 1, this.settings.particleColor.lastIndexOf(',')).trim();
        this.ctx.fillStyle = `rgba(${baseRgb}, ${finalAlpha})`;
        this.ctx.fill();
    }
}


// --- Main library class ---
class ParticleEffect {
    // Default settings
    static defaultConfig = {
        particleDensity: 150,
        particleColor: 'rgba(30, 30, 30, 0.7)',
        minSpeed: 0.15,
        maxSpeed: 0.5,
        minRadius: 0.5,
        maxRadius: 1.2,
        particleSpawnMargin: 10,
        edgeFadePercent: 15,
        minLifetimeSeconds: 1.5,
        maxLifetimeSeconds: 4.0,
        fadeOutDurationSeconds: 0.5,
        fadeInDurationSeconds: 0.5,
        blackRatioPercent: 50,
        minSemiTransparentOpacity: 0.2,
        maxSemiTransparentOpacity: 0.7,
        autoStart: true, // Original autoStart option
        
        // Новые параметры для скрытия элементов
        autoHideTarget: true,             // Автоматически скрывать целевой элемент при запуске
        targetFadeDuration: 0.3,          // Длительность анимации в секундах
        targetContentSelector: null,      // Селектор для элемента внутри (если null, используется весь targetElement)
        targetHideMethod: 'opacity-visibility', // Метод скрытия: 'opacity', 'visibility', 'display', 'opacity-visibility'
        targetHideClass: null,            // Альтернативно: имя класса для скрытия элемента
        targetTimingFunction: 'ease'      // Функция времени для анимации
    };

    constructor(targetElement, userConfig = {}) {
        if (!targetElement || !(targetElement instanceof Element)) {
            console.error('ParticleEffect: targetElement is not a valid DOM Element.');
            return;
        }
        this.targetElement = targetElement;

        // Merge user settings with defaults
        this.config = { ...ParticleEffect.defaultConfig, ...userConfig };

        // --- Create Canvas ---
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.targetElement.style.position = 'relative'; // For canvas positioning
        this.canvas.style.position = 'absolute';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.pointerEvents = 'none'; // To not interfere with clicks on the element
        this.targetElement.appendChild(this.canvas);

        // Найти и сохранить ссылку на содержимое, которое будем скрывать
        if (this.config.targetContentSelector) {
            this.contentToHide = this.targetElement.querySelector(this.config.targetContentSelector);
        } else {
            // Если селектор не задан, скрываем весь targetElement
            this.contentToHide = this.targetElement;
        }
        
        // Настроить стили для плавного перехода, если включено автоскрытие
        if (this.config.autoHideTarget && this.contentToHide) {
            // Сохраним оригинальные стили для восстановления при destroy()
            this.originalStyles = {
                transition: this.contentToHide.style.transition,
                opacity: this.contentToHide.style.opacity,
                visibility: this.contentToHide.style.visibility,
                display: this.contentToHide.style.display
            };
            
            // Если используется класс для скрытия
            if (this.config.targetHideClass) {
                // Ничего не делаем с инлайн-стилями, будем добавлять/удалять класс
            } else {
                // Установить стили для плавного перехода в зависимости от метода скрытия
                if (this.config.targetHideMethod === 'opacity' || 
                    this.config.targetHideMethod === 'opacity-visibility') {
                    this.contentToHide.style.transition = 
                        `opacity ${this.config.targetFadeDuration}s ${this.config.targetTimingFunction}`;
                }
                
                if (this.config.targetHideMethod === 'visibility' || 
                    this.config.targetHideMethod === 'opacity-visibility') {
                    // Добавляем transition для visibility, если нужно
                    if (this.contentToHide.style.transition) {
                        this.contentToHide.style.transition += 
                            `, visibility ${this.config.targetFadeDuration}s ${this.config.targetTimingFunction}`;
                    } else {
                        this.contentToHide.style.transition = 
                            `visibility ${this.config.targetFadeDuration}s ${this.config.targetTimingFunction}`;
                    }
                }
            }
        }

        // --- Initialize state ---
        this.particles = [];
        this.animationFrameId = null;
        this.lastTimestamp = 0;
        this.isActive = false;
        this.isDestroyed = false;

        // --- Bind methods to context ---
        this._animate = this._animate.bind(this);
        this._resizeCanvas = this._resizeCanvas.bind(this);

        // --- Use ResizeObserver to track parent element size changes ---
        this.resizeObserver = new ResizeObserver(entries => {
            // Usually there's just one entry, but just in case
            for (const entry of entries) {
                // Run resize with a small delay for optimization
                if (entry.target === this.targetElement && !this.isDestroyed) {
                    window.requestAnimationFrame(this._resizeCanvas);
                }
            }
        });
        this.resizeObserver.observe(this.targetElement);

        // Initial size setup
        this._resizeCanvas();

        // Auto-start if enabled
        if (this.config.autoStart) {
            this.start();
        }
    }

    // Update Canvas size and recreate particles (if active)
    _resizeCanvas() {
        if (this.isDestroyed) return;

        // Use the actual element dimensions for the canvas
        this.canvas.width = this.targetElement.clientWidth;
        this.canvas.height = this.targetElement.clientHeight;

        // Recreate particles only if the effect is active
        if (this.isActive) {
            this._createParticles();
        }
    }

    // Create/recreate particle array
    _createParticles() {
        if (this.isDestroyed) return;

        // Get dimensions in case _createParticles was called directly
        const width = this.canvas.width;
        const height = this.canvas.height;

        // Calculate particle count based on density
        const areaPixels = width * height;
        const densityPerPixel = this.config.particleDensity / 10000.0; // Density per px²
        const calculatedCount = Math.floor(areaPixels * densityPerPixel);

        // Limit count for performance
        const finalParticleCount = Math.max(10, Math.min(calculatedCount, 3000)); // From 10 to 3000

        this.particles = []; // Clear old particles
        for (let i = 0; i < finalParticleCount; i++) {
            this.particles.push(new Particle(this.canvas, this.ctx, this.config));
        }
    }

    // Main animation loop
    _animate(timestamp) {
        // Stop the loop if not active or destroyed
        if (!this.isActive || this.isDestroyed) {
            this.animationFrameId = null;
            return;
        }

        // Calculate frame time (deltaTimeSeconds)
        const deltaTimeSeconds = this.lastTimestamp ? (timestamp - this.lastTimestamp) / 1000 : 0;
        this.lastTimestamp = timestamp;

        const maxDeltaTime = 0.05; // Max frame time (to avoid "jumps" during lag)
        const dt = deltaTimeSeconds <= 0 ? (1 / 60) : deltaTimeSeconds; // Safe value if timestamp hasn't changed
        const limitedDt = Math.min(dt, maxDeltaTime);

        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Update and draw each particle
        for (const particle of this.particles) {
            particle.update(limitedDt);
            particle.draw();
        }

        // Request next animation frame
        this.animationFrameId = window.requestAnimationFrame(this._animate);
    }

    // Метод для скрытия содержимого
    _hideContent() {
        if (!this.config.autoHideTarget || !this.contentToHide) return;
        
        if (this.config.targetHideClass) {
            // Используем класс для скрытия
            this.contentToHide.classList.add(this.config.targetHideClass);
        } else {
            // Используем инлайн-стили в зависимости от выбранного метода
            switch(this.config.targetHideMethod) {
                case 'opacity':
                    this.contentToHide.style.opacity = '0';
                    break;
                case 'visibility':
                    this.contentToHide.style.visibility = 'hidden';
                    break;
                case 'display':
                    // Для display не используем анимацию, просто скрываем
                    this.contentToHide.style.display = 'none';
                    break;
                case 'opacity-visibility':
                default:
                    this.contentToHide.style.opacity = '0';
                    this.contentToHide.style.visibility = 'hidden';
                    break;
            }
        }
    }

    // Метод для показа содержимого
    _showContent() {
        if (!this.config.autoHideTarget || !this.contentToHide) return;
        
        if (this.config.targetHideClass) {
            // Используем класс для показа (удаляем класс скрытия)
            this.contentToHide.classList.remove(this.config.targetHideClass);
        } else {
            // Используем инлайн-стили в зависимости от выбранного метода
            switch(this.config.targetHideMethod) {
                case 'opacity':
                    this.contentToHide.style.opacity = '1';
                    break;
                case 'visibility':
                    this.contentToHide.style.visibility = 'visible';
                    break;
                case 'display':
                    // Восстанавливаем исходное значение display
                    this.contentToHide.style.display = this.originalStyles.display || '';
                    break;
                case 'opacity-visibility':
                default:
                    this.contentToHide.style.opacity = '1';
                    this.contentToHide.style.visibility = 'visible';
                    break;
            }
        }
    }
    
    // --- Public API ---

    /**
     * Starts the particle animation
     */
    start() {
        if (this.isDestroyed || this.isActive) return;
        this.isActive = true;
        
        // Скрыть содержимое
        this._hideContent();

        // Ensure size is up-to-date before starting
        this._resizeCanvas(); // This will also call _createParticles()

        // Start animation loop if not already running
        if (!this.animationFrameId) {
            // Set lastTimestamp before first frame
            this.lastTimestamp = performance.now();
            this.animationFrameId = window.requestAnimationFrame(this._animate);
        }
    }

    /**
     * Stops the particle animation
     */
    stop() {
        if (this.isDestroyed || !this.isActive) return;
        this.isActive = false;
        
        // Показать содержимое
        this._showContent();

        // Cancel next animation frame
        if (this.animationFrameId) {
            window.cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }

        // Clear canvas when stopping to make particles disappear
        if (this.ctx) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    /**
     * Toggles the particle animation state
     */
    toggle() {
        if (this.isActive) {
            this.stop();
        } else {
            this.start();
        }
    }

    /**
     * Updates the configuration with new options
     * @param {Object} newConfig - New configuration options
     */
    updateConfig(newConfig) {
        if (this.isDestroyed) return;
        
        // Текущее состояние автоскрытия
        const wasAutoHideEnabled = this.config.autoHideTarget;

        // Update config by merging old, default, and new
        this.config = { ...ParticleEffect.defaultConfig, ...this.config, ...newConfig };

        // Если изменился параметр autoHideTarget
        if (wasAutoHideEnabled !== this.config.autoHideTarget) {
            if (this.config.autoHideTarget) {
                // Настроить стили для плавного перехода
                if (this.contentToHide) {
                    // Сохраним оригинальные стили если еще не сохранены
                    if (!this.originalStyles) {
                        this.originalStyles = {
                            transition: this.contentToHide.style.transition,
                            opacity: this.contentToHide.style.opacity,
                            visibility: this.contentToHide.style.visibility,
                            display: this.contentToHide.style.display
                        };
                    }
                    
                    // Установить стили для плавного перехода
                    if (!this.config.targetHideClass) {
                        if (this.config.targetHideMethod === 'opacity' || 
                            this.config.targetHideMethod === 'opacity-visibility') {
                            this.contentToHide.style.transition = 
                                `opacity ${this.config.targetFadeDuration}s ${this.config.targetTimingFunction}`;
                        }
                        
                        if (this.config.targetHideMethod === 'visibility' || 
                            this.config.targetHideMethod === 'opacity-visibility') {
                            if (this.contentToHide.style.transition) {
                                this.contentToHide.style.transition += 
                                    `, visibility ${this.config.targetFadeDuration}s ${this.config.targetTimingFunction}`;
                            } else {
                                this.contentToHide.style.transition = 
                                    `visibility ${this.config.targetFadeDuration}s ${this.config.targetTimingFunction}`;
                            }
                        }
                    }
                    
                    // Скрыть, если эффект активен
                    if (this.isActive) {
                        this._hideContent();
                    }
                }
            } else {
                // Восстановить видимость если выключили autoHide
                if (this.contentToHide) {
                    this._showContent();
                    
                    // Оставим transition для плавного возвращения видимости
                    setTimeout(() => {
                        // Восстановить оригинальные стили transition после анимации
                        if (this.originalStyles && !this.config.autoHideTarget) {
                            this.contentToHide.style.transition = this.originalStyles.transition || '';
                        }
                    }, this.config.targetFadeDuration * 1000);
                }
            }
        }

        // If the effect is active, recreate particles with new config
        if (this.isActive) {
            this._createParticles();
        } else {
            // If not active, just clear the array so that on next start()
            // particles will be created with the new config.
            this.particles = [];
        }
    }

    /**
     * Destroys the particle effect and removes resources
     */
    destroy() {
        if (this.isDestroyed) return;
        
        // Восстановить оригинальные стили
        if (this.config.autoHideTarget && this.contentToHide && this.originalStyles) {
            if (this.config.targetHideClass) {
                // Удаляем класс скрытия, если он был добавлен
                this.contentToHide.classList.remove(this.config.targetHideClass);
            } else {
                // Восстанавливаем оригинальные стили
                this.contentToHide.style.transition = this.originalStyles.transition || '';
                this.contentToHide.style.opacity = this.originalStyles.opacity || '';
                this.contentToHide.style.visibility = this.originalStyles.visibility || '';
                this.contentToHide.style.display = this.originalStyles.display || '';
            }
        }

        this.isDestroyed = true;
        this.stop(); // Stop animation

        // Disconnect the resize observer
        if (this.resizeObserver) {
            try {
                this.resizeObserver.disconnect();
            } catch (e) {
                console.warn('Error disconnecting ResizeObserver:', e);
            }
        }

        // Remove canvas from DOM
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }

        // Clear references
        this.resizeObserver = null;
        this.canvas = null;
        this.ctx = null;
        this.particles = [];
    }
}

// Export the class for use in other modules
export default ParticleEffect; 