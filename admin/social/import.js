const documentSelect = document.getElementById("documentSelect");
const parseSelectedDocument = document.getElementById("parseSelectedDocument");
const uploadDocumentForm = document.getElementById("uploadDocumentForm");
const reviewTableBody = document.getElementById("reviewTableBody");
const importSelectedPosts = document.getElementById("importSelectedPosts");
const importWarnings = document.getElementById("importWarnings");
const refreshImageLibrary = document.getElementById("refreshImageLibrary");

let parsedPosts = [];
let availableImages = [];

ensureAuthenticated().then(async () => {
  await loadDocuments();
  await loadImages();
});

parseSelectedDocument.addEventListener("click", async () => {
  if (!documentSelect.value) return;
  try {
    const data = await adminRequest("/admin-api/social/import/parse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: documentSelect.value })
    });
    handleParsedResult(data);
  } catch (error) {
    showWarnings([error.message || "Document parse failed."]);
  }
});

uploadDocumentForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const formData = new FormData(uploadDocumentForm);
    const response = await fetch("/admin-api/social/import/upload", { method: "POST", body: formData, credentials: "same-origin" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Upload failed");
    handleParsedResult(data);
    uploadDocumentForm.reset();
  } catch (error) {
    showWarnings([error.message || "Upload failed."]);
  }
});

refreshImageLibrary.addEventListener("click", loadImages);

importSelectedPosts.addEventListener("click", async () => {
  const posts = collectReviewRows().filter((row) => row.selected);
  if (!posts.length) return;
  try {
    const payload = { posts: posts.map(({ selected, ...post }) => post) };
    await adminRequest("/admin-api/social/import/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    window.location.href = "/admin/social";
  } catch (error) {
    showWarnings([error.message || "Import failed."]);
  }
});

async function loadDocuments() {
  const data = await adminRequest("/admin-api/social/documents");
  documentSelect.innerHTML = `<option value="">Select a Word document</option>${data.documents.map((doc) => `<option value="${escapeHtml(doc.path)}">${escapeHtml(doc.name)}</option>`).join("")}`;
}

async function loadImages() {
  const data = await adminRequest("/admin-api/social/images");
  availableImages = data.images;
}

function handleParsedResult(data) {
  parsedPosts = data.posts || [];
  showWarnings(data.warnings || []);
  renderReviewTable();
}

function renderReviewTable() {
  if (!parsedPosts.length) {
    reviewTableBody.innerHTML = `<tr><td colspan="11" class="empty-state">Parse a document to review extracted posts here.</td></tr>`;
    return;
  }

  reviewTableBody.innerHTML = parsedPosts.map((post, index) => `
    <tr data-review-index="${index}">
      <td><input type="checkbox" data-field="selected" checked></td>
      <td>
        <input data-field="batchName" type="hidden" value="${escapeHtml(post.batchName || "")}">
        <input data-field="postNumber" type="number" min="1" value="${escapeHtml(post.postNumber || "")}">
        <textarea data-field="title">${escapeHtml(post.title || "")}</textarea>
      </td>
      <td>
        ${post.imagePath ? `<img class="review-thumb" src="${escapeHtml(post.imagePath)}" alt="Imported image">` : `<div class="review-thumb"></div>`}
        <select data-field="imagePath">
          <option value="">Assign image</option>
          ${availableImages.map((image) => `<option value="${escapeHtml(image.path)}"${image.path === post.imagePath ? " selected" : ""}>${escapeHtml(image.name)}</option>`).join("")}
        </select>
      </td>
      <td><textarea data-field="hook">${escapeHtml(post.hook || "")}</textarea></td>
      <td><textarea data-field="mainPostLine">${escapeHtml(post.mainPostLine || "")}</textarea></td>
      <td><textarea data-field="shortCaption">${escapeHtml(post.shortCaption || "")}</textarea></td>
      <td><textarea data-field="cta">${escapeHtml(post.cta || "")}</textarea></td>
      <td><input data-field="websiteUrl" type="text" value="${escapeHtml(post.websiteUrl || "")}"></td>
      <td><textarea data-field="linkedinCaption">${escapeHtml(post.linkedinCaption || "")}</textarea></td>
      <td><textarea data-field="instagramCaption">${escapeHtml(post.instagramCaption || "")}</textarea></td>
      <td><textarea data-field="facebookCaption">${escapeHtml(post.facebookCaption || "")}</textarea></td>
    </tr>
  `).join("");

  reviewTableBody.querySelectorAll('[data-field="imagePath"]').forEach((select) => {
    select.addEventListener("change", () => {
      const row = select.closest("[data-review-index]");
      const thumb = row.querySelector(".review-thumb");
      if (!thumb) return;

      if (thumb.tagName === "IMG") {
        thumb.src = select.value;
      } else if (select.value) {
        thumb.outerHTML = `<img class="review-thumb" src="${escapeHtml(select.value)}" alt="Assigned image">`;
      }
    });
  });
}

function collectReviewRows() {
  return [...reviewTableBody.querySelectorAll("[data-review-index]")].map((row) => {
    const get = (field) => row.querySelector(`[data-field="${field}"]`);
    return {
      selected: get("selected").checked,
      batchName: get("batchName").value,
      postNumber: get("postNumber").value ? Number(get("postNumber").value) : null,
      title: get("title").value.trim(),
      hook: get("hook").value.trim(),
      mainPostLine: get("mainPostLine").value.trim(),
      shortCaption: get("shortCaption").value.trim(),
      cta: get("cta").value.trim(),
      websiteUrl: get("websiteUrl").value.trim(),
      linkedinCaption: get("linkedinCaption").value.trim(),
      instagramCaption: get("instagramCaption").value.trim(),
      facebookCaption: get("facebookCaption").value.trim(),
      imagePath: get("imagePath").value.trim(),
      platform: "",
      status: "Draft",
      scheduledDate: "",
      publishedUrl: ""
    };
  });
}

function showWarnings(messages) {
  if (!messages.length) {
    importWarnings.hidden = true;
    importWarnings.textContent = "";
    return;
  }

  importWarnings.hidden = false;
  importWarnings.textContent = messages.join(" ");
}
