/* Extract the real AE recipe registry. Without arguments the catalog is written to cavalry/catalog/;
   with --stdout it is printed and no file is created. AE sources are read, never written.
   Registrations are recorded by instrumenting jzReg (and therefore every wrapper such as axl_reg that
   eventually calls it), not by counting text with a regex. The extracted functions are evidence of what the
   AE recipe does; they are not a Cavalry implementation. `implementationStatus` therefore stays
   "not-ported" until a native pack recipe exists for that name. */
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const crypto = require("node:crypto");

const ROOT = path.resolve(__dirname, "../..");
const AE = path.join(ROOT, "ae");
const OUTPUT = path.join(ROOT, "cavalry/catalog");

/* Same evaluation order as build_ae.py: the shared runtime first, then every recipe pack, then the
   build/diagnostic sources. UI definitions are not part of the recipe registry. */
const BRIDGE_FILES = [
  "00_core.jsx",
  "05_reg.jsx",
  "10_helpers.jsx",
  "15_plan.jsx",
  "16_omakase.jsx",
  "20_motion.jsx",
  "30_layouts.jsx",
  "40_decor.jsx",
  "45_core.jsx"
];
const TAIL_FILES = ["50_build.jsx", "55_diag.jsx"];

const GROUPS = ["layout", "enter", "hold", "exit", "decor", "treat", "bg", "cam", "fx", "trans"];

function sha256(text) {
  return crypto.createHash("sha256").update(text, "utf8").digest("hex");
}

function read(name) {
  return fs.readFileSync(path.join(AE, name), "utf8");
}

const packs = fs.readdirSync(AE).filter(name => /^p_.*\.jsx$/.test(name)).sort();
const order = [...BRIDGE_FILES, ...packs, ...TAIL_FILES];
const files = order.filter(name => fs.existsSync(path.join(AE, name)));

const sourceHashes = {};
const registrations = [];
const parseErrors = [];

const sandbox = {
  console: { log() {}, info() {}, warn() {}, error() {} },
  JZ_DATA: JSON.parse(fs.readFileSync(path.join(AE, "data.json"), "utf8")),
  app: { beginUndoGroup() {}, endUndoGroup() {} },
  __sourceFile: null,
  __recordRegistration(group, name, definition) {
    registrations.push({ group, name, sourceFile: sandbox.__sourceFile, definition });
  }
};

const context = vm.createContext(sandbox);

function evaluate(filename) {
  const source = read(filename);
  sourceHashes[`ae/${filename}`] = sha256(source);
  sandbox.__sourceFile = `ae/${filename}`;
  try {
    vm.runInContext(source, context, { filename: `ae/${filename}`, timeout: 5000 });
  } catch (error) {
    /* A UI-only or otherwise unparsable source must not hide the recipe registry in the other files.
       The audit records it so a broken source is visible instead of being silently skipped. */
    parseErrors.push({ file: `ae/${filename}`, message: String(error && error.message || error) });
  }
}

for (const filename of files) {
  evaluate(filename);
  if (filename === "05_reg.jsx") {
    vm.runInContext(`
      var __originalJzReg = jzReg;
      jzReg = function (group, name, definition) {
        __recordRegistration(group, name, definition);
        return __originalJzReg(group, name, definition);
      };
    `, context, { filename: "cavalry/catalog-instrumentation.js", timeout: 1000 });
  }
}

const entries = vm.runInContext(`
  (function () {
    var result = [];
    ${JSON.stringify(GROUPS)}.forEach(function (group) {
      Object.keys(JZ_REG[group] || {}).forEach(function (name) {
        var definition = JZ_REG[group][name];
        var methods = {};
        var flags = {};
        Object.keys(definition).forEach(function (key) {
          var value = definition[key];
          if (typeof value === "function") methods[key] = String(value);
          else if (value === null || ["string", "number", "boolean"].indexOf(typeof value) >= 0) flags[key] = value;
        });
        result.push({
          group: group,
          name: name,
          metadata: JZ_DATA.meta && JZ_DATA.meta[group] && JZ_DATA.meta[group][name] ? JZ_DATA.meta[group][name] : {},
          flags: flags,
          methods: methods
        });
      });
    });
    return result;
  })();
`, context, { filename: "cavalry/catalog-export.js", timeout: 5000 });

const lastRegistration = new Map();
for (const registration of registrations) {
  lastRegistration.set(`${registration.group}:${registration.name}`, registration);
}

for (const entry of entries) {
  const registration = lastRegistration.get(`${entry.group}:${entry.name}`);
  entry.sourceFile = registration ? registration.sourceFile : null;
  entry.implementationStatus = "not-ported";
  entry.sourceHash = sha256(JSON.stringify({ flags: entry.flags, methods: entry.methods }));
}

entries.sort((a, b) => `${a.group}:${a.name}`.localeCompare(`${b.group}:${b.name}`));

const counts = Object.fromEntries(GROUPS.map(group => [group, entries.filter(entry => entry.group === group).length]));

const catalog = {
  format: "jizura.cavalry.ae-source-catalog",
  version: 1,
  counts,
  total: entries.length,
  sourceHashes,
  parseErrors,
  entries
};

/* With --stdout the catalog is returned as JSON and no file is written; build_cavalry.py audits the
   registry in memory instead of keeping a second copy of the AE names on disk. */
if (process.argv.includes("--stdout")) {
  process.stdout.write(JSON.stringify(catalog) + "\n");
} else {
  fs.mkdirSync(OUTPUT, { recursive: true });
  fs.writeFileSync(path.join(OUTPUT, "ae-presets.json"), JSON.stringify(catalog, null, 2), "utf8");

  const csv = [
    ["group", "name", "label", "sourceFile", "implementationStatus", "sourceHash"],
    ...entries.map(entry => [
      entry.group,
      entry.name,
      entry.metadata.name || entry.name,
      entry.sourceFile || "",
      entry.implementationStatus,
      entry.sourceHash
    ])
  ].map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(",")).join("\n");

  fs.writeFileSync(path.join(OUTPUT, "ae-presets.csv"), csv, "utf8");

  console.log(JSON.stringify({ total: entries.length, counts, output: "cavalry/catalog/ae-presets.json" }, null, 2));
}
