"use strict";

function scoreImages(userImage, targetImage) {
  const pixelMatch = bestShiftMae(userImage.data, targetImage.data, userImage.width, userImage.height, SHIFT_RADIUS);
  const userGray = grayscaleArray(userImage);
  const targetGray = grayscaleArray(targetImage);
  const edgeMatch = bestShiftMaeArray(sobelArray(userGray, userImage.width, userImage.height), sobelArray(targetGray, targetImage.width, targetImage.height), userImage.width, userImage.height, 4);
  const histScore = histogramScore(userImage, targetImage);
  const pixelScore = 100 * Math.exp(-pixelMatch.mae * 5.2);
  const edgeScore = 100 * Math.exp(-edgeMatch.mae * 4.5);
  const score = pixelScore * 0.6 + edgeScore * 0.25 + histScore * 0.15 - Math.min(10, Math.hypot(pixelMatch.dx, pixelMatch.dy));
  return { score: clamp(score, 0, 100), pixelScore, edgeScore, histScore, dx: pixelMatch.dx, dy: pixelMatch.dy };
}

function bestShiftMae(user, target, width, height, radius) {
  let best = { mae: Infinity, dx: 0, dy: 0 };
  for (let dy = -radius; dy <= radius; dy += 1) {
    for (let dx = -radius; dx <= radius; dx += 1) {
      let sum = 0, count = 0;
      for (let y = Math.max(0, -dy); y < Math.min(height, height - dy); y += 1) {
        for (let x = Math.max(0, -dx); x < Math.min(width, width - dx); x += 1) {
          const ui = ((y + dy) * width + (x + dx)) * 4;
          const ti = (y * width + x) * 4;
          sum += Math.abs(user[ui] - target[ti]) + Math.abs(user[ui + 1] - target[ti + 1]) + Math.abs(user[ui + 2] - target[ti + 2]);
          count += 765;
        }
      }
      const mae = count ? sum / count : Infinity;
      if (mae < best.mae) best = { mae, dx, dy };
    }
  }
  return best;
}

function bestShiftMaeArray(user, target, width, height, radius) {
  let best = { mae: Infinity, dx: 0, dy: 0 };
  for (let dy = -radius; dy <= radius; dy += 1) {
    for (let dx = -radius; dx <= radius; dx += 1) {
      let sum = 0, count = 0;
      for (let y = Math.max(1, 1 - dy); y < Math.min(height - 1, height - 1 - dy); y += 1) {
        for (let x = Math.max(1, 1 - dx); x < Math.min(width - 1, width - 1 - dx); x += 1) {
          sum += Math.abs(user[(y + dy) * width + (x + dx)] - target[y * width + x]);
          count += 1;
        }
      }
      const mae = count ? sum / count / 255 : Infinity;
      if (mae < best.mae) best = { mae, dx, dy };
    }
  }
  return best;
}

function histogramScore(userImage, targetImage) {
  const bins = 16;
  const user = [new Float32Array(bins), new Float32Array(bins), new Float32Array(bins)];
  const target = [new Float32Array(bins), new Float32Array(bins), new Float32Array(bins)];
  const total = userImage.width * userImage.height;
  for (let i = 0; i < userImage.data.length; i += 4) {
    for (let c = 0; c < 3; c += 1) {
      user[c][Math.min(bins - 1, Math.floor(userImage.data[i + c] / 16))] += 1 / total;
      target[c][Math.min(bins - 1, Math.floor(targetImage.data[i + c] / 16))] += 1 / total;
    }
  }
  let intersection = 0;
  for (let c = 0; c < 3; c += 1) for (let b = 0; b < bins; b += 1) intersection += Math.min(user[c][b], target[c][b]);
  return intersection / 3 * 100;
}

function grayscaleArray(imageData) {
  const gray = new Float32Array(imageData.width * imageData.height);
  for (let i = 0, p = 0; i < imageData.data.length; i += 4, p += 1) gray[p] = 0.299 * imageData.data[i] + 0.587 * imageData.data[i + 1] + 0.114 * imageData.data[i + 2];
  return gray;
}

function sobelArray(gray, width, height) {
  const output = new Float32Array(width * height);
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const tl = gray[(y - 1) * width + x - 1], tc = gray[(y - 1) * width + x], tr = gray[(y - 1) * width + x + 1];
      const ml = gray[y * width + x - 1], mr = gray[y * width + x + 1];
      const bl = gray[(y + 1) * width + x - 1], bc = gray[(y + 1) * width + x], br = gray[(y + 1) * width + x + 1];
      output[y * width + x] = Math.min(255, Math.hypot(-tl - 2 * ml - bl + tr + 2 * mr + br, -tl - 2 * tc - tr + bl + 2 * bc + br) / 4);
    }
  }
  return output;
}


