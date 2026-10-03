const cardStage = document.querySelector("#cardStage");
const card = document.querySelector("#paymentCard");
const demoName = document.querySelector("#demoName");
const cardNamePreview = document.querySelector("#cardNamePreview");
const speedSelect = document.querySelector("#speedSelect");
const themeSelect = document.querySelector("#themeSelect");
const motionToggle = document.querySelector("#motionToggle");
const payButton = document.querySelector("#payButton");
const payCopy = payButton.querySelector(".pay-copy");
const status = document.querySelector("#formStatus");
const successScene = document.querySelector("#successScene");
const successName = document.querySelector("#successName");
const resetDemo = document.querySelector("#resetDemo");
const ringValue = document.querySelector("#ringValue");
const completionText = document.querySelector("#completionText");

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const circumference = 106.8;

let rafId = 0;
let targetX = 0;
let targetY = 0;
let currentX = 0;
let currentY = 0;
let tracking = false;

function cleanDemoLabel(value) {
  return value
    .replace(/[^a-zA-Z0-9 ._-]/g, "")
    .replace(/\s{2,}/g, " ")
    .slice(0, 22);
}

function currentDemoName() {
  return cleanDemoLabel(demoName.value.trim()) || "DEMO USER";
}

function syncName() {
  const safeValue = cleanDemoLabel(demoName.value);
  if (demoName.value !== safeValue) demoName.value = safeValue;
  const label = currentDemoName().toUpperCase();
  cardNamePreview.textContent = label;
  successName.textContent = label;
  updateCompletion();
}

function updateCompletion() {
  const percent = demoName.value.trim() ? 100 : 75;
  const offset = circumference * (1 - percent / 100);
  ringValue.style.strokeDashoffset = String(offset);
  completionText.textContent = percent + "%";
}

function setTheme() {
  document.body.dataset.theme = themeSelect.value;
}

function setMotion() {
  const enabled = motionToggle.checked && !reduceMotion;
  document.body.classList.toggle("motion-off", !enabled);
  if (!enabled) resetTilt();
}

function speedDelay() {
  if (reduceMotion) return 120;
  if (speedSelect.value === "fast") return 360;
  if (speedSelect.value === "calm") return 900;
  return 620;
}

function setLoading() {
  payButton.disabled = true;
  payButton.classList.remove("success");
  payButton.classList.add("loading");
  payCopy.textContent = "Running demo…";
  status.className = "form-status";
  status.textContent = "Simulating a local checkout interaction…";
}

function setReady() {
  payButton.disabled = false;
  payButton.classList.remove("loading", "success");
  payCopy.textContent = "Run demo payment";
  status.className = "form-status";
  status.textContent = "";
}

function showSuccess() {
  successName.textContent = currentDemoName().toUpperCase();
  payButton.classList.remove("loading");
  payButton.classList.add("success");
  payCopy.textContent = "Demo approved ✓";
  status.className = "form-status success";
  status.textContent = "Demo completed locally. No payment was sent.";
  successScene.classList.add("show");
  successScene.setAttribute("aria-hidden", "false");
  document.body.classList.add("success-active");
}

function runDemo() {
  if (payButton.disabled) return;
  setLoading();
  window.setTimeout(showSuccess, speedDelay());
}

function closeSuccess() {
  successScene.classList.remove("show");
  successScene.setAttribute("aria-hidden", "true");
  document.body.classList.remove("success-active");
  setReady();
}

function renderTilt() {
  if (!tracking || reduceMotion || !motionToggle.checked) {
    rafId = 0;
    return;
  }

  currentX += (targetX - currentX) * 0.14;
  currentY += (targetY - currentY) * 0.14;

  const rotateY = currentX * 11;
  const rotateX = -currentY * 8;
  const lift = 5 - Math.min(5, Math.abs(currentX) * 4 + Math.abs(currentY) * 4);

  card.style.transform =
    "translate3d(0," + (-Math.max(0, lift)) + "px,0) rotateX(" + rotateX + "deg) rotateY(" + rotateY + "deg)";

  if (Math.abs(targetX - currentX) > 0.002 || Math.abs(targetY - currentY) > 0.002) {
    rafId = requestAnimationFrame(renderTilt);
  } else {
    rafId = 0;
  }
}

function requestTiltFrame() {
  if (!rafId) rafId = requestAnimationFrame(renderTilt);
}

function resetTilt() {
  targetX = 0;
  targetY = 0;
  currentX = 0;
  currentY = 0;
  tracking = false;
  if (rafId) cancelAnimationFrame(rafId);
  rafId = 0;
  card.style.transform = "";
}

cardStage.addEventListener("pointerenter", () => {
  if (window.innerWidth <= 760 || reduceMotion || !motionToggle.checked) return;
  tracking = true;
  requestTiltFrame();
});

cardStage.addEventListener("pointermove", event => {
  if (window.innerWidth <= 760 || reduceMotion || !motionToggle.checked) return;
  const rect = cardStage.getBoundingClientRect();
  targetX = Math.max(-0.5, Math.min(0.5, (event.clientX - rect.left) / rect.width - 0.5));
  targetY = Math.max(-0.5, Math.min(0.5, (event.clientY - rect.top) / rect.height - 0.5));
  tracking = true;
  requestTiltFrame();
});

cardStage.addEventListener("pointerleave", resetTilt);
cardStage.addEventListener("pointercancel", resetTilt);

demoName.addEventListener("input", syncName);
themeSelect.addEventListener("change", setTheme);
motionToggle.addEventListener("change", setMotion);
payButton.addEventListener("click", runDemo);
resetDemo.addEventListener("click", closeSuccess);

document.addEventListener("keydown", event => {
  if (event.key === "Escape" && successScene.classList.contains("show")) {
    closeSuccess();
  }
});

window.addEventListener("resize", () => {
  if (window.innerWidth <= 760) resetTilt();
});

syncName();
setTheme();
setMotion();
updateCompletion();
