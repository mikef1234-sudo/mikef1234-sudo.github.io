async function adminRequest(url, options = {}) {
  const response = await fetch(url, {
    credentials: "same-origin",
    ...options,
  });

  if (response.status === 401) {
    window.location.href = "/admin/login";
    throw new Error("Unauthorized");
  }

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }
  return data;
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildPlatformCopy(post, platform) {
  const hook = post.hook || post.mainPostLine || post.title || "";
  const cta = post.cta || "";
  const website = post.websiteUrl || "https://clarpoint.co/";
  const captions = {
    linkedin: post.linkedinCaption || post.shortCaption || "",
    instagram: post.instagramCaption || post.shortCaption || "",
    facebook: post.facebookCaption || post.shortCaption || "",
  };

  if (platform === "instagram") {
    return [hook, captions.instagram, cta, "#projectmanagement #businessoperations #clarity #smallbusinesssupport #consulting"]
      .filter(Boolean)
      .join("\n\n");
  }

  return [hook, captions[platform], cta, website]
    .filter(Boolean)
    .join("\n\n");
}

async function copyText(text, button) {
  await navigator.clipboard.writeText(text);
  if (button) {
    const original = button.textContent;
    button.textContent = "Copied";
    setTimeout(() => {
      button.textContent = original;
    }, 1200);
  }
}

function previewMarkup(post, platform) {
  const platformCopy = buildPlatformCopy(post, platform);
  const title = platform === "linkedin" ? "LinkedIn preview" : platform === "instagram" ? "Instagram preview" : "Facebook preview";
  return `
    <article class="preview-surface">
      <p class="eyebrow">${title}</p>
      ${post.imagePath ? `<img src="${escapeHtml(post.imagePath)}" alt="${escapeHtml(post.title || post.mainPostLine || "Post image")}">` : ""}
      <div class="preview-copy">${escapeHtml(platformCopy)}</div>
      <div class="social-post-meta">
        <span class="platform-badge">${escapeHtml(platform)}</span>
        <span class="status-badge" data-status="${escapeHtml(post.status || "Draft")}">${escapeHtml(post.status || "Draft")}</span>
      </div>
    </article>
  `;
}

async function ensureAuthenticated() {
  await adminRequest("/admin-api/auth/status");
}

document.querySelectorAll("[data-admin-logout]").forEach((button) => {
  button.addEventListener("click", async () => {
    await adminRequest("/admin-api/auth/logout", { method: "POST" });
    window.location.href = "/admin/login";
  });
});
