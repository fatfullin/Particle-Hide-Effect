// ParticleEffect теперь доступен как глобальный объект из UMD скрипта
// в предыдущих версиях использовался:
// import ParticleEffect from '../dist/particle-effect.es.js';
// или
// window.ParticleEffect = ParticleEffect;

// --- DOM Элементы ---
const controlsContainer = document.getElementById('controls-container');
const configOutput = document.getElementById('config-output');
const copyButton = document.getElementById('copy-config-button');
const copyStatus = document.getElementById('copy-status');

// Основной контейнер для демо
const demoContainer = document.getElementById('container-main');
// Добавляем ссылки на другие контейнеры
const demoContainerSecondary = document.getElementById('container-secondary');
const demoContainerTertiary = document.getElementById('container-tertiary');

// --- Глобальные переменные ---
let currentConfig = {}; // Текущая конфигурация из слайдеров
// Храним все экземпляры эффектов
let effectInstances = [];
// Флаги для предотвращения рекурсивных вызовов при обновлении парных контролов
let isUpdatingSizeControls = false;
let isUpdatingLifetimeControls = false;
let isUpdatingOpacityControls = false;
let isUpdatingSpeedControls = false;
let isUpdatingSingleControl = {}; // Используем объект для отслеживания отдельных контролов

// --- Функции ---

/**
 * Собирает текущие значения из всех контролов в объект конфигурации.
 * @returns {object} Объект конфигурации
 */
function getCurrentConfigFromControls() {
    const config = {};
    const inputs = controlsContainer.querySelectorAll('input[type="range"], input[type="number"]');

    inputs.forEach(input => {
        const id = input.id;
        let value = input.type === 'range' ? parseFloat(input.value) : (input.value === '' ? null : parseFloat(input.value));
        
        // Используем текущее значение слайдера или дефолт, если инпут пустой или невалидный
        if (isNaN(value) || value === null) {
            let correspondingSliderId = id.replace('Value', 'Slider');
            // Определяем ID связанного слайдера (с учетом особых случаев)
            if (id === 'particleDensityValue') correspondingSliderId = 'particleDensity';
            else if (id === 'fadeInDurationValue') correspondingSliderId = 'fadeInDuration';
            else if (id === 'fadeOutDurationValue') correspondingSliderId = 'fadeOutDuration';
            else if (id === 'blackRatioValue') correspondingSliderId = 'blackRatio';
            else if (id === 'edgeFadePercentValue') correspondingSliderId = 'edgeFadePercent';
            else if (id === 'particleSizeValue') correspondingSliderId = 'particleSize'; // Для макс. радиуса ID слайдера 'particleSize'
            // Для парных: ID слайдера = ID инпута без 'Value' (minParticleSize, maxLifetime и т.д.)
            
            const slider = document.getElementById(correspondingSliderId);
            if(slider) {
                 value = parseFloat(slider.value);
                 console.log(`Input ${id} was invalid, using slider ${correspondingSliderId} value: ${value}`);
            } else {
                 // Если и слайдера нет, пытаемся взять дефолтное значение конфига
                 const settingKeyFallback = input.dataset.settingKey || mapIdToSettingKey(id);
                 if (settingKeyFallback && ParticleEffect.defaultConfig.hasOwnProperty(settingKeyFallback)) {
                      value = ParticleEffect.defaultConfig[settingKeyFallback]; 
                      console.log(`Input ${id} and slider ${correspondingSliderId} invalid/missing, using default config value for ${settingKeyFallback}: ${value}`);
                 } else {
                     console.warn(`Cannot determine value for input ${id}, skipping.`);
                     return; // Пропускаем, если не можем определить значение
                 }
            }
            // На всякий случай проверяем значение после всех фолбэков
            if (isNaN(value) || value === null) {
                console.error(`Value for ${id} is still invalid after fallbacks, skipping.`);
                return; 
            }
        }

        // --- УДАЛЕН БЛОК ОГРАНИЧЕНИЯ ДИАПАЗОНА ОТСЮДА --- 
        // Теперь это делается в update... функциях
        /*
        if (input.type === 'number') { ... }
        */
        // --- КОНЕЦ УДАЛЕННОГО БЛОКА ---

        // Преобразование ID контрола в ключ конфига ParticleEffect
        const settingKey = input.dataset.settingKey || mapIdToSettingKey(id);

        if (settingKey) {
             // Теперь здесь всегда будет гарантированно ограниченное значение
            config[settingKey] = value;
        } else {
            console.warn(`Could not map input ${id} to a config setting key.`);
        }
    });

    // Логика ensureMinMaxConsistency теперь не нужна здесь, 
    // так как она обрабатывается в updateXControls функциях.
    // ensureMinMaxConsistency(config); 

    return config;
}

/**
 * Преобразует ID HTML-элемента в ключ объекта конфигурации ParticleEffect.
 * @param {string} id - ID элемента
 * @returns {string|null} Ключ конфигурации или null
 */
function mapIdToSettingKey(id) {
    // Удаляем суффиксы Value/Slider и приводим к camelCase
    let baseKey = id.replace(/Value$|Slider$/, '');

    // Специальные случаи
    if (baseKey === 'particleSize') return 'maxRadius';
    if (baseKey === 'minParticleSize') return 'minRadius';
    if (baseKey === 'minLifetime') return 'minLifetimeSeconds';
    if (baseKey === 'maxLifetime') return 'maxLifetimeSeconds';
    if (baseKey === 'fadeInDuration') return 'fadeInDurationSeconds';
    if (baseKey === 'fadeOutDuration') return 'fadeOutDurationSeconds';
    if (baseKey === 'blackRatio') return 'blackRatioPercent';
    if (baseKey === 'minRandomOpacity') return 'minSemiTransparentOpacity';
    if (baseKey === 'maxRandomOpacity') return 'maxSemiTransparentOpacity';

    // Общее правило (если не спец. случай)
    // Проверяем, есть ли такой ключ в дефолтном конфиге
    if (ParticleEffect.defaultConfig.hasOwnProperty(baseKey)) {
        return baseKey;
    }

    return null; // Не удалось найти соответствие
}

/**
 * Ensures that min values don't exceed max values in the config.
 * @param {object} config - Configuration object
 */
function ensureMinMaxConsistency(config) {
    const pairs = [
        { min: 'minSpeed', max: 'maxSpeed' },
        { min: 'minRadius', max: 'maxRadius' },
        { min: 'minLifetimeSeconds', max: 'maxLifetimeSeconds' },
        { min: 'minSemiTransparentOpacity', max: 'maxSemiTransparentOpacity' }
    ];

    pairs.forEach(pair => {
        if (config.hasOwnProperty(pair.min) && config.hasOwnProperty(pair.max) && config[pair.min] > config[pair.max]) {
            // If min > max, swap them
             console.warn(`Inconsistent values for ${pair.min}/${pair.max}. Swapping.`);
             [config[pair.min], config[pair.max]] = [config[pair.max], config[pair.min]];

             // Update values in corresponding inputs/sliders
             updateControlValue(pair.min, config[pair.min]);
             updateControlValue(pair.max, config[pair.max]);
        }
    });
}

/**
 * Updates the value of a related input/slider by config key.
 * @param {string} settingKey - Config key
 * @param {number} value - New value
 */
function updateControlValue(settingKey, value) {
    // Find input and slider by reverse mapping
    let inputId = null;
    let sliderId = null;

    // Reverse mapping
    if (settingKey === 'maxRadius') inputId = 'particleSizeValue';
    else if (settingKey === 'minRadius') inputId = 'minParticleSizeValue';
    else if (settingKey === 'minLifetimeSeconds') inputId = 'minLifetimeValue';
    else if (settingKey === 'maxLifetimeSeconds') inputId = 'maxLifetimeValue';
    else if (settingKey === 'fadeInDurationSeconds') inputId = 'fadeInDurationValue';
    else if (settingKey === 'fadeOutDurationSeconds') inputId = 'fadeOutDurationValue';
    else if (settingKey === 'blackRatioPercent') inputId = 'blackRatioValue';
    else if (settingKey === 'minSemiTransparentOpacity') inputId = 'minRandomOpacityValue';
    else if (settingKey === 'maxSemiTransparentOpacity') inputId = 'maxRandomOpacityValue';
    else if (settingKey === 'minSpeed') inputId = 'minSpeedValue';
    else if (settingKey === 'maxSpeed') inputId = 'maxSpeedValue';
    else inputId = settingKey + 'Value'; // General rule

    sliderId = inputId.replace('Value', 'Slider');

    const inputElement = document.getElementById(inputId);
    const sliderElement = document.getElementById(sliderId);

    const precision = getPrecision(inputElement?.step || sliderElement?.step || '0');

    if (inputElement) inputElement.value = value.toFixed(precision);
    if (sliderElement) sliderElement.value = value;
}

/**
 * Determines the number of decimal places based on the step attribute.
 * @param {string} stepAttr - Value of step attribute
 * @returns {number} Number of decimal places
 */
function getPrecision(stepAttr) {
    if (!stepAttr || !stepAttr.includes('.')) return 0;
    return stepAttr.split('.')[1].length;
}

/**
 * Formats a configuration object into a readable string.
 * @param {object} config - Configuration object
 * @returns {string} Formatted string
 */
function formatConfigForDisplay(config) {
    let configString = '{\n';
    const keys = Object.keys(config).sort(); // Sort keys for consistency

    keys.forEach((key, index) => {
        const value = config[key];
        configString += `  ${key}: ${JSON.stringify(value)}`;
        if (index < keys.length - 1) {
            configString += ',';
        }
        configString += '\n';
    });

    configString += '}';
    return configString;
}

/**
 * Updates the demo effect configuration and the config display.
 */
function updateDemoAndConfigOutput() {
    currentConfig = getCurrentConfigFromControls();

    // Update config for all instances
    effectInstances.forEach(instance => {
        if (instance) {
            instance.updateConfig(currentConfig);
        }
    });

    const formattedConfig = formatConfigForDisplay(currentConfig);
    configOutput.textContent = formattedConfig;

    // Reset copy status
    hideCopyStatus();
}

/**
 * Copies text to clipboard.
 * @param {string} text - Text to copy
 */
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        console.log('Config copied to clipboard!');
        showCopyStatus();
    } catch (err) {
        console.error('Failed to copy config: ', err);
        alert('Failed to copy config. Your browser might not support this feature or the page is not opened via HTTPS.');
    }
}

/** Shows "Copied!" message */
function showCopyStatus() {
    copyStatus.style.display = 'inline';
    setTimeout(hideCopyStatus, 2000); // Hide after 2 seconds
}

/** Hides "Copied!" message */
function hideCopyStatus() {
    copyStatus.style.display = 'none';
}

/**
 * Updates particle size controls (min/max sliders and inputs),
 * ensuring their consistency.
 * @param {string} changedId - ID of the element that triggered the change.
 * @param {number} newValue - New value of the changed element (already checked for NaN).
 */
function updateSizeControls(changedId, newValue) {
    console.log(`updateSizeControls called for ${changedId} with value ${newValue}`);

    if (isUpdatingSizeControls) { // Use flag
        console.log('Re-entry blocked by isUpdatingSizeControls flag');
        return;
    }
    isUpdatingSizeControls = true; // Set flag

    try {
        const minSlider = document.getElementById('minParticleSize');
        const maxSlider = document.getElementById('particleSize');
        const minInput = document.getElementById('minParticleSizeValue');
        const maxInput = document.getElementById('particleSizeValue');

        if (!minSlider || !maxSlider || !minInput || !maxInput) {
            console.error("Particle size controls not found within updateSizeControls! Check IDs: minParticleSize, particleSize, minParticleSizeValue, particleSizeValue");
            return;
        }

        const minPrecision = getPrecision(minInput.step || minSlider.step || '0');
        const maxPrecision = getPrecision(maxInput.step || maxSlider.step || '0');

        // 1. Read current values from INPUTS (with slider fallback)
        let currentMinInputVal = parseFloat(minInput.value);
        if (isNaN(currentMinInputVal)) currentMinInputVal = parseFloat(minSlider.value);
        let currentMaxInputVal = parseFloat(maxInput.value);
        if (isNaN(currentMaxInputVal)) currentMaxInputVal = parseFloat(maxSlider.value);
        console.log(`Current INPUT values (parsed): min=${currentMinInputVal}, max=${currentMaxInputVal}`);

        // 2. Initialize final values with current input values
        let finalMin = currentMinInputVal;
        let finalMax = currentMaxInputVal;

        // 3. Apply the change from the event source
        if (changedId === 'minParticleSize' || changedId === 'minParticleSizeValue') {
            finalMin = newValue;
        } else { // MAX changed
            finalMax = newValue;
        }
        console.log(`Values after applying change: min=${finalMin}, max=${finalMax}`);

        // 4. Enforce min <= max rule, changing the *other* value only if necessary
        if (finalMin > finalMax) {
            console.log(`Rule violated (min ${finalMin} > max ${finalMax}). Adjusting.`);
            if (changedId === 'minParticleSize' || changedId === 'minParticleSizeValue') {
                // If MIN was changed and caused violation, push MAX up
                finalMax = finalMin;
                console.log(`MIN changed, pushing MAX to ${finalMax}`);
            } else {
                // If MAX was changed and caused violation, push MIN down
                finalMin = finalMax;
                 console.log(`MAX changed, pushing MIN to ${finalMin}`);
            }
        }

        // 5. Update input fields with final values
        minInput.value = finalMin.toFixed(minPrecision);
        maxInput.value = finalMax.toFixed(maxPrecision);
        console.log(`Inputs updated: minInput=${minInput.value}, maxInput=${maxInput.value}`);

        // 6. Update sliders (clamped to their own min/max attributes)
        const minSliderMinAttr = parseFloat(minSlider.min);
        const minSliderMaxAttr = parseFloat(minSlider.max);
        const maxSliderMinAttr = parseFloat(maxSlider.min);
        const maxSliderMaxAttr = parseFloat(maxSlider.max);

        minSlider.value = Math.max(minSliderMinAttr, Math.min(minSliderMaxAttr, finalMin));
        maxSlider.value = Math.max(maxSliderMinAttr, Math.min(maxSliderMaxAttr, finalMax));
        console.log(`Sliders updated (clamped): minSlider=${minSlider.value}, maxSlider=${maxSlider.value}`);

    } finally {
        isUpdatingSizeControls = false; // Сбрасываем флаг
        console.log('isUpdatingSizeControls flag cleared');
    }
}

/**
 * Обновляет контролы времени жизни частиц (min/max слайдеры и инпуты),
 * обеспечивая их связность.
 * @param {string} changedId - ID элемента, который вызвал изменение.
 * @param {number} newValue - Новое значение измененного элемента.
 */
function updateLifetimeControls(changedId, newValue) {
    console.log(`updateLifetimeControls called for ${changedId} with value ${newValue}`);
    if (isUpdatingLifetimeControls) return;
    isUpdatingLifetimeControls = true;

    try {
        const minSlider = document.getElementById('minLifetime');
        const maxSlider = document.getElementById('maxLifetime');
        const minInput = document.getElementById('minLifetimeValue');
        const maxInput = document.getElementById('maxLifetimeValue');

        if (!minSlider || !maxSlider || !minInput || !maxInput) {
            console.error("Lifetime controls not found!"); return;
        }

        const minPrecision = getPrecision(minInput.step || minSlider.step || '0');
        const maxPrecision = getPrecision(maxInput.step || maxSlider.step || '0');

        let currentMinInputVal = parseFloat(minInput.value);
        if (isNaN(currentMinInputVal)) currentMinInputVal = parseFloat(minSlider.value);
        let currentMaxInputVal = parseFloat(maxInput.value);
        if (isNaN(currentMaxInputVal)) currentMaxInputVal = parseFloat(maxSlider.value);

        let finalMin = currentMinInputVal;
        let finalMax = currentMaxInputVal;

        if (changedId === 'minLifetime' || changedId === 'minLifetimeValue') {
            finalMin = newValue;
        } else {
            finalMax = newValue;
        }

        if (finalMin > finalMax) {
            if (changedId === 'minLifetime' || changedId === 'minLifetimeValue') {
                finalMax = finalMin;
            } else {
                finalMin = finalMax;
            }
        }

        minInput.value = finalMin.toFixed(minPrecision);
        maxInput.value = finalMax.toFixed(maxPrecision);

        const minSliderMinAttr = parseFloat(minSlider.min);
        const minSliderMaxAttr = parseFloat(minSlider.max);
        const maxSliderMinAttr = parseFloat(maxSlider.min);
        const maxSliderMaxAttr = parseFloat(maxSlider.max);

        minSlider.value = Math.max(minSliderMinAttr, Math.min(minSliderMaxAttr, finalMin));
        maxSlider.value = Math.max(maxSliderMinAttr, Math.min(maxSliderMaxAttr, finalMax));

    } finally {
        isUpdatingLifetimeControls = false;
    }
}

/**
 * Обновляет контролы прозрачности частиц (min/max слайдеры и инпуты),
 * обеспечивая их связность.
 * @param {string} changedId - ID элемента, который вызвал изменение.
 * @param {number} newValue - Новое значение измененного элемента.
 */
function updateOpacityControls(changedId, newValue) {
    console.log(`updateOpacityControls called for ${changedId} with value ${newValue}`);
    if (isUpdatingOpacityControls) return;
    isUpdatingOpacityControls = true;

    try {
        const minSlider = document.getElementById('minRandomOpacity');
        const maxSlider = document.getElementById('maxRandomOpacity');
        const minInput = document.getElementById('minRandomOpacityValue');
        const maxInput = document.getElementById('maxRandomOpacityValue');

        if (!minSlider || !maxSlider || !minInput || !maxInput) {
            console.error("Opacity controls not found!"); return;
        }

        const minPrecision = getPrecision(minInput.step || minSlider.step || '0');
        const maxPrecision = getPrecision(maxInput.step || maxSlider.step || '0');

        let currentMinInputVal = parseFloat(minInput.value);
        if (isNaN(currentMinInputVal)) currentMinInputVal = parseFloat(minSlider.value);
        let currentMaxInputVal = parseFloat(maxInput.value);
        if (isNaN(currentMaxInputVal)) currentMaxInputVal = parseFloat(maxSlider.value);

        let finalMin = currentMinInputVal;
        let finalMax = currentMaxInputVal;

        if (changedId === 'minRandomOpacity' || changedId === 'minRandomOpacityValue') {
            finalMin = newValue;
        } else {
            finalMax = newValue;
        }

        if (finalMin > finalMax) {
            if (changedId === 'minRandomOpacity' || changedId === 'minRandomOpacityValue') {
                finalMax = finalMin;
            } else {
                finalMin = finalMax;
            }
        }

        minInput.value = finalMin.toFixed(minPrecision);
        maxInput.value = finalMax.toFixed(maxPrecision);

        const minSliderMinAttr = parseFloat(minSlider.min);
        const minSliderMaxAttr = parseFloat(minSlider.max);
        const maxSliderMinAttr = parseFloat(maxSlider.min);
        const maxSliderMaxAttr = parseFloat(maxSlider.max);

        minSlider.value = Math.max(minSliderMinAttr, Math.min(minSliderMaxAttr, finalMin));
        maxSlider.value = Math.max(maxSliderMinAttr, Math.min(maxSliderMaxAttr, finalMax));

    } finally {
        isUpdatingOpacityControls = false;
    }
}

/**
 * Обновляет контролы скорости частиц (min/max слайдеры и инпуты),
 * обеспечивая их связность.
 * @param {string} changedId - ID элемента, который вызвал изменение.
 * @param {number} newValue - Новое значение измененного элемента.
 */
function updateSpeedControls(changedId, newValue) {
    console.log(`updateSpeedControls called for ${changedId} with value ${newValue}`);
    if (isUpdatingSpeedControls) return;
    isUpdatingSpeedControls = true;

    try {
        const minSlider = document.getElementById('minSpeed');
        const maxSlider = document.getElementById('maxSpeed');
        const minInput = document.getElementById('minSpeedValue');
        const maxInput = document.getElementById('maxSpeedValue');

        if (!minSlider || !maxSlider || !minInput || !maxInput) {
            console.error("Speed controls not found!"); return;
        }

        const minPrecision = getPrecision(minInput.step || minSlider.step || '0');
        const maxPrecision = getPrecision(maxInput.step || maxSlider.step || '0');

        let currentMinInputVal = parseFloat(minInput.value);
        if (isNaN(currentMinInputVal)) currentMinInputVal = parseFloat(minSlider.value);
        let currentMaxInputVal = parseFloat(maxInput.value);
        if (isNaN(currentMaxInputVal)) currentMaxInputVal = parseFloat(maxSlider.value);

        let finalMin = currentMinInputVal;
        let finalMax = currentMaxInputVal;

        if (changedId === 'minSpeed' || changedId === 'minSpeedValue') {
            finalMin = newValue;
        } else {
            finalMax = newValue;
        }

        if (finalMin > finalMax) {
            if (changedId === 'minSpeed' || changedId === 'minSpeedValue') {
                finalMax = finalMin;
            } else {
                finalMin = finalMax;
            }
        }

        minInput.value = finalMin.toFixed(minPrecision);
        maxInput.value = finalMax.toFixed(maxPrecision);

        const minSliderMinAttr = parseFloat(minSlider.min);
        const minSliderMaxAttr = parseFloat(minSlider.max);
        const maxSliderMinAttr = parseFloat(maxSlider.min);
        const maxSliderMaxAttr = parseFloat(maxSlider.max);

        minSlider.value = Math.max(minSliderMinAttr, Math.min(minSliderMaxAttr, finalMin));
        maxSlider.value = Math.max(maxSliderMinAttr, Math.min(maxSliderMaxAttr, finalMax));

    } finally {
        isUpdatingSpeedControls = false;
    }
}

/**
 * Обновляет одиночный контрол (слайдер + инпут), обеспечивая их связность и ограничение диапазона.
 * @param {string} baseId - Базовый ID контрола (например, 'particleDensity', 'fadeInDuration').
 * @param {string} changedId - ID элемента, который вызвал изменение.
 * @param {number} newValue - Новое значение измененного элемента.
 */
function updateSingleControlPair(baseId, changedId, newValue) {
    const sliderId = baseId;
    const inputId = baseId + 'Value';
    console.log(`updateSingleControlPair called for baseId=${baseId}, changedId=${changedId}, value=${newValue}`);

    // Предотвращение рекурсии для этого конкретного контрола
    if (isUpdatingSingleControl[baseId]) {
        console.log(`Re-entry blocked for ${baseId}`);
        return;
    }
    isUpdatingSingleControl[baseId] = true;

    try {
        const slider = document.getElementById(sliderId);
        const input = document.getElementById(inputId);

        if (!slider || !input) {
            console.error(`Controls not found for baseId ${baseId} (sliderId=${sliderId}, inputId=${inputId})`);
            return;
        }

        const min = parseFloat(slider.min);
        const max = parseFloat(slider.max);
        const precision = getPrecision(input.step || slider.step || '0');

        let finalValue = newValue;

        // 1. Проверяем, если значение NaN (может случиться при невалидном вводе)
        if (isNaN(finalValue)) {
            // Пытаемся взять значение из другого элемента или дефолт
            const otherElement = changedId === sliderId ? input : slider;
            finalValue = parseFloat(otherElement.value);
            if (isNaN(finalValue)) { // Если и там невалидно, берем дефолт
                 const settingKey = mapIdToSettingKey(changedId) || mapIdToSettingKey(baseId);
                 if (settingKey && ParticleEffect.defaultConfig.hasOwnProperty(settingKey)) {
                     finalValue = ParticleEffect.defaultConfig[settingKey];
                     console.warn(`Invalid input for ${changedId}, reverting to default ${finalValue}`);
                 } else {
                     console.error(`Invalid input for ${changedId} and no default found. Cannot update.`);
                     return; // Не можем обновить
                 }
            }
        }

        // 2. Ограничиваем значение диапазоном min/max
        if (!isNaN(min) && !isNaN(max)) {
             const clampedValue = Math.max(min, Math.min(max, finalValue));
             if (clampedValue !== finalValue) {
                 console.log(`Clamping value for ${baseId} from ${finalValue} to ${clampedValue}`);
                 finalValue = clampedValue;
             }
        } else {
            console.warn(`Invalid min/max attributes for slider ${sliderId}`);
        }

        // 3. Форматируем значение
        const formattedValue = finalValue.toFixed(precision);

        // 4. Обновляем оба элемента (с проверкой, чтобы не вызывать лишние события)
        if (input.value !== formattedValue) {
            input.value = formattedValue;
        }
        // Сравниваем числовые значения для слайдера
        if (parseFloat(slider.value) !== finalValue) {
             slider.value = finalValue; 
        }
        console.log(`Controls updated for ${baseId}: slider=${slider.value}, input=${input.value}`);

    } finally {
        isUpdatingSingleControl[baseId] = false; // Сбрасываем флаг для этого контрола
    }
}

// --- Инициализация ---

// Устанавливаем начальные значения контролов из дефолтного конфига
Object.keys(ParticleEffect.defaultConfig).forEach(key => {
    updateControlValue(key, ParticleEffect.defaultConfig[key]);
    // Дополнительно сохраняем ключ конфига в data-атрибут для упрощения
    let inputId = null;
     if (key === 'maxRadius') inputId = 'particleSizeValue';
     else if (key === 'minRadius') inputId = 'minParticleSizeValue';
     else if (key === 'minLifetimeSeconds') inputId = 'minLifetimeValue';
     else if (key === 'maxLifetimeSeconds') inputId = 'maxLifetimeValue';
     else if (key === 'fadeInDurationSeconds') inputId = 'fadeInDurationValue';
     else if (key === 'fadeOutDurationSeconds') inputId = 'fadeOutDurationValue';
     else if (key === 'blackRatioPercent') inputId = 'blackRatioValue';
     else if (key === 'minSemiTransparentOpacity') inputId = 'minRandomOpacityValue';
     else if (key === 'maxSemiTransparentOpacity') inputId = 'maxRandomOpacityValue';
     else if (key === 'minSpeed') inputId = 'minSpeedValue';
     else if (key === 'maxSpeed') inputId = 'maxSpeedValue';
     else inputId = key + 'Value';
    const inputElement = document.getElementById(inputId);
    const sliderElement = document.getElementById(inputId?.replace('Value', 'Slider'));
    if(inputElement) inputElement.dataset.settingKey = key;
    if(sliderElement) sliderElement.dataset.settingKey = key;

});


// Создаем экземпляры эффектов для всех демо-контейнеров
effectInstances = []; // Очищаем массив на всякий случай
// Убрано getCurrentConfigFromControls() отсюда, т.к. оно вызывается в updateDemoAndConfigOutput()
// currentConfig = getCurrentConfigFromControls(); 

[demoContainer, demoContainerSecondary, demoContainerTertiary].forEach((container, index) => {
    if (container) {
        try {
            const instance = new ParticleEffect(container, {
                ...currentConfig,
                autoStart: false // Отключаем автостарт
            });
            effectInstances.push(instance);
            console.log(`ParticleEffect initialized for container ${index + 1}.`);

            // Находим текстовый элемент внутри контейнера
            const textElement = container.querySelector('.text-to-cover');

            // Добавляем слушатель клика для ручного запуска/остановки
            container.addEventListener('click', () => {
                if (!textElement) return; // Если текста нет, ничего не делаем

                console.log(`Toggling effect for container ${index + 1}`);

                // Логика скрытия/показа текста ДО переключения эффекта
                if (instance.isActive) {
                    // Если сейчас активен (будет остановлен), ПОКАЗЫВАЕМ текст
                    textElement.classList.remove('text-hidden');
                } else {
                    // Если сейчас неактивен (будет запущен), СКРЫВАЕМ текст
                    textElement.classList.add('text-hidden');
                }

                // Переключаем сам эффект
                instance.toggle();
            });

        } catch (error) {
            console.error(`Failed to initialize ParticleEffect for container ${index + 1}:`, error);
            effectInstances.push(null); // Добавляем null, чтобы сохранить порядок индексов
        }
    } else {
        console.warn(`Container ${index + 1} not found.`);
        effectInstances.push(null);
    }
});

// Вызываем один раз после инициализации всех эффектов
updateDemoAndConfigOutput();

// Добавляем слушатели на все контролы
controlsContainer.addEventListener('input', (event) => {
    const element = event.target;
    const id = element.id;
    const type = element.type;
    console.log(`Input event on: ${id}, type: ${type}`);

    if (type !== 'range' && type !== 'number') {
        console.log('Ignoring non-range/number input');
        return;
    }

    // Определяем, к какой группе парных контролов принадлежит элемент
    const isSizeControl = ['minParticleSize', 'minParticleSizeValue', 'particleSize', 'particleSizeValue'].includes(id);
    const isLifetimeControl = ['minLifetime', 'minLifetimeValue', 'maxLifetime', 'maxLifetimeValue'].includes(id);
    const isOpacityControl = ['minRandomOpacity', 'minRandomOpacityValue', 'maxRandomOpacity', 'maxRandomOpacityValue'].includes(id);
    const isSpeedControl = ['minSpeed', 'minSpeedValue', 'maxSpeed', 'maxSpeedValue'].includes(id);
    const isPairedControl = isSizeControl || isLifetimeControl || isOpacityControl || isSpeedControl;

    // Определяем одиночные контролы по их базовому ID
    const singleControlBaseIds = ['particleDensity', 'fadeInDuration', 'fadeOutDuration', 'blackRatio', 'edgeFadePercent'];
    let singleControlInfo = null;
    for (const baseId of singleControlBaseIds) {
        if (id === baseId || id === baseId + 'Value') {
            singleControlInfo = { baseId: baseId, isSlider: (id === baseId), isInput: (id === baseId + 'Value') };
            break;
        }
    }

    let value = parseFloat(element.value);

    if (isPairedControl) {
        if (type === 'range') {
            if (!isNaN(value)) {
                // Вызываем соответствующую функцию обновления
                if (isSizeControl) updateSizeControls(id, value);
                else if (isLifetimeControl) updateLifetimeControls(id, value);
                else if (isOpacityControl) updateOpacityControls(id, value);
                else if (isSpeedControl) updateSpeedControls(id, value);
            } else {
                console.warn(`Invalid number from range slider ${id}: ${element.value}.`);
            }
        } else { // Инпут пары изменился (type === 'number')
            console.log(`Pair number input ${id} changed during input. Only updating slider position.`);
            // Только обновляем позицию соответствующего слайдера
            let sliderToUpdate = null;
            if (id === 'minParticleSizeValue') sliderToUpdate = document.getElementById('minParticleSize');
            else if (id === 'particleSizeValue') sliderToUpdate = document.getElementById('particleSize');
            else if (id === 'minLifetimeValue') sliderToUpdate = document.getElementById('minLifetime');
            else if (id === 'maxLifetimeValue') sliderToUpdate = document.getElementById('maxLifetime');
            else if (id === 'minRandomOpacityValue') sliderToUpdate = document.getElementById('minRandomOpacity');
            else if (id === 'maxRandomOpacityValue') sliderToUpdate = document.getElementById('maxRandomOpacity');
            else if (id === 'minSpeedValue') sliderToUpdate = document.getElementById('minSpeed');
            else if (id === 'maxSpeedValue') sliderToUpdate = document.getElementById('maxSpeed');

            if (sliderToUpdate && !isNaN(value)) {
                 const min = parseFloat(sliderToUpdate.min);
                 const max = parseFloat(sliderToUpdate.max);
                 sliderToUpdate.value = Math.max(min, Math.min(max, value));
                 console.log(`Updated slider ${sliderToUpdate.id} position to ${sliderToUpdate.value}`);
            }
        }
    } else { // Не парный контрол
        // Проверяем, является ли это одним из наших одиночных контролов
        if (singleControlInfo) {
            if (singleControlInfo.isSlider) {
                // Если изменился СЛАЙДЕР одиночного контрола, вызываем полный апдейт
                console.log(`Handling single control SLIDER input: baseId=${singleControlInfo.baseId}, changedId=${id}`);
                updateSingleControlPair(singleControlInfo.baseId, id, value);
            } else if (singleControlInfo.isInput) {
                // Если изменился ИНПУТ одиночного контрола, ТОЛЬКО обновляем слайдер
                console.log(`Handling single control INPUT input: baseId=${singleControlInfo.baseId}, changedId=${id}. Updating slider position only.`);
                const sliderToUpdate = document.getElementById(singleControlInfo.baseId);
                if (sliderToUpdate && !isNaN(value)) {
                    const min = parseFloat(sliderToUpdate.min);
                    const max = parseFloat(sliderToUpdate.max);
                    sliderToUpdate.value = Math.max(min, Math.min(max, value));
                }
            }
        } else {
            // Если это не известный парный или одиночный контрол, пропускаем
            console.log(`Ignoring unknown control during input: ${id}`);
        }
    }

    // Обновляем демо и вывод конфига ПОСЛЕ всех манипуляций
    console.log('Input listener finished, calling updateDemoAndConfigOutput...');
    updateDemoAndConfigOutput(); 
});

// Слушатель на поля ввода для обновления по Enter или потере фокуса
controlsContainer.addEventListener('change', (event) => {
     const element = event.target;
     const id = element.id;
     const type = element.type;

     if (type === 'number') {
         console.log(`Change event on number input: ${id}`);
         // Определяем, к какой группе парных контролов принадлежит элемент
         const isSizeControl = ['minParticleSizeValue', 'particleSizeValue'].includes(id);
         const isLifetimeControl = ['minLifetimeValue', 'maxLifetimeValue'].includes(id);
         const isOpacityControl = ['minRandomOpacityValue', 'maxRandomOpacityValue'].includes(id);
         const isSpeedControl = ['minSpeedValue', 'maxSpeedValue'].includes(id);
         const isPairedInput = isSizeControl || isLifetimeControl || isOpacityControl || isSpeedControl;

         if (isPairedInput) {
             // Вызываем полную логику связывания ЗДЕСЬ, после завершения ввода
             let value = parseFloat(element.value);
              if (!isNaN(value)) {
                 console.log(`Calling update<Pair>Controls from CHANGE event for ${id} with value ${value}`);
                 // Вызываем соответствующую функцию обновления
                 if (isSizeControl) updateSizeControls(id, value);
                 else if (isLifetimeControl) updateLifetimeControls(id, value);
                 else if (isOpacityControl) updateOpacityControls(id, value);
                 else if (isSpeedControl) updateSpeedControls(id, value);

                 // Обновляем демо после окончательного применения значения
                 updateDemoAndConfigOutput();
             } else {
                  console.warn(`Invalid number entered in ${id} on change: ${element.value}`);
                  // Возможно, стоит восстановить предыдущее валидное значение?
             }
         } else {
             // Проверяем, одиночный ли это контрол
             if (singleControlInfo) {
                 console.log(`Change event on single control number input: baseId=${singleControlInfo.baseId}, changedId=${id}`);
                 // Вызываем общую функцию обновления для окончательной проверки/ограничения/форматирования
                 let value = parseFloat(element.value);
                 updateSingleControlPair(singleControlInfo.baseId, id, value);
                 // Демо обновится ниже, т.к. updateDemoAndConfigOutput вызывается в конце
             } else {
                 console.log(`'change' event on unknown number input ${id}. Triggering updateDemo.`);
             }
         }
     }
});


// Слушатель для кнопки копирования
copyButton.addEventListener('click', () => {
    copyToClipboard(configOutput.textContent);
});

console.log('Demo script initialized.'); 