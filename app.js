(() => {
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
  };

  if (state.developerMode) {
    state.completedChapters = STORY_CHAPTERS.length;
  }

  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    bindDom();
    await loadImagePoolManifest();
    buildSandboxSources();
    bindEvents();
    updateModeClasses();
    updateDeveloperButton();
    updateLeaderboard();
    await loadStoryChapter(0);
  }

  function bindDom() {
    const ids = [
      "chapterProgress", "chapterList", "unlockCount", "unlockList", "runCount", "leaderboardList",
      "beltLabel", "puzzleTitle", "puzzleTagline", "scoreValue", "streakValue", "bestValue",
      "audioButton", "devButton", "resetButton", "newRandomButton", "dialogueStep", "masterText", "prevLineButton",
      "hintButton", "nextLineButton", "sourceName", "targetName", "matchLabel", "inputCanvas", "targetCanvas",
      "outputCanvas", "recommendationHint", "recommendationList", "randomDifficulty", "sandboxSourceSelect",
      "wireLayer", "nodeBoard", "scoreGrade", "scoreDetail", "scoreBreakdown", "recipeText", "burstLayer",
      "sidebarToggle", "miniInputCanvas", "miniTargetCanvas", "miniOutputCanvas",
    ];
    ids.forEach((id) => {
      dom[id] = document.getElementById(id);
    });
    dom.inputCtx = dom.inputCanvas.getContext("2d", { willReadFrequently: true });
    dom.targetCtx = dom.targetCanvas.getContext("2d", { willReadFrequently: true });
    dom.outputCtx = dom.outputCanvas.getContext("2d", { willReadFrequently: true });
    dom.miniInputCtx = dom.miniInputCanvas.getContext("2d", { willReadFrequently: true });
    dom.miniTargetCtx = dom.miniTargetCanvas.getContext("2d", { willReadFrequently: true });
    dom.miniOutputCtx = dom.miniOutputCanvas.getContext("2d", { willReadFrequently: true });
  }

  function bindEvents() {
    document.querySelectorAll("[data-mode]").forEach((button) => {
      button.addEventListener("click", () => setMode(button.dataset.mode));
    });
    dom.chapterList.addEventListener("click", (event) => {
      const button = event.target.closest("[data-chapter]");
      if (!button || button.disabled) return;
      loadStoryChapter(Number(button.dataset.chapter));
      playSound("page");
    });
    document.querySelectorAll("[data-add-node]").forEach((button) => {
      button.addEventListener("click", () => addNode(button.dataset.addNode));
    });
    document.querySelectorAll("[data-action]").forEach((button) => {
      button.addEventListener("click", () => handleAction(button.dataset.action));
    });
    dom.recommendationList.addEventListener("click", (event) => {
      const button = event.target.closest("[data-rec]");
      if (!button) return;
      applyRecommendation(button.dataset.rec);
    });
    dom.nodeBoard.addEventListener("input", onNodeInput);
    dom.nodeBoard.addEventListener("change", onNodeInput);
    dom.nodeBoard.addEventListener("click", (event) => {
      const remove = event.target.closest("[data-remove-node]");
      if (remove) {
        removeNode(remove.dataset.removeNode);
      }
    });
    dom.resetButton.addEventListener("click", resetGraph);
    dom.newRandomButton.addEventListener("click", () => {
      loadRandomPuzzle();
      playSound("random");
    });
    dom.randomDifficulty.addEventListener("change", () => {
      loadRandomPuzzle();
      playSound("random");
    });
    dom.sandboxSourceSelect.addEventListener("change", async () => {
      state.sandboxSource = dom.sandboxSourceSelect.value;
      state.sandboxTarget = null;
      await loadSandbox();
    });
    dom.prevLineButton.addEventListener("click", () => shiftDialogue(-1));
    dom.nextLineButton.addEventListener("click", () => shiftDialogue(1));
    dom.hintButton.addEventListener("click", revealHint);
    dom.audioButton.addEventListener("click", toggleAudio);
    dom.devButton.addEventListener("click", unlockDeveloperMode);
    dom.sidebarToggle.addEventListener("click", toggleSidebar);
    window.addEventListener("resize", () => window.setTimeout(drawWires, 60));
    initNodeDrag();
  }

  function toggleSidebar() {
    document.querySelector(".app-shell").classList.toggle("sidebar-collapsed");
    window.setTimeout(drawWires, 350);
  }

  function initNodeDrag() {
    let dragging = null;
    let startX = 0, startY = 0, origX = 0, origY = 0;

    dom.nodeBoard.addEventListener("pointerdown", (e) => {
      const card = e.target.closest(".node-card");
      if (!card || e.target.closest("input, select, button, label, textarea")) return;
      dragging = card;
      dragging.classList.add("is-dragging");
      dragging.setPointerCapture(e.pointerId);
      const boardRect = dom.nodeBoard.getBoundingClientRect();
      startX = e.clientX;
      startY = e.clientY;
      origX = card.offsetLeft;
      origY = card.offsetTop;
      e.preventDefault();
    });

    dom.nodeBoard.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      dragging.style.left = Math.max(0, origX + dx) + "px";
      dragging.style.top = Math.max(0, origY + dy) + "px";
      drawWires();
    });

    const stopDrag = () => {
      if (!dragging) return;
      dragging.classList.remove("is-dragging");
      dragging = null;
      expandBoard();
      drawWires();
    };
    dom.nodeBoard.addEventListener("pointerup", stopDrag);
    dom.nodeBoard.addEventListener("pointercancel", stopDrag);
  }

  function expandBoard() {
    let maxRight = 980, maxBottom = 420;
    dom.nodeBoard.querySelectorAll(".node-card").forEach((card) => {
      maxRight = Math.max(maxRight, card.offsetLeft + card.offsetWidth + 30);
      maxBottom = Math.max(maxBottom, card.offsetTop + card.offsetHeight + 30);
    });
    dom.nodeBoard.style.minWidth = maxRight + "px";
    dom.nodeBoard.style.minHeight = maxBottom + "px";
  }

  async function setMode(mode) {
    if (!["story", "random", "sandbox"].includes(mode)) return;
    state.mode = mode;
    updateModeClasses();
    if (mode === "story") await loadStoryChapter(Math.min(state.chapterIndex, state.completedChapters));
    if (mode === "random") await loadRandomPuzzle();
    if (mode === "sandbox") await loadSandbox();
    playSound(mode === "story" ? "page" : mode === "random" ? "random" : "mode");
  }

  function updateModeClasses() {
    document.querySelectorAll("[data-mode]").forEach((button) => {
      button.setAttribute("aria-selected", String(button.dataset.mode === state.mode));
    });
    document.querySelectorAll(".story-only").forEach((el) => el.classList.toggle("is-hidden", state.mode !== "story"));
    document.querySelectorAll(".random-only").forEach((el) => el.classList.toggle("is-hidden", state.mode !== "random"));
    document.querySelectorAll(".sandbox-only").forEach((el) => el.classList.toggle("is-hidden", state.mode !== "sandbox"));
  }

  async function loadStoryChapter(index) {
    state.mode = "story";
    state.chapterIndex = clamp(index, 0, Math.min(STORY_CHAPTERS.length - 1, state.completedChapters));
    state.dialogueIndex = 0;
    state.hintIndex = 0;
    const chapter = STORY_CHAPTERS[state.chapterIndex];
    const source = getSource(chapter.source);
    state.baseImageData = await loadSourceImage(source);
    state.targetImageData = evaluateGraph(chapter.solution, state.baseImageData).image;
    state.graph = emptyGraph();
    updateModeClasses();
    updateHeader(chapter.belt, chapter.title, chapterLinesTag(chapter), source.name, "Lesson Target");
    renderSidebar();
    renderDialogue();
    renderAll();
  }

  async function loadRandomPuzzle() {
    state.mode = "random";
    state.dialogueIndex = 0;
    state.hintIndex = 0;
    const rng = seededRandom(Date.now());
    const source = IMAGE_SOURCES[Math.floor(rng() * IMAGE_SOURCES.length)];
    state.baseImageData = await loadSourceImage(source);
    const difficulty = dom.randomDifficulty.value || "medium";
    state.randomSolution = randomGraph(rng, difficulty);
    state.targetImageData = evaluateGraph(state.randomSolution, state.baseImageData).image;
    state.graph = emptyGraph();
    updateHeader("Random Mode", randomTitle(difficulty), "A hidden transform pipeline has been generated.", source.name, "Random Target");
    setDialogue([
      "A random scroll has dropped from the rafters. Its transformation is hidden, but its pixels cannot lie.",
      "Build a graph that reaches the target. You may use any tool you have unlocked through the story.",
      "If the answer seems impossible, remember: even a matrix with bad posture can become respectable after one good connection.",
    ]);
    renderSidebar();
    renderAll();
  }

  async function loadSandbox() {
    state.mode = "sandbox";
    state.dialogueIndex = 0;
    state.hintIndex = 0;
    const source = getSource(state.sandboxSource);
    state.baseImageData = await loadSourceImage(source);
    if (!state.sandboxTarget) state.sandboxTarget = cloneImageData(state.baseImageData);
    state.targetImageData = cloneImageData(state.sandboxTarget);
    state.graph = emptyGraph();
    updateHeader("Sandbox", "Open Mat", "Capture targets and test pipelines freely.", source.name, "Captured");
    setDialogue([
      "Sandbox mode is the open courtyard. Build any graph, capture its output as a target, then try to recreate it.",
      "No chapter unlocks are awarded here. The master is relaxing, which means he is judging you silently but with excellent posture.",
    ]);
    renderSidebar();
    renderAll();
  }

  function updateHeader(belt, title, tagline, sourceName, targetName) {
    dom.beltLabel.textContent = belt;
    dom.puzzleTitle.textContent = title;
    dom.puzzleTagline.textContent = tagline;
    dom.sourceName.textContent = sourceName;
    dom.targetName.textContent = targetName;
    dom.scoreValue.textContent = "0";
    dom.matchLabel.textContent = "Disconnected";
    dom.scoreGrade.textContent = "Ready";
    dom.scoreDetail.textContent = "Connect Output";
    dom.scoreBreakdown.textContent = "The final Output node must be connected to score.";
  }

  function setDialogue(lines) {
    state.currentLines = lines;
    renderDialogue();
  }

  function renderDialogue() {
    const chapter = state.mode === "story" ? STORY_CHAPTERS[state.chapterIndex] : null;
    const baseLines = chapter ? chapter.lines : state.currentLines || [];
    const hints = chapter?.hints || [];
    const lines = [...baseLines, ...hints.slice(0, state.hintIndex).map((hint, index) => `Hint ${index + 1}: ${hint}`)];
    const max = Math.max(1, lines.length);
    state.dialogueIndex = clamp(state.dialogueIndex, 0, max - 1);
    dom.masterText.textContent = lines[state.dialogueIndex] || "";
    dom.dialogueStep.textContent = `${state.dialogueIndex + 1}/${max}`;
    dom.hintButton.disabled = !chapter || state.hintIndex >= hints.length;
    dom.hintButton.textContent = chapter && state.hintIndex < hints.length ? `Hint ${state.hintIndex + 1}` : "Hint";
  }

  function shiftDialogue(delta) {
    state.dialogueIndex += delta;
    renderDialogue();
    playSound("page");
  }

  function revealHint() {
    const chapter = state.mode === "story" ? STORY_CHAPTERS[state.chapterIndex] : null;
    const hints = chapter?.hints || [];
    if (!hints.length || state.hintIndex >= hints.length) return;
    state.hintIndex += 1;
    state.dialogueIndex = chapter.lines.length + state.hintIndex - 1;
    renderDialogue();
    playSound("page");
  }

  function renderSidebar() {
    dom.chapterProgress.textContent = `${Math.min(state.completedChapters, STORY_CHAPTERS.length)}/${STORY_CHAPTERS.length}`;
    dom.chapterList.innerHTML = "";
    STORY_CHAPTERS.forEach((chapter, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "chapter-button";
      button.dataset.chapter = String(index);
      button.disabled = index > state.completedChapters;
      button.classList.toggle("is-active", state.mode === "story" && index === state.chapterIndex);
      button.innerHTML = `<strong>${escapeHtml(chapter.title)}</strong><span>${index < state.completedChapters ? "Complete" : index === state.completedChapters ? "Unlocked" : "Locked"}</span>`;
      dom.chapterList.append(button);
    });

    const unlocked = unlockedRecommendations();
    dom.unlockCount.textContent = String(unlocked.length);
    dom.unlockList.innerHTML = unlocked.length ? "" : "<p>No recommendations yet.</p>";
    unlocked.forEach((rec) => {
      const item = document.createElement("span");
      item.textContent = rec.label;
      dom.unlockList.append(item);
    });

    renderRecommendations();
    updateToolLocks();
  }

  function renderRecommendations() {
    const recs = unlockedRecommendations();
    dom.recommendationHint.textContent = recs.length ? "Click to add a ready block." : "No shortcuts in this chapter.";
    dom.recommendationList.innerHTML = "";
    if (!recs.length) {
      const empty = document.createElement("p");
      empty.textContent = "Discoveries stay in your head, not on a preset shelf.";
      dom.recommendationList.append(empty);
      return;
    }
    recs.forEach((rec) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "recommendation-button";
      button.dataset.rec = rec.id;
      button.textContent = rec.label;
      dom.recommendationList.append(button);
    });
  }

  function updateToolLocks() {
    const unlocked = unlockedToolSet();
    document.querySelectorAll("[data-add-node]").forEach((button) => {
      const type = button.dataset.addNode;
      button.disabled = !unlocked.has(type);
      button.title = unlocked.has(type) ? `Add ${type}` : "Locked by story progress";
    });
  }

  function unlockedToolSet() {
    if (state.developerMode) {
      return new Set(["color", "affine", "kernel", "split", "recombine"]);
    }
    if (state.mode === "sandbox" && state.completedChapters >= STORY_CHAPTERS.length) {
      return new Set(["color", "affine", "kernel", "split", "recombine"]);
    }
    const unlocked = new Set();
    const through = Math.min(state.completedChapters, STORY_CHAPTERS.length - 1);
    for (let i = 0; i <= through; i += 1) {
      STORY_CHAPTERS[i].tools.forEach((tool) => unlocked.add(tool));
    }
    if (state.mode === "random" && unlocked.size === 0) unlocked.add("color");
    return unlocked;
  }

  function unlockedRecommendations() {
    return RECOMMENDATIONS.filter((rec) => state.completedChapters > rec.after);
  }

  function unlockDeveloperMode() {
    if (state.developerMode) {
      state.completedChapters = STORY_CHAPTERS.length;
      localStorage.setItem(STORAGE_STORY, String(state.completedChapters));
      renderSidebar();
      updateDeveloperButton();
      dom.scoreGrade.textContent = "Dev";
      dom.scoreDetail.textContent = "All content unlocked";
      dom.scoreBreakdown.textContent = "Developer mode is already active.";
      return;
    }
    const password = window.prompt("Developer password");
    if (password !== "dojo") {
      dom.scoreGrade.textContent = "Locked";
      dom.scoreDetail.textContent = "Developer mode denied";
      dom.scoreBreakdown.textContent = "The mountain keeps its scrolls closed.";
      playSound("miss");
      return;
    }
    state.developerMode = true;
    state.completedChapters = STORY_CHAPTERS.length;
    localStorage.setItem(STORAGE_DEV, "true");
    localStorage.setItem(STORAGE_STORY, String(state.completedChapters));
    renderSidebar();
    updateDeveloperButton();
    dom.scoreGrade.textContent = "Dev";
    dom.scoreDetail.textContent = "All content unlocked";
    dom.scoreBreakdown.textContent = "Developer mode unlocked every chapter and editor tool.";
    playSound("unlock");
  }

  function updateDeveloperButton() {
    dom.devButton.textContent = state.developerMode ? "Dev On" : "Dev";
    dom.devButton.classList.toggle("primary", state.developerMode);
    dom.devButton.title = state.developerMode ? "Developer mode active" : "Developer unlock";
  }

  function addNode(type, params = null) {
    if (!unlockedToolSet().has(type)) return;
    const source = state.graph.outputSource || lastNodeId() || "input";
    const node = createNode(type, params, source);
    state.graph.nodes.push(node);
    state.graph.outputSource = node.id;
    renderAll();
    playSound("add-node");
  }

  function createNode(type, params, source) {
    const id = `n${nodeSeq++}`;
    if (type === "color") return { id, type, input: source || "input", params: normalizeColor(params) };
    if (type === "affine") return { id, type, input: source || "input", params: normalizeAffine(params) };
    if (type === "kernel") return { id, type, input: source || "input", params: normalizeKernel(params) };
    if (type === "split") return { id, type, input: source || "input", params: {} };
    return { id, type: "recombine", inputA: source || "input", inputB: "input", params: { mode: "blend", amount: 0.5 } };
  }

  function removeNode(id) {
    state.graph.nodes = state.graph.nodes.filter((node) => node.id !== id);
    state.graph.nodes.forEach((node) => {
      if (node.input === id) node.input = "input";
      if (node.inputA === id) node.inputA = "input";
      if (node.inputB === id) node.inputB = "input";
    });
    if (state.graph.outputSource === id) state.graph.outputSource = "";
    renderAll();
    playSound("remove-node");
  }

  function onNodeInput(event) {
    const target = event.target;
    if (!target.closest("[data-node-id]") && target.dataset.outputSelect !== "true") return;
    readGraphFromDom();
    renderAll(false);
    if (event.type === "change") playSound("wire");
  }

  function readGraphFromDom() {
    state.graph.nodes.forEach((node) => {
      const card = dom.nodeBoard.querySelector(`[data-node-id="${node.id}"]`);
      if (!card) return;
      if (node.type === "recombine") {
        node.inputA = card.querySelector("[data-param='inputA']").value;
        node.inputB = card.querySelector("[data-param='inputB']").value;
        node.params.mode = card.querySelector("[data-param='mode']").value;
        node.params.amount = Number(card.querySelector("[data-param='amount']").value) / 100;
      } else {
        node.input = card.querySelector("[data-param='input']").value;
      }
      if (node.type === "color") {
        const previous = normalizeColor(node.params);
        const equationInputs = [...card.querySelectorAll("[data-equation-index]")]
          .sort((a, b) => Number(a.dataset.equationIndex) - Number(b.dataset.equationIndex));
        if (equationInputs.length) {
          const typedExpressions = equationInputs.map((input) => input.value);
          node.params = normalizeColor({
            ...previous,
            mode: "equation",
            expressions: typedExpressions,
            equations: typedExpressions,
          });
        } else {
          node.params = normalizeColor({
            space: card.querySelector("[data-param='space']").value,
            channels: [0, 1, 2].map((i) => Number(card.querySelector(`[data-param='ch${i}']`).value)),
            exposure: Number(card.querySelector("[data-param='exposure']").value),
            contrast: Number(card.querySelector("[data-param='contrast']").value) / 100,
            posterize: Number(card.querySelector("[data-param='posterize']").value),
          });
        }
      }
      if (node.type === "affine") {
        node.params = normalizeAffine({
          a: Number(card.querySelector("[data-param='a']").value),
          b: Number(card.querySelector("[data-param='b']").value),
          c: Number(card.querySelector("[data-param='c']").value),
          d: Number(card.querySelector("[data-param='d']").value),
          e: Number(card.querySelector("[data-param='e']").value),
          f: Number(card.querySelector("[data-param='f']").value),
        });
      }
      if (node.type === "kernel") {
        const values = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
        card.querySelectorAll("[data-kx]").forEach((input) => {
          values[Number(input.dataset.ky)][Number(input.dataset.kx)] = Number(input.value);
        });
        node.params = normalizeKernel({
          values,
          normalize: card.querySelector("[data-param='normalize']").checked,
          scale: Number(card.querySelector("[data-param='scale']").value),
          bias: Number(card.querySelector("[data-param='bias']").value),
        });
      }
    });
    const output = dom.nodeBoard.querySelector("[data-output-select]");
    state.graph.outputSource = output ? output.value : "";
  }

  function renderAll(rebuild = true) {
    if (state.baseImageData) {
      drawImage(dom.inputCtx, state.baseImageData);
      drawMiniImage(dom.miniInputCtx, state.baseImageData);
    }
    if (state.targetImageData) {
      drawImage(dom.targetCtx, state.targetImageData);
      drawMiniImage(dom.miniTargetCtx, state.targetImageData);
    }
    if (rebuild) renderNodeBoard();
    renderOutput();
    updateGraphJson();
    window.setTimeout(drawWires, 30);
  }

  function renderOutput() {
    const result = evaluateGraph(state.graph, state.baseImageData);
    state.outputImageData = result.image;
    if (result.image) {
      drawImage(dom.outputCtx, result.image);
      drawMiniImage(dom.miniOutputCtx, result.image);
      dom.matchLabel.textContent = "Ready";
      if (dom.scoreDetail.textContent === "Output disconnected" || dom.scoreDetail.textContent === "Connect Output") {
        dom.scoreGrade.textContent = "Ready";
        dom.scoreDetail.textContent = "Graph connected";
        dom.scoreBreakdown.textContent = "Score the run when your output looks close.";
      }
    } else {
      clearCanvas(dom.outputCtx);
      clearMiniCanvas(dom.miniOutputCtx);
      dom.matchLabel.textContent = "Disconnected";
    }
    if (result.error) {
      dom.scoreGrade.textContent = "Graph";
      dom.scoreDetail.textContent = result.error;
      dom.scoreBreakdown.textContent = "Connect every required input, then connect Output.";
    }
  }

  function renderNodeBoard() {
    // Save existing positions before clearing (skip output — always recalculated)
    const savedPositions = new Map();
    dom.nodeBoard.querySelectorAll(".node-card").forEach((card) => {
      if (card.dataset.nodeId && card.dataset.nodeId !== "output") {
        savedPositions.set(card.dataset.nodeId, { left: card.style.left, top: card.style.top });
      }
    });
    dom.nodeBoard.innerHTML = "";

    const cardWidth = (card) => {
      if (card.classList.contains("kernel-node")) return 250;
      if (card.classList.contains("color-node")) return 300;
      return 220;
    };
    const gap = 18;

    // Build non-output cards
    const contentCards = [inputCard()];
    state.graph.nodes.forEach((node, index) => contentCards.push(nodeCard(node, index)));
    const outCard = outputCard();

    // Track rightmost edge of all placed cards
    let maxRight = gap;

    contentCards.forEach((card) => {
      const id = card.dataset.nodeId;
      const saved = savedPositions.get(id);
      if (saved && saved.left) {
        card.style.left = saved.left;
        card.style.top = saved.top;
        const leftVal = parseInt(saved.left, 10) || 0;
        maxRight = Math.max(maxRight, leftVal + cardWidth(card) + gap);
      } else {
        // Place new card at the rightmost edge
        card.style.left = maxRight + "px";
        card.style.top = gap + "px";
        maxRight += cardWidth(card) + gap;
      }
      dom.nodeBoard.append(card);
    });

    // Output always goes to the right of everything
    outCard.style.left = maxRight + "px";
    outCard.style.top = gap + "px";
    dom.nodeBoard.append(outCard);

    expandBoard();
  }

  function inputCard() {
    const card = document.createElement("article");
    card.className = "node-card fixed-node";
    card.dataset.nodeId = "input";
    card.innerHTML = `<div class="node-title"><strong>Input</strong><span>source</span></div><p>The starting image stream.</p>`;
    return card;
  }

  function outputCard() {
    const card = document.createElement("article");
    card.className = "node-card output-node";
    card.dataset.nodeId = "output";
    card.innerHTML = `
      <div class="node-title"><strong>Output</strong><span>required</span></div>
      <label class="field mini"><span>From</span>${sourceSelect("output", state.graph.outputSource || "", "data-output-select='true'")}</label>
      <p>Connect this node to score.</p>
    `;
    return card;
  }

  function nodeCard(node, index) {
    const card = document.createElement("article");
    card.className = `node-card ${node.type}-node`;
    card.dataset.nodeId = node.id;
    card.innerHTML = nodeMarkup(node, index);
    return card;
  }

  function nodeMarkup(node, index) {
    const title = `${node.type[0].toUpperCase()}${node.type.slice(1)} ${index + 1}`;
    const head = `<div class="node-title"><strong>${title}</strong><button type="button" data-remove-node="${node.id}" title="Remove node">x</button></div>`;
    if (node.type === "color") {
      const p = normalizeColor(node.params);
      const colorTitle = p.name ? `${escapeHtml(p.name)} ${index + 1}` : `Color ${index + 1}`;
      const colorHead = `<div class="node-title"><strong>${colorTitle}</strong><button type="button" data-remove-node="${node.id}" title="Remove node">x</button></div>`;
      return `${colorHead}
        <label class="field mini"><span>Input</span>${sourceSelect(node.id, node.input || "input", "data-param='input'")}</label>
        <div class="node-grid equations">
          ${p.expressions.map((expression, i) => `<label class="field mini equation-field"><span>Out ${escapeHtml(p.labels[i] || `Ch ${i + 1}`)}</span><input data-param="eq${i}" data-equation-index="${i}" type="text" spellcheck="false" value="${escapeHtml(expression)}"></label>`).join("")}
        </div>`;
    }
    if (node.type === "affine") {
      const p = normalizeAffine(node.params);
      return `${head}
        <label class="field mini"><span>Input</span>${sourceSelect(node.id, node.input || "input", "data-param='input'")}</label>
        <div class="node-grid three">
          ${["a", "c", "e", "b", "d", "f"].map((key) => `<label class="field mini"><span>${key}</span><input data-param="${key}" type="number" step="${key === "e" || key === "f" ? "1" : "0.01"}" value="${formatNumber(p[key], 3)}"></label>`).join("")}
        </div>`;
    }
    if (node.type === "kernel") {
      const p = normalizeKernel(node.params);
      return `${head}
        <label class="field mini"><span>Input</span>${sourceSelect(node.id, node.input || "input", "data-param='input'")}</label>
        <div class="kernel-mini">${p.values.map((row, y) => row.map((value, x) => `<input data-kx="${x}" data-ky="${y}" type="number" step="0.01" value="${formatNumber(value, 2)}">`).join("")).join("")}</div>
        <div class="node-grid three">
          <label class="check-field mini-check"><input data-param="normalize" type="checkbox" ${p.normalize ? "checked" : ""}><span>Norm</span></label>
          <label class="field mini"><span>Scale</span><input data-param="scale" type="number" step="0.01" value="${formatNumber(p.scale, 2)}"></label>
          <label class="field mini"><span>Bias</span><input data-param="bias" type="number" step="1" value="${formatNumber(p.bias, 1)}"></label>
        </div>`;
    }
    if (node.type === "split") {
      return `${head}
        <label class="field mini"><span>Input</span>${sourceSelect(node.id, node.input || "input", "data-param='input'")}</label>
        <p>Fork this stream by using this node as the input to several downstream blocks.</p>`;
    }
    const amount = Math.round((node.params?.amount ?? 0.5) * 100);
    return `${head}
      <div class="node-grid two">
        <label class="field mini"><span>A</span>${sourceSelect(node.id, node.inputA || "input", "data-param='inputA'")}</label>
        <label class="field mini"><span>B</span>${sourceSelect(node.id, node.inputB || "input", "data-param='inputB'")}</label>
        <label class="field mini"><span>Mode</span><select data-param="mode">${options(["blend", "screen", "multiply", "difference"], node.params?.mode || "blend")}</select></label>
        <label class="field mini"><span>Amount</span><input data-param="amount" type="range" min="0" max="100" value="${amount}"></label>
      </div>`;
  }

  function sourceSelect(currentId, value, attr) {
    const sources = currentId === "output" ? [{ id: "", label: "Not connected" }, { id: "input", label: "Input" }] : [{ id: "input", label: "Input" }];
    for (const node of state.graph.nodes) {
      if (node.id === currentId) break;
      const colorName = node.type === "color" ? normalizeColor(node.params).name : "";
      const typeLabel = colorName || `${node.type[0].toUpperCase()}${node.type.slice(1)}`;
      sources.push({ id: node.id, label: `${typeLabel} ${node.id.slice(1)}` });
    }
    return `<select ${attr}>${sources.map((source) => `<option value="${source.id}" ${source.id === value ? "selected" : ""}>${escapeHtml(source.label)}</option>`).join("")}</select>`;
  }

  function drawWires() {
    const board = dom.nodeBoard;
    const svg = dom.wireLayer;
    if (!board || !svg) return;
    const w = board.scrollWidth;
    const h = board.scrollHeight;
    svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
    svg.style.width = w + "px";
    svg.style.height = h + "px";
    svg.innerHTML = "";
    const draw = (fromId, toId, color = "#3476d4") => {
      if (!fromId || !toId) return;
      const from = board.querySelector(`[data-node-id="${fromId}"]`);
      const to = board.querySelector(`[data-node-id="${toId}"]`);
      if (!from || !to) return;
      const x1 = from.offsetLeft + from.offsetWidth;
      const y1 = from.offsetTop + from.offsetHeight / 2;
      const x2 = to.offsetLeft;
      const y2 = to.offsetTop + to.offsetHeight / 2;
      const mx = Math.max(28, (x2 - x1) / 2);
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", `M${x1},${y1} C${x1 + mx},${y1} ${x2 - mx},${y2} ${x2},${y2}`);
      path.setAttribute("stroke", color);
      path.setAttribute("stroke-width", "4");
      path.setAttribute("fill", "none");
      path.setAttribute("stroke-linecap", "round");
      svg.append(path);
    };
    state.graph.nodes.forEach((node) => {
      if (node.type === "recombine") {
        draw(node.inputA, node.id, "#ff6b57");
        draw(node.inputB, node.id, "#31b67a");
      } else {
        draw(node.input, node.id);
      }
    });
    draw(state.graph.outputSource, "output", "#1f2528");
  }

  function evaluateGraph(graph, inputImage) {
    if (!inputImage) return { image: null, error: "No input image" };
    const outputs = new Map([["input", inputImage]]);
    for (const node of graph.nodes) {
      if (node.type === "recombine") {
        const a = outputs.get(node.inputA);
        const b = outputs.get(node.inputB);
        if (!a || !b) return { image: null, error: `Missing input for ${node.id}` };
        outputs.set(node.id, applyRecombine(a, b, node.params));
      } else {
        const source = outputs.get(node.input);
        if (!source) return { image: null, error: `Missing input for ${node.id}` };
        if (node.type === "color") outputs.set(node.id, applyColor(source, node.params));
        else if (node.type === "affine") outputs.set(node.id, applyAffine(source, node.params));
        else if (node.type === "kernel") outputs.set(node.id, applyKernel(source, node.params));
        else if (node.type === "split") outputs.set(node.id, cloneImageData(source));
      }
    }
    if (!graph.outputSource) return { image: null, error: "Output disconnected" };
    const image = outputs.get(graph.outputSource);
    if (!image) return { image: null, error: "Output source missing" };
    return { image, error: "" };
  }

  function handleAction(action) {
    if (action === "score") submitScore();
    if (action === "capture-target") captureTarget();
    if (action === "auto-wire") autoWire();
    if (action === "clear-nodes") clearNodes();
    if (action === "export-graph") exportGraph(true);
    if (action === "import-graph") importGraph();
  }

  function submitScore() {
    readGraphFromDom();
    const result = evaluateGraph(state.graph, state.baseImageData);
    if (!result.image || !state.targetImageData) {
      dom.scoreGrade.textContent = "No Output";
      dom.scoreDetail.textContent = "Connect Output";
      dom.scoreBreakdown.textContent = "The Output node must point at Input or a tool block.";
      playSound("miss");
      return;
    }
    state.outputImageData = result.image;
    const scored = scoreImages(result.image, state.targetImageData);
    const finalScore = Math.round(scored.score);
    dom.scoreValue.textContent = String(finalScore);
    dom.matchLabel.textContent = `${finalScore}/100`;
    dom.scoreGrade.textContent = gradeForScore(finalScore);
    dom.scoreDetail.textContent = `${finalScore}/100`;
    dom.scoreBreakdown.textContent = `Pixel ${Math.round(scored.pixelScore)}, edge ${Math.round(scored.edgeScore)}, color ${Math.round(scored.histScore)}, shift ${scored.dx},${scored.dy}.`;

    const passed = finalScore >= 80;
    if (passed) {
      state.streak += 1;
      burst(finalScore);
    } else {
      state.streak = 0;
      playSound("miss");
    }
    localStorage.setItem(STORAGE_STREAK, String(state.streak));

    if (state.mode === "story" && passed && state.chapterIndex === state.completedChapters) {
      state.completedChapters = clamp(state.completedChapters + 1, 0, STORY_CHAPTERS.length);
      localStorage.setItem(STORAGE_STORY, String(state.completedChapters));
      dom.scoreBreakdown.textContent += " Chapter complete. New tools may have opened.";
      renderSidebar();
      playSound("unlock");
    } else if (passed) {
      playSound("score");
    }
    saveRun(finalScore, scored);
    updateLeaderboard();
  }

  function captureTarget() {
    const result = evaluateGraph(state.graph, state.baseImageData);
    if (!result.image) return;
    state.sandboxTarget = cloneImageData(result.image);
    state.targetImageData = cloneImageData(result.image);
    drawImage(dom.targetCtx, state.targetImageData);
    dom.scoreGrade.textContent = "Captured";
    dom.scoreDetail.textContent = "Target updated";
    dom.scoreBreakdown.textContent = "The current graph output is now the sandbox target.";
    playSound("capture");
  }

  function autoWire() {
    let source = "input";
    state.graph.nodes.forEach((node) => {
      if (node.type === "recombine") {
        node.inputA = source;
        node.inputB = "input";
      } else {
        node.input = source;
      }
      source = node.id;
    });
    state.graph.outputSource = source;
    renderAll();
    playSound("wire");
  }

  function clearNodes() {
    state.graph = emptyGraph();
    renderAll();
    playSound("reset");
  }

  function resetGraph() {
    state.graph = emptyGraph();
    renderAll();
    playSound("reset");
  }

  function exportGraph(selectText = false) {
    dom.recipeText.value = JSON.stringify(state.graph, null, 2);
    if (selectText) {
      dom.recipeText.focus();
      dom.recipeText.select();
      playSound("export");
    }
  }

  function importGraph() {
    try {
      const parsed = JSON.parse(dom.recipeText.value);
      state.graph = normalizeGraph(parsed);
      nodeSeq = Math.max(nodeSeq, ...state.graph.nodes.map((node) => Number(node.id.slice(1)) + 1), 1);
      renderAll();
      playSound("import");
    } catch (error) {
      dom.scoreGrade.textContent = "JSON";
      dom.scoreDetail.textContent = "Import failed";
      dom.scoreBreakdown.textContent = error.message;
      playSound("miss");
    }
  }

  function updateGraphJson() {
    dom.recipeText.value = JSON.stringify(state.graph, null, 2);
  }

  function applyRecommendation(id) {
    const rec = RECOMMENDATIONS.find((item) => item.id === id);
    if (!rec) return;
    if (rec.type === "pipeline") {
      const split = createNode("split", null, state.graph.outputSource || lastNodeId() || "input");
      const color = createNode("color", COLOR_PRESETS.gray.params, split.id);
      const edge = createNode("kernel", kernelParams("sobel-x"), split.id);
      const recombine = createNode("recombine", null, color.id);
      recombine.inputA = color.id;
      recombine.inputB = edge.id;
      recombine.params = { mode: "blend", amount: 0.5 };
      state.graph.nodes.push(split, color, edge, recombine);
      state.graph.outputSource = recombine.id;
    } else {
      addNode(rec.type, rec.params);
      return;
    }
    renderAll();
    playSound("add-node");
  }

  function saveRun(score, result) {
    const record = {
      at: new Date().toISOString(),
      mode: state.mode,
      title: dom.puzzleTitle.textContent,
      score,
      streak: state.streak,
      shift: [result.dx, result.dy],
    };
    state.runs.unshift(record);
    state.runs = state.runs.slice(0, 80);
    localStorage.setItem(STORAGE_RUNS, JSON.stringify(state.runs));
  }

  function updateLeaderboard() {
    const best = state.runs.reduce((max, run) => Math.max(max, Number(run.score) || 0), 0);
    dom.streakValue.textContent = String(state.streak);
    dom.bestValue.textContent = String(best);
    dom.runCount.textContent = String(state.runs.length);
    dom.leaderboardList.innerHTML = "";
    if (!state.runs.length) {
      const li = document.createElement("li");
      li.textContent = "No saved runs yet.";
      dom.leaderboardList.append(li);
      return;
    }
    [...state.runs].sort((a, b) => b.score - a.score).slice(0, 8).forEach((run) => {
      const li = document.createElement("li");
      li.innerHTML = `<strong>${Number(run.score) || 0}/100</strong>${escapeHtml(run.title)}<br>${escapeHtml(run.mode)} - Streak ${Number(run.streak) || 0}`;
      dom.leaderboardList.append(li);
    });
  }

  function randomGraph(rng, difficulty) {
    const tools = [...unlockedToolSet()];
    const steps = difficulty === "hard" ? 4 : difficulty === "medium" ? 3 : 2;
    const graph = emptyGraph();
    let source = "input";
    const choose = (list) => list[Math.floor(rng() * list.length)];
    for (let i = 0; i < steps; i += 1) {
      const available = tools.filter((tool) => ["color", "affine", "kernel"].includes(tool));
      const type = choose(available.length ? available : ["color"]);
      let params;
      if (type === "color") params = clone(choose(Object.values(COLOR_PRESETS)).params);
      if (type === "affine") params = clone(choose(Object.values(AFFINE_PRESETS)).params);
      if (type === "kernel") params = clone(choose(Object.values(KERNEL_PRESETS)));
      const node = createNode(type, params, source);
      graph.nodes.push(node);
      source = node.id;
    }
    if (difficulty === "hard" && tools.includes("split")) {
      graph.nodes = [];
      const split = createNode("split", null, "input");
      const a = createNode("color", clone(choose(Object.values(COLOR_PRESETS)).params), split.id);
      const b = createNode("kernel", clone(choose(Object.values(KERNEL_PRESETS))), split.id);
      const r = createNode("recombine", null, a.id);
      r.inputA = a.id;
      r.inputB = b.id;
      r.params = { mode: choose(["blend", "screen", "multiply"]), amount: 0.45 + rng() * 0.25 };
      graph.nodes.push(split, a, b, r);
      source = r.id;
    }
    graph.outputSource = source;
    return graph;
  }

  function graphFromSteps(steps) {
    const graph = emptyGraph();
    let source = "input";
    steps.forEach((step) => {
      const node = createNode(step.type, clone(step.params), source);
      graph.nodes.push(node);
      source = node.id;
    });
    graph.outputSource = source;
    return graph;
  }

  function splitSolution() {
    const graph = emptyGraph();
    const split = createNode("split", null, "input");
    const color = createNode("color", COLOR_PRESETS.gray.params, split.id);
    const edge = createNode("kernel", kernelParams("sobel-x"), split.id);
    const recombine = createNode("recombine", null, color.id);
    recombine.inputA = color.id;
    recombine.inputB = edge.id;
    recombine.params = { mode: "blend", amount: 0.5 };
    graph.nodes.push(split, color, edge, recombine);
    graph.outputSource = recombine.id;
    return graph;
  }

  function makeColorChapter() {
    const lessons = [
      {
        title: "The Red Gate",
        source: "openverse_026",
        equations: ["r", "0", "0"],
        goal: "Let only the red part of the image pass through.",
        explore: "The three output fields become the new red, green, and blue channels. Each field can use r, g, and b from the input pixel.",
      },
      {
        title: "The Green Lantern With No Lantern",
        source: "openverse_001",
        equations: ["0", "g", "0"],
        goal: "Reveal only the green channel.",
        explore: "Red, green, and blue are separate measurements before they become one visible color. Today the middle cup is the interesting one.",
      },
      {
        title: "Blue Soup, Cold Spoon",
        source: "openverse_022",
        equations: ["0", "0", "b"],
        goal: "Reveal only the blue channel.",
        explore: "The blue channel hides in bright skies, shadows, and other suspiciously calm places. The spoon refuses to elaborate.",
      },
      {
        title: "The Mirror Trades Hats",
        source: "openverse_023",
        equations: ["b", "g", "r"],
        goal: "Swap red and blue while leaving green alone.",
        explore: "An output channel does not have to copy the matching input channel. The cups can trade hats if the equation says so.",
      },
      {
        title: "The Three Bowls Agree",
        source: "openverse_028",
        equations: ["(r + g + b) / 3", "(r + g + b) / 3", "(r + g + b) / 3"],
        goal: "Build a simple grayscale by averaging RGB.",
        explore: "When all three output channels are equal, hue disappears. A committee of three colors is still a committee.",
      },
      {
        title: "The Eye's Uneven Scales",
        source: "openverse_031",
        equations: ["r * 0.299 + g * 0.587 + b * 0.114", "r * 0.299 + g * 0.587 + b * 0.114", "r * 0.299 + g * 0.587 + b * 0.114"],
        goal: "Build perceptual grayscale using brightness, not a plain average.",
        explore: "The eye does not weigh red, green, and blue equally. Green usually carries the largest share of perceived brightness.",
      },
      {
        title: "The Negative Teacup",
        source: "openverse_019",
        equations: ["255 - r", "255 - g", "255 - b"],
        goal: "Invert every color channel.",
        explore: "Channel values live from 0 to 255. To find a color's opposite, measure from the far wall back toward the value.",
      },
      {
        title: "Morning Adds Forty",
        source: "openverse_005",
        equations: ["r + 40", "g + 40", "b + 40"],
        goal: "Brighten the image by adding to every channel.",
        explore: "Adding the same number to all channels lifts the whole image. Values above 255 are clipped by the block.",
      },
      {
        title: "The Dim Attic of Pixels",
        source: "openverse_030",
        equations: ["r * 0.55", "g * 0.55", "b * 0.55"],
        goal: "Darken the image by scaling every channel down.",
        explore: "Multiplication changes distance from black. Half a candle is still a candle, unless it is accounting.",
      },
      {
        title: "Red Drum, Quiet Room",
        source: "openverse_035",
        equations: ["r * 1.35", "g * 0.8", "b * 0.8"],
        goal: "Make red stronger while the other channels step back.",
        explore: "Color bias can be built by scaling channels differently. The red drum is not subtle, but it is punctual.",
      },
      {
        title: "The Cyan Window",
        source: "openverse_040",
        equations: ["0", "g", "b"],
        goal: "Build cyan by removing red.",
        explore: "Cyan is what remains when green and blue stay together and red is asked to wait outside with the umbrella.",
      },
      {
        title: "Magenta Without Ceremony",
        source: "openverse_036",
        equations: ["r", "0", "b"],
        goal: "Build magenta by removing green.",
        explore: "Some colors are absences wearing a bright jacket. Magenta is red and blue agreeing not to invite green.",
      },
      {
        title: "Yellow Makes a Small Speech",
        source: "openverse_041",
        equations: ["r", "g", "0"],
        goal: "Build yellow by removing blue.",
        explore: "Red plus green makes yellow in light. Paint disagrees, but paint has its own paperwork.",
      },
      {
        title: "The Contrast Bellows",
        source: "openverse_044",
        equations: ["(r - 128) * 1.45 + 128", "(g - 128) * 1.45 + 128", "(b - 128) * 1.45 + 128"],
        goal: "Increase contrast around the midpoint.",
        explore: "To stretch contrast, move each value away from 128, then put the midpoint back. The bellows are dramatic but useful.",
      },
      {
        title: "The Fog Remembers 128",
        source: "openverse_046",
        equations: ["(r - 128) * 0.55 + 128", "(g - 128) * 0.55 + 128", "(b - 128) * 0.55 + 128"],
        goal: "Lower contrast by pulling values toward the midpoint.",
        explore: "Less contrast means shadows and highlights move toward the same quiet center. The fog has excellent filing habits.",
      },
      {
        title: "The Hard-Light Almond",
        source: "openverse_057",
        equations: ["abs(r - 128) * 2", "abs(g - 128) * 2", "abs(b - 128) * 2"],
        goal: "Fold each channel around the midpoint using absolute value.",
        explore: "abs(value) removes the sign. Fold the channel around 128 and stretch it; the almond is not involved but insists on credit.",
      },
      {
        title: "The Maximum Gong",
        source: "openverse_058",
        equations: ["max(r, g, b)", "max(r, g, b)", "max(r, g, b)"],
        goal: "Turn each pixel into its strongest channel value.",
        explore: "max chooses the largest value. If all outputs receive that winner, the loudest channel rings the whole gong.",
      },
      {
        title: "The Minimum Whisper",
        source: "openverse_063",
        equations: ["min(r, g, b)", "min(r, g, b)", "min(r, g, b)"],
        goal: "Turn each pixel into its weakest channel value.",
        explore: "min chooses the smallest value. Sometimes the quietest channel is carrying the map in its sock.",
      },
      {
        title: "Sepia Borrows a Coat",
        source: "openverse_068",
        equations: ["r * 0.393 + g * 0.769 + b * 0.189", "r * 0.349 + g * 0.686 + b * 0.168", "r * 0.272 + g * 0.534 + b * 0.131"],
        goal: "Build a sepia-style color mix from RGB weights.",
        explore: "Each output can combine all three inputs. Old photographs are not old because of math, but math helps them act the part.",
      },
      {
        title: "The Color Difference Scroll",
        source: "openverse_069",
        equations: ["abs(r - g)", "abs(g - b)", "abs(b - r)"],
        goal: "Show differences between neighboring color channels.",
        explore: "Instead of copying channels, compare them. Difference reveals where colors disagree, like a tiny parliament in a teacup.",
      },
      {
        title: "The Half-Lit Value Shrine",
        source: "openverse_002",
        steps: [
          { params: formatColorParams("HSV", "hsv", ["H", "S", "V"], ["H", "S", "V / 2"], ["H", "S", "V / 2"]) },
        ],
        goal: "Use HSV to dim brightness without moving hue or saturation.",
        explore: "The color keeps its address and costume, but the lamp in its hand becomes smaller.",
      },
      {
        title: "The Hue Wheel Sneezes",
        source: "openverse_003",
        steps: [
          { params: formatColorParams("HSV", "hsv", ["H", "S", "V"], ["H + 45", "S", "V"], ["H + 45", "S", "V"]) },
        ],
        goal: "Rotate hue in HSV while preserving saturation and value.",
        explore: "Nothing gets brighter. Nothing gets grayer. The colors simply move to neighboring doors.",
      },
      {
        title: "The Saturation Monastery",
        source: "openverse_006",
        steps: [
          { params: formatColorParams("HSV", "hsv", ["H", "S", "V"], ["H", "S * 0.35", "V"], ["H", "S * 0.35", "V"]) },
        ],
        goal: "Lower saturation in HSV without changing brightness.",
        explore: "The lantern keeps its flame, but the dye in the glass grows shy.",
      },
      {
        title: "The Intensity Stair",
        source: "openverse_007",
        steps: [
          { params: formatColorParams("HSI", "hsi", ["H", "S", "I"], ["H", "S", "I + 35"], ["H", "S", "I + 35"]) },
        ],
        goal: "Lift intensity in HSI while hue and saturation stand still.",
        explore: "The same color climbs a step. Its shadow complains, but follows.",
      },
      {
        title: "Cyan Ink in the Rain Barrel",
        source: "openverse_009",
        steps: [
          { params: formatColorParams("CMY", "cmy", ["C", "M", "Y"], ["C + 60", "M", "Y"], ["C + 60", "M", "Y"]) },
        ],
        goal: "Push cyan ink in CMY space.",
        explore: "One ink grows heavier, and the red light behind it has less room to breathe.",
      },
      {
        title: "The Key Plate Descends",
        source: "openverse_010",
        steps: [
          { params: formatColorParams("CMYK", "cmyk", ["C", "M", "Y", "K"], ["C", "M", "Y", "K + 45"], ["C", "M", "Y", "K + 45"]) },
        ],
        goal: "Darken with CMYK key while leaving chromatic inks alone.",
        explore: "The colored inks do not move. The black plate lowers like a careful ceiling.",
      },
      {
        title: "Overripe Lantern, Sharpened by Math",
        source: "openverse_011",
        steps: [
          { params: formatColorParams("HSV", "hsv", ["H", "S", "V"], ["H", "S * 1.45", "V"], ["H", "S * 1.45", "V"]) },
          { params: equationColorParams("(r - 128) * 1.18 + 128", "(g - 128) * 1.18 + 128", "(b - 128) * 1.18 + 128") },
        ],
        goal: "Chain saturation growth with RGB contrast.",
        explore: "First the dyes shout. Then the midpoint stretches the room until the shout has corners.",
      },
      {
        title: "The Warm Stone After Rain",
        source: "openverse_012",
        steps: [
          { params: formatColorParams("Grayscale", "gray", ["Gray"], ["Gray"], ["Gray"]) },
          { params: equationColorParams("r * 1.12 + 22", "g * 0.98 + 8", "b * 0.82") },
        ],
        goal: "Chain grayscale into a warm RGB tint.",
        explore: "First all colors become one stone. Then the stone remembers a sunset it never attended.",
      },
      {
        title: "The Ink Then Moon Trick",
        source: "openverse_014",
        steps: [
          { params: formatColorParams("CMY", "cmy", ["C", "M", "Y"], ["C + 35", "M", "Y"], ["C + 35", "M", "Y"]) },
          { params: formatColorParams("HSV", "hsv", ["H", "S", "V"], ["H", "S", "V * 0.82"], ["H", "S", "V * 0.82"]) },
        ],
        goal: "Chain CMY ink bias with HSV value dimming.",
        explore: "The first mask drinks red from the paper. The second mask turns down the moon.",
      },
      {
        title: "Three Masks Before Breakfast",
        source: "openverse_017",
        steps: [
          { params: equationColorParams("b", "g", "r") },
          { params: formatColorParams("HSV", "hsv", ["H", "S", "V"], ["H + 90", "S", "V"], ["H + 90", "S", "V"]) },
          { params: equationColorParams("r * 1.08", "g", "b * 0.86") },
        ],
        goal: "Solve a three-step color chain across RGB and HSV.",
        explore: "First two masks trade faces. Then the wheel turns. Last, the breakfast fire chooses a favorite side.",
      },
    ];
    const masterLines = [
      [
        "At the red gate, Master Bitshan places one finger over each eye and declares the third eye is mostly paperwork.",
        "Three little rivers enter the block. Only the warm river is allowed to remember its name.",
        "The mountain hums: absence is also an equation, provided it is written politely.",
      ],
      [
        "The master hangs a green bell in the fog and asks why the other bells keep pretending to ring.",
        "Do not chase the whole image. Listen for the middle thread and let the side threads fall asleep.",
        "A cucumber once tried to explain this lesson. It was technically correct and emotionally unavailable.",
      ],
      [
        "Master Bitshan pours the sky into a cup and says the cup is not blue; it is borrowing a number.",
        "The target is cold because two fires have been removed, not because winter learned arithmetic.",
        "Some pixels hide their ocean in the last room of the house.",
      ],
      [
        "The master swaps two teacups without moving the table. The table files no complaint.",
        "One voice stays where it is. Two voices trade masks and pretend this was always the ceremony.",
        "If the butterfly looks surprised, remember that butterflies have terrible version control.",
      ],
      [
        "Three bowls sit before you. Master Bitshan says they will become one bowl when they stop arguing.",
        "The target has no favorite hue, only a single compromise repeated three times.",
        "A council of colors is fair only when every chair is the same height.",
      ],
      [
        "The master weighs light on a crooked scale and smiles when green makes the table creak.",
        "The eye is not a judge; it is a biased clerk with excellent handwriting.",
        "Do not average the crowd. Ask which color the eye secretly overpays.",
      ],
      [
        "Master Bitshan turns the teacup inside out. Somehow the tea remains outside the cup, which is rude.",
        "Every channel walks away from the far wall carrying its own shadow.",
        "The opposite of a number is not anger. It is distance counted backward.",
      ],
      [
        "The morning lesson begins with a window opening in all three rooms at once.",
        "Nothing changes its shape. Everything simply stands a little closer to white.",
        "The sun is just addition with theatrical timing.",
      ],
      [
        "Master Bitshan lowers the attic lamp until the dust begins speaking in fractions.",
        "All colors keep their ratios, but each one takes smaller steps toward the viewer.",
        "A candle cut in half is still a candle; it merely negotiates with darkness.",
      ],
      [
        "A red drum sounds in a quiet room. The other instruments bow and pretend it was their idea.",
        "One channel grows taller while its companions remove their shoes.",
        "The master warns that confidence and clipping are cousins who should not share soup.",
      ],
      [
        "Master Bitshan opens a cyan window and the red wind refuses to enter.",
        "Two channels make a pact in the doorway. The missing one is the shape of the lesson.",
        "Sometimes a color is not built; it is what remains after a guest leaves early.",
      ],
      [
        "The master writes magenta on paper with invisible green ink, then denies owning a pen.",
        "Two lanterns remain. The middle lantern becomes a hole in the sentence.",
        "Absence wears bright clothes when red and blue split the rent.",
      ],
      [
        "A yellow speech rises from the floorboards after blue is asked to wait outside.",
        "The target glows like two witnesses agreeing too quickly.",
        "Paint may disagree with light, but today light has the chalk.",
      ],
      [
        "Master Bitshan places a tiny hinge at the center of brightness and stretches the room from there.",
        "Near the middle, little happens. Far from the middle, the pixels become dramatic.",
        "The bellows do not invent air; they exaggerate the air already trapped inside.",
      ],
      [
        "The fog remembers the center and invites every loud pixel to sit closer to it.",
        "Shadows and highlights walk toward the same address, muttering about rent.",
        "The mountain becomes quiet when distances shrink.",
      ],
      [
        "Master Bitshan folds a ribbon through the middle of the world and doubles the crease.",
        "Both sides of the center become the same kind of distance after the sign is swallowed.",
        "An almond is mentioned for legal reasons. It contributes nothing.",
      ],
      [
        "The maximum gong rings only for the loudest channel, then makes everyone repeat the note.",
        "One value wins the pixel. The other two stand nearby wearing ceremonial hats.",
        "The master says strength is simple when you ignore nuance. This is not life advice.",
      ],
      [
        "The minimum whisper chooses the quietest channel and gives it the whole stage.",
        "The dimmest voice becomes the shared voice; the bright voices must practice humility.",
        "A floorboard can teach more about a room than the chandelier, if you listen downward.",
      ],
      [
        "Master Bitshan lends the photograph an old coat stitched from three borrowed weights.",
        "No channel travels alone here. Each output is a committee with sepia-colored minutes.",
        "The past is not brown; it is a rumor produced by uneven multiplication.",
      ],
      [
        "The final scroll listens only to disagreements between neighboring colors.",
        "Where channels resemble each other, the room grows quiet. Where they quarrel, lanterns appear.",
        "Master Bitshan closes the lesson with a spoon, a compass, and no useful explanation.",
      ],
      [
        "Master Bitshan dims a shrine by lowering no candle you can see.",
        "The hue keeps its sandals. The saturation keeps its hat. Only the small sun in the pocket shrinks.",
        "Brightness is sometimes a room, sometimes a variable, and sometimes a monk refusing breakfast.",
      ],
      [
        "The master spins a color wheel and blames the sneeze on geometry.",
        "The target changes clothes without gaining weight or losing sleep.",
        "A hue can walk in circles for years and still call it progress.",
      ],
      [
        "Master Bitshan sends the dye to a monastery where loud colors must whisper.",
        "The lamps are not dimmer. The glass has simply stopped bragging.",
        "Saturation is peacock arithmetic, minus most of the peacock.",
      ],
      [
        "The master points to a staircase that only brightness can climb.",
        "Hue stays seated. Saturation folds its hands. Intensity steals the shoes.",
        "A color may rise without changing its name, which is why bureaucracy fears dawn.",
      ],
      [
        "A rain barrel fills with cyan ink, and the red light starts looking for a lawyer.",
        "This is not addition to red. It is ink standing in red's doorway.",
        "Subtractive color is a polite theft wearing waterproof boots.",
      ],
      [
        "The key plate descends with the solemnity of a very square eclipse.",
        "Colored inks keep their gossip. The black ink handles the weather.",
        "When K grows, the room does not change opinions; it changes curtains.",
      ],
      [
        "Master Bitshan asks the dye to shout, then asks the walls to stand farther apart.",
        "One block fattens color. The next block stretches distance from the middle.",
        "Two small spells in a row can look like one large spell with better manners.",
      ],
      [
        "The photograph becomes stone, then remembers it once dreamed in amber.",
        "First the chorus becomes one note. Then the note is warmed over a strange spoon.",
        "A sunset applied after silence is still a sunset, but now it has excellent posture.",
      ],
      [
        "The first mask drinks red through cyan ink; the second lowers the moon behind it.",
        "One space steals a color. Another space dims the whole stage.",
        "The master calls this a duet. The pixels call it paperwork with lanterns.",
      ],
      [
        "Three masks arrive before breakfast, each pretending to be the first mask.",
        "A swap, a wheel, and a small favoritism walk into the same pixel.",
        "Master Bitshan serves tea to the pipeline and refuses to explain the spoon.",
      ],
    ];

    return lessons.map((lesson, index) => ({
      title: lesson.title,
      belt: `Colors ${index + 1}/30`,
      source: lesson.source,
      tools: ["color"],
      solution: colorLessonSolution(lesson),
      unlockAfter: [],
      lines: index === 0
        ? [
          "You climb to the mountain dojo. Master Bitshan looks at the image, then at you: To understand what you are, you must understand what you see.",
          "Rules of the color block: write one equation for Out R, one for Out G, and one for Out B. Begin with r, g, b, arithmetic, and small helpers like min, max, abs, and clamp.",
          masterLines[index][2],
        ]
        : masterLines[index],
      hints: makeCrypticHints(lesson, index),
    }));
  }

  function makeCrypticHints(lesson, index) {
    if (index === 0) {
      return [
        "Only one lantern should remain awake.",
        "The sleeping lanterns do not dim; they become nothing.",
        "The surviving lantern is the one named by the gate.",
      ];
    }
    return [
      lesson.goal,
      lesson.explore,
      "The equation is already hiding in the target. Name the channels, then ask which ones became weights, mirrors, or silence.",
    ];
  }

  function colorLessonSolution(lesson) {
    const steps = Array.isArray(lesson.steps)
      ? lesson.steps
      : [{ params: equationColorParams(...lesson.equations) }];
    return graphFromSteps(steps.map((step) => ({ type: "color", params: step.params })));
  }

  function makeSplit18() {
    const graph = emptyGraph();
    const s = createNode("split", null, "input");
    const a = createNode("color", COLOR_PRESETS.warm.params, s.id);
    const b = createNode("kernel", kernelParams("edge"), s.id);
    const r = createNode("recombine", null, a.id);
    r.inputA = a.id; r.inputB = b.id;
    r.params = { mode: "screen", amount: 0.5 };
    graph.nodes.push(s, a, b, r); graph.outputSource = r.id;
    return graph;
  }

  function makeSplit21() {
    const graph = emptyGraph();
    const s = createNode("split", null, "input");
    const a = createNode("color", COLOR_PRESETS.gray.params, s.id);
    const b = createNode("kernel", kernelParams("blur"), s.id);
    const r = createNode("recombine", null, a.id);
    r.inputA = a.id; r.inputB = b.id;
    r.params = { mode: "multiply", amount: 0.5 };
    graph.nodes.push(s, a, b, r); graph.outputSource = r.id;
    return graph;
  }

  function makeSplit22() {
    const graph = emptyGraph();
    const s = createNode("split", null, "input");
    const b = createNode("kernel", kernelParams("emboss"), s.id);
    const r = createNode("recombine", null, s.id);
    r.inputA = s.id; r.inputB = b.id;
    r.params = { mode: "difference", amount: 0.5 };
    graph.nodes.push(s, b, r); graph.outputSource = r.id;
    return graph;
  }

  function makeSplit24() {
    const graph = emptyGraph();
    const s = createNode("split", null, "input");
    const a = createNode("color", COLOR_PRESETS.poster.params, s.id);
    const b = createNode("kernel", kernelParams("sobel-y"), s.id);
    const r = createNode("recombine", null, a.id);
    r.inputA = a.id; r.inputB = b.id;
    r.params = { mode: "blend", amount: 0.5 };
    graph.nodes.push(s, a, b, r); graph.outputSource = r.id;
    return graph;
  }

  function makeSplit25() {
    const graph = emptyGraph();
    const s = createNode("split", null, "input");
    const a = createNode("color", COLOR_PRESETS.gray.params, s.id);
    const sh = createNode("kernel", kernelParams("sharpen"), a.id);
    const b = createNode("color", COLOR_PRESETS.warm.params, s.id);
    const r = createNode("recombine", null, sh.id);
    r.inputA = sh.id; r.inputB = b.id;
    r.params = { mode: "screen", amount: 0.5 };
    graph.nodes.push(s, a, sh, b, r); graph.outputSource = r.id;
    return graph;
  }

  function emptyGraph() {
    return { nodes: [], outputSource: "" };
  }

  function normalizeGraph(graph) {
    const safe = graph && typeof graph === "object" ? graph : {};
    return {
      nodes: Array.isArray(safe.nodes) ? safe.nodes.map((node) => {
        const type = ["color", "affine", "kernel", "split", "recombine"].includes(node.type) ? node.type : "color";
        const normalized = createNode(type, node.params, node.input || "input");
        normalized.id = String(node.id || normalized.id);
        normalized.input = node.input || "input";
        normalized.inputA = node.inputA || "input";
        normalized.inputB = node.inputB || "input";
        return normalized;
      }) : [],
      outputSource: String(safe.outputSource || ""),
    };
  }

  function lastNodeId() {
    return state.graph.nodes.length ? state.graph.nodes[state.graph.nodes.length - 1].id : "";
  }

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
    const data = imageData.data;
    const i00 = (y0 * imageData.width + x0) * 4;
    const i10 = (y0 * imageData.width + x1) * 4;
    const i01 = (y1 * imageData.width + x0) * 4;
    const i11 = (y1 * imageData.width + x1) * 4;
    for (let c = 0; c < 3; c += 1) {
      const top = data[i00 + c] * (1 - tx) + data[i10 + c] * tx;
      const bottom = data[i01 + c] * (1 - tx) + data[i11 + c] * tx;
      out[target + c] = clampByte(top * (1 - ty) + bottom * ty);
    }
    out[target + 3] = 255;
  }

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

  function compileColorEquation(expression) {
    const source = cleanEquation(expression);
    const allowed = /^[0-9a-zA-Z_+\-*/%().,\s?:<>=!]+$/.test(source);
    const names = source.match(/[a-zA-Z_][a-zA-Z0-9_]*/g) || [];
    const allowedNames = new Set(["r", "g", "b", "x", "y", "w", "h", "avg", "luma", "Gray", "gray", "C", "M", "Y", "K", "H", "S", "V", "I", "c", "m", "k", "s", "v", "i", "min", "max", "abs", "clamp", "mix", "sqrt", "atan2", "sin", "cos", "pi"]);
    if (!allowed || names.some((name) => !allowedNames.has(name))) return () => 0;
    try {
      const fn = new Function("ctx", `
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
      `);
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
    if (score >= 98) return "Master";
    if (score >= 90) return "Clean";
    if (score >= 80) return "Pass";
    if (score >= 60) return "Close";
    return "Retry";
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
    let value = seed >>> 0;
    return () => {
      value = (value * 1664525 + 1013904223) >>> 0;
      return value / 4294967296;
    };
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

  function readJson(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || "null") ?? fallback; } catch { return fallback; }
  }
  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function cloneImageData(imageData) { return new ImageData(new Uint8ClampedArray(imageData.data), imageData.width, imageData.height); }
  function clamp(value, min, max) { return Math.max(min, Math.min(max, Number.isFinite(value) ? value : min)); }
  function clamp01(value) { return clamp(value, 0, 1); }
  function clampByte(value) { return clamp(Math.round(value), 0, 255); }
  function formatNumber(value, digits = 2) { const rounded = Number((Number(value) || 0).toFixed(digits)); return Object.is(rounded, -0) ? "0" : String(rounded); }
  function wrapHue(value) { return ((value % 360) + 360) % 360; }
  function escapeHtml(value) { return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;"); }
})();
