import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";

const runtimePackage = path.resolve(path.dirname(new URL(import.meta.url).pathname), "package.json");
const require = createRequire(runtimePackage);
const { Presentation, PresentationFile } = require("@oai/artifact-tool");

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "..");
const DOWNLOADS = path.join(ROOT, "public", "downloads", "templates");
const PREVIEW_DIR = path.join(ROOT, "tools", "template-artifacts", "output", "deck-previews");

const W = 1280;
const H = 720;

const palette = {
  ink: "#162424",
  muted: "#5A6A69",
  teal: "#0F766E",
  tealDark: "#0D5B55",
  cream: "#F7F2E9",
  soft: "#E8F3F1",
  orange: "#B86B2B",
  white: "#FFFFFF",
  clear: "#00000000",
};

function addShape(slide, geometry, left, top, width, height, fill, line = palette.clear, lineWidth = 0) {
  return slide.shapes.add({
    geometry,
    position: { left, top, width, height },
    fill,
    line: { style: "solid", fill: line, width: lineWidth },
  });
}

function addText(slide, text, left, top, width, height, {
  size = 24,
  bold = false,
  color = palette.ink,
  fill = palette.clear,
  line = palette.clear,
  lineWidth = 0,
  align = "left",
  typeface = "Aptos",
} = {}) {
  const shape = addShape(slide, "rect", left, top, width, height, fill, line, lineWidth);
  shape.text = text;
  shape.text.fontSize = size;
  shape.text.bold = bold;
  shape.text.color = color;
  shape.text.typeface = typeface;
  shape.text.alignment = align;
  shape.text.verticalAlignment = "top";
  shape.text.insets = { left: 0, right: 0, top: 0, bottom: 0 };
  return shape;
}

function addHeader(slide, kicker) {
  addText(slide, kicker.toUpperCase(), 70, 42, 420, 22, {
    size: 13,
    bold: true,
    color: palette.tealDark,
    typeface: "Aptos",
  });
  addShape(slide, "rect", 70, 72, 1140, 2, palette.ink);
}

function addTitle(slide, title, subtitle) {
  addText(slide, title, 70, 100, 770, 120, {
    size: 36,
    bold: true,
    color: palette.ink,
    typeface: "Aptos Display",
  });
  if (subtitle) {
    addText(slide, subtitle, 70, 228, 760, 54, {
      size: 18,
      color: palette.muted,
    });
  }
}

function addCard(slide, label, body, left, top, width, height, accent = palette.teal) {
  addShape(slide, "roundRect", left, top, width, height, palette.white, palette.ink, 1);
  addShape(slide, "rect", left, top, 8, height, accent);
  addText(slide, label.toUpperCase(), left + 22, top + 22, width - 44, 22, {
    size: 13,
    bold: true,
    color: palette.tealDark,
  });
  addText(slide, body, left + 22, top + 56, width - 44, height - 72, {
    size: 18,
    color: palette.ink,
  });
}

function addFooter(slide, note = "Clarpoint | Clear plans. Stronger communication. Better execution.") {
  addText(slide, note, 70, 676, 900, 20, {
    size: 10,
    color: palette.muted,
  });
}

async function renderPreview(presentation, slide, fileName) {
  await fs.mkdir(PREVIEW_DIR, { recursive: true });
  const blob = await presentation.export({ slide, format: "png", scale: 1 });
  const bytes = new Uint8Array(await blob.arrayBuffer());
  await fs.writeFile(path.join(PREVIEW_DIR, fileName), bytes);
}

async function saveDeck(presentation, outPath, previewName) {
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await renderPreview(presentation, presentation.slides.getItem(0), previewName);
  const pptx = await PresentationFile.exportPptx(presentation);
  await pptx.save(outPath);
}

async function buildExecutiveDeck() {
  const presentation = Presentation.create({ slideSize: { width: W, height: H } });

  const cover = presentation.slides.add();
  cover.background.fill = palette.cream;
  addHeader(cover, "Executive status pack");
  addTitle(cover, "Steering committee summary deck", "Use this editable deck to turn weekly delivery detail into a short executive checkpoint.");
  addCard(cover, "Best use", "Use this deck when leadership needs a sharper current-state view, key risks, decisions needed, and the next milestone path.", 70, 338, 530, 190, palette.teal);
  addCard(cover, "What to customize", "Replace the sample titles, milestone notes, risk items, and decision asks with current project-specific content before each review.", 630, 338, 530, 190, palette.orange);
  addFooter(cover);

  const summary = presentation.slides.add();
  summary.background.fill = palette.soft;
  addHeader(summary, "Executive summary");
  addTitle(summary, "Current status, top message, and leadership ask", "A strong executive slide should be short enough to scan and specific enough to drive action.");
  addCard(summary, "Status message", "Overall status: [Green / Yellow / Red]\nPrimary message: [What leadership should understand immediately]\nConfidence: [High / Medium / Low]", 70, 330, 340, 220);
  addCard(summary, "What changed", "Progress this period\nMilestones completed\nWhat moved or slipped\nWhat leadership should not miss", 440, 330, 340, 220);
  addCard(summary, "Leadership ask", "Decision needed\nOwner\nDeadline\nWhat happens if delayed", 810, 330, 340, 220, palette.orange);
  addFooter(summary);

  const risk = presentation.slides.add();
  risk.background.fill = palette.cream;
  addHeader(risk, "Risks and next steps");
  addTitle(risk, "Show risk, ownership, and what happens next", "Use this slide when leadership needs a clean view of where delivery pressure is building.");
  addCard(risk, "Top risks", "Risk 1\nImpact\nMitigation\nOwner", 70, 330, 340, 220);
  addCard(risk, "Dependencies and blockers", "Dependency\nCurrent state\nWhat needs to happen next", 440, 330, 340, 220, palette.orange);
  addCard(risk, "Next milestone path", "Next milestone\nTarget date\nRisk to date\nSupport required", 810, 330, 340, 220);
  addFooter(risk);

  await saveDeck(presentation, path.join(DOWNLOADS, "executive-project-status-pack", "steering-committee-summary-deck.pptx"), "executive-deck.png");
}

async function buildKickoffDeck() {
  const presentation = Presentation.create({ slideSize: { width: W, height: H } });

  const cover = presentation.slides.add();
  cover.background.fill = palette.cream;
  addHeader(cover, "Client kickoff pack");
  addTitle(cover, "Client kickoff deck", "Use this editable deck to lead a calm, structured kickoff that sets expectations and creates cleaner follow-through.");
  addCard(cover, "Purpose", "Align on outcomes, scope, roles, cadence, and immediate next steps without turning kickoff into a loose discussion.", 70, 344, 500, 180);
  addCard(cover, "How to use", "Pair this deck with the agenda, stakeholder intake form, workbook, and follow-up email template in the same pack.", 610, 344, 500, 180, palette.orange);
  addFooter(cover);

  const scope = presentation.slides.add();
  scope.background.fill = palette.soft;
  addHeader(scope, "Scope and success");
  addTitle(scope, "Start with the outcome, then define the working frame", "Keep the opening slides focused on what the work is meant to achieve and how success will be recognized.");
  addCard(scope, "Desired outcome", "Why this work matters\nWhat should be true at the end\nWhat success should feel like", 70, 330, 340, 220);
  addCard(scope, "Scope", "In scope\nOut of scope\nKnown assumptions\nDependencies", 440, 330, 340, 220);
  addCard(scope, "Working model", "Cadence\nCommunication path\nReview points\nEscalation path", 810, 330, 340, 220, palette.orange);
  addFooter(scope);

  const roles = presentation.slides.add();
  roles.background.fill = palette.cream;
  addHeader(roles, "Ownership and next steps");
  addTitle(roles, "Make owners and first actions visible before the meeting ends", "The goal is to leave kickoff with fewer assumptions and a stronger follow-up rhythm.");
  addCard(roles, "Key roles", "Executive sponsor\nBusiness owner\nDelivery lead\nApprover", 70, 330, 340, 220);
  addCard(roles, "Immediate actions", "Action\nOwner\nDue date\nTracking method", 440, 330, 340, 220);
  addCard(roles, "Next checkpoint", "First follow-up review\nNeeded materials\nSuccess signal for week one", 810, 330, 340, 220, palette.orange);
  addFooter(roles);

  await saveDeck(presentation, path.join(DOWNLOADS, "client-kickoff-meeting-pack", "client-kickoff-deck.pptx"), "kickoff-deck.png");
}

async function buildWebsiteDeck() {
  const presentation = Presentation.create({ slideSize: { width: W, height: H } });

  const cover = presentation.slides.add();
  cover.background.fill = palette.cream;
  addHeader(cover, "Website planning kit");
  addTitle(cover, "Website planning brief", "Use this deck to align on what the website should say, what it should drive, and what needs to be ready before launch.");
  addCard(cover, "Best use", "Use this before a redesign, homepage rewrite, or digital refresh when the offer is strong but the current website feels unclear or outdated.", 70, 344, 500, 180);
  addCard(cover, "What this supports", "Homepage clarity\nPage structure\nContent planning\nLaunch readiness", 610, 344, 500, 180, palette.orange);
  addFooter(cover);

  const message = presentation.slides.add();
  message.background.fill = palette.soft;
  addHeader(message, "Message and conversion");
  addTitle(message, "Clarify what the business does and what the visitor should do next", "A cleaner website often starts with a better message and a simpler conversion path.");
  addCard(message, "Homepage message", "Who the business helps\nWhat problem it solves\nWhat outcome it creates", 70, 330, 340, 220);
  addCard(message, "Proof and trust", "Experience\nExamples\nService credibility\nWhy believe it", 440, 330, 340, 220);
  addCard(message, "CTA path", "Primary CTA\nSecondary CTA\nLead capture\nMobile clarity", 810, 330, 340, 220, palette.orange);
  addFooter(message);

  const launch = presentation.slides.add();
  launch.background.fill = palette.cream;
  addHeader(launch, "Launch readiness");
  addTitle(launch, "Turn planning into a cleaner launch process", "Use the final slide to frame the launch checklist, owner decisions, and what must be true before go-live.");
  addCard(launch, "Pre-launch", "Copy approval\nQA\nMetadata\nForm testing", 70, 330, 340, 220);
  addCard(launch, "Launch day", "Final checks\nOwnership\nIssue response path", 440, 330, 340, 220);
  addCard(launch, "After launch", "Feedback\nFixes\nLead flow review\nMaintenance rhythm", 810, 330, 340, 220, palette.orange);
  addFooter(launch);

  await saveDeck(presentation, path.join(DOWNLOADS, "website-redesign-planning-kit", "website-planning-brief-deck.pptx"), "website-deck.png");
}

async function buildRaidDeck() {
  const presentation = Presentation.create({ slideSize: { width: W, height: H } });

  const cover = presentation.slides.add();
  cover.background.fill = palette.cream;
  addHeader(cover, "RAID and accountability");
  addTitle(cover, "Weekly accountability review deck", "Use this deck to run a short control review focused on owners, risks, decisions, and follow-up.");
  addCard(cover, "Best use", "Use this deck when the work is moving but the team needs a cleaner weekly control rhythm and stronger ownership visibility.", 70, 344, 500, 180);
  addCard(cover, "What this supports", "RAID review\nDecision follow-up\nAction ownership\nMeeting reset", 610, 344, 500, 180, palette.orange);
  addFooter(cover);

  const focus = presentation.slides.add();
  focus.background.fill = palette.soft;
  addHeader(focus, "Current view");
  addTitle(focus, "Show where attention is needed now", "Keep the conversation tight: what is open, what is blocked, what needs a decision, and who owns the next move.");
  addCard(focus, "Top risks", "Risk\nImpact\nOwner\nMitigation", 70, 330, 340, 220);
  addCard(focus, "Open actions", "Action\nOwner\nDue date\nProgress", 440, 330, 340, 220);
  addCard(focus, "Decisions needed", "Decision\nDecision owner\nDeadline\nImpact if delayed", 810, 330, 340, 220, palette.orange);
  addFooter(focus);

  const reset = presentation.slides.add();
  reset.background.fill = palette.cream;
  addHeader(reset, "Next steps");
  addTitle(reset, "Close the review with owners and dates", "The outcome of the meeting should be visible ownership, not another loose recap.");
  addCard(reset, "Escalations", "What needs sponsor attention now\nWhy it matters\nWhat support is needed", 70, 330, 340, 220);
  addCard(reset, "Follow-up plan", "Actions to close this week\nOwners\nDue dates", 440, 330, 340, 220);
  addCard(reset, "Operating improvement", "What can move async\nWhat meetings can shrink\nWhat needs a cleaner tracker", 810, 330, 340, 220, palette.orange);
  addFooter(reset);

  await saveDeck(presentation, path.join(DOWNLOADS, "raid-log-action-tracker-bundle", "weekly-accountability-review-deck.pptx"), "raid-deck.png");
}

async function buildConsultingDeck() {
  const presentation = Presentation.create({ slideSize: { width: W, height: H } });

  const cover = presentation.slides.add();
  cover.background.fill = palette.cream;
  addHeader(cover, "Consulting proposal kit");
  addTitle(cover, "Consulting proposal deck", "Use this deck to present a clearer scope, stronger investment framing, and a more confident next step.");
  addCard(cover, "Best use", "Use this deck after discovery when you need to move from a conversation into a structured recommendation and proposal.", 70, 344, 500, 180);
  addCard(cover, "What this supports", "Executive summary\nScope\nTimeline\nInvestment options", 610, 344, 500, 180, palette.orange);
  addFooter(cover);

  const scope = presentation.slides.add();
  scope.background.fill = palette.soft;
  addHeader(scope, "Approach");
  addTitle(scope, "Frame the current state and recommended path", "Keep the proposal story simple enough to scan and strong enough to support a buying decision.");
  addCard(scope, "Current state", "What is happening now\nWhere friction is showing up\nWhy it matters", 70, 330, 340, 220);
  addCard(scope, "Recommended support", "What Clarpoint would do\nHow the work will be structured\nKey deliverables", 440, 330, 340, 220);
  addCard(scope, "Client role", "Inputs needed\nReview responsibilities\nApproval path", 810, 330, 340, 220, palette.orange);
  addFooter(scope);

  const investment = presentation.slides.add();
  investment.background.fill = palette.cream;
  addHeader(investment, "Decision path");
  addTitle(investment, "Make scope, pricing, and next steps feel clear", "The goal is to reduce ambiguity so the client can make a cleaner decision.");
  addCard(investment, "Options", "Starter\nCore\nEmbedded\nWhen each option fits", 70, 330, 340, 220);
  addCard(investment, "Commercials", "Fee structure\nTiming\nAssumptions\nExclusions", 440, 330, 340, 220);
  addCard(investment, "Next steps", "Decision deadline\nKickoff plan\nWhat happens after approval", 810, 330, 340, 220, palette.orange);
  addFooter(investment);

  await saveDeck(presentation, path.join(DOWNLOADS, "consulting-proposal-starter-kit", "consulting-proposal-deck.pptx"), "consulting-deck.png");
}

async function buildBundleDeck() {
  const presentation = Presentation.create({ slideSize: { width: W, height: H } });

  const cover = presentation.slides.add();
  cover.background.fill = palette.cream;
  addHeader(cover, "Full Clarpoint toolkit");
  addTitle(cover, "Full Clarpoint client delivery system overview", "Use this deck to understand how the packs work together as a reusable consulting and delivery operating system.");
  addCard(cover, "What is in the bundle", "Executive status tools\nProject controls\nClient kickoff files\nWebsite planning resources\nProposal support", 70, 344, 500, 180);
  addCard(cover, "Best fit", "Consultants, agencies, operators, and delivery teams who want one repeatable working system instead of isolated templates.", 610, 344, 500, 180, palette.orange);
  addFooter(cover);

  const map = presentation.slides.add();
  map.background.fill = palette.soft;
  addHeader(map, "System map");
  addTitle(map, "Move from opportunity to plan to delivery with less noise", "This slide helps explain where each toolkit fits in the broader client or internal workflow.");
  addCard(map, "Start", "Proposal\nDiscovery\nScope framing", 70, 330, 250, 220);
  addCard(map, "Plan", "Kickoff\nRoles\nTimeline\nStakeholders", 350, 330, 250, 220);
  addCard(map, "Deliver", "Status\nRAID\nDecisions\nActions", 630, 330, 250, 220);
  addCard(map, "Improve", "Website\nMessaging\nOperating rhythm\nNext-step clarity", 910, 330, 250, 220, palette.orange);
  addFooter(map);

  await saveDeck(presentation, path.join(DOWNLOADS, "full-clarpoint-business-execution-toolkit", "full-clarpoint-client-delivery-system-overview-deck.pptx"), "bundle-deck.png");
}

await buildExecutiveDeck();
await buildKickoffDeck();
await buildWebsiteDeck();
await buildRaidDeck();
await buildConsultingDeck();
await buildBundleDeck();
