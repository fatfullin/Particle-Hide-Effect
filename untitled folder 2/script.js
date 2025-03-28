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
        edgeThreshold: options.edgeThreshold || 0.15 // Размер области у края для затухания (15% от размера)
    };
    
    // Создаем canvas и размещаем его внутри целевого элемента
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Позиционируем canvas поверх содержимого элемента
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none'; // Чтобы можно было кликать через canvas
    
    // Сохраняем оригинальное состояние элемента
    const originalPosition = window.getComputedStyle(targetElement).position;
    if (originalPosition === 'static') {
        targetElement.style.position = 'relative';
    }
    
    // Добавляем canvas в целевой элемент
    targetElement.appendChild(canvas);
    
    // Устанавливаем размер холста
    function resizeCanvas() {
        const rect = targetElement.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
    }
    
    // Вызываем изначально и при изменении размера окна
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Класс частицы
    class Particle {
        constructor() {
            this.reset();
        }
        
        reset() {
            // Размер
            this.size = settings.particleSize.min + Math.random() * (settings.particleSize.max - settings.particleSize.min);
            
            // Позиция
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            
            // Скорость и направление
            this.speed = settings.speed.min + Math.random() * (settings.speed.max - settings.speed.min);
            this.direction = Math.random() * Math.PI * 2;
            this.vx = Math.cos(this.direction) * this.speed;
            this.vy = Math.sin(this.direction) * this.speed;
            
            // Для плавных изменений направления
            this.noiseOffset = Math.random() * 1000;
            this.noiseIncrement = 0.005;
            
            // Прозрачность
            this.alpha = 1.0;
        }
        
        update() {
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
            
            // Проверяем границы - мягко отталкиваемся от краев
            if (this.x < this.size) {
                this.x = this.size;
                this.direction = Math.PI - this.direction + (Math.random() - 0.5) * 0.5;
            } else if (this.x > canvas.width - this.size) {
                this.x = canvas.width - this.size;
                this.direction = Math.PI - this.direction + (Math.random() - 0.5) * 0.5;
            }
            
            if (this.y < this.size) {
                this.y = this.size;
                this.direction = -this.direction + (Math.random() - 0.5) * 0.5;
            } else if (this.y > canvas.height - this.size) {
                this.y = canvas.height - this.size;
                this.direction = -this.direction + (Math.random() - 0.5) * 0.5;
            }
            
            // Если включено затухание у краев, рассчитываем прозрачность
            if (settings.fadeEdges) {
                // Определяем расстояние до ближайшего края в процентах от размера канваса
                const edgeX = Math.min(this.x, canvas.width - this.x) / canvas.width;
                const edgeY = Math.min(this.y, canvas.height - this.y) / canvas.height;
                const edgeDistance = Math.min(edgeX, edgeY);
                
                // Если мы находимся в зоне затухания (edgeThreshold определяет размер зоны)
                if (edgeDistance < settings.edgeThreshold) {
                    // Рассчитываем прозрачность: 0 на самом краю, 1 на границе зоны затухания
                    this.alpha = edgeDistance / settings.edgeThreshold;
                } else {
                    this.alpha = 1.0;
                }
            }
        }
        
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            
            // Если включено затухание у краев, используем рассчитанную прозрачность
            if (settings.fadeEdges) {
                // Разбиваем строку цвета на компоненты, если это rgba
                if (settings.particleColor.startsWith('rgba')) {
                    const rgbaMatch = settings.particleColor.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
                    if (rgbaMatch) {
                        const r = rgbaMatch[1];
                        const g = rgbaMatch[2];
                        const b = rgbaMatch[3];
                        const baseAlpha = parseFloat(rgbaMatch[4]);
                        // Применяем рассчитанную прозрачность
                        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${baseAlpha * this.alpha})`;
                    } else {
                        ctx.fillStyle = settings.particleColor;
                    }
                } 
                // Для rgb форматов
                else if (settings.particleColor.startsWith('rgb')) {
                    const rgbMatch = settings.particleColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
                    if (rgbMatch) {
                        const r = rgbMatch[1];
                        const g = rgbMatch[2];
                        const b = rgbMatch[3];
                        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${this.alpha})`;
                    } else {
                        ctx.fillStyle = settings.particleColor;
                    }
                }
                // Для других форматов цвета
                else {
                    ctx.fillStyle = settings.particleColor;
                    ctx.globalAlpha = this.alpha;
                }
            } else {
                ctx.fillStyle = settings.particleColor;
            }
            
            ctx.fill();
            
            // Сбрасываем globalAlpha, если использовался
            if (settings.fadeEdges && !settings.particleColor.startsWith('rgba') && !settings.particleColor.startsWith('rgb')) {
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
        // Полностью очищаем холст на каждом кадре
        ctx.fillStyle = settings.backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Обновляем и рисуем частицы
        particles.forEach(particle => {
            particle.update();
            particle.draw();
        });
        
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
            targetElement.removeChild(canvas);
            if (originalPosition === 'static') {
                targetElement.style.position = originalPosition;
            }
        },
        // Метод для изменения настроек
        updateSettings: function(newOptions) {
            Object.assign(settings, newOptions);
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