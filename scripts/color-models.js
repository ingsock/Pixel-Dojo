"use strict";

function normalizeColor(params = {}) {
  params = params && typeof params === "object" ? params : {};
  const equations = Array.isArray(params.equations) ? params.equations : null;
  const expressions = Array.isArray(params.expressions) ? params.expressions : null;
  if (params.mode === "equation" || equations || expressions) {
    const labels = Array.isArray(params.labels) ? params.labels : ["R", "G", "B"];
    const count = Math.max(1, Math.min(4, expressions?.length || equations?.length || labels.length || 3));
    return {
      mode: "equation",
      abstract: Boolean(params.abstract),
      name: cleanLabel(params.name || ""),
      display: ["rgb", "gray", "cmy", "cmyk", "hsv", "hsi"].includes(params.display) ? params.display : "rgb",
      labels: Array.from({ length: count }, (_, i) => cleanLabel(labels[i] || ["R", "G", "B", "A"][i] || `Ch ${i + 1}`)),
      expressions: Array.from({ length: count }, (_, i) => cleanEquation(expressions?.[i] ?? equations?.[i] ?? ["r", "g", "b", "0"][i])),
      equations: Array.from({ length: count }, (_, i) => cleanEquation(equations?.[i] ?? ["r", "g", "b", "0"][i])),
    };
  }
  return {
    mode: "adjust",
    abstract: false,
    name: "",
    display: "rgb",
    labels: ["R", "G", "B"],
    expressions: ["r", "g", "b"],
    equations: ["r", "g", "b"],
    space: ["RGB", "HSL", "HSV", "YCbCr", "Gray"].includes(params.space) ? params.space : "RGB",
    channels: Array.isArray(params.channels) ? [0, 1, 2].map((i) => clamp(Number(params.channels[i] || 0), -180, 180)) : [0, 0, 0],
    exposure: clamp(Number(params.exposure || 0), -100, 100),
    contrast: clamp(Number(params.contrast || 1), 0.2, 2.2),
    posterize: clamp(Math.round(Number(params.posterize || 0)), 0, 12),
  };
}

function equationColorParams(r, g, b) {
  return { mode: "equation", abstract: false, expressions: [r, g, b].map(cleanEquation), equations: [r, g, b].map(cleanEquation) };
}

function formatColorParams(name, display, labels, expressions, equations) {
  return {
    mode: "equation",
    abstract: true,
    name,
    display,
    labels,
    expressions,
    equations,
  };
}

function cleanLabel(value) {
  return String(value ?? "").trim().slice(0, 18);
}

function cleanEquation(value) {
  const text = String(value ?? "").trim();
  return text ? text.slice(0, 90) : "0";
}

function colorExpressionHelpText() {
  return "Use numbers, r, g, b, avg, luma, x, y, w, h, min(), max(), abs(), clamp(), mix(), sqrt(), sin(), cos(), atan2(), pi, and arithmetic like + - * / ().";
}

function validateColorExpression(expression) {
  const source = cleanEquation(expression);
  const allowedCharacters = /^[0-9a-zA-Z_+\-*/%().,\s?:<>=!]+$/.test(source);
  const names = source.match(/[a-zA-Z_][a-zA-Z0-9_]*/g) || [];
  const allowedNames = colorExpressionNames();
  const invalidNames = [...new Set(names.filter((name) => !allowedNames.has(name)))];
  if (!allowedCharacters) {
    return { ok: false, source, reason: "Only math operators, numbers, channel names, and supported helper functions are allowed." };
  }
  if (invalidNames.length) {
    return { ok: false, source, reason: `Unknown name${invalidNames.length > 1 ? "s" : ""}: ${invalidNames.join(", ")}.` };
  }
  try {
    // eslint-disable-next-line no-new-func
    new Function("ctx", colorEquationBody(source));
    return { ok: true, source, reason: "" };
  } catch {
    return { ok: false, source, reason: "The expression is not valid JavaScript math." };
  }
}

function colorExpressionNames() {
  return new Set(["r", "g", "b", "x", "y", "w", "h", "avg", "luma", "Gray", "gray", "C", "M", "Y", "K", "H", "S", "V", "I", "c", "m", "k", "s", "v", "i", "min", "max", "abs", "clamp", "mix", "sqrt", "atan2", "sin", "cos", "pi"]);
}

function colorEquationBody(source) {
  return `
    "use strict";
    const { r, g, b, x, y, w, h, avg, luma, Gray, C, M, Y, K, H, S, V, I } = ctx;
    const gray = Gray;
    const c = C, m = M, k = K, s = S, v = V, i = I;
    const min = Math.min;
    const max = Math.max;
    const abs = Math.abs;
    const sqrt = Math.sqrt;
    const atan2 = Math.atan2;
    const sin = Math.sin;
    const cos = Math.cos;
    const pi = Math.PI;
    const clamp = (value, low = 0, high = 255) => Math.max(low, Math.min(high, value));
    const mix = (a, b, t) => a * (1 - t) + b * t;
    return (${source});
  `;
}

function compileColorEquation(expression) {
  const validation = validateColorExpression(expression);
  if (!validation.ok) return () => 0;
  try {
    const fn = new Function("ctx", colorEquationBody(validation.source));
    return (ctx) => {
      try {
        const value = Number(fn(ctx));
        return Number.isFinite(value) ? value : 0;
      } catch {
        return 0;
      }
    };
  } catch {
    return () => 0;
  }
}

function colorEquationContext(r, g, b, pixel, width, height, display) {
  const avg = (r + g + b) / 3;
  const luma = 0.299 * r + 0.587 * g + 0.114 * b;
  const hsv = rgbToHsv(r, g, b);
  const hsiHue = Math.atan2(Math.sqrt(3) * (g - b), 2 * r - g - b) * 180 / Math.PI;
  const cmyC = 255 - r;
  const cmyM = 255 - g;
  const cmyY = 255 - b;
  const k = Math.min(cmyC, cmyM, cmyY);
  const useCmyk = display === "cmyk";
  return {
    r, g, b,
    x: pixel % width,
    y: Math.floor(pixel / width),
    w: width,
    h: height,
    avg,
    luma,
    Gray: avg,
    C: useCmyk ? cmyC - k : cmyC,
    M: useCmyk ? cmyM - k : cmyM,
    Y: useCmyk ? cmyY - k : cmyY,
    K: k,
    H: display === "hsi" ? hsiHue : hsv.h,
    S: display === "hsi" ? (1 - Math.min(r, g, b) / Math.max(1, avg)) * 255 : hsv.s * 255,
    V: hsv.v * 255,
    I: avg,
  };
}

function colorValuesToRgb(values, display) {
  const a = Number(values[0]) || 0;
  const b = Number(values[1]) || 0;
  const c = Number(values[2]) || 0;
  const d = Number(values[3]) || 0;
  if (display === "gray") return { r: a, g: a, b: a };
  if (display === "cmy") return { r: 255 - a, g: 255 - b, b: 255 - c };
  if (display === "cmyk") return { r: 255 - Math.min(255, a + d), g: 255 - Math.min(255, b + d), b: 255 - Math.min(255, c + d) };
  if (display === "hsv") return hsvToRgb(a, clamp(b, 0, 255) / 255, clamp(c, 0, 255) / 255);
  if (display === "hsi") return hsiToRgb(a, clamp(b, 0, 255) / 255, clamp(c, 0, 255));
  return { r: a, g: b, b: c };
}

function normalizeAffine(params = {}) {
  params = params && typeof params === "object" ? params : {};
  return {
    a: clamp(Number(params.a ?? 1), -3, 3), b: clamp(Number(params.b ?? 0), -3, 3),
    c: clamp(Number(params.c ?? 0), -3, 3), d: clamp(Number(params.d ?? 1), -3, 3),
    e: clamp(Number(params.e ?? 0), -96, 96), f: clamp(Number(params.f ?? 0), -96, 96),
  };
}

function normalizeKernel(params = {}) {
  params = params && typeof params === "object" ? params : {};
  const values = clone(KERNEL_PRESETS.identity.values);
  if (Array.isArray(params.values)) for (let y = 0; y < 3; y += 1) for (let x = 0; x < 3; x += 1) values[y][x] = clamp(Number(params.values?.[y]?.[x] ?? values[y][x]), -20, 20);
  return { values, normalize: Boolean(params.normalize), scale: clamp(Number(params.scale ?? 1), -10, 10), bias: clamp(Number(params.bias ?? 0), -255, 255) };
}

function kernelParams(id) {
  return clone(KERNEL_PRESETS[id] || KERNEL_PRESETS.identity);
}


function rotateAffine(degrees) {
  const radians = degrees * Math.PI / 180;
  return { a: Math.cos(radians), b: Math.sin(radians), c: -Math.sin(radians), d: Math.cos(radians), e: 0, f: 0 };
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h *= 60;
  }
  return { h, s, l };
}

function hslToRgb(h, s, l) {
  h = wrapHue(h) / 360;
  if (s === 0) return { r: l * 255, g: l * 255, b: l * 255 };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return { r: hueToRgb(p, q, h + 1 / 3) * 255, g: hueToRgb(p, q, h) * 255, b: hueToRgb(p, q, h - 1 / 3) * 255 };
}

function hueToRgb(p, q, t) {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1 / 6) return p + (q - p) * 6 * t;
  if (t < 1 / 2) return q;
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
  return p;
}

function rgbToHsv(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0;
  if (d) h = (max === r ? (g - b) / d % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4) * 60;
  return { h: wrapHue(h), s: max ? d / max : 0, v: max };
}

function hsvToRgb(h, s, v) {
  h = wrapHue(h);
  const c = v * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = v - c;
  let r = 0, g = 0, b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return { r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255 };
}

function hsiToRgb(h, s, i) {
  h = wrapHue(h);
  s = clamp01(s);
  i = clamp(i, 0, 255);
  const radians = Math.PI / 180;
  let r, g, b;
  if (h < 120) {
    const hr = h * radians;
    b = i * (1 - s);
    r = i * (1 + s * Math.cos(hr) / Math.max(0.0001, Math.cos((60 - h) * radians)));
    g = 3 * i - (r + b);
  } else if (h < 240) {
    const hh = h - 120;
    const hr = hh * radians;
    r = i * (1 - s);
    g = i * (1 + s * Math.cos(hr) / Math.max(0.0001, Math.cos((60 - hh) * radians)));
    b = 3 * i - (r + g);
  } else {
    const hh = h - 240;
    const hr = hh * radians;
    g = i * (1 - s);
    b = i * (1 + s * Math.cos(hr) / Math.max(0.0001, Math.cos((60 - hh) * radians)));
    r = 3 * i - (g + b);
  }
  return { r, g, b };
}

function rgbToYcbcr(r, g, b) {
  return { y: 0.299 * r + 0.587 * g + 0.114 * b, cb: 128 - 0.168736 * r - 0.331264 * g + 0.5 * b, cr: 128 + 0.5 * r - 0.418688 * g - 0.081312 * b };
}

function ycbcrToRgb(y, cb, cr) {
  return { r: y + 1.402 * (cr - 128), g: y - 0.344136 * (cb - 128) - 0.714136 * (cr - 128), b: y + 1.772 * (cb - 128) };
}

function seededRandom(seed) {
  let t = seed >>> 0;
  return () => {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ t >>> 15, 1 | t);
    r ^= r + Math.imul(r ^ r >>> 7, 61 | r);
    return ((r ^ r >>> 14) >>> 0) / 4294967296;
  };
}

