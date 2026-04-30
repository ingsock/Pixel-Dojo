"use strict";

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


