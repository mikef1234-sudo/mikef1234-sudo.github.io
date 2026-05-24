import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const bundledPython = "/Users/miferrar/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3";
const bundledNodeModules = "/Users/miferrar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules";

function resolvePython() {
  const preferred = [
    process.env.CLARPOINT_TEMPLATE_PYTHON,
    bundledPython,
    "python3",
  ].filter(Boolean);

  for (const candidate of preferred) {
    if (candidate === "python3") return candidate;
    if (fs.existsSync(candidate)) return candidate;
  }
  return "python3";
}

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: ROOT,
    stdio: "inherit",
    env: {
      ...process.env,
      CODEX_NODE_MODULES: process.env.CODEX_NODE_MODULES || bundledNodeModules,
    },
  });

  if (result.status !== 0) {
    throw new Error(`Command failed: ${command} ${args.join(" ")}`);
  }
}

const python = resolvePython();
const node = process.execPath;

run(python, ["tools/template-artifacts/build_template_docs.py"]);
run(node, ["tools/template-artifacts/build_template_workbooks.mjs"]);
run(node, ["tools/template-artifacts/build_template_decks.mjs"]);
run(python, ["scripts/generate_template_products.py"]);

console.log("Clarpoint template products generated successfully.");
