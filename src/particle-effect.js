// Класс Частицы (адаптирован для работы внутри ParticleEffect)
class Particle {
    // Конструктор принимает настройки из экземпляра ParticleEffect
    constructor(canvas, ctx, settings) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.settings = settings; // Сохраняем настройки
        this.reset(true); // Инициализация состояния
    }

    reset(isFirstReset = false) {
        // Рассчитываем область спавна с учетом отступов
        const spawnAreaWidth = Math.max(0, this.canvas.width - 2 * this.settings.particleSpawnMargin);
        const spawnAreaHeight = Math.max(0, this.canvas.height - 2 * this.settings.particleSpawnMargin);

        // Начальная позиция в пределах области спавна
        this.x = this.settings.particleSpawnMargin + Math.random() * spawnAreaWidth;
        this.y = this.settings.particleSpawnMargin + Math.random() * spawnAreaHeight;
        // Гарантия нахождения в пределах холста
        this.x = Math.max(0, Math.min(this.x, this.canvas.width));
        this.y = Math.max(0, Math.min(this.y, this.canvas.height));

        // Случайный радиус
        this.radius = Math.random() * (this.settings.maxRadius - this.settings.minRadius) + this.settings.minRadius;

        // Случайное направление и скорость
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * (this.settings.maxSpeed - this.settings.minSpeed) + this.settings.minSpeed;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;

        // Начальная прозрачность (черные или полупрозрачные)
        if (Math.random() < this.settings.blackRatioPercent / 100.0) {
            this.initialOpacity = 1.0; // Черные (непрозрачные)
        } else {
            this.initialOpacity = Math.random() * (this.settings.maxSemiTransparentOpacity - this.settings.minSemiTransparentOpacity) + this.settings.minSemiTransparentOpacity;
        }

        // Случайное время жизни
        this.lifetimeSeconds = Math.random() * (this.settings.maxLifetimeSeconds - this.settings.minLifetimeSeconds) + this.settings.minLifetimeSeconds;

        // Начальный возраст и прозрачность
        if (isFirstReset) {
            // При первом запуске даем случайный возраст для разнообразия
            this.ageSeconds = Math.random() * this.lifetimeSeconds;
            this.calculateCurrentOpacity(); // Рассчитываем начальную прозрачность
        } else {
            // При ресете возраст и прозрачность обнуляются (для fadeIn)
            this.ageSeconds = 0;
            this.currentOpacity = 0;
        }
    }

    // Расчет текущей прозрачности с учетом fadeIn, lifetime и fadeOut
    calculateCurrentOpacity() {
         const fadeInEndTime = this.settings.fadeInDurationSeconds;
         const fadeOutStartTime = Math.max(fadeInEndTime, this.lifetimeSeconds - this.settings.fadeOutDurationSeconds);

         if (this.ageSeconds < fadeInEndTime) {
             // Фаза Fade In
             const effectiveFadeInDuration = Math.max(0.001, fadeInEndTime); // Избегаем деления на ноль
             const fadeInProgress = Math.max(0, Math.min(1, this.ageSeconds / effectiveFadeInDuration));
             this.currentOpacity = this.initialOpacity * fadeInProgress;
         } else if (this.ageSeconds < fadeOutStartTime) {
             // Фаза полной видимости
             this.currentOpacity = this.initialOpacity;
         } else {
             // Фаза Fade Out
             const effectiveFadeOutDuration = Math.max(0.001, this.settings.fadeOutDurationSeconds); // Избегаем деления на ноль
             const timeIntoFadeOut = this.ageSeconds - fadeOutStartTime;
             const fadeOutProgress = Math.min(1, timeIntoFadeOut / effectiveFadeOutDuration);
             this.currentOpacity = this.initialOpacity * (1 - fadeOutProgress);
         }
         // Ограничиваем прозрачность между 0 и начальным значением
         this.currentOpacity = Math.max(0, Math.min(this.initialOpacity, this.currentOpacity));
    }

    // Обновление состояния частицы за прошедшее время
    update(deltaTimeSeconds) {
        this.ageSeconds += deltaTimeSeconds;

        // Если частица прожила свое время, ресетим ее
        if (this.ageSeconds >= this.lifetimeSeconds) {
            this.reset(false);
            return;
        }

        // Двигаем частицу
        this.x += this.vx;
        this.y += this.vy;

        // Обновляем прозрачность
        this.calculateCurrentOpacity();

        // Если частица полностью ушла за пределы холста, ресетим ее
        // Проверяем только если она видима (currentOpacity > 0)
         if (this.currentOpacity > 0 && (this.x + this.radius < 0 ||
            this.x - this.radius > this.canvas.width ||
            this.y + this.radius < 0 ||
            this.y - this.radius > this.canvas.height))
        {
            this.reset(false);
        }
    }

    // Отрисовка частицы
    draw() {
        // Не рисуем, если полностью прозрачна
        if (this.currentOpacity <= 0) return;

        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);

        // Базовая прозрачность из расчета жизни
        let baseAlpha = Math.max(0, Math.min(1, this.currentOpacity));

        // --- Расчет затухания у краев холста ---
        const smallerDim = Math.min(this.canvas.width, this.canvas.height);
        const fadeDistancePx = smallerDim * (this.settings.edgeFadePercent / 100.0);

        const distX = Math.min(this.x, this.canvas.width - this.x);
        const distY = Math.min(this.y, this.canvas.height - this.y);
        const minDist = Math.min(distX, distY);
        let edgeFadeFactor = 1.0;

        if (fadeDistancePx > 0 && minDist < fadeDistancePx) {
            // Используем квадратичное затухание для плавности
            const normalizedDist = Math.max(0, Math.min(1, minDist / fadeDistancePx));
            edgeFadeFactor = normalizedDist * normalizedDist;
        }

        // Итоговая прозрачность с учетом затухания у краев
        const finalAlpha = Math.max(0, Math.min(1, baseAlpha * edgeFadeFactor));

        // Не рисуем, если итоговая прозрачность нулевая
        if (finalAlpha <= 0) return;

        // Устанавливаем цвет и прозрачность
        const baseRgb = this.settings.particleColor.substring(this.settings.particleColor.indexOf('(') + 1, this.settings.particleColor.lastIndexOf(',')).trim();
        this.ctx.fillStyle = `rgba(${baseRgb}, ${finalAlpha})`;
        this.ctx.fill();
    }
}


// --- Основной класс библиотеки ---
class ParticleEffect {
    // Настройки по умолчанию
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
        autoStart: true, // Добавим опцию автостарта
    };

    constructor(targetElement, userConfig = {}) {
        if (!targetElement || !(targetElement instanceof Element)) {
            console.error('ParticleEffect: targetElement is not a valid DOM Element.');
            return;
        }
        this.targetElement = targetElement;

        // Объединяем пользовательские настройки с дефолтными
        this.config = { ...ParticleEffect.defaultConfig, ...userConfig };

        // --- Создание Canvas ---
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.targetElement.style.position = 'relative'; // Для позиционирования canvas
        this.canvas.style.position = 'absolute';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.pointerEvents = 'none'; // Чтобы не мешал кликам по элементу
        this.targetElement.appendChild(this.canvas);

        // --- Инициализация состояния ---
        this.particles = [];
        this.animationFrameId = null;
        this.lastTimestamp = 0;
        this.isActive = false;
        this.isDestroyed = false;

        // --- Привязка методов к контексту ---
        this._animate = this._animate.bind(this);
        this._resizeCanvas = this._resizeCanvas.bind(this);

        // --- Наблюдатель за размером ---
        // Используем ResizeObserver для отслеживания изменения размера родительского элемента
        this.resizeObserver = new ResizeObserver(entries => {
            // Обычно тут одна запись, но на всякий случай
            for (let entry of entries) {
                // Запускаем ресайз с небольшой задержкой для оптимизации
                if (this._resizeTimeout) clearTimeout(this._resizeTimeout);
                this._resizeTimeout = setTimeout(this._resizeCanvas, 50);
            }
        });
        this.resizeObserver.observe(this.targetElement);

        // Первичная установка размера
        this._resizeCanvas();

        // Автостарт, если включен
        if (this.config.autoStart) {
            this.start();
        }
    }

    // --- Приватные методы ---

    // Обновление размера Canvas и пересоздание частиц (если активен)
    _resizeCanvas() {
        if (this.isDestroyed) return;
        // Используем реальные размеры элемента для canvas
        this.canvas.width = this.targetElement.offsetWidth;
        this.canvas.height = this.targetElement.offsetHeight;

        // Пересоздаем частицы только если эффект активен
        if (this.isActive) {
            this._createParticles();
        }
    }

    // Создание/пересоздание массива частиц
    _createParticles() {
        if (this.isDestroyed || this.canvas.width === 0 || this.canvas.height === 0) {
            this.particles = [];
            return;
        }

        // Расчет количества частиц на основе плотности
        const canvasArea = this.canvas.width * this.canvas.height;
        const densityPerPixel = this.config.particleDensity / 10000.0; // Плотность на px²
        const calculatedCount = Math.round(canvasArea * densityPerPixel);

        // Ограничение количества для производительности
        const finalParticleCount = Math.max(10, Math.min(calculatedCount, 3000)); // От 10 до 3000

        this.particles = []; // Очищаем старые частицы
        for (let i = 0; i < finalParticleCount; i++) {
            this.particles.push(new Particle(this.canvas, this.ctx, this.config));
        }
    }

    // Основной цикл анимации
    _animate(timestamp) {
        // Останавливаем цикл, если не активен или уничтожен
        if (!this.isActive || this.isDestroyed) {
            this.animationFrameId = null;
            return;
        }

        // Расчет времени кадра (deltaTimeSeconds)
        const deltaTimeSeconds = (timestamp - (this.lastTimestamp || timestamp)) / 1000;
        this.lastTimestamp = timestamp;

        const maxDeltaTime = 0.05; // Макс. время кадра (чтобы избежать "прыжков" при лагах)
        const dt = deltaTimeSeconds <= 0 ? (1 / 60) : deltaTimeSeconds; // Безопасное значение, если timestamp не изменился
        const clampedDeltaTime = Math.min(dt, maxDeltaTime);

        // Очистка холста
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Обновление и отрисовка каждой частицы
        this.particles.forEach(particle => {
            particle.update(clampedDeltaTime);
            particle.draw();
        });

        // Запрос следующего кадра анимации
        this.animationFrameId = requestAnimationFrame(this._animate);
    }

    // --- Публичные методы API ---

    /**
     * Запускает анимацию частиц.
     */
    start() {
        if (this.isActive || this.isDestroyed) return;
        this.isActive = true;
        console.log('ParticleEffect: Starting animation');

        // Убедимся, что размер актуален перед стартом
        this._resizeCanvas(); // Это также вызовет _createParticles()

        // Начинаем цикл анимации, если еще не запущен
        if (!this.animationFrameId) {
             // Устанавливаем lastTimestamp перед первым кадром
            this.lastTimestamp = performance.now();
            this.animationFrameId = requestAnimationFrame(this._animate);
        }
    }

    /**
     * Останавливает анимацию частиц.
     */
    stop() {
        if (!this.isActive || this.isDestroyed) return;
        this.isActive = false;
        console.log('ParticleEffect: Stopping animation');

        // Отменяем следующий кадр анимации
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        // Очищаем холст при остановке, чтобы частицы исчезли
        if (this.ctx && this.canvas) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
         // Опционально: можно очистить холст при остановке
        // this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * Переключает состояние анимации (запущена/остановлена).
     */
    toggle() {
        if (this.isDestroyed) return;
        if (this.isActive) {
            this.stop();
        } else {
            this.start();
        }
    }

   /**
     * Обновляет конфигурацию эффекта новыми настройками.
     * @param {object} newConfig - Объект с новыми параметрами для обновления.
     */
    updateConfig(newConfig) {
        if (this.isDestroyed || !newConfig) return;

        // Обновляем конфиг, объединяя старый, дефолтный и новый
        this.config = { ...ParticleEffect.defaultConfig, ...this.config, ...newConfig };
        console.log('ParticleEffect: Config updated', this.config);

        // Если эффект активен, пересоздаем частицы с новым конфигом
        if (this.isActive) {
            this._createParticles();
        } else {
            // Если не активен, просто очистим массив, чтобы при следующем start()
            // частицы создались с новым конфигом.
             this.particles = [];
        }
    }


    /**
     * Полностью останавливает эффект, очищает ресурсы и удаляет canvas.
     */
    destroy() {
        if (this.isDestroyed) return;
        console.log('ParticleEffect: Destroying instance');
        this.isDestroyed = true;
        this.stop(); // Останавливаем анимацию

        // Отключаем наблюдатель за размером
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
            this.resizeObserver = null;
        }
        if (this._resizeTimeout) {
             clearTimeout(this._resizeTimeout);
        }


        // Удаляем canvas из DOM
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }

        // Очищаем ссылки
        this.particles = [];
        this.canvas = null;
        this.ctx = null;
        this.targetElement = null;
        this.config = null;
    }
}

// Экспортируем класс для использования в других модулях
export default ParticleEffect;