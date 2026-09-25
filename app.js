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
    let month = Number(value.slice(0, 2));
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

cvvInput.addEventListener("focus", () => cardStage.classList.add("cvv-focus"));
cvvInput.addEventListener("blur", () => cardStage.classList.remove("cvv-focus"));

function tiltCard(clientX, clientY) {
  if (cardStage.classList.contains("cvv-focus")) return;
  const rect = cardStage.getBoundingClientRect();
  const x = (clientX - rect.left) / rect.width - 0.5;
  const y = (clientY - rect.top) / rect.height - 0.5;
  const rotateY = x * 13;
  const rotateX = -y * 10;
  card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
}

cardStage.addEventListener("pointermove", event => tiltCard(event.clientX, event.clientY));
cardStage.addEventListener("pointerleave", () => {
  if (!cardStage.classList.contains("cvv-focus")) card.style.transform = "";
});
cardStage.addEventListener("pointerup", () => {
  if (!cardStage.classList.contains("cvv-focus")) card.style.transform = "";
});

function setInvalid(input, invalid) {
  input.classList.toggle("invalid", invalid);
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
  }, 1200);
});

syncPreview();