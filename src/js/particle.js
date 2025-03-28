/**
 * @file particle.js
 * @description Модуль для создания эффекта частиц на веб-странице
 * @version 1.0.0
 */

/**
 * @typedef {Object} ParticleSize
 * @property {number} min - Минимальный размер частицы
 * @property {number} max - Максимальный размер частицы
 */

/**
 * @typedef {Object} ParticleSpeed
 * @property {number} min - Минимальная скорость частицы
 * @property {number} max - Максимальная скорость частицы
 */

/**
 * @typedef {Object} ParticleOptions
 * @property {number} [particleCount=5000] - Количество частиц
 * @property {ParticleSize} [particleSize={min: 0.5, max: 2}] - Диапазон размеров частиц
 * @property {string} [particleColor='rgb(255, 255, 255)'] - Цвет частиц (формат CSS)
 * @property {string} [backgroundColor='rgb(17, 17, 17)'] - Цвет фона (формат CSS)
 * @property {ParticleSpeed} [speed={min: 0.1, max: 0.4}] - Диапазон скоростей частиц
 * @property {boolean} [fadeEdges=false] - Затухание частиц по краям
 * @property {boolean} [shrinkEdges=false] - Уменьшение размера частиц по краям
 * @property {number} [edgeThreshold=0.15] - Размер краевой зоны (% от общего размера)
 * @property {boolean} [useRetina=true] - Поддержка Retina-дисплеев
 * @property {number} [borderRadius=0] - Радиус скругления углов канваса
 * @property {boolean} [animateOpacity=false] - Анимация прозрачности частиц
 * @property {boolean} [useLifespan=false] - Использовать систему времени жизни частиц
 * @property {number} [lifespanMin=1000] - Минимальное время жизни частицы (мс)
 * @property {number} [lifespanMax=2000] - Максимальное время жизни частицы (мс)
 * @property {number} [fadeTime=300] - Время затухания/появления частицы (мс)
 * @property {boolean} [useZones=false] - Использовать систему зон
 * @property {number} [centerZoneSize=0.7] - Размер центральной зоны (% от размера контейнера)
 * @property {number} [flyoutChance=0.01] - Шанс вылета частицы из центральной зоны
 * @property {number} [flyoutParticles=0.15] - Процент частиц, которые могут вылетать
 * @property {number} [returnChance=0.03] - Шанс возврата частицы в центральную зону
 * @property {number} [edgeMarginPixels=0] - Размер края в пикселях для затухания/уменьшения
 */

/**
 * @typedef {Object} ParticleEffect
 * @property {function} destroy - Метод для удаления эффекта частиц
 * @property {function} updateSettings - Метод для обновления настроек эффекта
 */

/**
 * Класс для представления отдельной частицы в эффекте
 * @private
 */
class Particle {
  /**
   * Создает экземпляр частицы
   * @param {Object} ctx - Контекст рендеринга Canvas 2D
   * @param {ParticleOptions} settings - Настройки для частиц
   * @param {HTMLElement} targetElement - Целевой элемент, к которому привязан эффект
   */
  constructor(ctx, settings, targetElement) {
    this.ctx = ctx;
    this.settings = settings;
    this.targetElement = targetElement;
    this.reset();
  }
  
  /**
   * Сбрасывает состояние частицы (пересоздает её)
   * @param {boolean} [initialize=true] - Флаг начальной инициализации
   */
  reset(initialize = true) {
    // Размер
    this.baseSize = this.settings.particleSize.min + Math.random() * (this.settings.particleSize.max - this.settings.particleSize.min);
    this.size = this.baseSize; // Текущий размер (может меняться у краев)
    
    // Получаем размеры контейнера
    const rect = this.targetElement.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    // Равномерно распределяем частицы по всему канвасу
    this.x = Math.random() * width;
    this.y = Math.random() * height;
    
    // Если включены зоны, инициализируем соответствующие свойства
    if (this.settings.useZones) {
      // Определяем, будет ли эта частица из тех, что могут вылетать
      this.canFlyout = Math.random() < this.settings.flyoutParticles;
      
      // Проверяем, находится ли частица в центральной зоне
      const centerWidth = width * this.settings.centerZoneSize;
      const centerHeight = height * this.settings.centerZoneSize;
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
    this.speed = (this.settings.speed.min + Math.random() * (this.settings.speed.max - this.settings.speed.min)) * speedMultiplier;
    this.direction = Math.random() * Math.PI * 2;
    this.vx = Math.cos(this.direction) * this.speed;
    this.vy = Math.sin(this.direction) * this.speed;
    
    // Для плавных изменений направления
    this.noiseOffset = Math.random() * 1000;
    this.noiseIncrement = 0.005;
    
    // Прозрачность для краев
    this.alpha = 1.0;
    
    // Параметры для анимации прозрачности
    if (this.settings.animateOpacity) {
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
    if (this.settings.useLifespan) {
      // Устанавливаем время жизни частицы (между min и max)
      this.lifespan = this.settings.lifespanMin + Math.random() * (this.settings.lifespanMax - this.settings.lifespanMin);
      
      // Если инициализируем в первый раз, устанавливаем случайное начальное время жизни
      if (initialize) {
        this.life = Math.random() * this.lifespan;
      } else {
        this.life = 0; // Новая частица начинает с 0
      }
      
      // Состояния цикла жизни: 0 = появление, 1 = жизнь, 2 = угасание
      this.lifeState = initialize ? Math.floor(Math.random() * 3) : 0;
      
      // Фактор видимости от времени жизни (для плавного появления и исчезновения)
      this.lifeFactor = this.lifeState === 0 ? this.life / this.settings.fadeTime : 
                       this.lifeState === 2 ? 1 - ((this.life - (this.lifespan - this.settings.fadeTime)) / this.settings.fadeTime) : 1;
                       
      // Ограничиваем lifeFactor значениями от 0 до 1
      this.lifeFactor = Math.max(0, Math.min(1, this.lifeFactor));
    }
  }
  
  /**
   * Обновляет состояние частицы на каждом кадре анимации
   * @param {number} deltaTime - Время, прошедшее с прошлого кадра (мс)
   */
  update(deltaTime) {
    // Обновляем время жизни, если используется
    if (this.settings.useLifespan) {
      this.life += deltaTime;
      
      // Управление состояниями цикла жизни
      if (this.lifeState === 0 && this.life >= this.settings.fadeTime) {
        // Переход от появления к жизни
        this.lifeState = 1;
      } 
      else if (this.lifeState === 1 && this.life >= (this.lifespan - this.settings.fadeTime)) {
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
        this.lifeFactor = this.life / this.settings.fadeTime;
      } 
      else if (this.lifeState === 2) {
        // Угасание - прозрачность от 1 до 0
        this.lifeFactor = 1 - ((this.life - (this.lifespan - this.settings.fadeTime)) / this.settings.fadeTime);
      } 
      else {
        // Обычная жизнь - полная прозрачность
        this.lifeFactor = 1;
      }
      
      // Ограничиваем lifeFactor значениями от 0 до 1
      this.lifeFactor = Math.max(0, Math.min(1, this.lifeFactor));
    }
    
    // Обрабатываем поведение частицы в зонах, если включено
    if (this.settings.useZones && this.canFlyout) {
      const rect = this.targetElement.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      
      // Размеры центральной зоны
      const centerWidth = width * this.settings.centerZoneSize;
      const centerHeight = height * this.settings.centerZoneSize;
      
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
        if (Math.random() < this.settings.flyoutChance) {
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
        if (Math.random() < this.settings.returnChance) {
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
          this.speed = (this.settings.speed.min + Math.random() * (this.settings.speed.max - this.settings.speed.min)) * 1.3;
          
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
    
    // Используем шум для плавного изменения направления
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
    const rect = this.targetElement.getBoundingClientRect();
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
    if (this.settings.shrinkEdges) {
      // Используем строго значение из настроек
      const edgeMargin = this.settings.edgeMarginPixels;
      
      // Вычисляем дистанцию до каждого края в пикселях
      const distanceLeft = this.x;
      const distanceRight = width - this.x;
      const distanceTop = this.y;
      const distanceBottom = height - this.y;
      
      // Наименьшее расстояние до любого края
      const minDistance = Math.min(distanceLeft, distanceRight, distanceTop, distanceBottom);
      
      // Если мы находимся в зоне уменьшения
      if (minDistance < edgeMargin) {
        // Рассчитываем коэффициент размера: 0 на самом краю, 1 на границе зоны уменьшения
        const scaleFactor = minDistance / edgeMargin;
        // Применяем к базовому размеру частицы
        this.size = this.baseSize * scaleFactor;
      } else {
        this.size = this.baseSize;
      }
    }
    // Если включено затухание у краев, рассчитываем прозрачность
    else if (this.settings.fadeEdges) {
      // Используем строго значение из настроек
      const edgeMargin = this.settings.edgeMarginPixels;
      
      // Вычисляем дистанцию до каждого края в пикселях
      const distanceLeft = this.x;
      const distanceRight = width - this.x;
      const distanceTop = this.y;
      const distanceBottom = height - this.y;
      
      // Наименьшее расстояние до любого края
      const minDistance = Math.min(distanceLeft, distanceRight, distanceTop, distanceBottom);
      
      // Если мы находимся в зоне затухания
      if (minDistance < edgeMargin) {
        // Рассчитываем прозрачность: 0 на самом краю, 1 на границе зоны затухания
        this.alpha = minDistance / edgeMargin;
      } else {
        this.alpha = 1.0;
      }
    }
    
    // Обновляем анимацию прозрачности, если она включена
    if (this.settings.animateOpacity) {
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
  
  /**
   * Отрисовывает частицу на холсте
   */
  draw() {
    // Если размер стал слишком маленьким, не рисуем частицу
    if (this.size <= 0.01) return;
    
    this.ctx.beginPath();
    this.ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    
    // Определяем цвет с учетом прозрачности
    let finalOpacity = this.settings.animateOpacity ? this.opacity * this.alpha : this.alpha;
    
    // Если используется время жизни, умножаем на коэффициент жизни
    if (this.settings.useLifespan) {
      finalOpacity *= this.lifeFactor;
    }
    
    // Применяем соответствующий цвет в зависимости от формата
    if (this.settings.particleColor.startsWith('rgba')) {
      const rgbaMatch = this.settings.particleColor.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
      if (rgbaMatch) {
        const r = rgbaMatch[1];
        const g = rgbaMatch[2];
        const b = rgbaMatch[3];
        const baseAlpha = parseFloat(rgbaMatch[4]);
        // Применяем финальную прозрачность
        this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${baseAlpha * finalOpacity})`;
      } else {
        this.ctx.fillStyle = this.settings.particleColor;
      }
    } 
    else if (this.settings.particleColor.startsWith('rgb')) {
      const rgbMatch = this.settings.particleColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (rgbMatch) {
        const r = rgbMatch[1];
        const g = rgbMatch[2];
        const b = rgbMatch[3];
        this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${finalOpacity})`;
      } else {
        this.ctx.fillStyle = this.settings.particleColor;
        this.ctx.globalAlpha = finalOpacity;
      }
    }
    else {
      this.ctx.fillStyle = this.settings.particleColor;
      this.ctx.globalAlpha = finalOpacity;
    }
    
    this.ctx.fill();
    
    // Сбрасываем globalAlpha, если использовался
    if (this.ctx.globalAlpha !== 1.0) {
      this.ctx.globalAlpha = 1.0;
    }
  }
}

/**
 * Создает эффект частиц, привязанный к конкретному DOM-элементу
 * @param {HTMLElement} targetElement - DOM-элемент, к которому будет применен эффект частиц
 * @param {ParticleOptions} [options={}] - Настройки эффекта частиц
 * @returns {ParticleEffect} Объект с методами для управления эффектом
 */
export function createParticleEffect(targetElement, options = {}) {
  // Настройки по умолчанию
  const settings = {
    particleCount: options.particleCount || 5000,
    particleSize: options.particleSize || { min: 0.5, max: 2 },
    particleColor: options.particleColor || 'rgb(255, 255, 255)',
    backgroundColor: options.backgroundColor || 'rgb(17, 17, 17)',
    speed: options.speed || { min: 0.1, max: 0.4 },
    fadeEdges: options.fadeEdges || false,
    shrinkEdges: options.shrinkEdges || false,
    edgeThreshold: options.edgeThreshold || 0.15,
    useRetina: options.useRetina !== undefined ? options.useRetina : true,
    borderRadius: options.borderRadius || 0,
    animateOpacity: options.animateOpacity !== undefined ? options.animateOpacity : false,
    useLifespan: options.useLifespan !== undefined ? options.useLifespan : false,
    lifespanMin: options.lifespanMin || 1000,
    lifespanMax: options.lifespanMax || 2000,
    fadeTime: options.fadeTime || 300,
    useZones: options.useZones !== undefined ? options.useZones : false,
    centerZoneSize: options.centerZoneSize || 0.7,
    flyoutChance: options.flyoutChance || 0.01,
    flyoutParticles: options.flyoutParticles || 0.15,
    returnChance: options.returnChance || 0.03,
    edgeMarginPixels: options.edgeMarginPixels || 0
  };
  
  // Получаем точные размеры текста
  const rect = targetElement.getBoundingClientRect();
  const textWidth = rect.width;
  const textHeight = rect.height;
  
  // Создаем контейнер для canvas и размещаем его внутри целевого элемента
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.top = '0';
  container.style.left = '0';
  container.style.width = `${textWidth}px`;
  container.style.height = `${textHeight}px`;
  container.style.overflow = 'hidden';
  container.style.pointerEvents = 'none'; // Чтобы можно было кликать через canvas
  
  // Создаем отдельный div для отображения отладочной зоны
  const debugZone = document.createElement('div');
  debugZone.style.position = 'absolute';
  debugZone.style.top = '0';
  debugZone.style.left = '0';
  debugZone.style.width = `${textWidth}px`;
  debugZone.style.height = `${textHeight}px`;
  debugZone.style.pointerEvents = 'none';
  debugZone.style.zIndex = '10';  // Поверх канваса
  
  // Если задан радиус скругления, применяем его к контейнеру
  if (settings.borderRadius > 0) {
    container.style.borderRadius = `${settings.borderRadius}px`;
    debugZone.style.borderRadius = `${settings.borderRadius}px`;
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
  
  // Создаем частицы
  const particles = [];
  
  for (let i = 0; i < settings.particleCount; i++) {
    particles.push(new Particle(ctx, settings, targetElement));
  }
  
  // Функция анимации
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
    /**
     * Удаляет эффект частиц и восстанавливает исходное состояние элемента
     */
    destroy: function() {
      window.removeEventListener('resize', resizeCanvas);
      targetElement.removeChild(container);
      if (originalPosition === 'static') {
        targetElement.style.position = originalPosition;
      }
    },
    
    /**
     * Обновляет настройки эффекта частиц
     * @param {ParticleOptions} newOptions - Новые настройки
     */
    updateSettings: function(newOptions) {
      Object.assign(settings, newOptions);
      // Обновляем радиус скругления, если он был изменен
      if (newOptions.borderRadius !== undefined) {
        container.style.borderRadius = `${settings.borderRadius}px`;
        debugZone.style.borderRadius = `${settings.borderRadius}px`;
      }
      // Обновляем отладочную зону при изменении edgeMarginPixels
      if (newOptions.edgeMarginPixels !== undefined && newOptions.shrinkEdges) {
        // Удаляем существующие элементы
        while (debugZone.firstChild) {
          debugZone.removeChild(debugZone.firstChild);
        }
        
        // Создаем новые элементы
        const edgeSize = settings.edgeMarginPixels;
        const boxShadowColor = 'rgba(255, 0, 0, 0.3)';
        
        const topEdge = document.createElement('div');
        topEdge.style.position = 'absolute';
        topEdge.style.top = '0';
        topEdge.style.left = '0';
        topEdge.style.width = '100%';
        topEdge.style.height = `${edgeSize}px`;
        topEdge.style.backgroundColor = boxShadowColor;
        
        const bottomEdge = document.createElement('div');
        bottomEdge.style.position = 'absolute';
        bottomEdge.style.bottom = '0';
        bottomEdge.style.left = '0';
        bottomEdge.style.width = '100%';
        bottomEdge.style.height = `${edgeSize}px`;
        bottomEdge.style.backgroundColor = boxShadowColor;
        
        const leftEdge = document.createElement('div');
        leftEdge.style.position = 'absolute';
        leftEdge.style.top = `${edgeSize}px`;
        leftEdge.style.left = '0';
        leftEdge.style.width = `${edgeSize}px`;
        leftEdge.style.height = `calc(100% - ${edgeSize * 2}px)`;
        leftEdge.style.backgroundColor = boxShadowColor;
        
        const rightEdge = document.createElement('div');
        rightEdge.style.position = 'absolute';
        rightEdge.style.top = `${edgeSize}px`;
        rightEdge.style.right = '0';
        rightEdge.style.width = `${edgeSize}px`;
        rightEdge.style.height = `calc(100% - ${edgeSize * 2}px)`;
        rightEdge.style.backgroundColor = boxShadowColor;
        
        // Добавляем элементы в отладочную зону
        debugZone.appendChild(topEdge);
        debugZone.appendChild(bottomEdge);
        debugZone.appendChild(leftEdge);
        debugZone.appendChild(rightEdge);
      }
    }
  };
} 