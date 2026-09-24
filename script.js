const deck = document.getElementById("deck");
const presentationStage = document.getElementById("presentationStage");
const slides = [...document.querySelectorAll(".slide")];
const currentSlide = document.getElementById("currentSlide");
const totalSlides = document.getElementById("totalSlides");
const progressBar = document.getElementById("progressBar");
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
const backdropLayers = [...document.querySelectorAll(".story-image")];
const PRESENTATION_WIDTH = 1536;
const PRESENTATION_HEIGHT = 730;

function fitPresentation() {
  const scale = Math.min(1, innerWidth / PRESENTATION_WIDTH, innerHeight / PRESENTATION_HEIGHT);
  presentationStage.style.setProperty("--deck-scale", String(scale));
}

fitPresentation();
addEventListener("resize", fitPresentation, { passive: true });
window.visualViewport?.addEventListener("resize", fitPresentation, { passive: true });
const slideBackgrounds = [
  "assets/scene/hero-cosmic-wheat.webp",
  "assets/scene/grain-macro.webp", "assets/scene/seed-soil.webp",
  "assets/scene/corpus-archive.webp",
  "assets/scene/layers-mineral.webp",
  "assets/scene/field-aerial.webp",
  "assets/scene/field-detail.webp",
  "assets/scene/roots-memory.webp",
  "assets/scene/tree-field.webp",
  "assets/scene/canopy-memory.webp", "assets/scene/wheat-horizon.webp",
  "assets/scene/cloud-ascent.webp", "assets/scene/chapter3-composition.webp",
  "assets/scene/conclusions-cosmic-funnel.webp",
  "assets/scene/nebula-violet.webp"
];

let visibleBackdrop = 0;
let currentBackdrop = "";
slideBackgrounds.forEach(source => { const image = new Image(); image.src = source; });

function setBackdrop(index, immediate = false) {
  if (!backdropLayers.length) return;
  const source = slideBackgrounds[index] || slideBackgrounds[slideBackgrounds.length - 1];
  if (source === currentBackdrop) return;
  currentBackdrop = source;
  const nextBackdrop = immediate ? visibleBackdrop : 1 - visibleBackdrop;
  const nextLayer = backdropLayers[nextBackdrop];
  nextLayer.style.backgroundImage = `url("${source}")`;
  nextLayer.classList.add("is-visible");
  backdropLayers[1 - nextBackdrop].classList.remove("is-visible");
  visibleBackdrop = nextBackdrop;
}

let activeIndex = 0;
let scrollFrame = 0;
const pad = value => String(value).padStart(2, "0");

function activate(index, scroll = false) {
  const next = Math.max(0, Math.min(slides.length - 1, index));
  activeIndex = next;
  slides.forEach((slide, i) => slide.classList.toggle("is-active", i === next));
  currentSlide.textContent = pad(next + 1);
  progressBar.style.width = `${((next + 1) / slides.length) * 100}%`;
  document.documentElement.dataset.slide = String(next + 1);
  setBackdrop(next, currentBackdrop === "");
  window.dispatchEvent(new CustomEvent("deck:slide", {
    detail: { index: next, total: slides.length, theme: slides[next].dataset.theme || "" }
  }));
  if (scroll) slides[next].scrollIntoView({ behavior: reduceMotion.matches ? "auto" : "smooth", block: "start" });
}

function nearestSlide() {
  const center = deck.scrollTop + deck.clientHeight / 2;
  let found = 0;
  let shortest = Infinity;
  slides.forEach((slide, index) => {
    const distance = Math.abs(slide.offsetTop + slide.offsetHeight / 2 - center);
    if (distance < shortest) { shortest = distance; found = index; }
  });
  return found;
}

function move(delta) { activate(activeIndex + delta, true); }

addEventListener("keydown", event => {
  if (["ArrowRight", "ArrowDown", " ", "PageDown"].includes(event.key)) { event.preventDefault(); move(1); }
  if (["ArrowLeft", "ArrowUp", "PageUp"].includes(event.key)) { event.preventDefault(); move(-1); }
  if (event.key === "Home") { event.preventDefault(); activate(0, true); }
  if (event.key === "End") { event.preventDefault(); activate(slides.length - 1, true); }
});

deck.addEventListener("scroll", () => {
  cancelAnimationFrame(scrollFrame);
  scrollFrame = requestAnimationFrame(() => {
    const next = nearestSlide();
    if (next !== activeIndex) activate(next, false);
  });
}, { passive: true });

deck.addEventListener("click", event => {
  if (window.getSelection()?.toString()) return;
  const bounds = deck.getBoundingClientRect();
  move(event.clientX - bounds.left < bounds.width * .22 ? -1 : 1);
});

let touchStartY = 0;
deck.addEventListener("touchstart", event => { touchStartY = event.touches[0]?.clientY || 0; }, { passive: true });
deck.addEventListener("touchend", event => {
  const endY = event.changedTouches[0]?.clientY || touchStartY;
  if (Math.abs(endY - touchStartY) > 50) move(endY < touchStartY ? 1 : -1);
}, { passive: true });

totalSlides.textContent = pad(slides.length);
const requestedSlide = Number(new URLSearchParams(location.search).get("slide"));
if (Number.isFinite(requestedSlide) && requestedSlide > 0) {
  activeIndex = Math.min(slides.length - 1, Math.floor(requestedSlide) - 1);
  deck.scrollTop = slides[activeIndex].offsetTop;
}
activate(activeIndex, false);
