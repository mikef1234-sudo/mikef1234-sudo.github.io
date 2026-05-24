const OUTPUT_DEFINITIONS = [
  { id: "linkedinCompanyPost", label: "LinkedIn company page post", helper: "Professional, polished, and clear." },
  { id: "facebookBusinessPost", label: "Facebook business page post", helper: "Conversational business page copy." },
  { id: "instagramCaption", label: "Instagram caption", helper: "Caption format with spacing and CTA." },
  { id: "instagramReelScript", label: "Instagram reel script", helper: "Short-form hook, body, and close." },
  { id: "metaAdPrimaryText", label: "Meta ad primary text", helper: "Direct paid social copy." },
  { id: "linkedinAdCopy", label: "LinkedIn ad copy", helper: "B2B-focused sponsored content copy." },
  { id: "headlineOptions", label: "5 headline options", helper: "Headline set for testing." },
  { id: "ctaOptions", label: "5 CTA options", helper: "CTA variants to rotate." },
  { id: "hashtagOptions", label: "10 hashtag options", helper: "Suggested hashtag list." },
  { id: "higgsfieldPrompt", label: "Higgsfield video prompt", helper: "Prompt direction for motion content." },
  { id: "visualDirection", label: "Suggested image or video direction", helper: "Creative direction for static or motion." },
  { id: "postingWindow", label: "Suggested posting day and time", helper: "Recommended release window." }
];

const CALENDAR_STORAGE_KEY = "clarpoint-growth-studio-calendar";
const PERFORMANCE_STORAGE_KEY = "clarpoint-growth-studio-performance";
const BRIEF_STORAGE_KEY = "clarpoint-growth-studio-brief";
const OUTPUT_STORAGE_KEY = "clarpoint-growth-studio-outputs";
const CALENDAR_STATUSES = ["Planned", "Ready to post", "Posted", "Boosted", "Archived"];

const form = document.querySelector("#growth-studio-form");
const outputGrid = document.querySelector("#outputGrid");
const copyAllOutputsButton = document.querySelector("#copyAllOutputs");
const saveToCalendarButton = document.querySelector("#saveToCalendar");
const campaignSummary = document.querySelector("#campaignSummary");
const calendarTableBody = document.querySelector("#calendarTableBody");
const calendarStatusSummary = document.querySelector("#calendarStatusSummary");
const performanceForm = document.querySelector("#performanceForm");
const performanceTableBody = document.querySelector("#performanceTableBody");

let currentOutputs = {};
let calendarEntries = loadFromStorage(CALENDAR_STORAGE_KEY, []);
let performanceEntries = loadFromStorage(PERFORMANCE_STORAGE_KEY, []);

renderOutputCards();
hydrateBrief();
renderCalendar();
renderPerformanceTable();
renderStatusSummary();

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const brief = getBriefData();
  currentOutputs = generateOutputs(brief);
  saveToStorage(BRIEF_STORAGE_KEY, brief);
  saveToStorage(OUTPUT_STORAGE_KEY, currentOutputs);
  updateSummary(brief);
  populateOutputs(currentOutputs);
});

form.addEventListener("reset", () => {
  window.setTimeout(() => {
    currentOutputs = {};
    saveToStorage(BRIEF_STORAGE_KEY, {});
    saveToStorage(OUTPUT_STORAGE_KEY, {});
    updateSummary({});
    populateOutputs({});
  }, 0);
});

saveToCalendarButton.addEventListener("click", () => {
  const brief = getBriefData();

  if (!brief.campaignName || !brief.offer || !brief.platform) {
    return;
  }

  const entry = {
    id: createId(),
    campaignName: brief.campaignName,
    platform: brief.platform,
    contentType: brief.contentType,
    status: "Planned",
    landingPage: brief.landingPage,
    notes: `${brief.offer} | ${brief.cta}`
  };

  calendarEntries = [entry, ...calendarEntries];
  persistCalendar();
  renderCalendar();
  renderStatusSummary();
});

copyAllOutputsButton.addEventListener("click", async () => {
  const combined = OUTPUT_DEFINITIONS
    .map((definition) => {
      const value = currentOutputs[definition.id];
      return value ? `${definition.label}\n${value}` : "";
    })
    .filter(Boolean)
    .join("\n\n");

  if (!combined) {
    return;
  }

  const success = await copyText(combined);
  if (success) {
    setButtonCopiedState(copyAllOutputsButton, "Copied all outputs");
  }
});

outputGrid.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-copy-target]");

  if (!button) {
    return;
  }

  const targetId = button.getAttribute("data-copy-target");
  const target = document.getElementById(targetId);

  if (!target) {
    return;
  }

  const success = await copyText(target.value);

  if (success) {
    setButtonCopiedState(button, "Copied");
  }
});

performanceForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(performanceForm);

  const entry = {
    id: createId(),
    platform: String(formData.get("platform") || ""),
    postUrl: String(formData.get("postUrl") || ""),
    impressions: String(formData.get("impressions") || "0"),
    clicks: String(formData.get("clicks") || "0"),
    followersGained: String(formData.get("followersGained") || "0"),
    leadsGenerated: String(formData.get("leadsGenerated") || "0"),
    notes: String(formData.get("notes") || "")
  };

  performanceEntries = [entry, ...performanceEntries];
  persistPerformance();
  renderPerformanceTable();
  performanceForm.reset();
});

calendarTableBody.addEventListener("input", (event) => {
  const row = event.target.closest("[data-calendar-id]");

  if (!row) {
    return;
  }

  const id = row.getAttribute("data-calendar-id");
  const entry = calendarEntries.find((item) => item.id === id);

  if (!entry) {
    return;
  }

  entry.status = row.querySelector("[data-field='status']").value;
  entry.landingPage = row.querySelector("[data-field='landingPage']").value;
  entry.notes = row.querySelector("[data-field='notes']").value;
  persistCalendar();
  renderStatusSummary();
});

calendarTableBody.addEventListener("click", (event) => {
  const button = event.target.closest("[data-delete-calendar]");

  if (!button) {
    return;
  }

  const id = button.getAttribute("data-delete-calendar");
  calendarEntries = calendarEntries.filter((entry) => entry.id !== id);
  persistCalendar();
  renderCalendar();
  renderStatusSummary();
});

performanceTableBody.addEventListener("input", (event) => {
  const row = event.target.closest("[data-performance-id]");

  if (!row) {
    return;
  }

  const id = row.getAttribute("data-performance-id");
  const entry = performanceEntries.find((item) => item.id === id);

  if (!entry) {
    return;
  }

  entry.platform = row.querySelector("[data-field='platform']").value;
  entry.postUrl = row.querySelector("[data-field='postUrl']").value;
  entry.impressions = row.querySelector("[data-field='impressions']").value;
  entry.clicks = row.querySelector("[data-field='clicks']").value;
  entry.followersGained = row.querySelector("[data-field='followersGained']").value;
  entry.leadsGenerated = row.querySelector("[data-field='leadsGenerated']").value;
  entry.notes = row.querySelector("[data-field='notes']").value;
  persistPerformance();
});

performanceTableBody.addEventListener("click", (event) => {
  const button = event.target.closest("[data-delete-performance]");

  if (!button) {
    return;
  }

  const id = button.getAttribute("data-delete-performance");
  performanceEntries = performanceEntries.filter((entry) => entry.id !== id);
  persistPerformance();
  renderPerformanceTable();
});

function renderOutputCards() {
  outputGrid.innerHTML = OUTPUT_DEFINITIONS.map((definition) => `
    <article class="output-card">
      <div class="output-top">
        <div class="output-meta">
          <span class="output-label">${definition.label}</span>
          <p>${definition.helper}</p>
        </div>
        <button class="copy-button" type="button" data-copy-target="${definition.id}">Copy</button>
      </div>
      <textarea class="output-text" id="${definition.id}" readonly placeholder="Generate a campaign brief to populate this output."></textarea>
    </article>
  `).join("");
}

function hydrateBrief() {
  const savedBrief = loadFromStorage(BRIEF_STORAGE_KEY, {});
  const savedOutputs = loadFromStorage(OUTPUT_STORAGE_KEY, {});

  Object.entries(savedBrief).forEach(([key, value]) => {
    const field = form.elements.namedItem(key);

    if (field && typeof value === "string") {
      field.value = value;
    }
  });

  updateSummary(savedBrief);
  currentOutputs = savedOutputs;
  populateOutputs(savedOutputs);
}

function getBriefData() {
  const formData = new FormData(form);

  return {
    campaignName: normalize(String(formData.get("campaignName") || "")),
    campaignObjective: normalize(String(formData.get("campaignObjective") || "")),
    audience: normalize(String(formData.get("audience") || "")),
    offer: normalize(String(formData.get("offer") || "")),
    painPoint: normalize(String(formData.get("painPoint") || "")),
    tone: normalize(String(formData.get("tone") || "")),
    platform: normalize(String(formData.get("platform") || "")),
    cta: normalize(String(formData.get("cta") || "")),
    landingPage: normalize(String(formData.get("landingPage") || "")),
    contentType: normalize(String(formData.get("contentType") || ""))
  };
}

function updateSummary(brief) {
  const summaryRows = [
    {
      label: "Campaign",
      value: brief.campaignName || "No campaign loaded yet."
    },
    {
      label: "Focus",
      value: brief.offer && brief.painPoint
        ? `${brief.offer} for ${brief.audience || "the target audience"}`
        : "Add the core business problem and offer."
    },
    {
      label: "Primary use",
      value: brief.platform && brief.contentType
        ? `${brief.platform} / ${brief.contentType}`
        : "Choose a platform and content type."
    },
    {
      label: "Call to action",
      value: brief.cta || "Your primary CTA will appear here."
    }
  ];

  campaignSummary.innerHTML = summaryRows.map((row) => `
    <div>
      <span class="summary-label">${row.label}</span>
      <span class="summary-value">${escapeHtml(row.value)}</span>
    </div>
  `).join("");
}

function populateOutputs(outputs) {
  OUTPUT_DEFINITIONS.forEach((definition) => {
    const textarea = document.getElementById(definition.id);

    if (!textarea) {
      return;
    }

    textarea.value = outputs[definition.id] || "";
  });
}

function generateOutputs(brief) {
  const audience = lowerFirst(brief.audience);
  const offer = brief.offer;
  const painPoint = sentenceCase(brief.painPoint);
  const toneLine = toneGuidance(brief.tone);
  const contentAngle = contentAngleForType(brief.contentType);
  const ctaLine = brief.cta;
  const landingPage = brief.landingPage;
  const objective = brief.campaignObjective;
  const platform = brief.platform;
  const platformWindow = postingWindowFor(platform, brief.contentType);

  const linkedinCompanyPost = [
    `${brief.campaignName}: ${offer} for ${audience}.`,
    "",
    `${painPoint} Clarpoint helps teams turn that kind of scattered work into clearer priorities, stronger messaging, and better execution.`,
    "",
    `${offer} is designed for organizations that need ${objective.toLowerCase()} without adding noise. The work focuses on structure, communication, and practical follow-through.`,
    "",
    `${ctaLine}.`,
    `${landingPage}`
  ].join("\n");

  const facebookBusinessPost = [
    `When the work matters, unclear priorities and messy communication slow everything down.`,
    "",
    `${offer} helps ${audience} move from confusion to a clearer plan, stronger messaging, and steadier execution.`,
    "",
    `${painPoint}`,
    "",
    `${ctaLine} if you want a more practical next step.`,
    `${landingPage}`
  ].join("\n");

  const instagramCaption = [
    `Scattered work creates expensive delays.`,
    "",
    `${offer} helps ${audience} get clearer on the plan, the message, and what needs to happen next.`,
    "",
    `${contentAngle}`,
    "",
    `${ctaLine}.`,
    "",
    `${landingPage}`
  ].join("\n");

  const instagramReelScript = [
    `Hook: ${painPoint}`,
    `Scene 1: Show messy updates, open tabs, or unclear notes while the voiceover says, "The work is moving, but nobody has a clean view of what matters."`,
    `Scene 2: Shift to a calmer screen, roadmap, or cleaner homepage while the voiceover says, "Clarpoint brings structure, sharper communication, and a stronger execution path."`,
    `Scene 3: Highlight ${offer} and the outcome: "Clear plans. Stronger communication. Better execution."`,
    `Close: On-screen CTA: ${ctaLine} | ${landingPage}`
  ].join("\n\n");

  const metaAdPrimaryText = `${offer} helps ${audience} solve a common problem: ${lowerFirst(painPoint)} ${ctaLine}. ${landingPage}`;

  const linkedinAdCopy = [
    `${painPoint}`,
    `${offer} gives ${audience} a clearer plan, stronger stakeholder communication, and better execution support.`,
    `${ctaLine}.`
  ].join(" ");

  const headlineOptions = [
    `Turn scattered work into clearer execution`,
    `${offer} for teams that need structure fast`,
    `Clearer plans. Stronger communication. Better execution.`,
    `Fix the message and the operating rhythm`,
    `Bring structure back to high-priority work`
  ].join("\n");

  const ctaOptions = [
    `Book a Discovery Call`,
    `Start with a Clarity Sprint`,
    `Get a Website or Project Review`,
    `Request Project Clarity Support`,
    `${titleCase(brief.cta)}`
  ].join("\n");

  const hashtagOptions = buildHashtags(brief).join("\n");

  const higgsfieldPrompt = [
    `Create a polished business-growth video for Clarpoint.`,
    `Tone: ${toneLine}.`,
    `Audience: ${audience}.`,
    `Core problem: ${lowerFirst(painPoint)}.`,
    `Offer: ${offer}.`,
    `Visual arc: move from scattered screens, messy notes, or unclear updates into calm structure, clean typography, stronger roadmap visuals, and executive-ready communication.`,
    `End frame should reinforce: "Clear plans. Stronger communication. Better execution."`,
    `Primary CTA on final frame: ${ctaLine}.`,
    `Landing page reference: ${landingPage}.`
  ].join(" ");

  const visualDirection = [
    `Use a clean, premium consulting look with white space, muted neutrals, deep teal accents, and structured grid moments.`,
    `Show before/after contrast: messy coordination, unclear website sections, or fragmented updates shifting into clear plans, concise message hierarchy, and calmer decision-making.`,
    `Best creative direction for this brief: ${creativeDirectionForType(brief.contentType)}.`,
    `If using static imagery, feature operators, founders, or delivery leads in real work settings rather than generic handshake imagery.`
  ].join("\n\n");

  const postingWindow = [
    `Primary recommendation for ${platform}: ${platformWindow}.`,
    `Suggested content treatment: ${contentAngle}.`,
    `Use the strongest headline variation with the clearest CTA for the first post or launch asset.`
  ].join("\n");

  return {
    linkedinCompanyPost,
    facebookBusinessPost,
    instagramCaption,
    instagramReelScript,
    metaAdPrimaryText,
    linkedinAdCopy,
    headlineOptions,
    ctaOptions,
    hashtagOptions,
    higgsfieldPrompt,
    visualDirection,
    postingWindow
  };
}

function buildHashtags(brief) {
  const base = [
    "Clarpoint",
    "ProjectClarity",
    "BetterExecution",
    "ExecutiveCommunication",
    "DeliveryLeadership",
    "Governance",
    "DigitalPresence",
    "BusinessConsulting",
    "ProjectRecovery",
    "StakeholderCommunication"
  ];

  const dynamic = [brief.offer, brief.audience, brief.campaignObjective]
    .map((value) => toHashtag(value))
    .filter(Boolean);

  return [...new Set([...dynamic, ...base.map((value) => `#${value.replace(/^#/, "")}`)])].slice(0, 10);
}

function creativeDirectionForType(contentType) {
  const map = {
    "Organic post": "clean branded graphic with a single strong business insight and one proof point",
    "Paid ad": "simple conversion-focused static or short motion ad with one promise, one pain point, and one CTA",
    "Reel/video": "quick cuts with on-screen text, subtle movement, and a clean reveal of the offer",
    "Carousel": "structured slide-by-slide education with a clear before, after, and CTA sequence",
    "Founder post": "personal but polished talking-head or desk-side visual backed by practical insight"
  };

  return map[contentType] || "clean, premium business visual with a strong hierarchy and visible CTA";
}

function contentAngleForType(contentType) {
  const map = {
    "Organic post": "Lead with the problem, clarify the shift, and close with a practical next step",
    "Paid ad": "Keep the message tight, outcome-driven, and focused on one immediate action",
    "Reel/video": "Move quickly from tension to clarity with one simple takeaway",
    "Carousel": "Break the idea into a short sequence that feels easy to scan and easy to save",
    "Founder post": "Sound direct, experienced, and grounded in real work rather than polished hype"
  };

  return map[contentType] || "Lead with clarity, keep the message short, and close with a clear CTA";
}

function toneGuidance(tone) {
  const map = {
    "Practical and polished": "practical, polished, and outcome-focused",
    "Confident and direct": "confident, direct, and commercially sharp",
    "Founder-led and human": "founder-led, credible, and human",
    "Executive-ready and concise": "executive-ready, concise, and structured",
    "Urgent and action-focused": "urgent, clear, and action-focused"
  };

  return map[tone] || "practical and polished";
}

function postingWindowFor(platform, contentType) {
  const map = {
    LinkedIn: contentType === "Founder post"
      ? "Tuesday or Thursday between 8:00 AM and 10:00 AM local time"
      : "Tuesday through Thursday between 8:00 AM and 10:00 AM local time",
    Facebook: "Tuesday through Thursday between 9:00 AM and 11:00 AM local time",
    Instagram: contentType === "Reel/video"
      ? "Wednesday or Thursday between 11:30 AM and 1:30 PM or around 6:00 PM local time"
      : "Wednesday or Thursday between 11:00 AM and 1:00 PM local time",
    "Meta Ads": "Launch on Monday morning and review the first 72 hours before changing creative",
    "LinkedIn Ads": "Launch Tuesday morning and review performance after the first business-day cycle"
  };

  return map[platform] || "Midweek during business hours for B2B audiences";
}

function renderCalendar() {
  if (!calendarEntries.length) {
    calendarTableBody.innerHTML = `<tr><td class="empty-state" colspan="7">No calendar items yet. Generate a brief and add it to the calendar.</td></tr>`;
    return;
  }

  calendarTableBody.innerHTML = calendarEntries.map((entry) => `
    <tr data-calendar-id="${entry.id}">
      <td>${escapeHtml(entry.campaignName)}</td>
      <td>${escapeHtml(entry.platform)}</td>
      <td>${escapeHtml(entry.contentType)}</td>
      <td>
        <select class="table-select" data-field="status">
          ${CALENDAR_STATUSES.map((status) => `<option${status === entry.status ? " selected" : ""}>${status}</option>`).join("")}
        </select>
      </td>
      <td><input class="table-input" data-field="landingPage" type="text" value="${escapeAttribute(entry.landingPage)}"></td>
      <td><textarea class="table-textarea" data-field="notes">${escapeHtml(entry.notes || "")}</textarea></td>
      <td><button class="table-delete" type="button" data-delete-calendar="${entry.id}">Delete</button></td>
    </tr>
  `).join("");
}

function renderStatusSummary() {
  const counts = CALENDAR_STATUSES.map((status) => ({
    status,
    count: calendarEntries.filter((entry) => entry.status === status).length
  }));

  calendarStatusSummary.innerHTML = counts.map((item) => `
    <div class="status-card">
      <strong>${item.count}</strong>
      <span>${item.status}</span>
    </div>
  `).join("");
}

function renderPerformanceTable() {
  if (!performanceEntries.length) {
    performanceTableBody.innerHTML = `<tr><td class="empty-state" colspan="8">No performance records yet. Add numbers manually after posting.</td></tr>`;
    return;
  }

  performanceTableBody.innerHTML = performanceEntries.map((entry) => `
    <tr data-performance-id="${entry.id}">
      <td>
        <select class="table-select" data-field="platform">
          ${["LinkedIn", "Facebook", "Instagram", "Meta Ads", "LinkedIn Ads"].map((platform) => `<option${platform === entry.platform ? " selected" : ""}>${platform}</option>`).join("")}
        </select>
      </td>
      <td><input class="table-input" data-field="postUrl" type="text" value="${escapeAttribute(entry.postUrl)}"></td>
      <td><input class="table-input" data-field="impressions" type="number" min="0" value="${escapeAttribute(entry.impressions)}"></td>
      <td><input class="table-input" data-field="clicks" type="number" min="0" value="${escapeAttribute(entry.clicks)}"></td>
      <td><input class="table-input" data-field="followersGained" type="number" min="0" value="${escapeAttribute(entry.followersGained)}"></td>
      <td><input class="table-input" data-field="leadsGenerated" type="number" min="0" value="${escapeAttribute(entry.leadsGenerated)}"></td>
      <td><textarea class="table-textarea" data-field="notes">${escapeHtml(entry.notes || "")}</textarea></td>
      <td><button class="table-delete" type="button" data-delete-performance="${entry.id}">Delete</button></td>
    </tr>
  `).join("");
}

function persistCalendar() {
  saveToStorage(CALENDAR_STORAGE_KEY, calendarEntries);
}

function persistPerformance() {
  saveToStorage(PERFORMANCE_STORAGE_KEY, performanceEntries);
}

function normalize(value) {
  return value.trim();
}

function lowerFirst(value) {
  if (!value) {
    return "";
  }

  return value.charAt(0).toLowerCase() + value.slice(1);
}

function sentenceCase(value) {
  if (!value) {
    return "";
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}

function titleCase(value) {
  return value
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function toHashtag(value) {
  const compact = String(value || "")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("");

  return compact ? `#${compact}` : "";
}

function loadFromStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    return fallback;
  }
}

function saveToStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function createId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

async function copyText(text) {
  if (!text) {
    return false;
  }

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    return false;
  }
}

function setButtonCopiedState(button, copiedText) {
  const previous = button.textContent;
  button.textContent = copiedText;
  button.classList.add("copied");

  window.setTimeout(() => {
    button.textContent = previous;
    button.classList.remove("copied");
  }, 1600);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttribute(value) {
  return escapeHtml(value);
}
