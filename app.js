const form = document.querySelector("#paymentForm");
const cardStage = document.querySelector("#cardStage");
const cardName = document.querySelector("#cardName");
const iban = document.querySelector("#iban");
const expiry = document.querySelector("#expiry");
const cvc = document.querySelector("#cvc");

const namePreview = document.querySelector("#namePreview");
const ibanPreview = document.querySelector("#ibanPreview");
const expiryPreview = document.querySelector("#expiryPreview");
const cvcPreview = document.querySelector("#cvcPreview");

const checkoutGrid = document.querySelector("#checkoutGrid");
const successScene = document.querySelector("#successScene");
const successName = document.querySelector("#successName");
const successIban = document.querySelector("#successIban");
const successExpiry = document.querySelector("#successExpiry");
const resetButton = document.querySelector("#resetButton");

const onlyDigits = value => value.replace(/\D/g, "");

function formatIban(value) {
  const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 34);
  return cleaned.replace(/(.{4})/g, "$1 ").trim();
}

function formatExpiry(value) {
  const digits = onlyDigits(value).slice(0, 4);
  if (digits.length <= 2) return digits;
  return digits.slice(0, 2) + "/" + digits.slice(2);
}

function safeName(value) {
  return value.replace(/[^a-zA-ZÀ-ž0-9 .'-]/g, "").replace(/\s{2,}/g, " ").slice(0, 24);
}

function syncPreview() {
  const name = safeName(cardName.value.trim()) || "YOUR NAME";
  const ibanValue = formatIban(iban.value) || "DE00 0000 0000 0000 0000 00";
  const expiryValue = expiry.value || "••/••";
  const cvcValue = cvc.value || "•••";

  namePreview.textContent = name.toUpperCase();
  ibanPreview.textContent = ibanValue;
  expiryPreview.textContent = expiryValue;
  cvcPreview.textContent = cvcValue;

  successName.textContent = name.toUpperCase();
  successIban.textContent = ibanValue;
  successExpiry.textContent = expiryValue;
}

cardName.addEventListener("input", () => {
  const cleaned = safeName(cardName.value);
  if (cleaned !== cardName.value) cardName.value = cleaned;
  syncPreview();
});

iban.addEventListener("input", () => {
  const formatted = formatIban(iban.value);
  if (formatted !== iban.value) iban.value = formatted;
  syncPreview();
});

expiry.addEventListener("input", () => {
  const formatted = formatExpiry(expiry.value);
  if (formatted !== expiry.value) expiry.value = formatted;
  syncPreview();
});

cvc.addEventListener("input", () => {
  const value = onlyDigits(cvc.value).slice(0, 3);
  if (value !== cvc.value) cvc.value = value;
  syncPreview();
});

cvc.addEventListener("focus", () => {
  cardStage.classList.add("is-flipped");
});

cvc.addEventListener("blur", () => {
  cardStage.classList.remove("is-flipped");
});

[cardName, iban, expiry].forEach(input => {
  input.addEventListener("focus", () => cardStage.classList.remove("is-flipped"));
});

form.addEventListener("submit", event => {
  event.preventDefault();
  syncPreview();

  checkoutGrid.classList.add("is-leaving");

  window.setTimeout(() => {
    successScene.classList.add("show");
    successScene.setAttribute("aria-hidden", "false");
  }, 220);
});

resetButton.addEventListener("click", () => {
  successScene.classList.remove("show");
  successScene.setAttribute("aria-hidden", "true");
  checkoutGrid.classList.remove("is-leaving");
});

syncPreview();
