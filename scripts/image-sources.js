"use strict";

async function loadImagePoolManifest() {
  try {
    const response = await fetch("assets/images/pool-manifest.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    const ids = new Set(BASE_IMAGE_SOURCES.map((source) => source.id));
    const extras = Array.isArray(payload.images) ? payload.images
      .filter((source) => source?.id && source?.file && !ids.has(source.id))
      .map((source) => ({ id: String(source.id), name: String(source.name || source.id), file: normalizeImageFile(String(source.file)) })) : [];
    IMAGE_SOURCES = [...BASE_IMAGE_SOURCES, ...extras];
  } catch (error) {
    console.warn(`Image pool manifest unavailable: ${error.message}`);
  }
}

function normalizeImageFile(file) {
  return file.replace("assets/images/openverse/", "assets/images/");
}

function buildSandboxSources() {
  dom.sandboxSourceSelect.innerHTML = "";
  IMAGE_SOURCES.forEach((source) => {
    const option = document.createElement("option");
    option.value = source.id;
    option.textContent = source.name;
    dom.sandboxSourceSelect.append(option);
  });
}

async function loadSourceImage(source) {
  if (imageCache.has(source.id)) return cloneImageData(imageCache.get(source.id));
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  try {
    await drawLoadedImage(ctx, source.file);
  } catch {
    if (typeof source.draw === "function") source.draw(ctx, SIZE, SIZE);
    else drawFallbackChart(ctx, SIZE, SIZE);
  }
  const imageData = ctx.getImageData(0, 0, SIZE, SIZE);
  imageCache.set(source.id, imageData);
  return cloneImageData(imageData);
}

function drawLoadedImage(ctx, src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = "#fffaf0";
      ctx.fillRect(0, 0, SIZE, SIZE);
      const scale = Math.max(SIZE / img.naturalWidth, SIZE / img.naturalHeight);
      const w = img.naturalWidth * scale;
      const h = img.naturalHeight * scale;
      ctx.drawImage(img, (SIZE - w) / 2, (SIZE - h) / 2, w, h);
      resolve();
    };
    img.onerror = reject;
    img.src = src;
  });
}

function getSource(id) {
  return IMAGE_SOURCES.find((source) => source.id === id) || IMAGE_SOURCES[0];
}


function drawFallbackButterfly(ctx, width, height) {
  ctx.fillStyle = "#f9e8b7"; ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#3476d4"; ctx.beginPath(); ctx.ellipse(76, 86, 44, 54, -0.45, 0, Math.PI * 2); ctx.ellipse(116, 86, 44, 54, 0.45, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#ff6b57"; ctx.beginPath(); ctx.ellipse(76, 122, 32, 38, 0.4, 0, Math.PI * 2); ctx.ellipse(116, 122, 32, 38, -0.4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#1f2528"; ctx.fillRect(91, 55, 10, 88);
}

function drawFallbackTeapot(ctx, width, height) {
  ctx.fillStyle = "#d8f2ed"; ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#ffcf4a"; ctx.beginPath(); ctx.arc(93, 105, 48, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "#1f2528"; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(140, 104, 28, -1.1, 1.1); ctx.stroke();
}

function drawFallbackRings(ctx, width, height) {
  ctx.fillStyle = "#fffaf0"; ctx.fillRect(0, 0, width, height);
  for (let y = 36; y < height; y += 48) for (let x = 36; x < width; x += 48) {
    ctx.fillStyle = (x + y) % 96 === 0 ? "#6f59d9" : "#3476d4"; ctx.beginPath(); ctx.arc(x, y, 18, 0, Math.PI * 2); ctx.fill();
  }
}

function drawFallbackStripes(ctx, width, height) {
  ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, width, height);
  for (let x = -20; x < width + 20; x += 18) { ctx.fillStyle = x % 36 === 0 ? "#31b67a" : "#ff6b57"; ctx.fillRect(x, 0, 9, height); }
  ctx.fillStyle = "#1f2528"; ctx.beginPath(); ctx.arc(96, 96, 45, 0, Math.PI * 2); ctx.fill();
}

function drawFallbackLandscape(ctx, width, height) {
  const gradient = ctx.createLinearGradient(0, 0, 0, height); gradient.addColorStop(0, "#86d3f2"); gradient.addColorStop(1, "#fffaf0");
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#31b67a"; ctx.beginPath(); ctx.moveTo(0, 150); ctx.lineTo(70, 78); ctx.lineTo(126, 145); ctx.lineTo(192, 86); ctx.lineTo(192, 192); ctx.lineTo(0, 192); ctx.fill();
}

function drawFallbackBlocks(ctx, width, height) {
  ctx.fillStyle = "#f6dfb9"; ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#c98e13"; ctx.fillRect(54, 64, 84, 78);
  ctx.fillStyle = "#ffcf4a"; ctx.beginPath(); ctx.arc(74, 58, 18, 0, Math.PI * 2); ctx.arc(122, 58, 18, 0, Math.PI * 2); ctx.fill();
}

function drawFallbackCity(ctx, width, height) {
  ctx.fillStyle = "#d7e5dc"; ctx.fillRect(0, 0, width, height);
  for (let x = 8; x < width; x += 28) { const h = 50 + ((x * 11) % 86); ctx.fillStyle = x % 56 === 0 ? "#3476d4" : "#253136"; ctx.fillRect(x, height - h, 20, h); }
}

function drawFallbackBalloon(ctx, width, height) {
  ctx.fillStyle = "#bdeaf4"; ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#ff6b57"; ctx.beginPath(); ctx.arc(96, 70, 40, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "#1f2528"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(96, 110); ctx.bezierCurveTo(90, 128, 110, 142, 96, 164); ctx.stroke();
}

function drawFallbackChart(ctx, width, height) {
  ctx.fillStyle = "#fffaf0"; ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = "#d8cdb8"; for (let i = 0; i <= width; i += 16) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, height); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(width, i); ctx.stroke(); }
  ctx.fillStyle = "#253136"; ctx.fillRect(24, 44, 52, 96); ctx.fillStyle = "#3476d4"; ctx.fillRect(82, 70, 42, 70); ctx.fillStyle = "#ffcf4a"; ctx.fillRect(130, 34, 38, 106);
}


