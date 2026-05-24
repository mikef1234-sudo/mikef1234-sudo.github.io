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

const clarityForm = document.querySelector("[data-clarity-check-form]");
const clarityConfirmation = document.querySelector("[data-clarity-confirmation]");

if (clarityForm) {
  const clarityStatus = clarityForm.querySelector("[data-form-status]");
  const clarityTopicSelect = clarityForm.querySelector("#clarity-need");
  const clarityChallengeField = clarityForm.querySelector("#clarity-challenge");

  document.querySelectorAll("[data-start-focus]").forEach((trigger) => {
    trigger.addEventListener("click", () => {
      if (clarityTopicSelect) {
        clarityTopicSelect.value = trigger.getAttribute("data-start-focus") || "";
      }
    });
  });

  clarityForm.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!clarityForm.reportValidity()) {
      return;
    }

    if (clarityStatus) {
      clarityStatus.textContent = "Submitting your Clarity Check request...";
    }

    // Placeholder handler:
    // replace this block with the real email, CRM, or backend form submission
    // once Clarpoint has a live lead capture endpoint.
    window.setTimeout(() => {
      clarityForm.reset();
      if (clarityStatus) {
        clarityStatus.textContent = "";
      }
      if (clarityConfirmation) {
        clarityConfirmation.hidden = false;
      }
      if (clarityChallengeField) {
        clarityChallengeField.blur();
      }
    }, 250);
  });
}
