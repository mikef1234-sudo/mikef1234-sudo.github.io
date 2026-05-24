const filterBatch = document.getElementById("filterBatch");
const filterPlatform = document.getElementById("filterPlatform");
const filterStatus = document.getElementById("filterStatus");
const filterScheduledDate = document.getElementById("filterScheduledDate");
const applyFilters = document.getElementById("applyFilters");
const libraryGrid = document.getElementById("libraryGrid");
const previewDialog = document.getElementById("previewDialog");
const previewTitle = document.getElementById("previewTitle");
const previewCanvas = document.getElementById("previewCanvas");
const closePreview = document.getElementById("closePreview");

let currentPreviewPost = null;

ensureAuthenticated().then(loadLibrary);

applyFilters.addEventListener("click", loadLibrary);
closePreview.addEventListener("click", () => previewDialog.close());

document.querySelectorAll(".preview-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".preview-tab").forEach((item) => item.classList.remove("active"));
    tab.classList.add("active");
    if (currentPreviewPost) {
      renderPreview(currentPreviewPost, tab.dataset.previewPlatform);
    }
  });
});

async function loadLibrary() {
  const params = new URLSearchParams();
  if (filterBatch.value) params.set("batch", filterBatch.value);
  if (filterPlatform.value) params.set("platform", filterPlatform.value);
  if (filterStatus.value) params.set("status", filterStatus.value);
  if (filterScheduledDate.value) params.set("scheduledDate", filterScheduledDate.value);

  const data = await adminRequest(`/admin-api/social/posts?${params.toString()}`);
  hydrateBatchFilter(data.filters.batches);
  renderLibrary(data.posts);
}

function hydrateBatchFilter(batches) {
  const current = filterBatch.value;
  filterBatch.innerHTML = `<option value="">All</option>${batches.map((batch) => `<option value="${escapeHtml(batch)}">${escapeHtml(batch)}</option>`).join("")}`;
  filterBatch.value = current;
}

function renderLibrary(posts) {
  if (!posts.length) {
    libraryGrid.innerHTML = `<article class="social-post-card"><p class="empty-state">No posts match the current filters.</p></article>`;
    return;
  }

  libraryGrid.innerHTML = posts.map((post) => `
    <article class="social-post-card" data-post-id="${post.id}">
      ${post.imagePath ? `<img class="social-post-image" src="${escapeHtml(post.imagePath)}" alt="${escapeHtml(post.title || post.mainPostLine || "Social post image")}">` : `<div class="social-post-image"></div>`}
      <div class="social-post-meta">
        <span class="status-badge" data-status="${escapeHtml(post.status)}">${escapeHtml(post.status)}</span>
        <span class="platform-badge">${escapeHtml(post.platform || "No platform")}</span>
      </div>
      <div>
        <p class="eyebrow">${escapeHtml(post.batchName || "Imported batch")}</p>
        <h3>${escapeHtml(post.title || post.mainPostLine || "Untitled post")}</h3>
      </div>
      <p>${escapeHtml(post.hook || post.shortCaption || "")}</p>
      <p><strong>CTA:</strong> ${escapeHtml(post.cta || "")}</p>
      <p><strong>Website:</strong> ${escapeHtml(post.websiteUrl || "https://clarpoint.co/")}</p>
      <div class="social-post-actions">
        <a class="mini-button" href="/admin/social/editor?id=${post.id}">Edit</a>
        <button class="mini-button" type="button" data-preview="${post.id}">Preview</button>
        <button class="mini-button" type="button" data-copy-platform="linkedin">Copy LinkedIn Caption</button>
        <button class="mini-button" type="button" data-copy-platform="instagram">Copy Instagram Caption</button>
        <button class="mini-button" type="button" data-copy-platform="facebook">Copy Facebook Caption</button>
        <button class="mini-button" type="button" data-copy-full>Copy Full Post</button>
        <button class="mini-button" type="button" data-mark-approved="${post.id}">Mark as Approved</button>
        <button class="mini-button" type="button" data-mark-posted="${post.id}">Mark as Posted</button>
      </div>
    </article>
  `).join("");

  libraryGrid.querySelectorAll("[data-copy-platform], [data-copy-full], [data-preview], [data-mark-approved], [data-mark-posted]").forEach((button) => {
    button.addEventListener("click", async () => {
      const card = button.closest("[data-post-id]");
      const postId = card.dataset.postId;
      const data = await adminRequest(`/admin-api/social/posts/${postId}`);
      const post = data.post;

      if (button.dataset.copyPlatform) {
        return copyText(buildPlatformCopy(post, button.dataset.copyPlatform), button);
      }
      if (button.hasAttribute("data-copy-full")) {
        return copyText(
          [
            buildPlatformCopy(post, "linkedin"),
            "",
            buildPlatformCopy(post, "instagram"),
            "",
            buildPlatformCopy(post, "facebook")
          ].join("\n\n"),
          button
        );
      }
      if (button.dataset.preview) {
        currentPreviewPost = post;
        previewTitle.textContent = post.title || post.mainPostLine || "Preview";
        renderPreview(post, "linkedin");
        previewDialog.showModal();
        return;
      }
      if (button.dataset.markApproved) {
        await adminRequest(`/admin-api/social/posts/${postId}/mark-approved`, { method: "POST" });
        return loadLibrary();
      }
      if (button.dataset.markPosted) {
        await adminRequest(`/admin-api/social/posts/${postId}/mark-posted`, { method: "POST" });
        return loadLibrary();
      }
    });
  });
}

function renderPreview(post, platform) {
  previewCanvas.innerHTML = previewMarkup(post, platform);
}
