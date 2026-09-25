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

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const onlyDigits = value => value.replace(/\D/g, "");

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

numberInput.addEventListener("input", event => {
  event.target.value = formatCardNumber(event.target.value);
  syncPreview();
});

expiryInput.addEventListener("input", event => {
  let value = formatExpiry(event.target.value);

  if (value.length >= 2) {
    const month = Number(value.slice(0, 2));
    if (month > 12) value = "12" + value.slice(2);
    if (month === 0 && value.length >= 2) value = "01" + value.slice(2);
  }

  event.target.value = value;
  syncPreview();
});

cvvInput.addEventListener("input", event => {
  event.target.value = onlyDigits(event.target.value).slice(0, 4);
  syncPreview();
});

nameInput.addEventListener("input", syncPreview);

/* Reference-video interaction:
   CVV focus rotates the card to its back, other fields bring it to the front. */
cvvInput.addEventListener("focus", () => {
  card.style.transform = "";
  cardStage.classList.add("cvv-focus");
});

cvvInput.addEventListener("blur", () => {
  cardStage.classList.remove("cvv-focus");
});

[nameInput, numberInput, expiryInput].forEach(input => {
  input.addEventListener("focus", () => {
    cardStage.classList.remove("cvv-focus");
  });
});

/* Smooth 3D tracking uses one requestAnimationFrame per paint instead of
   writing styles directly on every pointer event. */
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

function setInvalid(input, invalid) {
  input.classList.toggle("invalid", invalid);
  input.setAttribute("aria-invalid", invalid ? "true" : "false");
}

function validate() {
  const cardDigits = onlyDigits(numberInput.value);
  const [monthText, yearText] = expiryInput.value.split("/");
  const month = Number(monthText);
  const year = Number(yearText);
  const now = new Date();
  const currentYY = now.getFullYear() % 100;

  const expiryOk =
    /^\d{2}\/\d{2}$/.test(expiryInput.value) &&
    month >= 1 &&
    month <= 12 &&
    (year > currentYY || (year === currentYY && month >= now.getMonth() + 1));

  const states = {
    name: nameInput.value.trim().length >= 2,
    number: /^\d{16}$/.test(cardDigits),
    expiry: expiryOk,
    cvv: /^\d{3,4}$/.test(cvvInput.value)
  };

  setInvalid(nameInput, !states.name);
  setInvalid(numberInput, !states.number);
  setInvalid(expiryInput, !states.expiry);
  setInvalid(cvvInput, !states.cvv);

  return Object.values(states).every(Boolean);
}

form.addEventListener("submit", event => {
  event.preventDefault();
  status.className = "form-status";

  if (!validate()) {
    status.textContent = "Please check the highlighted fields.";
    status.classList.add("error");

    const firstInvalid = form.querySelector(".invalid");
    if (firstInvalid) firstInvalid.focus();
    return;
  }

  payButton.classList.add("loading");
  payButton.disabled = true;
  payButton.querySelector(".pay-copy").textContent = "Processing demo…";
  status.textContent = "No payment is being sent. This is a UI demo.";

  window.setTimeout(() => {
    payButton.classList.remove("loading");
    payButton.disabled = false;
    payButton.querySelector(".pay-copy").textContent = "Pay $1,248.00";
    status.textContent = "Demo complete — ready to connect to a real payment provider later.";
    status.classList.add("success");
  }, 1100);
});

syncPreview();
