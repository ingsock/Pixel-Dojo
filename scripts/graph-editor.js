"use strict";

let colorNoticeTimer = null;

function addNode(type, params = null, options = {}) {
  if (!unlockedToolSet().has(type)) return;
  const source = state.graph.outputSource || lastNodeId() || "input";
  const node = createNode(type, params, source);
  state.graph.nodes.push(node);
  state.graph.outputSource = node.id;
  if (options.reveal && type === "color" && isFirstLessonTutorial()) {
    state.tutorialStep = Math.max(state.tutorialStep, 2);
  }
  renderAll();
  if (options.reveal && type === "color") revealTutorialTarget();
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
  const rebuild = target.matches("[data-param='size']");
  renderAll(!rebuild ? false : true, { deferColorNotices: event.type === "input" && target.matches("[data-equation-index]") });
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
      const kernelInputs = [...card.querySelectorAll("[data-kx]")];
      const kernelSize = kernelInputs.length ? Math.max(...kernelInputs.map((input) => Math.max(Number(input.dataset.kx), Number(input.dataset.ky)))) + 1 : 3;
      const values = Array.from({ length: kernelSize }, () => Array.from({ length: kernelSize }, () => 0));
      kernelInputs.forEach((input) => {
        values[Number(input.dataset.ky)][Number(input.dataset.kx)] = Number(input.value);
      });
      node.params = normalizeKernel({
        size: Number(card.querySelector("[data-param='size']").value),
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

function renderAll(rebuild = true, options = {}) {
  if (state.baseImageData) {
    drawImage(dom.inputCtx, state.baseImageData);
    drawMiniImage(dom.miniInputCtx, state.baseImageData);
  }
  if (state.targetImageData) {
    drawImage(dom.targetCtx, state.targetImageData);
    drawMiniImage(dom.miniTargetCtx, state.targetImageData);
  }
  if (rebuild) renderNodeBoard();
  renderOutput(options);
  updateGraphJson();
  window.setTimeout(drawWires, 30);
  renderTutorial();
  updateNextLevelButton();
}

function renderOutput(options = {}) {
  const result = evaluateGraph(state.graph, state.baseImageData);
  state.outputImageData = result.image;
  if (options.deferColorNotices) {
    renderColorNotices(new Map());
    scheduleColorNoticeRender();
  } else {
    clearColorNoticeTimer();
    renderColorNotices(result.nodeNotices || new Map());
  }
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

function scheduleColorNoticeRender() {
  clearColorNoticeTimer();
  colorNoticeTimer = window.setTimeout(() => {
    colorNoticeTimer = null;
    renderOutput();
  }, 650);
}

function clearColorNoticeTimer() {
  if (!colorNoticeTimer) return;
  window.clearTimeout(colorNoticeTimer);
  colorNoticeTimer = null;
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
  if (node.type === "kernel") card.style.setProperty("--kernel-size", String(normalizeKernel(node.params).size));
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
      </div>
      <div class="color-notices" data-color-notices="${node.id}" aria-live="polite"></div>`;
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
    const sizes = [...new Set([3, 5, 7, p.size])].sort((a, b) => a - b);
    return `${head}
      <label class="field mini"><span>Input</span>${sourceSelect(node.id, node.input || "input", "data-param='input'")}</label>
      <div class="kernel-mini">${p.values.map((row, y) => row.map((value, x) => `<input data-kx="${x}" data-ky="${y}" type="number" step="0.01" value="${formatNumber(value, 2)}">`).join("")).join("")}</div>
      <div class="node-grid kernel-controls">
        <label class="field mini"><span>Size</span><select data-param="size">${sizes.map((size) => `<option value="${size}" ${size === p.size ? "selected" : ""}>${size}x${size}</option>`).join("")}</select></label>
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
  if (!inputImage) return { image: null, error: "No input image", nodeNotices: new Map() };
  const outputs = new Map([["input", inputImage]]);
  const nodeNotices = new Map();
  for (const node of graph.nodes) {
    if (node.type === "recombine") {
      const a = outputs.get(node.inputA);
      const b = outputs.get(node.inputB);
      if (!a || !b) return { image: null, error: `Missing input for ${node.id}`, nodeNotices };
      outputs.set(node.id, applyRecombine(a, b, node.params));
    } else {
      const source = outputs.get(node.input);
      if (!source) return { image: null, error: `Missing input for ${node.id}`, nodeNotices };
      if (node.type === "color") {
        const colorOutput = applyColor(source, node.params);
        outputs.set(node.id, colorOutput);
        nodeNotices.set(node.id, colorOutput.colorNotice || {});
      }
      else if (node.type === "affine") outputs.set(node.id, applyAffine(source, node.params));
      else if (node.type === "kernel") outputs.set(node.id, applyKernel(source, node.params));
      else if (node.type === "split") outputs.set(node.id, cloneImageData(source));
    }
  }
  if (!graph.outputSource) return { image: null, error: "Output disconnected", nodeNotices };
  const image = outputs.get(graph.outputSource);
  if (!image) return { image: null, error: "Output source missing", nodeNotices };
  return { image, error: "", nodeNotices };
}

function renderColorNotices(nodeNotices) {
  dom.nodeBoard.querySelectorAll("[data-color-notices]").forEach((container) => {
    const notice = nodeNotices.get(container.dataset.colorNotices) || {};
    const invalid = Array.isArray(notice.invalidExpressions) ? notice.invalidExpressions : [];
    const items = [];
    if (invalid.length) {
      const details = invalid.map((item) => `${item.label}: ${item.source} (${item.reason})`).join(" ");
      items.push(`<div class="color-notice error"><strong>Invalid expression</strong><p>${escapeHtml(details)} ${escapeHtml(colorExpressionHelpText())}</p></div>`);
    }
    if (notice.clampedPixels > 0) {
      const title = "All input and output values should be within 0 to 255. Values below 0 evaluate to 0, and values above 255 evaluate to 255.";
      items.push(`<div class="color-notice warning"><strong>Values clamped <span class="info-dot" tabindex="0" role="note" aria-label="${escapeHtml(title)}" data-tooltip="${escapeHtml(title)}">ⓘ</span></strong><p>${notice.clampedPixels} pixel${notice.clampedPixels === 1 ? "" : "s"} had values outside 0 to 255 and were clamped.</p></div>`);
    }
    container.innerHTML = items.join("");
  });
}


