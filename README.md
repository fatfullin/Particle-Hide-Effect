# Particle Hide Effect

A JavaScript library for creating particle effects that automatically hide or reveal DOM elements with customizable animations.

Check out the [live demo](https://fatfullin.github.io/Particle-Hide-Effect/demo) to see the particle effect in action and experiment with different settings.

## Installation

```bash
npm install @fatmax/particle-hide-effect
```

Or include the UMD build directly in your HTML:

```html
<script src="https://cdn.jsdelivr.net/npm/@fatmax/particle-hide-effect@latest/dist/particle-effect.umd.js"></script>
```

## Usage

### ES Module

```javascript
import ParticleEffect from '@fatmax/particle-hide-effect';

const element = document.getElementById('your-element-id');

const config = {
  // Configuration options (see below)
  particleDensity: 200,
  minRadius: 0.6,
  maxRadius: 1.5,
  // ... other options
};

const effect = new ParticleEffect(element, config);

// Add event listeners or call methods directly
element.addEventListener('click', () => {
  effect.toggle();
});
```

### Browser (UMD)

```html
<div id="my-element">Click Me</div>

<script src="https://cdn.jsdelivr.net/npm/@fatmax/particle-hide-effect@latest/dist/particle-effect.umd.js"></script>
<script>
  const element = document.getElementById('my-element');
  const config = { /* your config */ };
  const effect = new ParticleEffect(element, config);

  element.addEventListener('click', () => {
    effect.toggle();
  });
</script>
```

## Configuration Options

The `ParticleEffect` constructor accepts an optional configuration object as the second argument. Here are the available options with their default values:

```javascript
{
  particleDensity: 150,        // Particles per 10,000 sq pixels
  minRadius: 0.5,              // Minimum particle radius
  maxRadius: 1.2,              // Maximum particle radius
  minLifetimeSeconds: 1.5,     // Minimum particle lifetime in seconds
  maxLifetimeSeconds: 4.0,     // Maximum particle lifetime in seconds
  fadeInDurationSeconds: 0.5,  // Particle fade-in duration in seconds
  fadeOutDurationSeconds: 0.5, // Particle fade-out duration in seconds
  minSpeed: 0.15,              // Minimum particle speed (pixels per frame)
  maxSpeed: 0.5,               // Maximum particle speed (pixels per frame)
  blackRatioPercent: 50,       // Percentage of opaque (black) particles
  minSemiTransparentOpacity: 0.2, // Min opacity for semi-transparent particles
  maxSemiTransparentOpacity: 0.7, // Max opacity for semi-transparent particles
  edgeFadePercent: 15,         // Edge fade zone as a % of the container's smaller dimension
  autoStart: true,             // Start the effect immediately on creation
  particleColor: 'rgba(30, 30, 30, 0.7)', // Base color for the particles
  
  // Content hiding options
  autoHideTarget: true,        // Automatically hide content when effect starts
  targetFadeDuration: 0.3,     // Duration of content fade animation in seconds
  targetContentSelector: null, // CSS selector for content to hide (null = entire element)
  targetHideClass: null,       // CSS class to apply for hiding (overrides default behavior)
  targetTimingFunction: 'ease' // CSS timing function for animations
}
```

### Particle Appearance Options

*   **particleDensity**: Controls how many particles are generated relative to the element's area.
*   **minRadius / maxRadius**: Define the size range for particles.
*   **minLifetimeSeconds / maxLifetimeSeconds**: Define the lifetime range for particles.
*   **fadeInDurationSeconds / fadeOutDurationSeconds**: Control the fade-in/out animation speed.
*   **minSpeed / maxSpeed**: Define the speed range for particle movement.
*   **blackRatioPercent**: Percentage of particles that will be fully opaque (black in the default light theme context, white in a dark theme).
*   **minSemiTransparentOpacity / maxSemiTransparentOpacity**: Define the opacity range for the remaining semi-transparent particles.
*   **edgeFadePercent**: Creates a zone near the edges where particles fade out. The value is a percentage of the element's smaller dimension (width or height).
*   **autoStart**: If `true`, the effect starts automatically when the `ParticleEffect` object is created.
*   **particleColor**: Base color of the particles in rgba format.

### Content Hiding Options

*   **autoHideTarget**: Automatically hide the target element's content when the effect is active.
*   **targetFadeDuration**: Duration of the fade animation for hiding/showing content.
*   **targetContentSelector**: CSS selector for targeting a specific child element to hide (if null, manages all content).
*   **targetHideClass**: Optional CSS class to use for hiding content instead of inline styles.
*   **targetTimingFunction**: CSS timing function for the fade animation ('ease', 'linear', etc).

#### Using a Custom CSS Class

Instead of using the built-in hiding mechanism, you can define your own CSS class:

```css
.my-hide-class {
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.5s ease, visibility 0.5s ease;
}
```

```javascript
const effect = new ParticleEffect(element, {
  targetHideClass: 'my-hide-class'
});
```

## Methods

*   `effect.start()`: Starts the particle effect and hides the text.
*   `effect.stop()`: Stops the particle effect and reveals the text.
*   `effect.toggle()`: Toggles the effect between started and stopped states.
*   `effect.updateConfig(newConfig)`: Updates the effect's configuration on the fly. Accepts an object with one or more configuration options.
*   `effect.destroy()`: Removes the canvas, stops the animation loop, and cleans up event listeners.

## License

MIT 