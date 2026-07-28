#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const http = require("http");
const { findBusinesses } = require("./finder/places");
const { scoreAll } = require("./finder/score");
const { generateAll, generateSite } = require("./generator/generate");

const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "output");
const LEADS_FILE = path.join(OUT_DIR, "leads.json");

// --- tiny arg parser -----------------------------------------------------
function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith("--")) args[key] = true;
      else { args[key] = next; i++; }
    } else args._.push(a);
  }
  return args;
}

function c(code, s) { return `\x1b[${code}m${s}\x1b[0m`; }
const bold = (s) => c(1, s), green = (s) => c(32, s), cyan = (s) => c(36, s),
  yellow = (s) => c(33, s), dim = (s) => c(2, s), red = (s) => c(31, s);

function ensureOut() { fs.mkdirSync(OUT_DIR, { recursive: true }); }

function toCsv(rows) {
  const cols = ["score", "status", "name", "category", "phone", "website", "city", "region", "rating", "reviewsCount", "reasons"];
  const esc = (v) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const head = cols.join(",");
  const body = rows.map((r) =>
    cols.map((k) => {
      if (k === "score" || k === "status") return esc(r.lead[k]);
      if (k === "reasons") return esc((r.lead.reasons || []).join("; "));
      return esc(r[k]);
    }).join(",")
  ).join("\n");
  return head + "\n" + body + "\n";
}

// --- commands ------------------------------------------------------------

async function cmdFind(args) {
  const query = args._.join(" ").trim() || args.query;
  if (!query) return fail('Usage: find "<what> in <city, ST>"  (e.g. find "plumbers in Boise, ID")');

  const onlyNoWebsite = Boolean(args["only-no-website"]);
  const probe = !args["no-probe"];

  console.log(bold(`\n🔎 Finding businesses: `) + cyan(query));
  const { source, businesses } = await findBusinesses(query, { onlyNoWebsite });
  if (source === "demo") {
    console.log(yellow("   (no GOOGLE_PLACES_API_KEY set — using offline demo data)"));
  }
  if (!businesses.length) return console.log(yellow("   No businesses found."));

  console.log(dim(`   Scoring ${businesses.length} businesses${probe ? " (probing existing sites)" : ""}...`));
  const scored = await scoreAll(businesses, { probe });

  ensureOut();
  fs.writeFileSync(LEADS_FILE, JSON.stringify(scored, null, 2));
  fs.writeFileSync(path.join(OUT_DIR, "leads.csv"), toCsv(scored));

  console.log(bold("\n📋 Ranked leads (best prospects first):\n"));
  scored.forEach((r, i) => {
    const s = r.lead.score;
    const badge = s >= 80 ? green(`[${s}]`) : s >= 50 ? yellow(`[${s}]`) : dim(`[${s}]`);
    console.log(`  ${badge} ${bold(r.name)} ${dim("· " + (r.category || "—"))}`);
    console.log(`        📞 ${r.phone || dim("no phone")}   ${dim(r.lead.status)}`);
    console.log(`        ${dim(r.lead.reasons.join("; "))}`);
  });
  console.log(green(`\n✔ Saved ${scored.length} leads → `) + dim(path.relative(ROOT, LEADS_FILE) + " (+ leads.csv)"));
  console.log(dim(`  Next: ${bold("npm run generate")} to build sites for these leads.\n`));
}

async function cmdGenerate(args) {
  ensureOut();
  let businesses;

  if (args.file) {
    businesses = JSON.parse(fs.readFileSync(args.file, "utf8"));
  } else if (fs.existsSync(LEADS_FILE)) {
    businesses = JSON.parse(fs.readFileSync(LEADS_FILE, "utf8"));
  } else {
    return fail(`No leads found. Run ${bold("find")} first, or pass ${bold("--file <path.json>")}.`);
  }
  if (!Array.isArray(businesses)) businesses = [businesses];

  // Optionally only build strong leads.
  const min = args["min-score"] ? Number(args["min-score"]) : 0;
  const chosen = businesses.filter((b) => !b.lead || b.lead.score >= min);

  console.log(bold(`\n🏗  Generating ${chosen.length} site(s)...\n`));
  const results = generateAll(chosen, OUT_DIR);
  results.forEach((r) => console.log(`  ${green("✔")} ${bold(r.name)} ${dim("→ " + path.relative(ROOT, r.file))}`));
  console.log(green(`\n✔ Done. `) + dim(`Preview with ${bold("npm run serve")} then open the printed URL.\n`));
}

async function cmdPipeline(args) {
  await cmdFind(args);
  await cmdGenerate(args);
}

function cmdServe(args) {
  ensureOut();
  const port = Number(args.port) || 4173;
  const server = http.createServer((req, res) => {
    let urlPath = decodeURIComponent(req.url.split("?")[0]);
    if (urlPath === "/") urlPath = "/index.html";
    let filePath = path.join(OUT_DIR, urlPath);
    if (!filePath.startsWith(OUT_DIR)) { res.writeHead(403); return res.end("Forbidden"); }
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) filePath = path.join(filePath, "index.html");
    if (!fs.existsSync(filePath)) {
      // directory index of generated sites
      const dirs = fs.existsSync(OUT_DIR)
        ? fs.readdirSync(OUT_DIR).filter((d) => fs.statSync(path.join(OUT_DIR, d)).isDirectory())
        : [];
      const links = dirs.map((d) => `<li><a href="/${d}/">${d}</a></li>`).join("");
      res.writeHead(200, { "Content-Type": "text/html" });
      return res.end(`<h1>Generated sites</h1><ul>${links || "<li>none yet — run generate</li>"}</ul>`);
    }
    const ext = path.extname(filePath);
    const type = ext === ".html" ? "text/html" : ext === ".css" ? "text/css" : ext === ".js" ? "text/javascript" : "text/plain";
    res.writeHead(200, { "Content-Type": type });
    fs.createReadStream(filePath).pipe(res);
  });
  server.listen(port, () => {
    console.log(green(`\n▶ Preview server running:`) + bold(` http://localhost:${port}/`));
    console.log(dim("  Lists all generated sites. Ctrl+C to stop.\n"));
  });
}

function fail(msg) { console.error(red("✖ ") + msg); process.exitCode = 1; }

function help() {
  console.log(`
${bold("Money Printer")} — find local businesses & generate websites

${bold("Usage:")}  node src/cli.js <command> [options]

${bold("Commands:")}
  ${cyan("find")} "<query>"        Find & rank local businesses as leads
                          e.g. find "coffee shops in Boise, ID"
  ${cyan("generate")}             Build websites for saved leads (output/)
  ${cyan("pipeline")} "<query>"    find + generate in one go
  ${cyan("serve")}                Preview generated sites in the browser

${bold("Options:")}
  --only-no-website     find: keep only businesses with no website
  --no-probe            find: skip fetching/inspecting existing sites (faster)
  --min-score <n>       generate: only build leads scoring >= n
  --file <path.json>    generate: build from a specific JSON file
  --port <n>            serve: port (default 4173)

${bold("Live data:")} set ${yellow("GOOGLE_PLACES_API_KEY")} to query the real Google Places API.
Without it, an offline demo dataset is used so everything still runs.
`);
}

async function main() {
  const argv = process.argv.slice(2);
  const args = parseArgs(argv);
  const cmd = args._.shift();
  try {
    switch (cmd) {
      case "find": return await cmdFind(args);
      case "generate": return await cmdGenerate(args);
      case "pipeline": return await cmdPipeline(args);
      case "serve": return cmdServe(args);
      case undefined:
      case "help": return help();
      default: return fail(`Unknown command: ${cmd}\nRun ${bold("node src/cli.js help")}.`);
    }
  } catch (e) {
    fail(e.message);
    if (process.env.DEBUG) console.error(e);
  }
}

main();
