# Particle Effect

Современная библиотека для создания эффекта частиц на веб-странице. Позволяет добавлять анимированные частицы к любому DOM-элементу с гибкими настройками.

**[Демо](https://fatfullin.github.io/Particle-Hide-Effect/)**

## Возможности

- Добавление эффекта частиц к любому DOM-элементу
- Гибкая настройка параметров частиц (количество, размер, цвет, скорость)
- Система времени жизни частиц
- Анимация прозрачности
- Эффекты на краях (затухание или уменьшение размера)
- Поддержка Retina-дисплеев
- Система зон с возможностью "вылета" частиц

## Установка

```bash
# Клонирование репозитория
git clone https://github.com/fatfullin/Particle-Hide-Effect.git
cd Particle-Hide-Effect

# Установка зависимостей
npm install

# Запуск в режиме разработки
npm run dev
```

## Использование

### Базовое использование

```html
<!-- Подключение библиотеки -->
<script type="module">
  import { createParticleEffect } from './src/js/particle.js';
  
  // Применение эффекта к элементу
  document.addEventListener('DOMContentLoaded', () => {
    const element = document.getElementById('my-element');
    const effect = createParticleEffect(element);
    
    // Удаление эффекта
    // effect.destroy();
  });
</script>
```

### Настройка параметров

```javascript
const options = {
  particleCount: 1000,                     // Количество частиц
  particleSize: { min: 0.5, max: 2 },      // Диапазон размеров
  particleColor: 'rgba(0, 0, 0, 0.7)',     // Цвет частиц
  backgroundColor: 'rgba(255, 255, 255, 0.8)', // Цвет фона
  speed: { min: 0.05, max: 0.15 },        // Скорость движения
  shrinkEdges: true,                       // Уменьшение частиц у краев
  edgeMarginPixels: 10,                    // Размер краевой зоны
  animateOpacity: true,                    // Анимация прозрачности
  useLifespan: true,                       // Время жизни частиц
  lifespanMin: 500,                        // Минимальное время жизни
  lifespanMax: 1000                        // Максимальное время жизни
};

const effect = createParticleEffect(element, options);
```

### Полный список настроек

| Параметр | Тип | По умолчанию | Описание |
|----------|-----|--------------|----------|
| `particleCount` | Number | 5000 | Количество частиц |
| `particleSize` | Object | `{ min: 0.5, max: 2 }` | Диапазон размеров частиц |
| `particleColor` | String | 'rgb(255, 255, 255)' | Цвет частиц (CSS формат) |
| `backgroundColor` | String | 'rgb(17, 17, 17)' | Цвет фона (CSS формат) |
| `speed` | Object | `{ min: 0.1, max: 0.4 }` | Диапазон скоростей |
| `fadeEdges` | Boolean | false | Затухание у краев |
| `shrinkEdges` | Boolean | false | Уменьшение размера у краев |
| `edgeMarginPixels` | Number | 0 | Размер краевой зоны в пикселях |
| `useRetina` | Boolean | true | Поддержка Retina-дисплеев |
| `borderRadius` | Number | 0 | Радиус скругления углов канваса |
| `animateOpacity` | Boolean | false | Анимация прозрачности |
| `useLifespan` | Boolean | false | Использование системы времени жизни |
| `lifespanMin` | Number | 1000 | Минимальное время жизни (мс) |
| `lifespanMax` | Number | 2000 | Максимальное время жизни (мс) |
| `fadeTime` | Number | 300 | Время затухания/появления (мс) |
| `useZones` | Boolean | false | Использование системы зон |
| `centerZoneSize` | Number | 0.7 | Размер центральной зоны (0-1) |
| `flyoutChance` | Number | 0.01 | Шанс вылета частицы (0-1) |
| `flyoutParticles` | Number | 0.15 | Доля частиц для вылета (0-1) |
| `returnChance` | Number | 0.03 | Шанс возврата частицы (0-1) |
| `hideOriginalText` | Boolean | true | Скрыть исходный текст |

## API

### createParticleEffect(element, options)

Создает эффект частиц на указанном DOM-элементе.

**Параметры:**
- `element` - DOM-элемент, к которому применяется эффект
- `options` - Объект с настройками (опционально)

**Возвращает:** Объект с методами:
- `destroy()` - удаляет эффект и освобождает ресурсы
- `updateSettings(newOptions)` - обновляет настройки эффекта

## Лицензия

MIT 