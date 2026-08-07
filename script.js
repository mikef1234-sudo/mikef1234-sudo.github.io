const toggle = document.querySelector("[data-menu-toggle]");
const menu = document.querySelector("[data-menu]");

if (toggle && menu) {
  toggle.addEventListener("click", () => {
    const isOpen = menu.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });
}

document.querySelectorAll("[data-inquiry-form]").forEach((inquiryForm) => {
  const formStatus = inquiryForm.querySelector("[data-form-status]");
  if (!formStatus) return;

  inquiryForm.addEventListener("submit", () => {
    const action = inquiryForm.getAttribute("action") || "";

    formStatus.textContent = action.startsWith("mailto:")
      ? "Opening your email app to send the inquiry..."
      : "Sending your inquiry...";
  });
});

const clarityTopicSelect = document.querySelector("#clarity-need");

document.querySelectorAll("[data-start-focus]").forEach((trigger) => {
  trigger.addEventListener("click", () => {
    if (clarityTopicSelect) {
      clarityTopicSelect.value = trigger.getAttribute("data-start-focus") || "";
    }
  });
});
