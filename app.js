const form = document.querySelector("#paymentForm");
const checkoutGrid = document.querySelector(".checkout-grid");
const cardStage = document.querySelector("#cardStage");
const card = document.querySelector("#paymentCard");
const nameInput = document.querySelector("#cardName");
const numberInput = document.querySelector("#cardNumber");
const expiryInput = document.querySelector("#cardExpiry");
const cvvInput = document.querySelector("#cardCvv");
const payButton = document.querySelector("#payButton");
const status = document.querySelector("#formStatus");

const namePreview = document.querySelector("#cardNamePreview");
const numberPreview = document.querySelector("#cardNumberPreview");
const expiryPreview = document.querySelector("#cardExpiryPreview");
const cvvPreview = document.querySelector("#cardCvvPreview");
const brandPreview = document.querySelector("#cardBrand");

const keyboard = document.querySelector("#demoKeyboard");
const keyboardKeys = document.querySelector("#keyboardKeys");
const keyboardLabel = document.querySelector("#keyboardLabel");
const keyboardDone = document.querySelector("#keyboardDone");

const successScene = document.querySelector("#successScene");
const successCardSlot = document.querySelector("#successCardSlot");
const resetDemo = document.querySelector("#resetDemo");

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const onlyDigits = value => value.replace(/\D/g, "");
const demoInputs = [nameInput, numberInput, expiryInput, cvvInput];

let activeInput = null;

function formatCardNumber(value) {
  return onlyDigits(value).slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
}

function formatExpiry(value) {
  const digits = onlyDigits(value).slice(0, 4);
  if (digits.length <= 2) return digits;
  return digits.slice(0, 2) + "/" + digits.slice(2);
}

function detectBrand(value) {
  const digits = onlyDigits(value);
  if (/^4/.test(digits)) return "VISA";
  if (/^(5[1-5]|2[2-7])/.test(digits)) return "MC";
  if (/^3[47]/.test(digits)) return "AMEX";
  return "CARD";
}

function syncPreview() {
  namePreview.textContent = (nameInput.value.trim() || "YOUR NAME").toUpperCase();
  numberPreview.textContent = numberInput.value || "•••• •••• •••• ••••";
  expiryPreview.textContent = expiryInput.value || "MM/YY";
  cvvPreview.textContent = cvvInput.value || "•••";
  brandPreview.textContent = detectBrand(numberInput.value);
}

function setInputValue(input, value) {
  input.value = value;
  syncPreview();
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

function keyboardTitle(input) {
  const kind = input.dataset.keyboard;
  if (kind === "name") return "Cardholder name";
  if (kind === "number") return "Card number";
  if (kind === "expiry") return "Expiry date";
  return "Security code";
}

function makeKey(label, value = label, classes = "") {
  const button = document.createElement("button");
  button.type = "button";
  button.className = ("key " + classes).trim();
  button.textContent = label;
  button.dataset.value = value;
  return button;
}

function renderKeyboard(input) {
  keyboardKeys.innerHTML = "";
  const kind = input.dataset.keyboard;

  if (kind === "name") {
    "QWERTYUIOPASDFGHJKLZXCVBNM".split("").forEach(letter => {
      keyboardKeys.appendChild(makeKey(letter, letter));
    });
    keyboardKeys.appendChild(makeKey("space", " ", "space action"));
    keyboardKeys.appendChild(makeKey("⌫", "__backspace", "wide action"));
    return;
  }

  ["1","2","3","4","5","6","7","8","9"].forEach(number => {
    keyboardKeys.appendChild(makeKey(number, number, "numeric"));
  });
  keyboardKeys.appendChild(makeKey("⌫", "__backspace", "numeric action"));
  keyboardKeys.appendChild(makeKey("0", "0", "numeric"));
  keyboardKeys.appendChild(makeKey("Next", "__next", "numeric action"));
}

function openKeyboard(input) {
  activeInput = input;
  keyboardLabel.textContent = keyboardTitle(input);
  renderKeyboard(input);
  keyboard.classList.add("visible");
  keyboard.setAttribute("aria-hidden", "false");
  document.body.classList.add("keyboard-open");

  if (input === cvvInput) {
    card.style.transform = "";
    cardStage.classList.add("cvv-focus");
  } else {
    cardStage.classList.remove("cvv-focus");
  }
}

function closeKeyboard() {
  keyboard.classList.remove("visible");
  keyboard.setAttribute("aria-hidden", "true");
  document.body.classList.remove("keyboard-open");
  if (activeInput) activeInput.blur();
  activeInput = null;
  cardStage.classList.remove("cvv-focus");
}

function moveToNextInput() {
  if (!activeInput) return;
  const index = demoInputs.indexOf(activeInput);
  if (index >= 0 && index < demoInputs.length - 1) {
    const next = demoInputs[index + 1];
    next.focus({ preventScroll: true });
    openKeyboard(next);
  } else {
    closeKeyboard();
  }
}

function applyDemoKey(value) {
  if (!activeInput) return;
  const kind = activeInput.dataset.keyboard;

  if (value === "__next") {
    moveToNextInput();
    return;
  }

  if (value === "__backspace") {
    if (kind === "number") {
      const digits = onlyDigits(activeInput.value).slice(0, -1);
      setInputValue(activeInput, formatCardNumber(digits));
    } else if (kind === "expiry") {
      const digits = onlyDigits(activeInput.value).slice(0, -1);
      setInputValue(activeInput, formatExpiry(digits));
    } else {
      setInputValue(activeInput, activeInput.value.slice(0, -1));
    }
    return;
  }

  if (kind === "name") {
    if (activeInput.value.length < 28) setInputValue(activeInput, activeInput.value + value);
    return;
  }

  if (kind === "number") {
    const digits = (onlyDigits(activeInput.value) + value).slice(0, 16);
    setInputValue(activeInput, formatCardNumber(digits));
    if (digits.length === 16) window.setTimeout(moveToNextInput, 150);
    return;
  }

  if (kind === "expiry") {
    let digits = (onlyDigits(activeInput.value) + value).slice(0, 4);
    if (digits.length >= 2) {
      let month = Number(digits.slice(0, 2));
      if (month > 12) digits = "12" + digits.slice(2);
      if (month === 0) digits = "01" + digits.slice(2);
    }
    setInputValue(activeInput, formatExpiry(digits));
    if (digits.length === 4) window.setTimeout(moveToNextInput, 150);
    return;
  }

  if (kind === "cvv") {
    const digits = (onlyDigits(activeInput.value) + value).slice(0, 4);
    setInputValue(activeInput, digits);
  }
}

keyboardKeys.addEventListener("click", event => {
  const key = event.target.closest(".key");
  if (!key) return;
  applyDemoKey(key.dataset.value);
});

keyboardDone.addEventListener("click", closeKeyboard);

demoInputs.forEach(input => {
  input.addEventListener("focus", () => openKeyboard(input));
  input.addEventListener("click", () => openKeyboard(input));
});

/* Smooth 3D card tracking on pointer devices. */
let targetX = 0;
let targetY = 0;
let currentX = 0;
let currentY = 0;
let rafId = 0;
let tracking = false;

function renderTilt() {
  if (!tracking || cardStage.classList.contains("cvv-focus") || reduceMotion) {
    rafId = 0;
    return;
  }

  currentX += (targetX - currentX) * 0.16;
  currentY += (targetY - currentY) * 0.16;

  const rotateY = currentX * 9;
  const rotateX = -currentY * 7;
  const lift = 4 - Math.min(4, Math.abs(currentX) + Math.abs(currentY));

  card.style.transform =
    `translate3d(0,${-Math.max(0, lift)}px,0) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;

  if (Math.abs(targetX - currentX) > 0.002 || Math.abs(targetY - currentY) > 0.002) {
    rafId = requestAnimationFrame(renderTilt);
  } else {
    rafId = 0;
  }
}

function requestTiltFrame() {
  if (!rafId) rafId = requestAnimationFrame(renderTilt);
}

cardStage.addEventListener("pointerenter", () => {
  if (reduceMotion) return;
  tracking = true;
  requestTiltFrame();
});

cardStage.addEventListener("pointermove", event => {
  if (reduceMotion || cardStage.classList.contains("cvv-focus")) return;

  const rect = cardStage.getBoundingClientRect();
  targetX = Math.max(-0.5, Math.min(0.5, (event.clientX - rect.left) / rect.width - 0.5));
  targetY = Math.max(-0.5, Math.min(0.5, (event.clientY - rect.top) / rect.height - 0.5));

  tracking = true;
  requestTiltFrame();
});

function resetCardTilt() {
  if (cardStage.classList.contains("cvv-focus")) return;

  targetX = 0;
  targetY = 0;
  currentX = 0;
  currentY = 0;
  tracking = false;

  if (rafId) cancelAnimationFrame(rafId);
  rafId = 0;
  card.style.transform = "";
}

cardStage.addEventListener("pointerleave", resetCardTilt);
cardStage.addEventListener("pointerup", resetCardTilt);
cardStage.addEventListener("pointercancel", resetCardTilt);

function buildSuccessCard() {
  successCardSlot.innerHTML = "";
  const clone = card.cloneNode(true);
  clone.removeAttribute("id");
  clone.querySelectorAll("[id]").forEach(node => node.removeAttribute("id"));
  clone.classList.add("success-card-clone");
  clone.style.transform = "";
  successCardSlot.appendChild(clone);
}

function showSuccess() {
  buildSuccessCard();
  successScene.classList.add("show");
  successScene.setAttribute("aria-hidden", "false");
  document.body.classList.add("success-active");
}

form.addEventListener("submit", event => {
  event.preventDefault();

  closeKeyboard();
  status.className = "form-status";
  status.textContent = "Processing demo…";
  payButton.disabled = true;
  payButton.classList.add("loading");
  payButton.querySelector(".pay-copy").textContent = "Processing…";

  window.setTimeout(() => {
    payButton.classList.remove("loading");
    payButton.classList.add("success");
    payButton.querySelector(".pay-copy").textContent = "Paid ✓";
    status.textContent = "Demo approved — no real payment was sent.";
    status.classList.add("success");
    showSuccess();
  }, reduceMotion ? 150 : 720);
});

resetDemo.addEventListener("click", () => {
  successScene.classList.remove("show");
  successScene.setAttribute("aria-hidden", "true");
  document.body.classList.remove("success-active");
  payButton.disabled = false;
  payButton.classList.remove("success");
  payButton.querySelector(".pay-copy").textContent = "Pay $1,248.00";
  status.textContent = "";
  successCardSlot.innerHTML = "";

  if (window.innerWidth <= 760 && checkoutGrid) {
    checkoutGrid.scrollTo({ left: checkoutGrid.clientWidth, behavior: reduceMotion ? "auto" : "smooth" });
  }
});

syncPreview();
