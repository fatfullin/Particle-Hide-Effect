// Функция для создания эффекта частиц, привязанного к конкретному элементу
function createParticleEffect(targetElement, options = {}) {
    // Настройки по умолчанию
    const settings = {
        particleCount: options.particleCount || 5000,
        particleSize: options.particleSize || { min: 0.5, max: 2 },
        particleColor: options.particleColor || 'rgb(255, 255, 255)',
        backgroundColor: options.backgroundColor || 'rgb(17, 17, 17)',
        speed: options.speed || { min: 0.1, max: 0.4 },
        fadeEdges: options.fadeEdges || false,
        shrinkEdges: options.shrinkEdges || false, // Новый параметр для уменьшения размера у краев
        edgeThreshold: options.edgeThreshold || 0.15, // Размер области у края для затухания/уменьшения (15% от размера)
        useRetina: options.useRetina !== undefined ? options.useRetina : true, // По умолчанию используем поддержку Retina
        borderRadius: options.borderRadius || 0, // Радиус скругления углов канваса
        animateOpacity: options.animateOpacity !== undefined ? options.animateOpacity : false, // Анимация прозрачности частиц
        useLifespan: options.useLifespan !== undefined ? options.useLifespan : false, // Включение системы времени жизни
        lifespanMin: options.lifespanMin || 1000, // Минимальное время жизни частицы в мс (1 секунда)
        lifespanMax: options.lifespanMax || 2000, // Максимальное время жизни частицы в мс (2 секунды)
        fadeTime: options.fadeTime || 300, // Время затухания/появления в мс (300мс = 0.3 секунды)
        useZones: options.useZones !== undefined ? options.useZones : false, // Включение системы зон
        centerZoneSize: options.centerZoneSize || 0.7, // Размер центральной зоны (70% от размера контейнера)
        flyoutChance: options.flyoutChance || 0.01, // Шанс, что частица вылетит наружу (1%)
        flyoutParticles: options.flyoutParticles || 0.15, // Процент частиц, которые могут вылетать (15% от всех частиц)
        returnChance: options.returnChance || 0.03 // Шанс, что частица вернется в центральную зону (3% каждый кадр)
    };
    
    // Создаем контейнер для canvas и размещаем его внутри целевого элемента
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.overflow = 'hidden';
    container.style.pointerEvents = 'none'; // Чтобы можно было кликать через canvas
    
    // Если задан радиус скругления, применяем его к контейнеру
    if (settings.borderRadius > 0) {
        container.style.borderRadius = `${settings.borderRadius}px`;
    }
    
    // Создаем canvas и размещаем его внутри контейнера
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Получаем pixel ratio устройства для поддержки Retina дисплеев
    const pixelRatio = settings.useRetina ? (window.devicePixelRatio || 1) : 1;
    
    // Позиционируем canvas внутри контейнера
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    
    // Сохраняем оригинальное состояние элемента
    const originalPosition = window.getComputedStyle(targetElement).position;
    if (originalPosition === 'static') {
        targetElement.style.position = 'relative';
    }
    
    // Добавляем контейнер в целевой элемент, а canvas в контейнер
    container.appendChild(canvas);
    targetElement.appendChild(container);
    
    // Устанавливаем размер холста с учетом pixel ratio
    function resizeCanvas() {
        const rect = targetElement.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        
        // Устанавливаем размер холста с учетом pixel ratio
        canvas.width = width * pixelRatio;
        canvas.height = height * pixelRatio;
        
        // Масштабируем контекст для поддержки Retina
        if (pixelRatio > 1) {
            ctx.scale(pixelRatio, pixelRatio);
        }
        
        // Размер стилей остается прежним
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
    }
    
    // Вызываем изначально и при изменении размера окна
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Переменная для отслеживания времени
    let lastTime = Date.now();
    
    // Класс частицы
    class Particle {
        constructor() {
            this.reset();
        }
        
        reset(initialize = true) {
            // Размер
            this.baseSize = settings.particleSize.min + Math.random() * (settings.particleSize.max - settings.particleSize.min);
            this.size = this.baseSize; // Текущий размер (может меняться у краев)
            
            // Получаем размеры контейнера
            const rect = targetElement.getBoundingClientRect();
            const width = rect.width;
            const height = rect.height;
            
            // Всегда равномерно распределяем частицы по всему канвасу
            // независимо от настройки useZones
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            
            // Если включены зоны, инициализируем соответствующие свойства
            if (settings.useZones) {
                // Определяем, будет ли эта частица из тех, что могут вылетать
                this.canFlyout = Math.random() < settings.flyoutParticles;
                
                // Проверяем, находится ли частица в центральной зоне
                const centerWidth = width * settings.centerZoneSize;
                const centerHeight = height * settings.centerZoneSize;
                const centerX = (width - centerWidth) / 2;
                const centerY = (height - centerHeight) / 2;
                
                this.inCenterZone = (
                    this.x >= centerX && 
                    this.x <= (centerX + centerWidth) && 
                    this.y >= centerY && 
                    this.y <= (centerY + centerHeight)
                );
            }
            
            // Скорость и направление (увеличиваем скорость на 30%)
            const speedMultiplier = 1.3; // Увеличение на 30%
            this.speed = (settings.speed.min + Math.random() * (settings.speed.max - settings.speed.min)) * speedMultiplier;
            this.direction = Math.random() * Math.PI * 2;
            this.vx = Math.cos(this.direction) * this.speed;
            this.vy = Math.sin(this.direction) * this.speed;
            
            // Для плавных изменений направления
            this.noiseOffset = Math.random() * 1000;
            this.noiseIncrement = 0.005;
            
            // Прозрачность для краев
            this.alpha = 1.0;
            
            // Параметры для анимации прозрачности
            if (settings.animateOpacity) {
                // Базовая прозрачность (от 0.3 до 1.0)
                this.opacityBase = 0.3 + Math.random() * 0.7;
                // Текущая прозрачность для анимации
                this.opacity = this.opacityBase;
                // Направление изменения прозрачности (1: увеличение, -1: уменьшение)
                this.opacityDirection = Math.random() > 0.5 ? 1 : -1;
                // Скорость изменения прозрачности (разная у каждой частицы)
                this.opacitySpeed = 0.001 + Math.random() * 0.005;
            } else {
                this.opacity = 1.0;
            }
            
            // Параметры для системы времени жизни
            if (settings.useLifespan) {
                // Устанавливаем время жизни частицы (между min и max)
                this.lifespan = settings.lifespanMin + Math.random() * (settings.lifespanMax - settings.lifespanMin);
                
                // Если инициализируем в первый раз, устанавливаем случайное начальное время жизни
                if (initialize) {
                    this.life = Math.random() * this.lifespan;
                } else {
                    this.life = 0; // Новая частица начинает с 0
                }
                
                // Состояния цикла жизни: 0 = появление, 1 = жизнь, 2 = угасание
                this.lifeState = initialize ? Math.floor(Math.random() * 3) : 0;
                
                // Фактор видимости от времени жизни (для плавного появления и исчезновения)
                this.lifeFactor = this.lifeState === 0 ? this.life / settings.fadeTime : 
                                 this.lifeState === 2 ? 1 - ((this.life - (this.lifespan - settings.fadeTime)) / settings.fadeTime) : 1;
                                 
                // Ограничиваем lifeFactor значениями от 0 до 1
                this.lifeFactor = Math.max(0, Math.min(1, this.lifeFactor));
            }
        }
        
        update(deltaTime) {
            // Обновляем время жизни, если используется
            if (settings.useLifespan) {
                this.life += deltaTime;
                
                // Управление состояниями цикла жизни
                if (this.lifeState === 0 && this.life >= settings.fadeTime) {
                    // Переход от появления к жизни
                    this.lifeState = 1;
                } 
                else if (this.lifeState === 1 && this.life >= (this.lifespan - settings.fadeTime)) {
                    // Переход от жизни к угасанию
                    this.lifeState = 2;
                } 
                else if (this.lifeState === 2 && this.life >= this.lifespan) {
                    // Перерождение частицы
                    this.reset(false);
                    return;
                }
                
                // Обновляем фактор прозрачности на основе состояния цикла жизни
                if (this.lifeState === 0) {
                    // Появление - прозрачность от 0 до 1
                    this.lifeFactor = this.life / settings.fadeTime;
                } 
                else if (this.lifeState === 2) {
                    // Угасание - прозрачность от 1 до 0
                    this.lifeFactor = 1 - ((this.life - (this.lifespan - settings.fadeTime)) / settings.fadeTime);
                } 
                else {
                    // Обычная жизнь - полная прозрачность
                    this.lifeFactor = 1;
                }
                
                // Ограничиваем lifeFactor значениями от 0 до 1
                this.lifeFactor = Math.max(0, Math.min(1, this.lifeFactor));
            }
            
            // Обрабатываем поведение частицы в зонах, если включено
            if (settings.useZones && this.canFlyout) {
                const rect = targetElement.getBoundingClientRect();
                const width = rect.width;
                const height = rect.height;
                
                // Размеры центральной зоны
                const centerWidth = width * settings.centerZoneSize;
                const centerHeight = height * settings.centerZoneSize;
                
                // Положение центральной зоны (центрируем)
                const centerX = (width - centerWidth) / 2;
                const centerY = (height - centerHeight) / 2;
                
                // Определяем, находится ли частица в центральной зоне
                const inCenter = 
                    this.x >= centerX && 
                    this.x <= (centerX + centerWidth) && 
                    this.y >= centerY && 
                    this.y <= (centerY + centerHeight);
                
                // Если частица в центральной зоне и может вылететь
                if (inCenter && this.inCenterZone) {
                    // Шанс вылететь наружу
                    if (Math.random() < settings.flyoutChance) {
                        // Выбираем случайное направление к краю
                        const angle = Math.random() * Math.PI * 2;
                        this.direction = angle;
                        
                        // Увеличиваем скорость для более выраженного "выстрела"
                        this.speed *= 2.5;
                        
                        // Обновляем векторы скорости
                        this.vx = Math.cos(this.direction) * this.speed;
                        this.vy = Math.sin(this.direction) * this.speed;
                        
                        // Меняем состояние
                        this.inCenterZone = false;
                    }
                }
                // Если частица за пределами центральной зоны и может вернуться
                else if (!inCenter && !this.inCenterZone) {
                    // Шанс вернуться в центральную зону
                    if (Math.random() < settings.returnChance) {
                        // Направление к центру
                        const centerCenterX = centerX + centerWidth / 2;
                        const centerCenterY = centerY + centerHeight / 2;
                        
                        // Рассчитываем угол к центру
                        const dx = centerCenterX - this.x;
                        const dy = centerCenterY - this.y;
                        const angle = Math.atan2(dy, dx);
                        
                        // Устанавливаем направление с небольшой случайностью
                        this.direction = angle + (Math.random() - 0.5) * 0.5;
                        
                        // Восстанавливаем нормальную скорость
                        this.speed = (settings.speed.min + Math.random() * (settings.speed.max - settings.speed.min)) * 1.3;
                        
                        // Обновляем векторы скорости
                        this.vx = Math.cos(this.direction) * this.speed;
                        this.vy = Math.sin(this.direction) * this.speed;
                        
                        // Меняем состояние только если частица полностью вернулась в центр
                        if (inCenter) {
                            this.inCenterZone = true;
                        }
                    }
                }
            }
            
            // Используем шум Перлина для плавного изменения направления
            // Здесь мы просто имитируем эффект шума с помощью синуса/косинуса
            this.noiseOffset += this.noiseIncrement;
            
            // Плавно меняем направление (небольшое отклонение на каждом кадре)
            const angleChange = Math.sin(this.noiseOffset) * 0.1;
            this.direction += angleChange;
            
            // Небольшое случайное возмущение
            if (Math.random() < 0.1) {
                this.direction += (Math.random() - 0.5) * 0.2;
            }
            
            // Обновляем скорость по новому направлению
            this.vx = Math.cos(this.direction) * this.speed;
            this.vy = Math.sin(this.direction) * this.speed;
            
            // Обновляем позицию
            this.x += this.vx;
            this.y += this.vy;
            
            // Получаем текущие размеры для проверки границ
            const rect = targetElement.getBoundingClientRect();
            const width = rect.width;
            const height = rect.height;
            
            // Проверяем границы - мягко отталкиваемся от краев
            if (this.x < this.size) {
                this.x = this.size;
                this.direction = Math.PI - this.direction + (Math.random() - 0.5) * 0.5;
            } else if (this.x > width - this.size) {
                this.x = width - this.size;
                this.direction = Math.PI - this.direction + (Math.random() - 0.5) * 0.5;
            }
            
            if (this.y < this.size) {
                this.y = this.size;
                this.direction = -this.direction + (Math.random() - 0.5) * 0.5;
            } else if (this.y > height - this.size) {
                this.y = height - this.size;
                this.direction = -this.direction + (Math.random() - 0.5) * 0.5;
            }
            
            // Если включено уменьшение размера у краев
            if (settings.shrinkEdges) {
                // Определяем расстояние до ближайшего края в процентах от размера канваса
                const edgeX = Math.min(this.x, width - this.x) / width;
                const edgeY = Math.min(this.y, height - this.y) / height;
                const edgeDistance = Math.min(edgeX, edgeY);
                
                // Если мы находимся в зоне уменьшения (edgeThreshold определяет размер зоны)
                if (edgeDistance < settings.edgeThreshold) {
                    // Рассчитываем коэффициент размера: 0 на самом краю, 1 на границе зоны уменьшения
                    const scaleFactor = edgeDistance / settings.edgeThreshold;
                    // Применяем к базовому размеру частицы
                    this.size = this.baseSize * scaleFactor;
                } else {
                    this.size = this.baseSize;
                }
            }
            // Если включено затухание у краев, рассчитываем прозрачность
            else if (settings.fadeEdges) {
                // Определяем расстояние до ближайшего края в процентах от размера канваса
                const edgeX = Math.min(this.x, width - this.x) / width;
                const edgeY = Math.min(this.y, height - this.y) / height;
                const edgeDistance = Math.min(edgeX, edgeY);
                
                // Если мы находимся в зоне затухания (edgeThreshold определяет размер зоны)
                if (edgeDistance < settings.edgeThreshold) {
                    // Рассчитываем прозрачность: 0 на самом краю, 1 на границе зоны затухания
                    this.alpha = edgeDistance / settings.edgeThreshold;
                } else {
                    this.alpha = 1.0;
                }
            }
            
            // Обновляем анимацию прозрачности, если она включена
            if (settings.animateOpacity) {
                // Обновляем прозрачность
                this.opacity += this.opacityDirection * this.opacitySpeed;
                
                // Меняем направление, если достигли пределов
                if (this.opacity >= 1.0) {
                    this.opacity = 1.0;
                    this.opacityDirection = -1;
                } else if (this.opacity <= 0.3) {
                    this.opacity = 0.3;
                    this.opacityDirection = 1;
                }
            }
        }
        
        draw() {
            // Если размер стал слишком маленьким, не рисуем частицу
            if (this.size <= 0.01) return;
            
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            
            // Определяем цвет с учетом прозрачности
            let finalOpacity = settings.animateOpacity ? this.opacity * this.alpha : this.alpha;
            
            // Если используется время жизни, умножаем на коэффициент жизни
            if (settings.useLifespan) {
                finalOpacity *= this.lifeFactor;
            }
            
            // Применяем соответствующий цвет в зависимости от формата
            if (settings.particleColor.startsWith('rgba')) {
                const rgbaMatch = settings.particleColor.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
                if (rgbaMatch) {
                    const r = rgbaMatch[1];
                    const g = rgbaMatch[2];
                    const b = rgbaMatch[3];
                    const baseAlpha = parseFloat(rgbaMatch[4]);
                    // Применяем финальную прозрачность
                    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${baseAlpha * finalOpacity})`;
                } else {
                    ctx.fillStyle = settings.particleColor;
                }
            } 
            else if (settings.particleColor.startsWith('rgb')) {
                const rgbMatch = settings.particleColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
                if (rgbMatch) {
                    const r = rgbMatch[1];
                    const g = rgbMatch[2];
                    const b = rgbMatch[3];
                    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${finalOpacity})`;
                } else {
                    ctx.fillStyle = settings.particleColor;
                    ctx.globalAlpha = finalOpacity;
                }
            }
            else {
                ctx.fillStyle = settings.particleColor;
                ctx.globalAlpha = finalOpacity;
            }
            
            ctx.fill();
            
            // Сбрасываем globalAlpha, если использовался
            if (ctx.globalAlpha !== 1.0) {
                ctx.globalAlpha = 1.0;
            }
        }
    }
    
    // Создаем частицы
    const particles = [];
    
    for (let i = 0; i < settings.particleCount; i++) {
        particles.push(new Particle());
    }
    
    // Анимация
    function animate() {
        // Рассчитываем deltaTime
        const currentTime = Date.now();
        const deltaTime = currentTime - lastTime;
        lastTime = currentTime;
        
        // Сохраняем трансформацию контекста
        ctx.save();
        
        // Очищаем холст с учетом pixelRatio
        if (pixelRatio > 1) {
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.fillStyle = settings.backgroundColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.scale(pixelRatio, pixelRatio);
        } else {
            ctx.fillStyle = settings.backgroundColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        
        // Обновляем и рисуем частицы
        particles.forEach(particle => {
            particle.update(deltaTime);
            particle.draw();
        });
        
        // Восстанавливаем трансформацию
        ctx.restore();
        
        // Запрашиваем следующий кадр
        requestAnimationFrame(animate);
    }
    
    // Запускаем анимацию
    animate();
    
    // Возвращаем объект с методами управления эффектом
    return {
        // Метод для удаления эффекта
        destroy: function() {
            window.removeEventListener('resize', resizeCanvas);
            targetElement.removeChild(container);
            if (originalPosition === 'static') {
                targetElement.style.position = originalPosition;
            }
        },
        // Метод для изменения настроек
        updateSettings: function(newOptions) {
            Object.assign(settings, newOptions);
            // Обновляем радиус скругления, если он был изменен
            if (newOptions.borderRadius !== undefined) {
                container.style.borderRadius = `${settings.borderRadius}px`;
            }
        }
    };
}

// Пример использования:
document.addEventListener('DOMContentLoaded', function() {
    // Создаем эффект для демонстрации на всей странице
    const demoCanvas = document.getElementById('particles-canvas');
    if (demoCanvas) {
        const effect = createParticleEffect(document.body, {
            particleCount: 5000,
            backgroundColor: 'rgb(17, 17, 17)'
        });
    }
    
    // Пример добавления эффекта к конкретному элементу при клике
    document.querySelectorAll('.apply-particles').forEach(element => {
        element.addEventListener('click', function() {
            // Создаем эффект для этого элемента
            const effect = createParticleEffect(this, {
                particleCount: 1000, // Меньше частиц для элементов
                backgroundColor: 'rgba(17, 17, 17, 0.9)'
            });
            
            // Сохраняем ссылку на эффект, чтобы можно было его удалить позже
            this.particleEffect = effect;
        });
    });
}); 