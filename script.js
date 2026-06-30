const deck = document.getElementById("deck");
const slides = Array.from(document.querySelectorAll(".slide"));
const currentSlide = document.getElementById("currentSlide");
const totalSlides = document.getElementById("totalSlides");
const progressBar = document.getElementById("progressBar");
const prevButton = document.getElementById("prevSlide");
const nextButton = document.getElementById("nextSlide");
const canvas = document.getElementById("cosmos");
const ctx = canvas.getContext("2d");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

let activeIndex = 0;
let particles = [];
let comets = [];
let lightRifts = [];
let rafId = null;
let canvasWidth = 0;
let canvasHeight = 0;
let pixelRatio = 1;

const padNumber = (number) => String(number).padStart(2, "0");

function setActive(index, shouldScroll = false) {
  const nextIndex = Math.max(0, Math.min(index, slides.length - 1));
  activeIndex = nextIndex;

  slides.forEach((slide, slideIndex) => {
    slide.classList.toggle("is-active", slideIndex === nextIndex);
  });

  currentSlide.textContent = padNumber(nextIndex + 1);
  progressBar.style.width = `${((nextIndex + 1) / slides.length) * 100}%`;
  prevButton.disabled = nextIndex === 0;
  nextButton.disabled = nextIndex === slides.length - 1;

  if (shouldScroll) {
    slides[nextIndex].scrollIntoView({
      behavior: reduceMotion.matches ? "auto" : "smooth",
      block: "start"
    });
  }
}

function closestSlideIndex() {
  const viewportCenter = deck.scrollTop + deck.clientHeight / 2;
  let closest = 0;
  let distance = Infinity;

  slides.forEach((slide, index) => {
    const slideCenter = slide.offsetTop + slide.offsetHeight / 2;
    const nextDistance = Math.abs(viewportCenter - slideCenter);
    if (nextDistance < distance) {
      distance = nextDistance;
      closest = index;
    }
  });

  return closest;
}

function go(delta) {
  setActive(activeIndex + delta, true);
}

function handleKeydown(event) {
  const key = event.key;
  const nextKeys = ["ArrowRight", " ", "PageDown"];
  const previousKeys = ["ArrowLeft", "PageUp"];

  if (nextKeys.includes(key)) {
    event.preventDefault();
    go(1);
  }

  if (previousKeys.includes(key)) {
    event.preventDefault();
    go(-1);
  }

  if (key === "Home") {
    event.preventDefault();
    setActive(0, true);
  }

  if (key === "End") {
    event.preventDefault();
    setActive(slides.length - 1, true);
  }
}

function syncFromScroll() {
  const nextIndex = closestSlideIndex();
  if (nextIndex !== activeIndex) {
    setActive(nextIndex, false);
  }

  const maxScroll = deck.scrollHeight - deck.clientHeight;
  const progress = maxScroll > 0 ? deck.scrollTop / maxScroll : 0;
  document.documentElement.style.setProperty("--parallax", `${progress * -90}px`);
  document.documentElement.style.setProperty("--parallax-soft", `${progress * -42}px`);
}

function resizeCanvas() {
  pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  canvasWidth = window.innerWidth;
  canvasHeight = window.innerHeight;
  canvas.width = Math.floor(canvasWidth * pixelRatio);
  canvas.height = Math.floor(canvasHeight * pixelRatio);
  canvas.style.width = `${canvasWidth}px`;
  canvas.style.height = `${canvasHeight}px`;
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

  const count = reduceMotion.matches ? 70 : Math.min(150, Math.floor(canvasWidth * canvasHeight / 13000));
  particles = Array.from({ length: count }, () => ({
    x: Math.random() * canvasWidth,
    y: Math.random() * canvasHeight,
    r: Math.random() > 0.86 ? Math.random() * 2.5 + 1.2 : Math.random() * 1.7 + 0.45,
    a: Math.random() * 0.62 + 0.16,
    baseA: Math.random() * 0.62 + 0.16,
    twinkle: Math.random() * Math.PI * 2,
    twinkleSpeed: 0.006 + Math.random() * 0.013,
    vx: (Math.random() - 0.5) * 0.18,
    vy: (Math.random() - 0.5) * 0.12,
    hue: ["142,160,184", "86,112,150", "118,105,153", "247,241,231"][Math.floor(Math.random() * 4)]
  }));

  comets = Array.from({ length: reduceMotion.matches ? 0 : 6 }, (_, index) => ({
    x: index < 3 ? canvasWidth * (0.18 + Math.random() * 0.72) : -canvasWidth * (0.2 + Math.random() * 1.2) - index * 220,
    y: canvasHeight * (0.16 + Math.random() * 0.76),
    length: 360 + Math.random() * 520,
    speed: 1.1 + Math.random() * 1.45,
    angle: -0.36 + Math.random() * 0.22,
    alpha: 0.18 + Math.random() * 0.20,
    width: 2.4 + Math.random() * 2.6,
    cooldown: 0,
    hue: ["196,207,218", "142,160,184", "86,112,150"][Math.floor(Math.random() * 3)]
  }));

  lightRifts = Array.from({ length: reduceMotion.matches ? 0 : 3 }, (_, index) => ({
    x: canvasWidth * (0.18 + index * 0.28),
    y: canvasHeight * (0.16 + Math.random() * 0.62),
    length: canvasWidth * (0.34 + Math.random() * 0.22),
    angle: -0.22 + Math.random() * 0.44,
    phase: Math.random() * Math.PI * 2,
    speed: 0.004 + Math.random() * 0.003,
    alpha: 0.09 + Math.random() * 0.07,
    hue: ["196,207,218", "142,160,184", "86,112,150"][index % 3]
  }));
}

function drawBackground() {
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  const slideProgress = slides.length > 1 ? activeIndex / (slides.length - 1) : 0;

  const gradient = ctx.createRadialGradient(
    canvasWidth * (0.18 + slideProgress * 0.22),
    canvasHeight * 0.22,
    10,
    canvasWidth * 0.5,
    canvasHeight * 0.5,
    Math.max(canvasWidth, canvasHeight) * 0.82
  );
  gradient.addColorStop(0, "rgba(142,160,184,0.13)");
  gradient.addColorStop(0.34, "rgba(86,112,150,0.12)");
  gradient.addColorStop(0.64, "rgba(118,105,153,0.07)");
  gradient.addColorStop(1, "rgba(11,14,18,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  particles.forEach((particle, index) => {
    if (!reduceMotion.matches) {
      particle.x += particle.vx + Math.sin((Date.now() * 0.0001) + index) * 0.018;
      particle.y += particle.vy;

      if (particle.x < -10) particle.x = canvasWidth + 10;
      if (particle.x > canvasWidth + 10) particle.x = -10;
      if (particle.y < -10) particle.y = canvasHeight + 10;
      if (particle.y > canvasHeight + 10) particle.y = -10;
    }

    particle.twinkle += particle.twinkleSpeed;
    particle.a = particle.baseA * (0.62 + Math.sin(particle.twinkle) * 0.32 + 0.32);

    ctx.beginPath();
    ctx.fillStyle = `rgba(${particle.hue},${particle.a})`;
    ctx.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2);
    ctx.fill();

    if (particle.r > 2) {
      ctx.beginPath();
      ctx.fillStyle = `rgba(${particle.hue},${particle.a * 0.13})`;
      ctx.arc(particle.x, particle.y, particle.r * 5.5, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  comets.forEach((comet) => {
    comet.x += Math.cos(comet.angle) * comet.speed;
    comet.y += Math.sin(comet.angle) * comet.speed;

    if (comet.x > canvasWidth + comet.length * 1.15 || comet.y < -comet.length || comet.y > canvasHeight + comet.length) {
      comet.x = -comet.length - Math.random() * canvasWidth * 1.2;
      comet.y = canvasHeight * (0.28 + Math.random() * 0.72);
      comet.length = 360 + Math.random() * 520;
      comet.speed = 1.1 + Math.random() * 1.45;
      comet.alpha = 0.18 + Math.random() * 0.20;
      comet.width = 2.4 + Math.random() * 2.6;
    }

    const tailX = comet.x - Math.cos(comet.angle) * comet.length;
    const tailY = comet.y - Math.sin(comet.angle) * comet.length;
    const streak = ctx.createLinearGradient(tailX, tailY, comet.x, comet.y);
    streak.addColorStop(0, `rgba(${comet.hue},0)`);
    streak.addColorStop(0.72, `rgba(${comet.hue},${comet.alpha})`);
    streak.addColorStop(1, "rgba(241,237,228,0.22)");

    ctx.beginPath();
    ctx.strokeStyle = streak;
    ctx.lineWidth = comet.width;
    ctx.moveTo(tailX, tailY);
    ctx.lineTo(comet.x, comet.y);
    ctx.stroke();

    ctx.beginPath();
    ctx.fillStyle = `rgba(${comet.hue},${comet.alpha * 0.8})`;
    ctx.arc(comet.x, comet.y, comet.width * 1.2, 0, Math.PI * 2);
    ctx.fill();
  });

  lightRifts.forEach((rift) => {
    rift.phase += rift.speed;
    const drift = Math.sin(rift.phase) * canvasWidth * 0.08;
    const centerX = rift.x + drift;
    const centerY = rift.y + Math.cos(rift.phase * 0.7) * canvasHeight * 0.04;
    const dx = Math.cos(rift.angle) * rift.length;
    const dy = Math.sin(rift.angle) * rift.length;
    const startX = centerX - dx / 2;
    const startY = centerY - dy / 2;
    const endX = centerX + dx / 2;
    const endY = centerY + dy / 2;
    const beam = ctx.createLinearGradient(startX, startY, endX, endY);

    beam.addColorStop(0, `rgba(${rift.hue},0)`);
    beam.addColorStop(0.48, `rgba(${rift.hue},${rift.alpha})`);
    beam.addColorStop(1, `rgba(${rift.hue},0)`);

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.beginPath();
    ctx.strokeStyle = beam;
    ctx.lineWidth = 16;
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    ctx.beginPath();
    ctx.strokeStyle = beam;
    ctx.lineWidth = 2.2;
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    ctx.restore();
  });

  for (let i = 0; i < particles.length; i += 1) {
    for (let j = i + 1; j < particles.length; j += 9) {
      const a = particles[i];
      const b = particles[j];
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const distance = Math.hypot(dx, dy);
      if (distance < 115) {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(241,237,228,${(1 - distance / 115) * 0.045})`;
        ctx.lineWidth = 1;
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
  }

  if (!reduceMotion.matches) {
    rafId = requestAnimationFrame(drawBackground);
  }
}

function startCanvas() {
  if (rafId) cancelAnimationFrame(rafId);
  resizeCanvas();
  drawBackground();
}

let scrollTimer = null;
deck.addEventListener("scroll", () => {
  if (scrollTimer) window.cancelAnimationFrame(scrollTimer);
  scrollTimer = window.requestAnimationFrame(syncFromScroll);
}, { passive: true });

window.addEventListener("keydown", handleKeydown);
window.addEventListener("resize", startCanvas);
prevButton.addEventListener("click", () => go(-1));
nextButton.addEventListener("click", () => go(1));

totalSlides.textContent = padNumber(slides.length);
setActive(0, false);
startCanvas();
