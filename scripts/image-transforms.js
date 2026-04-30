"use strict";

function applyColor(imageData, params) {
  const recipe = normalizeColor(params);
  const output = new ImageData(imageData.width, imageData.height);
  const input = imageData.data;
  const out = output.data;
  if (recipe.mode === "equation") {
    const evaluators = recipe.expressions.map(compileColorEquation);
    for (let i = 0, pixel = 0; i < input.length; i += 4, pixel += 1) {
      const r = input[i];
      const g = input[i + 1];
      const b = input[i + 2];
      const ctx = colorEquationContext(r, g, b, pixel, imageData.width, imageData.height, recipe.display);
      const values = evaluators.map((evaluate) => evaluate(ctx));
      const rgb = colorValuesToRgb(values, recipe.display);
      out[i] = clampByte(rgb.r);
      out[i + 1] = clampByte(rgb.g);
      out[i + 2] = clampByte(rgb.b);
      out[i + 3] = 255;
    }
    return output;
  }
  const [ch0, ch1, ch2] = recipe.channels;
  for (let i = 0; i < input.length; i += 4) {
    let r = input[i];
    let g = input[i + 1];
    let b = input[i + 2];
    if (recipe.space === "RGB") {
      r += ch0; g += ch1; b += ch2;
    } else if (recipe.space === "HSL") {
      const hsl = rgbToHsl(r, g, b);
      ({ r, g, b } = hslToRgb(hsl.h + ch0, clamp01(hsl.s + ch1 / 100), clamp01(hsl.l + ch2 / 100)));
    } else if (recipe.space === "HSV") {
      const hsv = rgbToHsv(r, g, b);
      ({ r, g, b } = hsvToRgb(hsv.h + ch0, clamp01(hsv.s + ch1 / 100), clamp01(hsv.v + ch2 / 100)));
    } else if (recipe.space === "YCbCr") {
      const ycc = rgbToYcbcr(r, g, b);
      ({ r, g, b } = ycbcrToRgb(ycc.y + ch0, ycc.cb + ch1, ycc.cr + ch2));
    } else {
      const y = 0.299 * r + 0.587 * g + 0.114 * b + ch0;
      r = y + ch1; g = y + ch2; b = y - ch1;
    }
    r = (r - 128) * recipe.contrast + 128 + recipe.exposure;
    g = (g - 128) * recipe.contrast + 128 + recipe.exposure;
    b = (b - 128) * recipe.contrast + 128 + recipe.exposure;
    if (recipe.posterize > 1) {
      const step = 255 / (recipe.posterize - 1);
      r = Math.round(r / step) * step;
      g = Math.round(g / step) * step;
      b = Math.round(b / step) * step;
    }
    out[i] = clampByte(r); out[i + 1] = clampByte(g); out[i + 2] = clampByte(b); out[i + 3] = 255;
  }
  return output;
}

function applyAffine(imageData, params) {
  const affine = normalizeAffine(params);
  const output = new ImageData(imageData.width, imageData.height);
  const out = output.data;
  const det = affine.a * affine.d - affine.b * affine.c;
  if (Math.abs(det) < 1e-6) return cloneImageData(imageData);
  const cx = (imageData.width - 1) / 2;
  const cy = (imageData.height - 1) / 2;
  for (let y = 0; y < imageData.height; y += 1) {
    for (let x = 0; x < imageData.width; x += 1) {
      const dx = x - cx - affine.e;
      const dy = y - cy - affine.f;
      const sx = (affine.d * dx - affine.c * dy) / det + cx;
      const sy = (-affine.b * dx + affine.a * dy) / det + cy;
      sampleBilinear(imageData, sx, sy, out, (y * imageData.width + x) * 4);
    }
  }
  return output;
}

function applyKernel(imageData, params) {
  const kernel = normalizeKernel(params);
  const values = clone(kernel.values);
  if (kernel.normalize) {
    const sum = values.flat().reduce((total, value) => total + value, 0);
    if (Math.abs(sum) > 1e-9) values.forEach((row, y) => row.forEach((value, x) => values[y][x] = value / sum));
  }
  const output = new ImageData(imageData.width, imageData.height);
  const input = imageData.data;
  const out = output.data;
  for (let y = 0; y < imageData.height; y += 1) {
    for (let x = 0; x < imageData.width; x += 1) {
      let r = 0, g = 0, b = 0;
      for (let ky = 0; ky < 3; ky += 1) {
        for (let kx = 0; kx < 3; kx += 1) {
          const sx = clamp(x + kx - 1, 0, imageData.width - 1);
          const sy = clamp(y + ky - 1, 0, imageData.height - 1);
          const index = (sy * imageData.width + sx) * 4;
          const weight = values[ky][kx] * kernel.scale;
          r += input[index] * weight; g += input[index + 1] * weight; b += input[index + 2] * weight;
        }
      }
      const target = (y * imageData.width + x) * 4;
      out[target] = clampByte(r + kernel.bias);
      out[target + 1] = clampByte(g + kernel.bias);
      out[target + 2] = clampByte(b + kernel.bias);
      out[target + 3] = 255;
    }
  }
  return output;
}

function applyRecombine(a, b, params = {}) {
  const output = new ImageData(a.width, a.height);
  const out = output.data;
  const amount = clamp(Number(params.amount ?? 0.5), 0, 1);
  const mode = params.mode || "blend";
  for (let i = 0; i < out.length; i += 4) {
    for (let c = 0; c < 3; c += 1) {
      const av = a.data[i + c];
      const bv = b.data[i + c];
      let mixed = av * (1 - amount) + bv * amount;
      if (mode === "screen") mixed = 255 - (255 - av) * (255 - bv) / 255;
      if (mode === "multiply") mixed = av * bv / 255;
      if (mode === "difference") mixed = Math.abs(av - bv);
      out[i + c] = clampByte(mixed);
    }
    out[i + 3] = 255;
  }
  return output;
}

function sampleBilinear(imageData, x, y, out, target) {
  if (x < 0 || y < 0 || x > imageData.width - 1 || y > imageData.height - 1) {
    out[target] = 255; out[target + 1] = 250; out[target + 2] = 240; out[target + 3] = 255;
    return;
  }
  const x0 = Math.floor(x), y0 = Math.floor(y);
  const x1 = Math.min(imageData.width - 1, x0 + 1), y1 = Math.min(imageData.height - 1, y0 + 1);
  const tx = x - x0, ty = y - y0;
  const i00 = (y0 * imageData.width + x0) * 4;
  const i10 = (y0 * imageData.width + x1) * 4;
  const i01 = (y1 * imageData.width + x0) * 4;
  const i11 = (y1 * imageData.width + x1) * 4;
  const mix = (a, b, t) => a * (1 - t) + b * t;
  for (let c = 0; c < 3; c += 1) {
    const top = mix(imageData.data[i00 + c], imageData.data[i10 + c], tx);
    const bottom = mix(imageData.data[i01 + c], imageData.data[i11 + c], tx);
    out[target + c] = clampByte(mix(top, bottom, ty));
  }
  out[target + 3] = 255;
}

