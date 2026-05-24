(function () {
  const templates = window.CLARPOINT_TEMPLATES || [];

  function currency(value) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);
  }

  function getTemplateBySlug(slug) {
    return templates.find((item) => item.slug === slug);
  }

  function buyButton(product, depth) {
    const href = product.stripePaymentLink || `${depth}contact.html`;
    const text = product.stripePaymentLink ? "Buy Now" : "Contact Clarpoint";
    const attr = product.stripePaymentLink ? "rel=\"noreferrer\"" : "";
    return `<a class="button primary" href="${href}" ${attr} data-event="template_buy_click" data-checkout-event="template_checkout_started" data-template-id="${product.id}" data-template-slug="${product.slug}">${text}</a>`;
  }

  function fileTypeLabel(product) {
    if (Array.isArray(product.fileTypes) && product.fileTypes.length) {
      return product.fileTypes.join(" • ");
    }
    return product.fileType;
  }

  function normalizeFormat(path) {
    const lower = String(path || "").toLowerCase();
    if (lower.endsWith(".pdf")) return "PDF";
    if (lower.endsWith(".docx")) return "Word";
    if (lower.endsWith(".xlsx")) return "Excel";
    if (lower.endsWith(".pptx")) return "PowerPoint";
    if (lower.endsWith(".csv")) return "CSV";
    if (lower.endsWith(".zip")) return "ZIP";
    if (lower.endsWith(".html")) return "HTML Preview";
    return "Other";
  }

  function formatCountSummary(product) {
    const counts = {};
    (product.downloadFiles || []).forEach(([filePath]) => {
      const format = normalizeFormat(filePath);
      counts[format] = (counts[format] || 0) + 1;
    });
    const preferredOrder = ["PDF", "Word", "Excel", "PowerPoint", "CSV", "ZIP", "HTML Preview"];
    return preferredOrder
      .filter((format) => counts[format])
      .map((format) => `${counts[format]} ${format}`)
      .join(" • ");
  }

  function categoryFilterOptions() {
    const categories = Array.from(new Set(templates.map((item) => item.category)));
    return ["All templates"].concat(categories);
  }

  function renderTemplateCard(product) {
    return `
      <article class="template-card" data-event="template_view" data-template-id="${product.id}" data-template-slug="${product.slug}">
        <div class="template-card-top">
          <div>
            <p class="eyebrow">${product.category}</p>
            <h3>${product.title}</h3>
          </div>
          ${summaryBadge(product)}
        </div>
        <p class="template-price">${currency(product.price)}</p>
        <p>${product.description}</p>
        <p class="template-use-case">${product.useCase}</p>
        <div class="template-stack-meta">
          <p class="template-meta">${fileCount(product)}</p>
          <p class="template-format-line">${fileTypeLabel(product)}</p>
          <p class="template-card-note">${formatCountSummary(product)} • Examples and blank versions included.</p>
        </div>
        <div class="button-row template-card-actions">
          ${buyButton(product, "../")}
          <a class="button secondary" href="${product.slug}/index.html" data-event="template_view" data-template-id="${product.id}" data-template-slug="${product.slug}">View Details</a>
        </div>
      </article>
    `;
  }

  function summaryBadge(product) {
    return product.badge ? `<span class="template-badge">${product.badge}</span>` : "";
  }

  function fileCount(product) {
    return `${product.includedFiles.length} files included`;
  }

  function featuredFileCount(product) {
    return `${product.downloadFiles.length} featured files`;
  }

  function summaryStat(label, value, tone = "default") {
    return `
      <div class="template-stat-card template-stat-card-${tone}">
        <p class="template-stat-label">${label}</p>
        <p class="template-stat-value">${value}</p>
      </div>
    `;
  }

  function iconTypeForFile(path, label) {
    const lowerPath = String(path || "").toLowerCase();
    const lowerLabel = String(label || "").toLowerCase();

    if (lowerPath.endsWith(".zip") || lowerLabel.includes("bundle")) return "bundle";
    if (lowerPath.endsWith(".pdf")) return "pdf";
    if (lowerPath.endsWith(".pptx") || lowerLabel.includes("deck") || lowerLabel.includes("slide")) return "slides";
    if (lowerPath.endsWith(".xlsx") || lowerPath.endsWith(".csv") || lowerLabel.includes("tracker") || lowerLabel.includes("workbook") || lowerLabel.includes("log")) return "sheet";
    if (lowerLabel.includes("email")) return "email";
    if (lowerLabel.includes("checklist")) return "checklist";
    if (lowerLabel.includes("guide") || lowerLabel.includes("overview")) return "guide";
    if (lowerLabel.includes("form") || lowerLabel.includes("questionnaire") || lowerLabel.includes("worksheet")) return "form";
    return "doc";
  }

  function iconSvg(type) {
    const icons = {
      bundle: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8.5h16v10.25a1.25 1.25 0 0 1-1.25 1.25H5.25A1.25 1.25 0 0 1 4 18.75z" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/><path d="M9 8.5V6.8c0-.99.81-1.8 1.8-1.8h2.4c.99 0 1.8.81 1.8 1.8v1.7" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/><path d="M4 11.25h16" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>`,
      pdf: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3.75h6.8L19 7.95v12.3a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1v-15.5a1 1 0 0 1 1-1z" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/><path d="M14.8 3.75v4.4H19" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/><path d="M9.5 15.75h5" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/><path d="M9.5 12.5h3.75" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>`,
      slides: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="16" height="11" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.9"/><path d="M9 19h6" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/><path d="M12 16v3" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/><path d="M8 9h8" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/><path d="M8 12h4.5" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>`,
      sheet: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3.75h6.8L19 7.95v12.3a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1v-15.5a1 1 0 0 1 1-1z" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/><path d="M14.8 3.75v4.4H19" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/><path d="M9.25 11.1h5.5M9.25 14.15h5.5M9.25 17.2h5.5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`,
      email: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="6" width="16" height="12" rx="1.6" fill="none" stroke="currentColor" stroke-width="1.9"/><path d="M5.5 8l6.5 5 6.5-5" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
      checklist: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.5 7.5h7M9.5 12h7M9.5 16.5h7" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/><path d="m5.5 7.5 1.25 1.25L8.5 6.9M5.5 12l1.25 1.25L8.5 11.4M5.5 16.5l1.25 1.25L8.5 15.9" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
      guide: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.75 5.5h8.5a1.75 1.75 0 0 1 1.75 1.75v11.25H8.5A1.75 1.75 0 0 0 6.75 20z" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/><path d="M6.75 5.5A1.75 1.75 0 0 0 5 7.25V20a1.75 1.75 0 0 1 1.75-1.5H17" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/><path d="M9.5 9h5.5M9.5 12h5.5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`,
      form: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="4" width="14" height="16" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.9"/><path d="M8.5 9h1.5M8.5 13h1.5M8.5 17h1.5M12 9h4M12 13h4M12 17h4" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`,
      doc: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3.75h6.8L19 7.95v12.3a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1v-15.5a1 1 0 0 1 1-1z" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/><path d="M14.8 3.75v4.4H19" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/><path d="M9.5 11h5.5M9.5 14h5.5M9.5 17h4" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`
    };

    return icons[type] || icons.doc;
  }

  function fileDescription(path, label) {
    const lowerPath = String(path || "").toLowerCase();
    const lowerLabel = String(label || "").toLowerCase();

    if (lowerPath.endsWith(".zip")) {
      return "A compressed bundle that groups the full pack together so everything is easy to download and save in one step.";
    }
    if (lowerLabel.includes("guide")) {
      return "A quick start guide that explains what is in the pack, how the files work together, and where to begin first.";
    }
    if (lowerLabel.includes("overview")) {
      return "A short buyer-facing summary you can review before using the files so the pack structure and purpose are clear right away.";
    }
    if (lowerLabel.includes("workbook")) {
      return "A working spreadsheet with structured tabs you can update, track, and reuse as the project or business moves forward.";
    }
    if (lowerLabel.includes("deck") || lowerLabel.includes("slide")) {
      return "A presentation-ready file you can edit for leadership, kickoff, review, or client-facing conversations.";
    }
    if (lowerLabel.includes("email")) {
      return "A prewritten communication template you can adapt quickly for clearer updates, follow-up, or escalation.";
    }
    if (lowerLabel.includes("checklist")) {
      return "A practical step-by-step checklist built to make ownership, readiness, and follow-through easier to see.";
    }
    if (lowerLabel.includes("tracker")) {
      return "A tracker built to keep owners, due dates, progress, and follow-up visible in one working file.";
    }
    if (lowerLabel.includes("log")) {
      return "A structured log designed to capture decisions, issues, risks, or actions so nothing important gets lost.";
    }
    if (lowerLabel.includes("template")) {
      return "An editable template you can copy, tailor, and put to work immediately without building the structure from scratch.";
    }
    if (lowerLabel.includes("form") || lowerLabel.includes("questionnaire")) {
      return "A structured intake file to collect the right inputs faster and make planning or decision-making cleaner.";
    }
    if (lowerLabel.includes("worksheet")) {
      return "A guided working file that helps organize thinking, shape better inputs, and clarify what comes next.";
    }
    return "A ready-to-edit file included in the pack so you can move faster with a cleaner starting point.";
  }

  const grid = document.getElementById("templateGrid");
  if (grid) {
    const filterBar = document.getElementById("templateFilters");
    let activeCategory = "All templates";

    function renderGrid() {
      const visibleTemplates = activeCategory === "All templates"
        ? templates
        : templates.filter((product) => product.category === activeCategory);

      grid.innerHTML = visibleTemplates.map(renderTemplateCard).join("");
    }

    if (filterBar) {
      filterBar.innerHTML = categoryFilterOptions().map((category) => `
        <button
          class="template-filter-chip${category === activeCategory ? " active" : ""}"
          type="button"
          data-template-filter="${category}"
          data-event="template_filter_clicked"
        >
          ${category}
        </button>
      `).join("");

      filterBar.addEventListener("click", (event) => {
        const button = event.target.closest("[data-template-filter]");
        if (!button) return;
        activeCategory = button.getAttribute("data-template-filter") || "All templates";
        Array.from(filterBar.querySelectorAll("[data-template-filter]")).forEach((chip) => {
          chip.classList.toggle("active", chip === button);
        });
        renderGrid();
      });
    }

    renderGrid();
  }

  const detailMarker = document.querySelector("[data-template-detail]");
  if (detailMarker) {
    const slug = detailMarker.getAttribute("data-template-slug") || document.body.getAttribute("data-template-slug");
    const product = getTemplateBySlug(slug);
    const detailRoot = detailMarker.tagName === "BODY" ? document.getElementById("main") : detailMarker;
    if (!product) {
      detailRoot.innerHTML = `<div class="container"><div class="template-empty"><h1>Template not found</h1><p>The requested template could not be found.</p><a class="button primary" href="../index.html">Back to Templates</a></div></div>`;
      return;
    }

      detailRoot.innerHTML = `
      <section class="page-hero">
        <div class="container">
          <p class="eyebrow">${product.category}</p>
          <h1>${product.title}</h1>
          <p class="lead">${product.description}</p>
          <div class="template-detail-summary compact">
            ${summaryStat("Price", currency(product.price), "price")}
            ${product.badge ? summaryStat("Pack", product.badge, "badge") : ""}
            ${summaryStat("Included", fileCount(product), "meta")}
          </div>
          <div class="button-row">
            ${buyButton(product, "../../")}
            <a class="button secondary" href="../../clarity-check/index.html" data-event="clarity_check_clicked">Book a Clarity Check</a>
          </div>
          <p class="template-delivery-note">After purchase, you will receive instant access to download the template files.</p>
          ${product.stripePaymentLink ? "" : `<p class="template-setup-note">Add a Stripe Payment Link in <code>data/templates.js</code> to activate direct checkout for this product.</p>`}
        </div>
      </section>

      <section class="section">
        <div class="container template-detail-grid">
          <div class="template-detail-main">
            <div class="section-heading">
              <p class="eyebrow">Who this is for</p>
              <h2>${product.audience}</h2>
            </div>
            <p class="body-copy">${product.useCase}</p>
            <div class="template-side-card">
              <p class="eyebrow">What you are buying</p>
              <p>You are buying an editable Clarpoint toolkit with ready-to-use starter files, working templates, and reference documents designed to help you move faster without starting from scratch.</p>
              <p>The purchase includes downloadable files you can adapt for your own project, business, clients, or internal workflow.</p>
            </div>
          </div>

          <aside class="template-detail-side">
            <div class="template-side-card">
              <p class="eyebrow">Included in the purchase</p>
              <h3>${featuredFileCount(product)}</h3>
              <p>Formats: ${fileTypeLabel(product)}</p>
              <p>Delivered as a downloadable file pack with individual customer-ready files and a zipped bundle.</p>
            </div>
            <div class="template-side-card">
              <p class="eyebrow">What formats are included?</p>
              <h3>${formatCountSummary(product)}</h3>
              <p>Each toolkit includes a mix of PDF guides, editable Word files, Excel workbooks, PowerPoint decks, and CSV trackers.</p>
            </div>
            <div class="template-side-card">
              <p class="eyebrow">How to use it</p>
              <h3>Download, adapt, and put it to work fast.</h3>
              <p>Each toolkit is built to give you a clean starting point you can customize for your project, client, or internal workflow.</p>
            </div>
          </aside>

          <div class="template-detail-files">
            <div class="section-heading">
              <p class="eyebrow">What is included</p>
              <h2>Files included in this pack</h2>
            </div>
            <div class="template-deliverable-grid">
              ${product.downloadFiles.map(([path, label]) => `
                <article class="template-deliverable-card">
                  <span class="template-deliverable-icon" aria-hidden="true">${iconSvg(iconTypeForFile(path, label))}</span>
                  <h3>${label}</h3>
                  <p class="template-deliverable-copy">${fileDescription(path, label)}</p>
                </article>
              `).join("")}
            </div>
          </div>
        </div>
      </section>

      <section class="section alt">
        <div class="container">
          <div class="clarity-final-cta template-custom-cta">
            <div>
              <p class="eyebrow">Custom Support</p>
              <h2>Need help customizing this for your business?</h2>
              <p>Book a free Clarpoint Clarity Check if you want help adapting this toolkit into a full operating model, project plan, executive readout, website plan, or client delivery system.</p>
            </div>
            <div class="button-row">
              <a class="button primary" href="../../clarity-check/index.html" data-event="clarity_check_clicked">Book a Clarity Check</a>
              <a class="button secondary" href="../../contact.html">Contact Clarpoint</a>
              <a class="button secondary" href="../index.html">Back to Templates</a>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  const successRoot = document.getElementById("templateSuccess");
  if (successRoot) {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get("product");
    const product = getTemplateBySlug(slug);
    if (!product) {
      successRoot.innerHTML = `<div class="template-empty"><h1>Purchase details not found</h1><p>Add <code>?product=template-slug</code> to preview the post-purchase download page.</p><a class="button primary" href="../templates/index.html">Browse Templates</a></div>`;
      return;
    }
    successRoot.innerHTML = `
      <div class="section-heading">
        <p class="eyebrow">Thank You</p>
        <h1>Thank you for your purchase. Your Clarpoint template files are ready below.</h1>
        <p class="lead">Download the files now, then come back anytime you need Clarpoint to help customize the toolkit for your business, project, or delivery model.</p>
      </div>
      <div class="template-side-card">
        <p class="eyebrow">${product.category}</p>
        <h2>${product.title}</h2>
        <p class="template-price">${currency(product.price)}</p>
        <div class="button-row">
          <a class="button primary" href="..${product.downloadFilePath}download-all.zip" data-event="template_download_click" data-template-id="${product.id}" data-template-slug="${product.slug}">Download All Files</a>
          <a class="button secondary" href="../clarity-check/index.html" data-event="clarity_check_clicked">Book a Clarity Check</a>
        </div>
      </div>
      <div class="template-download-list">
        ${(product.downloadFiles || []).map(([path, label]) => `<a class="template-download-link" href="..${product.downloadFilePath}${path}" data-event="template_download_click" data-template-id="${product.id}" data-template-slug="${product.slug}">${label}</a>`).join("")}
      </div>
    `;
  }
})();
