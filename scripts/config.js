"use strict";


const SIZE = 192;
const SHIFT_RADIUS = 6;
const STORAGE_RUNS = "imageDojoRuns";
const STORAGE_STREAK = "imageDojoStreak";
const STORAGE_STORY = "imageDojoStoryCompleted";
const STORAGE_DEV = "imageDojoDeveloperMode";
const MAIN_THEME_SRC = "assets/game-audio/Pixel Dojo.mp3";

const BASE_IMAGE_SOURCES = [
  { id: "butterfly", name: "Butterfly", file: "assets/images/butterfly.jpg", draw: drawFallbackButterfly },
  { id: "teapot", name: "Teapot", file: "assets/images/teapot.jpg", draw: drawFallbackTeapot },
  { id: "blueberries", name: "Blueberries", file: "assets/images/blueberries.jpg", draw: drawFallbackRings },
  { id: "football", name: "Football", file: "assets/images/football.jpg", draw: drawFallbackStripes },
  { id: "larch", name: "Larch", file: "assets/images/larch.jpg", draw: drawFallbackLandscape },
  { id: "teddy", name: "Teddy", file: "assets/images/teddy-bear.jpg", draw: drawFallbackBlocks },
  { id: "urbanBear", name: "Urban Bear", file: "assets/images/urban-bear.jpg", draw: drawFallbackCity },
  { id: "wildBear", name: "Wild Bear", file: "assets/images/wild-bear.jpg", draw: drawFallbackCity },
  { id: "balloon", name: "Balloon", file: "assets/images/balloon-sq1.jpg", draw: drawFallbackBalloon },
  { id: "postcard", name: "Postcard", file: "assets/images/postcard-background.jpg", draw: drawFallbackChart },
  { id: "header", name: "Mountain Header", file: "assets/images/header.jpg", draw: drawFallbackChart },
];

let IMAGE_SOURCES = [...BASE_IMAGE_SOURCES];

const AFFINE_PRESETS = {
  "shift-r": { label: "Shift R", params: { a: 1, b: 0, c: 0, d: 1, e: 18, f: 0 } },
  "shift-l": { label: "Shift L", params: { a: 1, b: 0, c: 0, d: 1, e: -18, f: 0 } },
  "shift-u": { label: "Shift U", params: { a: 1, b: 0, c: 0, d: 1, e: 0, f: -16 } },
  "shift-d": { label: "Shift D", params: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 16 } },
  "rotate-l": { label: "Rotate L", params: rotateAffine(-12) },
  "rotate-r": { label: "Rotate R", params: rotateAffine(12) },
  "flip-x": { label: "Flip X", params: { a: -1, b: 0, c: 0, d: 1, e: 0, f: 0 } },
  "zoom": { label: "Zoom", params: { a: 1.12, b: 0, c: 0, d: 1.12, e: 0, f: 0 } },
  "shear": { label: "Shear", params: { a: 1, b: 0, c: 0.22, d: 1, e: 0, f: 0 } },
};

const KERNEL_PRESETS = {
  identity: { label: "Identity", values: [[0, 0, 0], [0, 1, 0], [0, 0, 0]], normalize: false, scale: 1, bias: 0 },
  blur: { label: "Blur", values: [[1, 2, 1], [2, 4, 2], [1, 2, 1]], normalize: true, scale: 1, bias: 0 },
  box: { label: "Box Blur", values: [[1, 1, 1], [1, 1, 1], [1, 1, 1]], normalize: true, scale: 1, bias: 0 },
  sharpen: { label: "Sharpen", values: [[0, -1, 0], [-1, 5, -1], [0, -1, 0]], normalize: false, scale: 1, bias: 0 },
  edge: { label: "Edge", values: [[-1, -1, -1], [-1, 8, -1], [-1, -1, -1]], normalize: false, scale: 0.55, bias: 128 },
  emboss: { label: "Emboss", values: [[-2, -1, 0], [-1, 1, 1], [0, 1, 2]], normalize: false, scale: 0.72, bias: 128 },
  "sobel-x": { label: "Sobel X", values: [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]], normalize: false, scale: 0.35, bias: 128 },
  "sobel-y": { label: "Sobel Y", values: [[-1, -2, -1], [0, 0, 0], [1, 2, 1]], normalize: false, scale: 0.35, bias: 128 },
};

const COLOR_PRESETS = {
  gray: { label: "Gray From RGB", params: equationColorParams("(r + g + b) / 3", "(r + g + b) / 3", "(r + g + b) / 3") },
  warm: { label: "Warm Bias", params: equationColorParams("r * 1.14 + 16", "g * 1.03", "b * 0.82") },
  cool: { label: "Cool Bias", params: equationColorParams("r * 0.82", "g * 1.02", "b * 1.16 + 14") },
  poster: { label: "Hard Light", params: equationColorParams("abs(r - 128) * 2", "abs(g - 128) * 2", "abs(b - 128) * 2") },
};

let nodeSeq = 1;

const STORY_CHAPTERS = makeColorChapter();

const RECOMMENDATIONS = [
  { id: "rec-format-gray", label: "Grayscale", type: "color", params: formatColorParams("Grayscale", "gray", ["Gray"], ["Gray"], ["(r + g + b) / 3"]), after: 4 },
  { id: "rec-format-hsi", label: "HSI", type: "color", params: formatColorParams("HSI", "hsi", ["H", "S", "I"], [
    "H",
    "S",
    "I",
  ], [
    "atan2(sqrt(3) * (g - b), 2 * r - g - b) * 180 / pi",
    "(1 - min(r, g, b) / max(1, avg)) * 255",
    "avg",
  ]), after: 5 },
  { id: "rec-format-cmy", label: "CMY", type: "color", params: formatColorParams("CMY", "cmy", ["C", "M", "Y"], ["C", "M", "Y"], ["255 - r", "255 - g", "255 - b"]), after: 6 },
  { id: "rec-format-hsv", label: "HSV", type: "color", params: formatColorParams("HSV", "hsv", ["H", "S", "V"], [
    "H",
    "S",
    "V",
  ], [
    "atan2(sqrt(3) * (g - b), 2 * r - g - b) * 180 / pi",
    "(max(r, g, b) - min(r, g, b)) / max(1, max(r, g, b)) * 255",
    "max(r, g, b)",
  ]), after: 16 },
  { id: "rec-format-cmyk", label: "CMYK", type: "color", params: formatColorParams("CMYK", "cmyk", ["C", "M", "Y", "K"], [
    "C",
    "M",
    "Y",
    "K",
  ], [
    "255 - r - min(255 - r, 255 - g, 255 - b)",
    "255 - g - min(255 - r, 255 - g, 255 - b)",
    "255 - b - min(255 - r, 255 - g, 255 - b)",
    "min(255 - r, 255 - g, 255 - b)",
  ]), after: 17 },
];

const TUTORIAL_STEPS = [
  {
    target: ".arena-grid .canvas-block",
    label: "See the goal",
    title: "Compare input, target, and output",
    text: "Screens build color from red, green, and blue light. Each channel is a number from 0 off to 255 full brightness. This first target keeps red and turns green and blue off.",
    action: "reveal-target",
    actionLabel: "Show Images",
  },
  {
    target: "[data-add-node='color']",
    label: "Press here",
    title: "Add a Color block",
    text: "Scroll to the Tool Belt and press the real Color button there. The Color block edits each pixel by writing three equations: one for red, one for green, and one for blue.",
    action: "reveal-target",
    actionLabel: "Show Button",
  },
  {
    target: ".color-node [data-equation-index]",
    label: "Type here",
    title: "Set the three output channels",
    text: "Click the highlighted equation fields in the Color block. Use r to copy red, then type 0 for green and 0 for blue so those lights are switched off.",
    action: "reveal-target",
    actionLabel: "Show Fields",
  },
  {
    target: ".color-node [data-equation-index]",
    label: "Try numbers",
    title: "Move the values around",
    text: "Changing numbers changes brightness before the final value is clipped back into 0 to 255. Try making red brighter or dimmer, then return to red only before scoring.",
    action: "reveal-target",
    actionLabel: "Show Fields",
    nudges: true,
  },
  {
    target: "[data-output-select]",
    label: "Connect",
    title: "Send the block to Output",
    text: "Only the Output node is scored. Set its From menu to the color block so the run sheet compares your red-only image to the target.",
    action: "reveal-target",
    actionLabel: "Show Output Menu",
  },
  {
    target: "[data-action='score']",
    label: "Score",
    title: "Score the run",
    text: "When the output matches the target closely enough, the chapter unlocks the next level. The Next Level button will appear in the run sheet after a win.",
    action: "reveal-target",
    actionLabel: "Show Score Button",
  },
];

nodeSeq = 1;

const dom = {};
const imageCache = new Map();
let themeAudio = null;

const state = {
  mode: "story",
  chapterIndex: 0,
  completedChapters: clamp(Number(localStorage.getItem(STORAGE_STORY) || 0), 0, STORY_CHAPTERS.length),
  dialogueIndex: 0,
  hintIndex: 0,
  baseImageData: null,
  targetImageData: null,
  outputImageData: null,
  randomSolution: null,
  sandboxSource: "butterfly",
  sandboxTarget: null,
  graph: emptyGraph(),
  runs: readJson(STORAGE_RUNS, []),
  streak: Number(localStorage.getItem(STORAGE_STREAK) || 0),
  audioOn: false,
  developerMode: localStorage.getItem(STORAGE_DEV) === "true",
  tutorialStep: 0,
};

if (state.developerMode) {
  state.completedChapters = STORY_CHAPTERS.length;
}

document.addEventListener("DOMContentLoaded", init);

