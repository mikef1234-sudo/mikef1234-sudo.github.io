const canvas = document.getElementById("reelCanvas");
const ctx = canvas.getContext("2d");
const renderBtn = document.getElementById("renderBtn");
const previewBtn = document.getElementById("previewBtn");
const statusNode = document.getElementById("status");

const FPS = 30;
const DURATION = 16;
const TOTAL_FRAMES = FPS * DURATION;

const scenes = [
  { start: 0, end: 4.2, type: "hook" },
  { start: 4.2, end: 8.6, type: "scene1" },
  { start: 8.6, end: 12.6, type: "scene2" },
  { start: 12.6, end: 14.5, type: "scene3" },
  { start: 14.5, end: 16, type: "close" }
];

previewBtn.addEventListener("click", () => playPreview());
renderBtn.addEventListener("click", async () => renderVideo());

drawFrame(0);

function drawFrame(time) {
  const activeScene = scenes.find((scene) => time >= scene.start && time < scene.end) || scenes[scenes.length - 1];
  const sceneProgress = (time - activeScene.start) / (activeScene.end - activeScene.start);
  const pulse = Math.sin(time * 2.4) * 0.5 + 0.5;

  drawBackground(time, pulse);

  if (activeScene.type === "hook") {
    drawHook(sceneProgress);
  } else if (activeScene.type === "scene1") {
    drawMessyScene(sceneProgress, pulse);
  } else if (activeScene.type === "scene2") {
    drawCalmScene(sceneProgress, pulse);
  } else if (activeScene.type === "scene3") {
    drawOfferScene(sceneProgress, pulse);
  } else {
    drawClose(sceneProgress, pulse);
  }
}

function drawBackground(time, pulse) {
  const gradient = ctx.createLinearGradient(0, 0, 1080, 1920);
  gradient.addColorStop(0, "#f7f6ef");
  gradient.addColorStop(1, "#edf2ef");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1080, 1920);

  ctx.save();
  ctx.globalAlpha = 0.14;
  ctx.fillStyle = "#0f766e";
  ctx.beginPath();
  ctx.arc(160 + pulse * 80, 280, 260, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#2158d8";
  ctx.beginPath();
  ctx.arc(930 - pulse * 60, 1280, 280, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#c58c10";
  ctx.beginPath();
  ctx.arc(820, 420 + pulse * 40, 180, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = "rgba(20,34,32,0.05)";
  ctx.lineWidth = 1;
  for (let x = 0; x < 1080; x += 80) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 1920);
    ctx.stroke();
  }
  for (let y = 0; y < 1920; y += 80) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(1080, y);
    ctx.stroke();
  }
  ctx.restore();

  drawBrandLockup();
}

function drawBrandLockup() {
  ctx.fillStyle = "#0f766e";
  ctx.font = "800 42px Manrope, Arial, sans-serif";
  ctx.fillText("CLARPOINT", 84, 120);

  ctx.fillStyle = "#142220";
  ctx.font = "700 24px Manrope, Arial, sans-serif";
  ctx.fillText("Website and digital presence support", 84, 168);
}

function drawHook(progress) {
  drawLargeHeadline("The offer is strong,\nbut the website\nmessage is vague\nand hard to scan.", progress);
  drawBottomCaption("Hook", "A strong offer still needs a message people can understand quickly.");
}

function drawMessyScene(progress, pulse) {
  drawLargeHeadline("The work is moving,\nbut nobody has\na clean view of\nwhat matters.", progress);

  const cardY = 820;
  for (let i = 0; i < 3; i += 1) {
    const x = 90 + i * 320 + Math.sin((progress + i) * 3) * 10;
    const y = cardY + (i % 2 === 0 ? 0 : 42) + pulse * 8;
    drawPanel(x, y, 280, 220, 20, "rgba(255,255,255,0.84)");
    ctx.fillStyle = "#142220";
    ctx.font = "700 26px Manrope, Arial, sans-serif";
    ctx.fillText(i === 0 ? "Open tabs" : i === 1 ? "Messy notes" : "Mixed signals", x + 26, y + 50);
    drawFauxLines(x + 26, y + 82, 228, [1, 0.82, 0.64, 0.92]);
  }

  drawBottomCaption(
    "Scene 1",
    "Show messy updates, open tabs, or unclear notes while the voiceover says, \"The work is moving, but nobody has a clean view of what matters.\""
  );
}

function drawCalmScene(progress, pulse) {
  drawLargeHeadline("Clarpoint brings\nstructure, sharper\ncommunication,\nand a stronger\nexecution path.", progress);

  drawPanel(108, 900, 864, 560, 30, "rgba(255,255,255,0.9)");
  ctx.fillStyle = "#142220";
  ctx.font = "800 34px Manrope, Arial, sans-serif";
  ctx.fillText("Clarity roadmap", 156, 980);

  const bars = [
    { label: "Plan", color: "#0f766e", width: 0.82 },
    { label: "Message", color: "#c58c10", width: 0.72 },
    { label: "Launch", color: "#2158d8", width: 0.76 }
  ];

  bars.forEach((bar, index) => {
    const y = 1060 + index * 126;
    ctx.fillStyle = "#39514c";
    ctx.font = "700 30px Manrope, Arial, sans-serif";
    ctx.fillText(bar.label, 156, y);
    ctx.fillStyle = "rgba(20,34,32,0.09)";
    roundRect(310, y - 28, 560, 28, 14);
    ctx.fill();
    ctx.fillStyle = bar.color;
    roundRect(310, y - 28, 560 * (bar.width + pulse * 0.04), 28, 14);
    ctx.fill();
  });

  drawBottomCaption(
    "Scene 2",
    "Shift to a calmer screen, roadmap, or cleaner homepage while the voiceover says, \"Clarpoint brings structure, sharper communication, and a stronger execution path.\""
  );
}

function drawOfferScene(progress, pulse) {
  drawLargeHeadline("Website and\ndigital presence\nsupport.", progress);
  drawPanel(92, 980, 896, 330, 30, "rgba(255,255,255,0.88)");
  ctx.fillStyle = "#0f766e";
  ctx.font = "800 26px Manrope, Arial, sans-serif";
  ctx.fillText("Outcome", 140, 1052);

  ctx.fillStyle = "#142220";
  ctx.font = "800 66px 'Arial', sans-serif";
  wrapText("Clear plans. Stronger communication. Better execution.", 140, 1126, 800, 78);

  ctx.fillStyle = "#39514c";
  ctx.font = "700 30px Manrope, Arial, sans-serif";
  wrapText("Cleaner positioning, sharper calls to action, and a more credible digital presence.", 140, 1310, 780, 42);

  drawBottomCaption(
    "Scene 3",
    "Highlight website and digital presence support and the outcome: \"Clear plans. Stronger communication. Better execution.\""
  );
}

function drawClose(progress, pulse) {
  ctx.save();
  ctx.globalAlpha = 0.12;
  ctx.fillStyle = "#142220";
  ctx.font = "800 240px 'Arial', sans-serif";
  ctx.fillText("CLARPOINT", 52, 1460);
  ctx.restore();

  drawLargeHeadline("Get a website\nor project review.", progress);
  drawPill(88, 1030, 470, 76, "#0f766e", "#ffffff", "https://clarpoint.co/");

  ctx.fillStyle = "#39514c";
  ctx.font = "700 34px Manrope, Arial, sans-serif";
  wrapText("Use this as the final CTA frame for the reel close.", 90, 1188, 620, 44);

  drawBottomCaption("Close", "On-screen CTA: Get a website or project review | https://clarpoint.co/");
}

function drawLargeHeadline(text, progress) {
  const y = 300 + easeOut(progress) * 10;
  ctx.fillStyle = "#142220";
  ctx.font = "800 110px 'Arial', sans-serif";
  wrapText(text, 82, y, 910, 112);
}

function drawBottomCaption(label, copy) {
  drawPanel(78, 1560, 924, 236, 30, "rgba(20,34,32,0.9)");
  ctx.fillStyle = "#7fe0d5";
  ctx.font = "800 24px Manrope, Arial, sans-serif";
  ctx.fillText(label.toUpperCase(), 126, 1630);
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 34px Manrope, Arial, sans-serif";
  wrapText(copy, 126, 1690, 826, 44);
}

function drawPanel(x, y, w, h, r, fill) {
  ctx.fillStyle = fill;
  roundRect(x, y, w, h, r);
  ctx.fill();
}

function drawFauxLines(x, y, width, multipliers) {
  multipliers.forEach((multi, index) => {
    ctx.fillStyle = "rgba(20,34,32,0.11)";
    roundRect(x, y + index * 30, width * multi, 14, 7);
    ctx.fill();
  });
}

function drawPill(x, y, w, h, fill, color, text) {
  ctx.fillStyle = fill;
  roundRect(x, y, w, h, h / 2);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.font = "800 34px Manrope, Arial, sans-serif";
  ctx.fillText(text, x + 30, y + 48);
}

function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function wrapText(text, x, y, maxWidth, lineHeight) {
  const paragraphs = text.split("\n");
  let currentY = y;
  paragraphs.forEach((paragraph) => {
    const words = paragraph.split(" ");
    let line = "";
    words.forEach((word) => {
      const testLine = line ? `${line} ${word}` : word;
      const width = ctx.measureText(testLine).width;
      if (width > maxWidth && line) {
        ctx.fillText(line, x, currentY);
        line = word;
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    });
    if (line) {
      ctx.fillText(line, x, currentY);
      currentY += lineHeight;
    }
  });
}

function easeOut(value) {
  return 1 - Math.pow(1 - Math.max(0, Math.min(1, value)), 3);
}

function playPreview() {
  const start = performance.now();

  function tick(now) {
    const elapsed = (now - start) / 1000;
    const time = elapsed % DURATION;
    drawFrame(time);
    if (elapsed < DURATION) {
      requestAnimationFrame(tick);
    }
  }

  requestAnimationFrame(tick);
}

async function renderVideo() {
  statusNode.textContent = "Rendering video…";
  const stream = canvas.captureStream(FPS);
  const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
    ? "video/webm;codecs=vp9"
    : "video/webm";

  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: 8_000_000
  });

  const chunks = [];
  recorder.addEventListener("dataavailable", (event) => {
    if (event.data.size > 0) {
      chunks.push(event.data);
    }
  });

  recorder.addEventListener("stop", () => {
    const blob = new Blob(chunks, { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "clarpoint-website-clarity-reel.webm";
    link.click();
    statusNode.textContent = "Rendered and downloaded: clarpoint-website-clarity-reel.webm";
    URL.revokeObjectURL(url);
  });

  recorder.start();

  for (let frame = 0; frame < TOTAL_FRAMES; frame += 1) {
    const time = frame / FPS;
    drawFrame(time);
    await new Promise((resolve) => setTimeout(resolve, 1000 / FPS));
  }

  recorder.stop();
}
