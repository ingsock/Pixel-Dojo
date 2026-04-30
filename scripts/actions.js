"use strict";

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
      updateNextLevelButton();
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


