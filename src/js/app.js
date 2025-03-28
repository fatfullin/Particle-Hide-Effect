/**
 * @file app.js
 * @description Инициализация и управление эффектом частиц
 * @version 1.0.0
 */

import { createParticleEffect } from './particle.js';

/**
 * Основные настройки эффекта частиц 
 */
const DEFAULT_PARTICLE_OPTIONS = {
  particleCount: 1050,
  backgroundColor: 'rgba(255, 255, 255, 0.8)',
  particleColor: 'rgba(0, 0, 0, 0.7)',
  particleSize: { min: 0.36, max: 1.2 },
  speed: { min: 0.05, max: 0.15 },
  fadeEdges: false,
  shrinkEdges: true,
  edgeMarginPixels: 10,
  useRetina: true,
  borderRadius: 0,
  animateOpacity: true,
  useLifespan: true,
  lifespanMin: 500,
  lifespanMax: 1000,
  fadeTime: 300,
  useZones: false,
  centerZoneSize: 0.6,
  flyoutChance: 0.05,
  flyoutParticles: 0.3,
  returnChance: 0.01
};

/**
 * Инициализация эффекта частиц на странице
 */
function initParticleEffects() {
  // Получаем элементы
  const titleElement = document.getElementById('target-title');
  const applyBtn = document.querySelector('.apply');
  const removeBtn = document.querySelector('.remove');
  
  if (!titleElement || !applyBtn || !removeBtn) {
    console.warn('Не найдены необходимые элементы для инициализации эффекта частиц');
    return;
  }
  
  // Обработчик для кнопки применения эффекта
  applyBtn.addEventListener('click', function() {
    if (!titleElement.hasAttribute('data-has-effect')) {
      applyEffect(titleElement);
    }
  });
  
  // Обработчик для кнопки удаления эффекта
  removeBtn.addEventListener('click', function() {
    removeEffect(titleElement);
  });
  
  /**
   * Применяет эффект частиц к указанному элементу
   * @param {HTMLElement} element - Элемент, к которому применяется эффект
   */
  function applyEffect(element) {
    // Если у элемента уже есть эффект, не добавляем новый
    if (element.hasAttribute('data-has-effect')) return;
    
    // Сохраняем текущие стили для правильного размещения эффекта
    const computedStyle = window.getComputedStyle(element);
    
    // Применяем эффект
    const effect = createParticleEffect(element, DEFAULT_PARTICLE_OPTIONS);
    
    // Сохраняем ссылку на эффект
    element.setAttribute('data-has-effect', 'true');
    element.particleEffect = effect;
    
    // Показываем кнопку удаления
    applyBtn.classList.add('hidden');
    removeBtn.classList.remove('hidden');
  }
  
  /**
   * Удаляет эффект частиц с указанного элемента
   * @param {HTMLElement} element - Элемент, с которого удаляется эффект
   */
  function removeEffect(element) {
    if (element.particleEffect) {
      element.particleEffect.destroy();
      element.particleEffect = null;
      element.removeAttribute('data-has-effect');
      
      // Меняем видимость кнопок
      applyBtn.classList.remove('hidden');
      removeBtn.classList.add('hidden');
    }
  }
}

// Запускаем инициализацию при загрузке DOM
document.addEventListener('DOMContentLoaded', initParticleEffects); 