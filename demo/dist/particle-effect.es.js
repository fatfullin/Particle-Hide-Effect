var u = Object.defineProperty;
var g = (n, t, i) => t in n ? u(n, t, { enumerable: !0, configurable: !0, writable: !0, value: i }) : n[t] = i;
var m = (n, t, i) => g(n, typeof t != "symbol" ? t + "" : t, i);
class p {
  // Конструктор принимает настройки из экземпляра ParticleEffect
  constructor(t, i, s) {
    this.canvas = t, this.ctx = i, this.settings = s, this.reset(!0);
  }
  reset(t = !1) {
    const i = Math.max(0, this.canvas.width - 2 * this.settings.particleSpawnMargin), s = Math.max(0, this.canvas.height - 2 * this.settings.particleSpawnMargin);
    this.x = this.settings.particleSpawnMargin + Math.random() * i, this.y = this.settings.particleSpawnMargin + Math.random() * s, this.x = Math.max(0, Math.min(this.x, this.canvas.width)), this.y = Math.max(0, Math.min(this.y, this.canvas.height)), this.radius = Math.random() * (this.settings.maxRadius - this.settings.minRadius) + this.settings.minRadius;
    const e = Math.random() * Math.PI * 2, a = Math.random() * (this.settings.maxSpeed - this.settings.minSpeed) + this.settings.minSpeed;
    this.vx = Math.cos(e) * a, this.vy = Math.sin(e) * a, Math.random() < this.settings.blackRatioPercent / 100 ? this.initialOpacity = 1 : this.initialOpacity = Math.random() * (this.settings.maxSemiTransparentOpacity - this.settings.minSemiTransparentOpacity) + this.settings.minSemiTransparentOpacity, this.lifetimeSeconds = Math.random() * (this.settings.maxLifetimeSeconds - this.settings.minLifetimeSeconds) + this.settings.minLifetimeSeconds, t ? (this.ageSeconds = Math.random() * this.lifetimeSeconds, this.calculateCurrentOpacity()) : (this.ageSeconds = 0, this.currentOpacity = 0);
  }
  // Расчет текущей прозрачности с учетом fadeIn, lifetime и fadeOut
  calculateCurrentOpacity() {
    const t = this.settings.fadeInDurationSeconds, i = Math.max(t, this.lifetimeSeconds - this.settings.fadeOutDurationSeconds);
    if (this.ageSeconds < t) {
      const s = Math.max(1e-3, t), e = Math.max(0, Math.min(1, this.ageSeconds / s));
      this.currentOpacity = this.initialOpacity * e;
    } else if (this.ageSeconds < i)
      this.currentOpacity = this.initialOpacity;
    else {
      const s = Math.max(1e-3, this.settings.fadeOutDurationSeconds), e = this.ageSeconds - i, a = Math.min(1, e / s);
      this.currentOpacity = this.initialOpacity * (1 - a);
    }
    this.currentOpacity = Math.max(0, Math.min(this.initialOpacity, this.currentOpacity));
  }
  // Обновление состояния частицы за прошедшее время
  update(t) {
    if (this.ageSeconds += t, this.ageSeconds >= this.lifetimeSeconds) {
      this.reset(!1);
      return;
    }
    this.x += this.vx, this.y += this.vy, this.calculateCurrentOpacity(), this.currentOpacity > 0 && (this.x + this.radius < 0 || this.x - this.radius > this.canvas.width || this.y + this.radius < 0 || this.y - this.radius > this.canvas.height) && this.reset(!1);
  }
  // Отрисовка частицы
  draw() {
    if (this.currentOpacity <= 0) return;
    this.ctx.beginPath(), this.ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    let t = Math.max(0, Math.min(1, this.currentOpacity));
    const s = Math.min(this.canvas.width, this.canvas.height) * (this.settings.edgeFadePercent / 100), e = Math.min(this.x, this.canvas.width - this.x), a = Math.min(this.y, this.canvas.height - this.y), h = Math.min(e, a);
    let c = 1;
    if (s > 0 && h < s) {
      const l = Math.max(0, Math.min(1, h / s));
      c = l * l;
    }
    const o = Math.max(0, Math.min(1, t * c));
    if (o <= 0) return;
    const f = this.settings.particleColor.substring(this.settings.particleColor.indexOf("(") + 1, this.settings.particleColor.lastIndexOf(",")).trim();
    this.ctx.fillStyle = `rgba(${f}, ${o})`, this.ctx.fill();
  }
}
const r = class r {
  constructor(t, i = {}) {
    if (!t || !(t instanceof Element)) {
      console.error("ParticleEffect: targetElement is not a valid DOM Element.");
      return;
    }
    this.targetElement = t, this.config = { ...r.defaultConfig, ...i }, this.canvas = document.createElement("canvas"), this.ctx = this.canvas.getContext("2d"), this.targetElement.style.position = "relative", this.canvas.style.position = "absolute", this.canvas.style.top = "0", this.canvas.style.left = "0", this.canvas.style.width = "100%", this.canvas.style.height = "100%", this.canvas.style.pointerEvents = "none", this.targetElement.appendChild(this.canvas), this.particles = [], this.animationFrameId = null, this.lastTimestamp = 0, this.isActive = !1, this.isDestroyed = !1, this._animate = this._animate.bind(this), this._resizeCanvas = this._resizeCanvas.bind(this), this.resizeObserver = new ResizeObserver((s) => {
      for (let e of s)
        this._resizeTimeout && clearTimeout(this._resizeTimeout), this._resizeTimeout = setTimeout(this._resizeCanvas, 50);
    }), this.resizeObserver.observe(this.targetElement), this._resizeCanvas(), this.config.autoStart && this.start();
  }
  // --- Приватные методы ---
  // Обновление размера Canvas и пересоздание частиц (если активен)
  _resizeCanvas() {
    this.isDestroyed || (this.canvas.width = this.targetElement.offsetWidth, this.canvas.height = this.targetElement.offsetHeight, this.isActive && this._createParticles());
  }
  // Создание/пересоздание массива частиц
  _createParticles() {
    if (this.isDestroyed || this.canvas.width === 0 || this.canvas.height === 0) {
      this.particles = [];
      return;
    }
    const t = this.canvas.width * this.canvas.height, i = this.config.particleDensity / 1e4, s = Math.round(t * i), e = Math.max(10, Math.min(s, 3e3));
    this.particles = [];
    for (let a = 0; a < e; a++)
      this.particles.push(new p(this.canvas, this.ctx, this.config));
  }
  // Основной цикл анимации
  _animate(t) {
    if (!this.isActive || this.isDestroyed) {
      this.animationFrameId = null;
      return;
    }
    const i = (t - (this.lastTimestamp || t)) / 1e3;
    this.lastTimestamp = t;
    const s = 0.05, e = i <= 0 ? 1 / 60 : i, a = Math.min(e, s);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height), this.particles.forEach((h) => {
      h.update(a), h.draw();
    }), this.animationFrameId = requestAnimationFrame(this._animate);
  }
  // --- Публичные методы API ---
  /**
   * Запускает анимацию частиц.
   */
  start() {
    this.isActive || this.isDestroyed || (this.isActive = !0, console.log("ParticleEffect: Starting animation"), this._resizeCanvas(), this.animationFrameId || (this.lastTimestamp = performance.now(), this.animationFrameId = requestAnimationFrame(this._animate)));
  }
  /**
   * Останавливает анимацию частиц.
   */
  stop() {
    !this.isActive || this.isDestroyed || (this.isActive = !1, console.log("ParticleEffect: Stopping animation"), this.animationFrameId && (cancelAnimationFrame(this.animationFrameId), this.animationFrameId = null), this.ctx && this.canvas && this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height));
  }
  /**
   * Переключает состояние анимации (запущена/остановлена).
   */
  toggle() {
    this.isDestroyed || (this.isActive ? this.stop() : this.start());
  }
  /**
    * Обновляет конфигурацию эффекта новыми настройками.
    * @param {object} newConfig - Объект с новыми параметрами для обновления.
    */
  updateConfig(t) {
    this.isDestroyed || !t || (this.config = { ...r.defaultConfig, ...this.config, ...t }, console.log("ParticleEffect: Config updated", this.config), this.isActive ? this._createParticles() : this.particles = []);
  }
  /**
   * Полностью останавливает эффект, очищает ресурсы и удаляет canvas.
   */
  destroy() {
    this.isDestroyed || (console.log("ParticleEffect: Destroying instance"), this.isDestroyed = !0, this.stop(), this.resizeObserver && (this.resizeObserver.disconnect(), this.resizeObserver = null), this._resizeTimeout && clearTimeout(this._resizeTimeout), this.canvas && this.canvas.parentNode && this.canvas.parentNode.removeChild(this.canvas), this.particles = [], this.canvas = null, this.ctx = null, this.targetElement = null, this.config = null);
  }
};
// Настройки по умолчанию
m(r, "defaultConfig", {
  particleDensity: 150,
  particleColor: "rgba(30, 30, 30, 0.7)",
  minSpeed: 0.15,
  maxSpeed: 0.5,
  minRadius: 0.5,
  maxRadius: 1.2,
  particleSpawnMargin: 10,
  edgeFadePercent: 15,
  minLifetimeSeconds: 1.5,
  maxLifetimeSeconds: 4,
  fadeOutDurationSeconds: 0.5,
  fadeInDurationSeconds: 0.5,
  blackRatioPercent: 50,
  minSemiTransparentOpacity: 0.2,
  maxSemiTransparentOpacity: 0.7,
  autoStart: !0
  // Добавим опцию автостарта
});
let d = r;
export {
  d as default
};
