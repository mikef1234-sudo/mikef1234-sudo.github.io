const editorForm = document.getElementById("editorForm");
const editorStatus = document.getElementById("editorStatus");
const editorImagePreview = document.getElementById("editorImagePreview");
const imageSelect = document.getElementById("imageSelect");
const replacementImageUpload = document.getElementById("replacementImageUpload");
const editorPreviews = document.getElementById("editorPreviews");
const copyFullPostButton = document.getElementById("copyFullPost");

let postId = new URLSearchParams(window.location.search).get("id");
let currentPost = null;

ensureAuthenticated().then(async () => {
  await loadImageLibrary();
  await loadPost();
});

editorForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const payload = collectFormPayload();
  const data = await adminRequest(`/admin-api/social/posts/${postId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  currentPost = data.post;
  editorStatus.textContent = "Saved.";
  renderPost(currentPost);
});

copyFullPostButton.addEventListener("click", async () => {
  if (!currentPost) return;
  await copyText(
    [
      buildPlatformCopy(currentPost, "linkedin"),
      "",
      buildPlatformCopy(currentPost, "instagram"),
      "",
      buildPlatformCopy(currentPost, "facebook")
    ].join("\n\n"),
    copyFullPostButton
  );
});

imageSelect.addEventListener("change", () => {
  currentPost = {
    ...currentPost,
    imagePath: imageSelect.value || "",
  };
  editorImagePreview.src = currentPost.imagePath;
  editorPreviews.innerHTML = `
    ${previewMarkup(currentPost, "linkedin")}
    ${previewMarkup(currentPost, "instagram")}
    ${previewMarkup(currentPost, "facebook")}
  `;
});

replacementImageUpload.addEventListener("change", async () => {
  const file = replacementImageUpload.files[0];
  if (!file) return;
  try {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch("/admin-api/social/images/upload", { method: "POST", body: formData, credentials: "same-origin" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Image upload failed");
    await loadImageLibrary(data.image.path);
    currentPost = {
      ...currentPost,
      imagePath: data.image.path,
    };
    renderPost(currentPost);
    editorStatus.textContent = "Replacement image uploaded. Save changes when ready.";
    replacementImageUpload.value = "";
  } catch (error) {
    editorStatus.textContent = error.message || "Image upload failed.";
  }
});

async function loadPost() {
  const data = await adminRequest(`/admin-api/social/posts/${postId}`);
  currentPost = data.post;
  renderPost(currentPost);
}

async function loadImageLibrary(selectedPath = "") {
  const data = await adminRequest("/admin-api/social/images");
  imageSelect.innerHTML = `<option value="">Select image</option>${data.images.map((image) => `<option value="${escapeHtml(image.path)}">${escapeHtml(image.name)}</option>`).join("")}`;
  if (selectedPath) imageSelect.value = selectedPath;
}

function renderPost(post) {
  for (const [key, value] of Object.entries(post)) {
    const field = editorForm.elements.namedItem(key);
    if (field) field.value = value || "";
  }
  imageSelect.value = post.imagePath || "";
  editorImagePreview.src = post.imagePath || "";
  editorPreviews.innerHTML = `
    ${previewMarkup(post, "linkedin")}
    ${previewMarkup(post, "instagram")}
    ${previewMarkup(post, "facebook")}
  `;
}

function collectFormPayload() {
  currentPost = {
    ...currentPost,
    batchName: editorForm.batchName.value.trim(),
    postNumber: editorForm.postNumber.value ? Number(editorForm.postNumber.value) : null,
    title: editorForm.title.value.trim(),
    hook: editorForm.hook.value.trim(),
    mainPostLine: editorForm.mainPostLine.value.trim(),
    shortCaption: editorForm.shortCaption.value.trim(),
    cta: editorForm.cta.value.trim(),
    websiteUrl: editorForm.websiteUrl.value.trim(),
    platform: editorForm.platform.value,
    status: editorForm.status.value,
    scheduledDate: editorForm.scheduledDate.value,
    publishedUrl: editorForm.publishedUrl.value.trim(),
    linkedinCaption: editorForm.linkedinCaption.value.trim(),
    instagramCaption: editorForm.instagramCaption.value.trim(),
    facebookCaption: editorForm.facebookCaption.value.trim(),
    imagePath: imageSelect.value.trim()
  };
  return currentPost;
}
