"use strict";

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
    "tutorialCoach", "tutorialStepLabel", "tutorialTargetLabel", "tutorialTitle", "tutorialText",
    "tutorialBackButton", "tutorialActionButton", "tutorialNextButton", "nextLevelButton",
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
    button.addEventListener("click", () => addNode(button.dataset.addNode, null, { reveal: isFirstLessonTutorial() }));
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
  dom.tutorialBackButton.addEventListener("click", () => shiftTutorial(-1));
  dom.tutorialNextButton.addEventListener("click", () => shiftTutorial(1));
  dom.tutorialActionButton.addEventListener("click", runTutorialAction);
  dom.nextLevelButton.addEventListener("click", goToNextLevel);
  document.querySelectorAll("[data-tutorial-nudge]").forEach((button) => {
    button.addEventListener("click", () => applyTutorialNudge(button.dataset.tutorialNudge));
  });
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

function shiftTutorial(delta) {
  state.tutorialStep = clamp(state.tutorialStep + delta, 0, TUTORIAL_STEPS.length - 1);
  renderTutorial(true);
  playSound("page");
}

function renderTutorial(reveal = false) {
  clearTutorialHighlights();
  const showTutorial = state.mode === "story" && state.chapterIndex === 0;
  dom.tutorialCoach.classList.toggle("is-hidden", !showTutorial);
  if (!showTutorial) return;

  const step = TUTORIAL_STEPS[state.tutorialStep];
  dom.tutorialStepLabel.textContent = `Step ${state.tutorialStep + 1}/${TUTORIAL_STEPS.length}`;
  dom.tutorialTargetLabel.textContent = step.label;
  dom.tutorialTitle.textContent = step.title;
  dom.tutorialText.textContent = step.text;
  dom.tutorialBackButton.disabled = state.tutorialStep === 0;
  dom.tutorialNextButton.disabled = state.tutorialStep === TUTORIAL_STEPS.length - 1;
  dom.tutorialActionButton.textContent = step.actionLabel;
  dom.tutorialActionButton.disabled = !step.action;
  document.querySelector(".tutorial-nudges")?.classList.toggle("is-hidden", !step.nudges);

  const highlightTargets = tutorialTargets(step);
  highlightTargets.forEach((target) => target.classList.add("tutorial-highlight"));
  if (reveal) revealTutorialTarget(step);
}

function clearTutorialHighlights() {
  document.querySelectorAll(".tutorial-highlight").forEach((el) => el.classList.remove("tutorial-highlight"));
}

function runTutorialAction() {
  const step = TUTORIAL_STEPS[state.tutorialStep];
  if (!step.action) return;
  revealTutorialTarget(step);
  playSound("page");
}

function setTutorialColorEquations(expressions) {
  const node = state.graph.nodes.find((item) => item.type === "color");
  if (!node) {
    state.tutorialStep = 1;
    renderTutorial(true);
    return;
  }
  node.input = "input";
  node.params = equationColorParams(...expressions);
  state.graph.outputSource = node.id;
  renderAll();
  playSound("wire");
}

function isFirstLessonTutorial() {
  return state.mode === "story" && state.chapterIndex === 0;
}

function tutorialTargets(step = TUTORIAL_STEPS[state.tutorialStep]) {
  const targets = [...document.querySelectorAll(step.target)];
  if (targets.length) return targets;
  if (step.target.includes("color-node")) return [document.querySelector("[data-add-node='color']")].filter(Boolean);
  return [document.querySelector("[data-add-node='color']")].filter(Boolean);
}

function revealTutorialTarget(step = TUTORIAL_STEPS[state.tutorialStep]) {
  window.setTimeout(() => {
    const target = tutorialTargets(step)[0];
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
  }, 80);
}

function applyTutorialNudge(kind) {
  if (kind === "brighter") setTutorialColorEquations(["r + 35", "0", "0"]);
  if (kind === "darker") setTutorialColorEquations(["r * 0.65", "0", "0"]);
  if (kind === "reset") setTutorialColorEquations(["r", "0", "0"]);
}

async function goToNextLevel() {
  if (state.mode !== "story") return;
  const nextIndex = state.chapterIndex + 1;
  if (nextIndex >= STORY_CHAPTERS.length || nextIndex > state.completedChapters) return;
  await loadStoryChapter(nextIndex);
  dom.puzzleTitle.scrollIntoView({ behavior: "smooth", block: "start" });
  playSound("page");
}

function updateNextLevelButton() {
  if (!dom.nextLevelButton) return;
  const show = state.mode === "story"
    && state.chapterIndex < STORY_CHAPTERS.length - 1
    && state.completedChapters > state.chapterIndex;
  dom.nextLevelButton.classList.toggle("is-hidden", !show);
  dom.nextLevelButton.textContent = show ? `Next Level: ${STORY_CHAPTERS[state.chapterIndex + 1].title}` : "Next Level";
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


