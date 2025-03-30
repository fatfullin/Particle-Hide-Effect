# Particle Hide Effect

A simple JavaScript library to create a particle effect that reveals or hides the text content of a DOM element.

## Installation

```bash
npm install particle-hide-effect # Or yarn add particle-hide-effect (Replace with your actual package name if published)
```

Or include the UMD build directly in your HTML:

```html
<script src="https://cdn.jsdelivr.net/npm/particle-hide-effect@latest/dist/particle-effect.umd.js"></script> <!-- Replace with actual CDN link -->
```

## Usage

### ES Module

```javascript
import ParticleEffect from 'particle-hide-effect'; // Replace with your actual package name

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

<script src="path/to/particle-effect.umd.js"></script>
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
  minSpeed: 0.5,               // Minimum particle speed (pixels per frame)
  maxSpeed: 1.5,               // Maximum particle speed (pixels per frame)
  blackRatioPercent: 50,       // Percentage of opaque (black) particles
  minSemiTransparentOpacity: 0.2, // Min opacity for semi-transparent particles
  maxSemiTransparentOpacity: 0.7, // Max opacity for semi-transparent particles
  edgeFadePercent: 15,         // Edge fade zone as a % of the container's smaller dimension
  autoStart: false,            // Start the effect immediately on creation
  zIndex: 2                    // z-index for the particle canvas
}
```

*   **particleDensity**: Controls how many particles are generated relative to the element's area.
*   **minRadius / maxRadius**: Define the size range for particles.
*   **minLifetimeSeconds / maxLifetimeSeconds**: Define the lifetime range for particles.
*   **fadeInDurationSeconds / fadeOutDurationSeconds**: Control the fade-in/out animation speed.
*   **minSpeed / maxSpeed**: Define the speed range for particle movement.
*   **blackRatioPercent**: Percentage of particles that will be fully opaque (black in the default light theme context, white in a dark theme).
*   **minSemiTransparentOpacity / maxSemiTransparentOpacity**: Define the opacity range for the remaining semi-transparent particles.
*   **edgeFadePercent**: Creates a zone near the edges where particles fade out. The value is a percentage of the element's smaller dimension (width or height).
*   **autoStart**: If `true`, the effect starts automatically when the `ParticleEffect` object is created.
*   **zIndex**: The CSS `z-index` property applied to the particle canvas.

## Methods

*   `effect.start()`: Starts the particle effect and hides the text.
*   `effect.stop()`: Stops the particle effect and reveals the text.
*   `effect.toggle()`: Toggles the effect between started and stopped states.
*   `effect.updateConfig(newConfig)`: Updates the effect's configuration on the fly. Accepts an object with one or more configuration options.
*   `effect.destroy()`: Removes the canvas, stops the animation loop, and cleans up event listeners.

## Demo

[Link to Live Demo (GitHub Pages)]() <!-- Placeholder -->

## License

ISC <!-- Or your chosen license -->