"use strict";

function options(list, selected) {
  return list.map((item) => `<option value="${item}" ${item === selected ? "selected" : ""}>${item}</option>`).join("");
}

function chapterLinesTag(chapter) {
  return chapter.tools.includes("recombine") ? "Learn to branch and recombine streams." : "Color equations from basic RGB.";
}

function randomTitle(difficulty) {
  return `${difficulty[0].toUpperCase()}${difficulty.slice(1)} Mystery Scroll`;
}

function clearCanvas(ctx) {
  ctx.fillStyle = "#fffaf0";
  ctx.fillRect(0, 0, SIZE, SIZE);
  ctx.strokeStyle = "#d8cdb8";
  ctx.lineWidth = 2;
  for (let i = 16; i < SIZE; i += 16) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, SIZE); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(SIZE, i); ctx.stroke();
  }
}

function drawImage(ctx, imageData) {
  ctx.putImageData(imageData, 0, 0);
}

function drawMiniImage(ctx, imageData) {
  const tmp = document.createElement("canvas");
  tmp.width = imageData.width;
  tmp.height = imageData.height;
  tmp.getContext("2d").putImageData(imageData, 0, 0);
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.drawImage(tmp, 0, 0, ctx.canvas.width, ctx.canvas.height);
}

function clearMiniCanvas(ctx) {
  ctx.fillStyle = "#fffaf0";
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

function toggleAudio() {
  state.audioOn = !state.audioOn;
  dom.audioButton.textContent = state.audioOn ? "Mute" : "Audio";
  if (state.audioOn) {
    playTheme();
    playSound("mode");
  } else {
    pauseTheme();
  }
}

function playTheme() {
  if (!themeAudio) {
    themeAudio = new Audio(MAIN_THEME_SRC);
    themeAudio.loop = true;
    themeAudio.volume = 0.28;
  }
  themeAudio.play().catch(() => {
    dom.scoreGrade.textContent = "Audio";
    dom.scoreDetail.textContent = "Theme blocked";
    dom.scoreBreakdown.textContent = "Press Audio again after interacting with the page.";
  });
}

function pauseTheme() {
  if (!themeAudio) return;
  themeAudio.pause();
}

function playSound(name) {
  if (!state.audioOn) return;
  const files = {
    click: "assets/game-audio/click.ogg",
    score: "assets/game-audio/score.ogg",
    miss: "assets/game-audio/miss.ogg",
    next: "assets/game-audio/next.ogg",
    page: "assets/game-audio/page-turn.wav",
    "add-node": "assets/game-audio/add-node.ogg",
    "remove-node": "assets/game-audio/remove-node.ogg",
    wire: "assets/game-audio/wire.ogg",
    mode: "assets/game-audio/mode.ogg",
    random: "assets/game-audio/random.ogg",
    reset: "assets/game-audio/reset.ogg",
    capture: "assets/game-audio/capture.ogg",
    unlock: "assets/game-audio/unlock.ogg",
    import: "assets/game-audio/import.ogg",
    export: "assets/game-audio/export.ogg",
  };
  const audio = new Audio(files[name] || files.click);
  const volume = {
    page: 0.46,
    wire: 0.22,
    "add-node": 0.28,
    "remove-node": 0.26,
    random: 0.28,
    unlock: 0.32,
    miss: 0.25,
  };
  audio.volume = volume[name] ?? 0.3;
  audio.play().catch(() => {});
}

function burst(score) {
  const colors = ["#ffcf4a", "#ff6b57", "#31b67a", "#3476d4", "#6f59d9"];
  for (let i = 0; i < (score >= 95 ? 42 : 24); i += 1) {
    const piece = document.createElement("span");
    piece.className = "burst-piece";
    piece.style.setProperty("--piece-color", colors[i % colors.length]);
    piece.style.setProperty("--x", `${Math.round((Math.random() - 0.5) * 520)}px`);
    piece.style.setProperty("--y", `${Math.round(120 + Math.random() * 330)}px`);
    piece.style.setProperty("--r", `${Math.round((Math.random() - 0.5) * 620)}deg`);
    dom.burstLayer.append(piece);
    window.setTimeout(() => piece.remove(), 900);
  }
}

function gradeForScore(score) {
  if (score >= 95) return "S";
  if (score >= 90) return "A";
  if (score >= 80) return "Pass";
  if (score >= 65) return "Close";
  return "Train";
}

