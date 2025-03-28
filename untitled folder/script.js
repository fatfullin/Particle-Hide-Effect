document.addEventListener('DOMContentLoaded', function() {
    // Получаем холст и контекст
    const canvas = document.getElementById('particles-canvas');
    const ctx = canvas.getContext('2d');
    
    // Устанавливаем размер холста
    function resizeCanvas() {
        const size = Math.min(window.innerWidth, window.innerHeight);
        canvas.width = size;
        canvas.height = size;
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
            this.size = 0.5 + Math.random() * 1.5;
            
            // Позиция
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            
            // Скорость и направление
            this.speed = 0.1 + Math.random() * 0.3;
            this.direction = Math.random() * Math.PI * 2;
            this.vx = Math.cos(this.direction) * this.speed;
            this.vy = Math.sin(this.direction) * this.speed;
            
            // Для плавных изменений направления
            this.noiseOffset = Math.random() * 1000;
            this.noiseIncrement = 0.005;
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
        }
        
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = 'rgb(255, 255, 255)';
            ctx.fill();
        }
    }
    
    // Создаем частицы
    const particleCount = 5000; // Меньше частиц для лучшей производительности
    const particles = [];
    
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }
    
    // Анимация
    function animate() {
        // Полностью очищаем холст на каждом кадре
        ctx.fillStyle = 'rgb(17, 17, 17)';
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
}); 