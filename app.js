const form = document.querySelector("#paymentForm");
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

const mobileLivePreview = document.querySelector("#mobileLivePreview");
const mobileCardStage = document.querySelector("#mobileCardStage");

const successScene = document.querySelector("#successScene");
const successCardSlot = document.querySelector("#successCardSlot");
const resetDemo = document.querySelector("#resetDemo");

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const onlyDigits = value => value.replace(/\D/g, "");
const demoInputs = [nameInput, numberInput, expiryInput, cvvInput];

let activeInput = null;
let mobileCard = null;

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

function buildMobileCard() {
  if (!mobileCardStage || mobileCard) return;
  mobileCard = card.cloneNode(true);
  mobileCard.removeAttribute("id");
  mobileCard.querySelectorAll("[id]").forEach(node => node.removeAttribute("id"));
  mobileCard.classList.add("mobile-payment-card");
  mobileCard.style.transform = "";
  mobileCardStage.appendChild(mobileCard);
}

function updateCardNode(cardNode) {
  if (!cardNode) return;
  const numberNode = cardNode.querySelector(".card-number");
  const nameNode = cardNode.querySelector(".card-bottom > div:first-child strong");
  const expiryNode = cardNode.querySelector(".expiry-box strong");
  const cvvNode = cardNode.querySelector(".signature-row strong");

  if (numberNode) numberNode.textContent = numberInput.value || "•••• •••• •••• ••••";
  if (nameNode) nameNode.textContent = (nameInput.value.trim() || "YOUR NAME").toUpperCase();
  if (expiryNode) expiryNode.textContent = expiryInput.value || "MM/YY";
  if (cvvNode) cvvNode.textContent = cvvInput.value || "•••";
}

function syncPreview() {
  namePreview.textContent = (nameInput.value.trim() || "YOUR NAME").toUpperCase();
  numberPreview.textContent = numberInput.value || "•••• •••• •••• ••••";
  expiryPreview.textContent = expiryInput.value || "MM/YY";
  cvvPreview.textContent = cvvInput.value || "•••";
  brandPreview.textContent = detectBrand(numberInput.value);
  updateCardNode(mobileCard);
}

function setInputValue(input, value) {
  input.value = value;
  input.classList.remove("invalid");
  input.setAttribute("aria-invalid", "false");
  syncPreview();
  input.dispatchEvent(new Event("input", { bubbles: true }));
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
  button.setAttribute("aria-label", value === "__backspace" ? "Delete" : label);
  return button;
}

function renderKeyboard(input) {
  keyboardKeys.innerHTML = "";
  const kind = input.dataset.keyboard;

  if (kind === "name") {
    "QWERTYUIOPASDFGHJKLZXCVBNM".split("").forEach(letter => {
      keyboardKeys.appendChild(makeKey(letter, letter));
    });
    keyboardKeys.appendChild(makeKey("SPACE", " ", "space action"));
    keyboardKeys.appendChild(makeKey("⌫ DELETE", "__backspace", "wide action delete-key"));
    return;
  }

  ["1","2","3","4","5","6","7","8","9"].forEach(number => {
    keyboardKeys.appendChild(makeKey(number, number, "numeric"));
  });
  keyboardKeys.appendChild(makeKey("⌫", "__backspace", "numeric action delete-key"));
  keyboardKeys.appendChild(makeKey("0", "0", "numeric"));
  keyboardKeys.appendChild(makeKey("NEXT", "__next", "numeric action"));
}

function setFlipState(input) {
  const flip = input === cvvInput;
  card.style.transform = "";
  cardStage.classList.toggle("cvv-focus", flip);
  mobileCardStage?.classList.toggle("cvv-focus", flip);
}

function revealActiveInput(input) {
  if (window.innerWidth > 760) return;
  window.setTimeout(() => {
    const rect = input.getBoundingClientRect();
    const keyboardHeight = keyboard.getBoundingClientRect().height || 250;
    const safeBottom = window.innerHeight - keyboardHeight - 18;
    if (rect.bottom > safeBottom) {
      window.scrollBy({
        top: rect.bottom - safeBottom + 12,
        behavior: reduceMotion ? "auto" : "smooth"
      });
    }
  }, 80);
}

function openKeyboard(input) {
  activeInput = input;
  demoInputs.forEach(field => field.classList.toggle("demo-active", field === input));
  keyboardLabel.textContent = keyboardTitle(input);
  renderKeyboard(input);
  keyboard.classList.add("visible");
  keyboard.setAttribute("aria-hidden", "false");
  document.body.classList.add("keyboard-open");
  mobileLivePreview?.classList.add("typing");
  setFlipState(input);
  revealActiveInput(input);
}

function closeKeyboard() {
  keyboard.classList.remove("visible");
  keyboard.setAttribute("aria-hidden", "true");
  document.body.classList.remove("keyboard-open");
  mobileLivePreview?.classList.remove("typing");
  demoInputs.forEach(field => field.classList.remove("demo-active"));
  activeInput = null;
  cardStage.classList.remove("cvv-focus");
  mobileCardStage?.classList.remove("cvv-focus");
}

function moveToNextInput() {
  if (!activeInput) return;
  const index = demoInputs.indexOf(activeInput);
  if (index >= 0 && index < demoInputs.length - 1) {
    openKeyboard(demoInputs[index + 1]);
  } else {
    closeKeyboard();
  }
}

function deleteOne() {
  if (!activeInput) return;
  const kind = activeInput.dataset.keyboard;

  if (kind === "number") {
    const digits = onlyDigits(activeInput.value).slice(0, -1);
    setInputValue(activeInput, formatCardNumber(digits));
  } else if (kind === "expiry") {
    const digits = onlyDigits(activeInput.value).slice(0, -1);
    setInputValue(activeInput, formatExpiry(digits));
  } else {
    setInputValue(activeInput, Array.from(activeInput.value).slice(0, -1).join(""));
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
    deleteOne();
    return;
  }

  if (kind === "name") {
    if (activeInput.value.length < 28) {
      setInputValue(activeInput, activeInput.value + value);
    }
    return;
  }

  if (kind === "number") {
    const digits = (onlyDigits(activeInput.value) + value).slice(0, 16);
    setInputValue(activeInput, formatCardNumber(digits));
    return;
  }

  if (kind === "expiry") {
    let digits = (onlyDigits(activeInput.value) + value).slice(0, 4);
    if (digits.length >= 2) {
      const month = Number(digits.slice(0, 2));
      if (month > 12) digits = "12" + digits.slice(2);
      if (month === 0) digits = "01" + digits.slice(2);
    }
    setInputValue(activeInput, formatExpiry(digits));
    return;
  }

  if (kind === "cvv") {
    const digits = (onlyDigits(activeInput.value) + value).slice(0, 4);
    setInputValue(activeInput, digits);
  }
}

/* Touch-first events make the custom keyboard reliable on iPhone.
   preventDefault keeps readonly fields from handing control to the native keyboard. */
demoInputs.forEach(input => {
  input.addEventListener("pointerdown", event => {
    event.preventDefault();
    openKeyboard(input);
  });
  input.addEventListener("click", event => {
    event.preventDefault();
    openKeyboard(input);
  });
  input.addEventListener("focus", () => openKeyboard(input));
});

keyboardKeys.addEventListener("pointerdown", event => {
  const key = event.target.closest(".key");
  if (!key) return;
  event.preventDefault();
  applyDemoKey(key.dataset.value);
});

keyboardKeys.addEventListener("click", event => {
  if (event.detail !== 0) return;
  const key = event.target.closest(".key");
  if (!key) return;
  applyDemoKey(key.dataset.value);
});

keyboardDone.addEventListener("pointerdown", event => {
  event.preventDefault();
  closeKeyboard();
});
keyboardDone.addEventListener("click", event => {
  if (event.detail !== 0) return;
  closeKeyboard();
});

document.addEventListener("keydown", event => {
  if (!activeInput) return;

  if (event.key === "Backspace") {
    event.preventDefault();
    deleteOne();
    return;
  }

  if (event.key === "Escape" || event.key === "Enter") {
    event.preventDefault();
    if (event.key === "Enter") moveToNextInput();
    else closeKeyboard();
    return;
  }

  const kind = activeInput.dataset.keyboard;
  if (kind === "name" && /^[a-zA-Z ]$/.test(event.key)) {
    event.preventDefault();
    applyDemoKey(event.key.toUpperCase());
  } else if (kind !== "name" && /^\d$/.test(event.key)) {
    event.preventDefault();
    applyDemoKey(event.key);
  }
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
});

buildMobileCard();
syncPreview();
