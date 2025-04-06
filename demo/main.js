// ParticleEffect is now available as a global object from the UMD script
// in previous versions we used:
// import ParticleEffect from '../dist/particle-effect.es.js';
// or
// window.ParticleEffect = ParticleEffect;

// --- DOM Elements ---
const controlsContainer = document.getElementById('controls-container');
const configOutput = document.getElementById('config-output');
const copyButton = document.getElementById('copy-config-button');
const copyStatus = document.getElementById('copy-status');

// Main demo container
const demoContainer = document.getElementById('container-main');
// References to other containers
const demoContainerSecondary = document.getElementById('container-secondary');
const demoContainerTertiary = document.getElementById('container-tertiary');

// --- Global Variables ---
let currentConfig = {}; // Current configuration from sliders
// Store all effect instances
let effectInstances = [];
// Flags to prevent recursive calls when updating paired controls
let isUpdatingSizeControls = false;
let isUpdatingLifetimeControls = false;
let isUpdatingOpacityControls = false;
let isUpdatingSpeedControls = false;
let isUpdatingSingleControl = {}; // Use an object to track individual controls

// --- Functions ---

/**
 * Collects current values from all controls into a configuration object.
 * @returns {object} Configuration object
 */
function getCurrentConfigFromControls() {
    const config = {};
    const inputs = controlsContainer.querySelectorAll('input[type="range"], input[type="number"]');

    inputs.forEach(input => {
        const id = input.id;
        let value = input.type === 'range' ? parseFloat(input.value) : (input.value === '' ? null : parseFloat(input.value));
        
        // Use current slider value or default if input is empty or invalid
        if (isNaN(value) || value === null) {
            let correspondingSliderId = id.replace('Value', 'Slider');
            // Determine the ID of the related slider (accounting for special cases)
            if (id === 'particleDensityValue') correspondingSliderId = 'particleDensity';
            else if (id === 'fadeInDurationValue') correspondingSliderId = 'fadeInDuration';
            else if (id === 'fadeOutDurationValue') correspondingSliderId = 'fadeOutDuration';
            else if (id === 'blackRatioValue') correspondingSliderId = 'blackRatio';
            else if (id === 'edgeFadePercentValue') correspondingSliderId = 'edgeFadePercent';
            else if (id === 'particleSizeValue') correspondingSliderId = 'particleSize'; // For max radius, slider ID is 'particleSize'
            // For paired controls: slider ID = input ID without 'Value' (minParticleSize, maxLifetime, etc.)
            
            const slider = document.getElementById(correspondingSliderId);
            if(slider) {
                 value = parseFloat(slider.value);
                 console.log(`Input ${id} was invalid, using slider ${correspondingSliderId} value: ${value}`);
            } else {
                 // If slider doesn't exist, try to get default config value
                 const settingKeyFallback = input.dataset.settingKey || mapIdToSettingKey(id);
                 if (settingKeyFallback && ParticleEffect.defaultConfig.hasOwnProperty(settingKeyFallback)) {
                      value = ParticleEffect.defaultConfig[settingKeyFallback]; 
                      console.log(`Input ${id} and slider ${correspondingSliderId} invalid/missing, using default config value for ${settingKeyFallback}: ${value}`);
                 } else {
                     console.warn(`Cannot determine value for input ${id}, skipping.`);
                     return; // Skip if we can't determine the value
                 }
            }
            // Check value after all fallbacks just to be safe
            if (isNaN(value) || value === null) {
                console.error(`Value for ${id} is still invalid after fallbacks, skipping.`);
                return; 
            }
        }

        // --- REMOVED RANGE LIMITATION BLOCK FROM HERE --- 
        // This is now done in the update... functions
        /*
        if (input.type === 'number') { ... }
        */
        // --- END OF REMOVED BLOCK ---

        // Convert control ID to ParticleEffect config key
        const settingKey = input.dataset.settingKey || mapIdToSettingKey(id);

        if (settingKey) {
             // Now we always have a guaranteed limited value here
            config[settingKey] = value;
        } else {
            console.warn(`Could not map input ${id} to a config setting key.`);
        }
    });

    // The ensureMinMaxConsistency logic is no longer needed here,
    // as it's handled in the updateXControls functions.
    // ensureMinMaxConsistency(config); 

    return config;
}

/**
 * Converts an HTML element ID to a ParticleEffect configuration key.
 * @param {string} id - Element ID
 * @returns {string|null} Configuration key or null
 */
function mapIdToSettingKey(id) {
    // Remove Value/Slider suffixes and convert to camelCase
    let baseKey = id.replace(/Value$|Slider$/, '');

    // Special cases
    if (baseKey === 'particleSize') return 'maxRadius';
    if (baseKey === 'minParticleSize') return 'minRadius';
    if (baseKey === 'minLifetime') return 'minLifetimeSeconds';
    if (baseKey === 'maxLifetime') return 'maxLifetimeSeconds';
    if (baseKey === 'fadeInDuration') return 'fadeInDurationSeconds';
    if (baseKey === 'fadeOutDuration') return 'fadeOutDurationSeconds';
    if (baseKey === 'blackRatio') return 'blackRatioPercent';
    if (baseKey === 'minRandomOpacity') return 'minSemiTransparentOpacity';
    if (baseKey === 'maxRandomOpacity') return 'maxSemiTransparentOpacity';

    // General rule (if not a special case)
    // Check if the key exists in the default config
    if (ParticleEffect.defaultConfig.hasOwnProperty(baseKey)) {
        return baseKey;
    }

    return null; // No matching key found
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
        isUpdatingSizeControls = false; // Reset flag
        console.log('isUpdatingSizeControls flag cleared');
    }
}

/**
 * Updates lifetime controls (min/max sliders and inputs),
 * ensuring their consistency.
 * @param {string} changedId - ID of the element that triggered the change.
 * @param {number} newValue - New value of the changed element.
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
 * Updates opacity controls (min/max sliders and inputs),
 * ensuring their consistency.
 * @param {string} changedId - ID of the element that triggered the change.
 * @param {number} newValue - New value of the changed element.
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
 * Updates speed controls (min/max sliders and inputs),
 * ensuring their consistency.
 * @param {string} changedId - ID of the element that triggered the change.
 * @param {number} newValue - New value of the changed element.
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
 * Updates a single control pair (slider + input), ensuring consistency and range limitation.
 * @param {string} baseId - Base ID of the control (e.g., 'particleDensity', 'fadeInDuration').
 * @param {string} changedId - ID of the element that triggered the change.
 * @param {number} newValue - New value of the changed element.
 */
function updateSingleControlPair(baseId, changedId, newValue) {
    const sliderId = baseId;
    const inputId = baseId + 'Value';
    console.log(`updateSingleControlPair called for baseId=${baseId}, changedId=${changedId}, value=${newValue}`);

    // Prevent recursion for this specific control
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

        // 1. Check if value is NaN (can happen with invalid input)
        if (isNaN(finalValue)) {
            // Try to get value from the other element or use default
            const otherElement = changedId === sliderId ? input : slider;
            finalValue = parseFloat(otherElement.value);
            if (isNaN(finalValue)) { // If still invalid, use default
                 const settingKey = mapIdToSettingKey(changedId) || mapIdToSettingKey(baseId);
                 if (settingKey && ParticleEffect.defaultConfig.hasOwnProperty(settingKey)) {
                     finalValue = ParticleEffect.defaultConfig[settingKey];
                     console.warn(`Invalid input for ${changedId}, reverting to default ${finalValue}`);
                 } else {
                     console.error(`Invalid input for ${changedId} and no default found. Cannot update.`);
                     return; // Cannot update
                 }
            }
        }

        // 2. Limit value to min/max range
        if (!isNaN(min) && !isNaN(max)) {
             const clampedValue = Math.max(min, Math.min(max, finalValue));
             if (clampedValue !== finalValue) {
                 console.log(`Clamping value for ${baseId} from ${finalValue} to ${clampedValue}`);
                 finalValue = clampedValue;
             }
        } else {
            console.warn(`Invalid min/max attributes for slider ${sliderId}`);
        }

        // 3. Format value
        const formattedValue = finalValue.toFixed(precision);

        // 4. Update both elements (checking to avoid triggering unnecessary events)
        if (input.value !== formattedValue) {
            input.value = formattedValue;
        }
        // Compare numeric values for slider
        if (parseFloat(slider.value) !== finalValue) {
             slider.value = finalValue; 
        }
        console.log(`Controls updated for ${baseId}: slider=${slider.value}, input=${input.value}`);

    } finally {
        isUpdatingSingleControl[baseId] = false; // Reset flag for this control
    }
}

// --- Initialization ---

// Set initial control values from default config
Object.keys(ParticleEffect.defaultConfig).forEach(key => {
    updateControlValue(key, ParticleEffect.defaultConfig[key]);
    // Additionally save the config key in a data attribute for simplification
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


// Create effect instances for all demo containers
effectInstances = []; // Clear array just in case
// Removed getCurrentConfigFromControls() from here, as it's called in updateDemoAndConfigOutput()
// currentConfig = getCurrentConfigFromControls(); 

[demoContainer, demoContainerSecondary, demoContainerTertiary].forEach((container, index) => {
    if (container) {
        try {
            const instance = new ParticleEffect(container, {
                ...currentConfig,
                autoStart: false, // Disable autostart
                autoHideTarget: true // Используем автоскрытие из библиотеки
            });
            effectInstances.push(instance);
            console.log(`ParticleEffect initialized for container ${index + 1}.`);

            // Add click listener for manual start/stop
            container.addEventListener('click', () => {
                console.log(`Toggling effect for container ${index + 1}`);
                // Просто переключаем эффект, скрытие контента происходит автоматически
                instance.toggle();
            });

        } catch (error) {
            console.error(`Failed to initialize ParticleEffect for container ${index + 1}:`, error);
            effectInstances.push(null); // Add null to preserve index order
        }
    } else {
        console.warn(`Container ${index + 1} not found.`);
        effectInstances.push(null);
    }
});

// Call once after initializing all effects
updateDemoAndConfigOutput();

// Add listeners to all controls
controlsContainer.addEventListener('input', (event) => {
    const element = event.target;
    const id = element.id;
    const type = element.type;
    console.log(`Input event on: ${id}, type: ${type}`);

    if (type !== 'range' && type !== 'number') {
        console.log('Ignoring non-range/number input');
        return;
    }

    // Determine which paired control group the element belongs to
    const isSizeControl = ['minParticleSize', 'minParticleSizeValue', 'particleSize', 'particleSizeValue'].includes(id);
    const isLifetimeControl = ['minLifetime', 'minLifetimeValue', 'maxLifetime', 'maxLifetimeValue'].includes(id);
    const isOpacityControl = ['minRandomOpacity', 'minRandomOpacityValue', 'maxRandomOpacity', 'maxRandomOpacityValue'].includes(id);
    const isSpeedControl = ['minSpeed', 'minSpeedValue', 'maxSpeed', 'maxSpeedValue'].includes(id);
    const isPairedControl = isSizeControl || isLifetimeControl || isOpacityControl || isSpeedControl;

    // Determine single controls by their base ID
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
                // Call the appropriate update function
                if (isSizeControl) updateSizeControls(id, value);
                else if (isLifetimeControl) updateLifetimeControls(id, value);
                else if (isOpacityControl) updateOpacityControls(id, value);
                else if (isSpeedControl) updateSpeedControls(id, value);
            } else {
                console.warn(`Invalid number from range slider ${id}: ${element.value}.`);
            }
        } else { // Paired input changed (type === 'number')
            console.log(`Pair number input ${id} changed during input. Only updating slider position.`);
            // Only update position of the corresponding slider
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
    } else { // Not a paired control
        // Check if this is one of our single controls
        if (singleControlInfo) {
            if (singleControlInfo.isSlider) {
                // If SLIDER of a single control changed, call full update
                console.log(`Handling single control SLIDER input: baseId=${singleControlInfo.baseId}, changedId=${id}`);
                updateSingleControlPair(singleControlInfo.baseId, id, value);
            } else if (singleControlInfo.isInput) {
                // If INPUT of a single control changed, ONLY update slider position
                console.log(`Handling single control INPUT input: baseId=${singleControlInfo.baseId}, changedId=${id}. Updating slider position only.`);
                const sliderToUpdate = document.getElementById(singleControlInfo.baseId);
                if (sliderToUpdate && !isNaN(value)) {
                    const min = parseFloat(sliderToUpdate.min);
                    const max = parseFloat(sliderToUpdate.max);
                    sliderToUpdate.value = Math.max(min, Math.min(max, value));
                }
            }
        } else {
            // If not a known paired or single control, skip
            console.log(`Ignoring unknown control during input: ${id}`);
        }
    }

    // Update demo and config output AFTER all manipulations
    console.log('Input listener finished, calling updateDemoAndConfigOutput...');
    updateDemoAndConfigOutput(); 
});

// Listener for input fields to update on Enter or focus loss
controlsContainer.addEventListener('change', (event) => {
     const element = event.target;
     const id = element.id;
     const type = element.type;

     if (type === 'number') {
         console.log(`Change event on number input: ${id}`);
         // Determine which paired control group the element belongs to
         const isSizeControl = ['minParticleSizeValue', 'particleSizeValue'].includes(id);
         const isLifetimeControl = ['minLifetimeValue', 'maxLifetimeValue'].includes(id);
         const isOpacityControl = ['minRandomOpacityValue', 'maxRandomOpacityValue'].includes(id);
         const isSpeedControl = ['minSpeedValue', 'maxSpeedValue'].includes(id);
         const isPairedInput = isSizeControl || isLifetimeControl || isOpacityControl || isSpeedControl;

         if (isPairedInput) {
             // Call full linking logic HERE, after input completion
             let value = parseFloat(element.value);
              if (!isNaN(value)) {
                 console.log(`Calling update<Pair>Controls from CHANGE event for ${id} with value ${value}`);
                 // Call the appropriate update function
                 if (isSizeControl) updateSizeControls(id, value);
                 else if (isLifetimeControl) updateLifetimeControls(id, value);
                 else if (isOpacityControl) updateOpacityControls(id, value);
                 else if (isSpeedControl) updateSpeedControls(id, value);

                 // Update demo after finalizing the value
                 updateDemoAndConfigOutput();
             } else {
                  console.warn(`Invalid number entered in ${id} on change: ${element.value}`);
                  // Consider restoring previous valid value?
             }
         } else {
             // Check if this is a single control
             if (singleControlInfo) {
                 console.log(`Change event on single control number input: baseId=${singleControlInfo.baseId}, changedId=${id}`);
                 // Call general update function for final validation/limiting/formatting
                 let value = parseFloat(element.value);
                 updateSingleControlPair(singleControlInfo.baseId, id, value);
                 // Demo will be updated below, as updateDemoAndConfigOutput is called at the end
             } else {
                 console.log(`'change' event on unknown number input ${id}. Triggering updateDemo.`);
             }
         }
     }
});


// Listener for copy button
copyButton.addEventListener('click', () => {
    copyToClipboard(configOutput.textContent);
});

console.log('Demo script initialized.');

// Функция для обновления конфигурации и отображения в блоке с кодом
function updateConfig() {
    const config = {
        particleDensity: parseFloat(document.getElementById('particleDensity').value),
        minRadius: parseFloat(document.getElementById('minParticleSize').value),
        maxRadius: parseFloat(document.getElementById('particleSize').value),
        minLifetimeSeconds: parseFloat(document.getElementById('minLifetime').value),
        maxLifetimeSeconds: parseFloat(document.getElementById('maxLifetime').value),
        fadeInDurationSeconds: parseFloat(document.getElementById('fadeInDuration').value),
        fadeOutDurationSeconds: parseFloat(document.getElementById('fadeOutDuration').value),
        blackRatioPercent: parseFloat(document.getElementById('blackRatio').value),
        minSemiTransparentOpacity: parseFloat(document.getElementById('minRandomOpacity').value),
        maxSemiTransparentOpacity: parseFloat(document.getElementById('maxRandomOpacity').value),
        minSpeed: parseFloat(document.getElementById('minSpeed').value),
        maxSpeed: parseFloat(document.getElementById('maxSpeed').value),
        edgeFadePercent: parseFloat(document.getElementById('edgeFadePercent').value),
        // Добавляем параметры автоскрытия с дефолтными значениями (но в комментариях)
        // autoHideTarget: true,
        // targetFadeDuration: 0.3,
        // targetTimingFunction: 'ease'
    };

    // Форматирование конфигурации для отображения
    const formattedConfig = JSON.stringify(config, null, 2);
    document.getElementById('config-output').textContent = formattedConfig;
    
    // Применение обновленной конфигурации к существующим инстансам
    if (mainEffect) mainEffect.updateConfig(config);
    if (secondaryEffect) secondaryEffect.updateConfig(config);
    if (tertiaryEffect) tertiaryEffect.updateConfig(config);
} 