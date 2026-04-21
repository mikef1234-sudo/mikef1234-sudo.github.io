const toggle = document.querySelector("[data-menu-toggle]");
const menu = document.querySelector("[data-menu]");

if (toggle && menu) {
  toggle.addEventListener("click", () => {
    const isOpen = menu.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });
}

const inquiryForm = document.querySelector("[data-inquiry-form]");
const formStatus = document.querySelector("[data-form-status]");

if (inquiryForm && formStatus) {
  inquiryForm.addEventListener("submit", (event) => {
    const action = inquiryForm.getAttribute("action") || "";

    if (action.includes("your-form-id")) {
      event.preventDefault();
      formStatus.textContent = "The inquiry form needs a connected endpoint before it can send.";
      return;
    }

    formStatus.textContent = "Sending your inquiry...";
  });
}
