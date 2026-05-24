import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";

const runtimePackage = path.resolve(path.dirname(new URL(import.meta.url).pathname), "package.json");
const require = createRequire(runtimePackage);
const { SpreadsheetFile, Workbook } = require("@oai/artifact-tool");

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "..");
const DOWNLOADS = path.join(ROOT, "public", "downloads", "templates");
const PREVIEW_DIR = path.join(ROOT, "tools", "template-artifacts", "output", "workbook-previews");

const COLORS = {
  ink: "#162424",
  muted: "#5A6A69",
  teal: "#0F766E",
  soft: "#EAF4F2",
  cream: "#F6F1E7",
  orange: "#B86B2B",
  white: "#FFFFFF",
};

const headerFormats = {
  fill: COLORS.teal,
  font: { bold: true, color: COLORS.white },
  horizontalAlignment: "center",
  verticalAlignment: "center",
  wrapText: true,
};

function padRows(rows, count, width) {
  const padded = [...rows];
  while (padded.length < count) {
    padded.push(new Array(width).fill(""));
  }
  return padded;
}

function setWidths(sheet, widths, rowCount = 40) {
  widths.forEach((width, idx) => {
    const col = String.fromCharCode(65 + idx);
    sheet.getRange(`${col}1:${col}${rowCount}`).format.columnWidth = width;
  });
}

function styleSheet(sheet, headerRange, bodyRange) {
  headerRange.format = headerFormats;
  bodyRange.format.wrapText = true;
  sheet.showGridLines = false;
}

function createWorkbook() {
  return Workbook.create();
}

async function saveWorkbook(workbook, outPath, previewSheet) {
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  const xlsx = await SpreadsheetFile.exportXlsx(workbook);
  await xlsx.save(outPath);
  await fs.mkdir(PREVIEW_DIR, { recursive: true });
  const preview = await workbook.render({
    sheetName: previewSheet,
    autoCrop: "all",
    scale: 1,
    format: "png",
  });
  const bytes = new Uint8Array(await preview.arrayBuffer());
  await fs.writeFile(path.join(PREVIEW_DIR, `${path.basename(outPath, ".xlsx")}.png`), bytes);
}

async function buildExecutiveWorkbook() {
  const workbook = createWorkbook();

  const summary = workbook.worksheets.add("Status Summary");
  summary.getRange("A1:B18").values = [
    ["Executive Project Status Summary", "Use this sheet to prepare a weekly leadership readout."],
    ["Project / Initiative", ""],
    ["Reporting Period", ""],
    ["Sponsor", ""],
    ["Delivery Lead", ""],
    ["Overall Status", "Green / Yellow / Red"],
    ["Primary Message", ""],
    ["Key Progress", ""],
    ["Top Risk", ""],
    ["Decision Needed", ""],
    ["Next Milestone", ""],
    ["Milestone Date", ""],
    ["Support Needed", ""],
    ["Owner", ""],
    ["Notes", ""],
    ["", ""],
    ["How to use", "Update this sheet first, then roll detail into the logs on the next tabs."],
    ["Clarpoint", "Clear plans. Stronger communication. Better execution."],
  ];
  styleSheet(summary, summary.getRange("A1:B1"), summary.getRange("A2:B18"));
  summary.getRange("A1:B1").merge();
  summary.getRange("A1").format.font = { bold: true, color: COLORS.white, size: 16 };
  setWidths(summary, [24, 62], 24);

  const raid = workbook.worksheets.add("RAID Log");
  const raidRows = padRows([
    ["ID", "Type", "Description", "Impact", "Owner", "Mitigation / Next Step", "Target Date", "Status"],
    ["R-01", "Risk", "Approval timing may affect the next milestone", "Medium", "Program Manager", "Confirm owner and decision date", "2026-06-02", "Open"],
    ["I-01", "Issue", "Vendor date is still unconfirmed", "High", "Delivery Lead", "Escalate in weekly readout", "2026-05-30", "In Progress"],
  ], 18, 8);
  raid.getRange("A1:H18").values = raidRows;
  styleSheet(raid, raid.getRange("A1:H1"), raid.getRange("A2:H18"));
  setWidths(raid, [12, 12, 38, 14, 18, 34, 14, 14], 22);

  const actions = workbook.worksheets.add("Action Tracker");
  const actionRows = padRows([
    ["Action ID", "Action", "Owner", "Due Date", "Status", "Priority", "Notes"],
    ["ACT-01", "Confirm milestone owners", "Program Manager", "2026-05-29", "In Progress", "High", "Review in Monday note"],
    ["ACT-02", "Draft leadership decision request", "Delivery Lead", "2026-05-31", "Open", "High", "Needs sponsor framing"],
  ], 18, 7);
  actions.getRange("A1:G18").values = actionRows;
  styleSheet(actions, actions.getRange("A1:G1"), actions.getRange("A2:G18"));
  setWidths(actions, [12, 34, 18, 14, 14, 12, 30], 22);

  const decisions = workbook.worksheets.add("Decision Log");
  const decisionRows = padRows([
    ["Decision ID", "Decision", "Date", "Owner", "Reason", "Impact", "Follow-Up"],
    ["DEC-01", "Keep phased launch approach", "2026-05-24", "Executive Sponsor", "Reduces immediate delivery risk", "Scope / timeline", "Update milestone plan"],
    ["DEC-02", "Escalate content dependency", "2026-05-24", "Program Manager", "Content timing threatens launch date", "Stakeholder communication", "Raise in leadership note"],
  ], 16, 7);
  decisions.getRange("A1:G16").values = decisionRows;
  styleSheet(decisions, decisions.getRange("A1:G1"), decisions.getRange("A2:G16"));
  setWidths(decisions, [12, 30, 14, 18, 28, 22, 28], 20);

  const milestones = workbook.worksheets.add("Milestones");
  const milestoneRows = padRows([
    ["Milestone", "Owner", "Target Date", "Current Status", "Risk Level", "Notes"],
    ["Requirements sign-off", "Business Lead", "2026-06-03", "On Track", "Low", ""],
    ["Build complete", "Tech Lead", "2026-06-18", "At Risk", "Medium", "Waiting on approvals"],
  ], 16, 6);
  milestones.getRange("A1:F16").values = milestoneRows;
  styleSheet(milestones, milestones.getRange("A1:F1"), milestones.getRange("A2:F16"));
  setWidths(milestones, [26, 18, 14, 16, 12, 30], 20);

  await saveWorkbook(workbook, path.join(DOWNLOADS, "executive-project-status-pack", "executive-project-control-workbook.xlsx"), "Status Summary");
}

async function buildRaidWorkbook() {
  const workbook = createWorkbook();
  const raid = workbook.worksheets.add("RAID Log");
  const raidRows = padRows([
    ["ID", "Category", "Item", "Impact", "Owner", "Mitigation", "Review Date", "Status"],
    ["R-01", "Risk", "Requirements still shifting", "High", "Project Lead", "Freeze core scope by next checkpoint", "2026-05-29", "Open"],
    ["I-01", "Issue", "Decision backlog slowing approvals", "High", "Sponsor", "Prioritize open approvals", "2026-05-30", "In Progress"],
  ], 18, 8);
  raid.getRange("A1:H18").values = raidRows;
  styleSheet(raid, raid.getRange("A1:H1"), raid.getRange("A2:H18"));
  setWidths(raid, [12, 14, 34, 12, 18, 28, 14, 14], 22);

  const actions = workbook.worksheets.add("Action Tracker");
  const actionsRows = padRows([
    ["Action ID", "Action", "Owner", "Due Date", "Status", "Notes"],
    ["ACT-01", "Close outstanding scope questions", "Project Lead", "2026-05-28", "Open", "Needs client input"],
    ["ACT-02", "Update weekly risk summary", "PM", "2026-05-29", "In Progress", "Prepare for Friday review"],
  ], 18, 6);
  actions.getRange("A1:F18").values = actionsRows;
  styleSheet(actions, actions.getRange("A1:F1"), actions.getRange("A2:F18"));
  setWidths(actions, [12, 34, 18, 14, 14, 28], 22);

  const decisions = workbook.worksheets.add("Decision Log");
  decisions.getRange("A1:F16").values = padRows([
    ["Decision ID", "Decision", "Decision Owner", "Date", "Impact", "Next Step"],
    ["DEC-01", "Keep weekly review cadence", "Operations Lead", "2026-05-24", "Improves visibility", "Send updated invite"],
  ], 16, 6);
  styleSheet(decisions, decisions.getRange("A1:F1"), decisions.getRange("A2:F16"));
  setWidths(decisions, [12, 30, 18, 14, 22, 26], 20);

  const review = workbook.worksheets.add("Weekly Review");
  review.getRange("A1:B14").values = [
    ["Weekly Review Prompt", "Use this tab to prep a short action-driven check-in."],
    ["Top action to close this week", ""],
    ["Main blocker", ""],
    ["Decision needed", ""],
    ["Owner support needed", ""],
    ["What changed since last review", ""],
    ["Next checkpoint", ""],
    ["", ""],
    ["Reminder", "Focus on owners, dates, and decisions rather than general discussion."],
    ["", ""],
    ["Clarpoint", "Clear plans. Stronger communication. Better execution."],
    ["", ""],
    ["", ""],
    ["", ""],
  ];
  styleSheet(review, review.getRange("A1:B1"), review.getRange("A2:B14"));
  review.getRange("A1:B1").merge();
  setWidths(review, [26, 64], 18);

  await saveWorkbook(workbook, path.join(DOWNLOADS, "raid-log-action-tracker-bundle", "raid-action-control-workbook.xlsx"), "RAID Log");
}

async function buildKickoffWorkbook() {
  const workbook = createWorkbook();
  const tracker = workbook.worksheets.add("Kickoff Tracker");
  tracker.getRange("A1:G18").values = padRows([
    ["Workstream", "Owner", "Kickoff Topic", "Decision Needed", "Action", "Due Date", "Status"],
    ["Project setup", "Delivery Lead", "Scope and timeline", "", "Confirm milestone path", "2026-05-31", "Open"],
    ["Stakeholders", "Account Lead", "Decision roles", "", "Validate approvers", "2026-05-29", "In Progress"],
  ], 18, 7);
  styleSheet(tracker, tracker.getRange("A1:G1"), tracker.getRange("A2:G18"));
  setWidths(tracker, [18, 18, 26, 24, 28, 14, 14], 22);

  const stakeholders = workbook.worksheets.add("Stakeholder Map");
  stakeholders.getRange("A1:F18").values = padRows([
    ["Name", "Role", "Team", "Priority", "Decision Influence", "Notes"],
    ["", "", "", "", "", ""],
  ], 18, 6);
  styleSheet(stakeholders, stakeholders.getRange("A1:F1"), stakeholders.getRange("A2:F18"));
  setWidths(stakeholders, [18, 18, 16, 12, 20, 28], 22);

  const actions = workbook.worksheets.add("Action Log");
  actions.getRange("A1:F18").values = padRows([
    ["Action ID", "Action", "Owner", "Due Date", "Status", "Notes"],
    ["ACT-01", "Send recap and next steps", "Delivery Lead", "2026-05-26", "Open", ""],
  ], 18, 6);
  styleSheet(actions, actions.getRange("A1:F1"), actions.getRange("A2:F18"));
  setWidths(actions, [12, 32, 18, 14, 14, 28], 22);

  await saveWorkbook(workbook, path.join(DOWNLOADS, "client-kickoff-meeting-pack", "client-kickoff-workbook.xlsx"), "Kickoff Tracker");
}

async function buildWebsiteWorkbook() {
  const workbook = createWorkbook();
  const planner = workbook.worksheets.add("Page Planner");
  planner.getRange("A1:F20").values = padRows([
    ["Page", "Purpose", "Main Message", "Primary CTA", "Proof Needed", "Notes"],
    ["Homepage", "Explain the offer fast", "", "", "", ""],
    ["Services", "Show what is offered", "", "", "", ""],
    ["About", "Build trust", "", "", "", ""],
  ], 20, 6);
  styleSheet(planner, planner.getRange("A1:F1"), planner.getRange("A2:F20"));
  setWidths(planner, [18, 26, 30, 18, 24, 26], 24);

  const messaging = workbook.worksheets.add("Messaging Map");
  messaging.getRange("A1:B16").values = [
    ["Homepage Messaging Prompt", "Working Answer"],
    ["Who is the site for?", ""],
    ["What problem does the business solve?", ""],
    ["What outcome should be clear in one line?", ""],
    ["What proof should be visible fast?", ""],
    ["What should the visitor do next?", ""],
    ["Primary CTA", ""],
    ["Secondary CTA", ""],
    ["Top differentiator", ""],
    ["Main credibility signal", ""],
    ["", ""],
    ["Reminder", "Keep answers short enough to reuse in real page copy."],
    ["", ""],
    ["", ""],
    ["", ""],
    ["", ""],
  ];
  styleSheet(messaging, messaging.getRange("A1:B1"), messaging.getRange("A2:B16"));
  setWidths(messaging, [28, 60], 20);

  const launch = workbook.worksheets.add("Launch Checklist");
  launch.getRange("A1:D18").values = padRows([
    ["Checklist Item", "Owner", "Status", "Notes"],
    ["Final copy approved", "", "", ""],
    ["Forms tested", "", "", ""],
    ["Mobile QA complete", "", "", ""],
    ["Metadata updated", "", "", ""],
  ], 18, 4);
  styleSheet(launch, launch.getRange("A1:D1"), launch.getRange("A2:D18"));
  setWidths(launch, [34, 18, 14, 28], 20);

  const maintenance = workbook.worksheets.add("Maintenance Rhythm");
  maintenance.getRange("A1:C16").values = padRows([
    ["Review Item", "Cadence", "Notes"],
    ["Check contact forms", "Monthly", ""],
    ["Refresh proof / examples", "Quarterly", ""],
    ["Review CTA alignment", "Monthly", ""],
    ["Review outdated content", "Quarterly", ""],
  ], 16, 3);
  styleSheet(maintenance, maintenance.getRange("A1:C1"), maintenance.getRange("A2:C16"));
  setWidths(maintenance, [32, 16, 32], 20);

  await saveWorkbook(workbook, path.join(DOWNLOADS, "website-redesign-planning-kit", "website-planning-workbook.xlsx"), "Page Planner");
}

async function buildConsultingWorkbook() {
  const workbook = createWorkbook();
  const pricing = workbook.worksheets.add("Pricing Options");
  pricing.getRange("A1:E16").values = padRows([
    ["Package", "Description", "Fee", "Billing Model", "Notes"],
    ["Starter", "Targeted advisory or sprint support", "$2,500", "Fixed fee", "Good for short planning engagements"],
    ["Core", "Structured delivery and communication support", "$5,500", "Fixed fee", "Add reporting and governance"],
    ["Embedded", "Ongoing weekly support and follow-through", "$3,500 / month", "Monthly retainer", "Best for steady leadership support"],
  ], 16, 5);
  styleSheet(pricing, pricing.getRange("A1:E1"), pricing.getRange("A2:E16"));
  setWidths(pricing, [18, 34, 16, 18, 30], 20);

  const scope = workbook.worksheets.add("Scope Tracker");
  scope.getRange("A1:E18").values = padRows([
    ["Workstream", "Deliverable", "Owner", "Timing", "Notes"],
    ["Planning", "", "", "", ""],
    ["Reporting", "", "", "", ""],
    ["Client delivery", "", "", "", ""],
  ], 18, 5);
  styleSheet(scope, scope.getRange("A1:E1"), scope.getRange("A2:E18"));
  setWidths(scope, [20, 30, 18, 16, 28], 20);

  const onboarding = workbook.worksheets.add("Onboarding Plan");
  onboarding.getRange("A1:D18").values = padRows([
    ["Step", "Owner", "Due Date", "Status"],
    ["Signed agreement received", "", "", ""],
    ["Kickoff scheduled", "", "", ""],
    ["Shared folder created", "", "", ""],
    ["Reporting cadence confirmed", "", "", ""],
  ], 18, 4);
  styleSheet(onboarding, onboarding.getRange("A1:D1"), onboarding.getRange("A2:D18"));
  setWidths(onboarding, [34, 18, 14, 14], 20);

  await saveWorkbook(workbook, path.join(DOWNLOADS, "consulting-proposal-starter-kit", "consulting-pricing-and-scope-workbook.xlsx"), "Pricing Options");
}

async function buildBundleWorkbook() {
  const workbook = createWorkbook();
  const index = workbook.worksheets.add("Toolkit Index");
  index.getRange("A1:D12").values = [
    ["Pack", "Primary Use", "Main Formats Included", "Notes"],
    ["Executive Project Status Pack", "Leadership reporting and delivery visibility", "DOCX, XLSX, CSV, PPTX, PDF", "Use when executive updates need to get sharper"],
    ["RAID Log + Action Tracker Bundle", "Project control and follow-up", "XLSX, CSV, DOCX, PDF", "Use when actions and decisions are getting lost"],
    ["Client Kickoff Meeting Pack", "Client engagement setup", "DOCX, XLSX, PPTX, PDF", "Use before new work begins"],
    ["Website Redesign Planning Kit", "Website and message planning", "DOCX, XLSX, PDF", "Use before a website refresh or rebuild"],
    ["Consulting Proposal Starter Kit", "Proposal and onboarding structure", "DOCX, XLSX, CSV, PDF", "Use when shaping and closing new consulting work"],
    ["Bonus Executive Communication Templates", "Sharper updates and asks", "DOCX, MD", "Use alongside the other packs"],
    ["", "", "", ""],
    ["Clarpoint", "Clear plans. Stronger communication. Better execution.", "", ""],
    ["", "", "", ""],
    ["", "", "", ""],
    ["", "", "", ""],
  ];
  styleSheet(index, index.getRange("A1:D1"), index.getRange("A2:D12"));
  setWidths(index, [32, 32, 24, 34], 16);
  await saveWorkbook(workbook, path.join(DOWNLOADS, "full-clarpoint-business-execution-toolkit", "clarpoint-toolkit-index.xlsx"), "Toolkit Index");
}

await buildExecutiveWorkbook();
await buildRaidWorkbook();
await buildKickoffWorkbook();
await buildWebsiteWorkbook();
await buildConsultingWorkbook();
await buildBundleWorkbook();
