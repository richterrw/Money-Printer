#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const http = require("http");
const { findBusinesses } = require("./finder/places");
const { scoreAll } = require("./finder/score");
const { generateSite, slugify } = require("./generator/generate");

const ROOT = path.resolve(__dirname, "..");
const PUBLIC_DIR = path.join(ROOT, "public");
const OUT_DIR = path.join(ROOT, "output");
const PORT = Number(process.env.PORT) || 4000;
const HOST = process.env.HOST || "0.0.0.0"; // bind all interfaces so a phone on the LAN can reach it

fs.mkdirSync(OUT_DIR, { recursive: true });

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

function send(res, status, body, headers = {}) {
  res.writeHead(status, { "Cache-Control": "no-cache", ...headers });
  res.end(body);
}
function sendJson(res, status, obj) {
  send(res, status, JSON.stringify(obj), { "Content-Type": "application/json; charset=utf-8" });
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (c) => {
      data += c;
      if (data.length > 2_000_000) reject(new Error("payload too large"));
    });
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

function serveFile(res, filePath) {
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    return send(res, 404, "Not found");
  }
  const type = MIME[path.extname(filePath)] || "application/octet-stream";
  res.writeHead(200, { "Content-Type": type });
  fs.createReadStream(filePath).pipe(res);
}

// --- API handlers --------------------------------------------------------

async function apiFind(req, res) {
  const body = JSON.parse((await readBody(req)) || "{}");
  const query = String(body.query || "").trim();
  if (!query) return sendJson(res, 400, { error: "Missing query" });

  const { source, businesses } = await findBusinesses(query, {
    onlyNoWebsite: Boolean(body.onlyNoWebsite)
  });
  const scored = await scoreAll(businesses, { probe: body.probe !== false });

  // Slim payload for the phone; keep everything needed to generate later.
  const leads = scored.map((b) => ({
    name: b.name,
    category: b.category,
    phone: b.phone,
    address: b.address,
    city: b.city,
    region: b.region,
    website: b.website,
    rating: b.rating,
    reviewsCount: b.reviewsCount,
    placeId: b.placeId,
    hours: b.hours,
    reviews: b.reviews,
    services: b.services,
    lead: b.lead,
    slug: slugify(b.name)
  }));

  sendJson(res, 200, { source, query, count: leads.length, leads });
}

async function apiGenerate(req, res) {
  const business = JSON.parse((await readBody(req)) || "{}");
  if (!business || !business.name) return sendJson(res, 400, { error: "Missing business" });
  const file = generateSite(business, OUT_DIR);
  const slug = path.basename(path.dirname(file));
  sendJson(res, 200, { slug, url: `/sites/${slug}/` });
}

// --- request router ------------------------------------------------------

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    const p = decodeURIComponent(url.pathname);

    // health check for hosting platforms
    if (p === "/healthz") return sendJson(res, 200, { ok: true });

    // API
    if (p === "/api/find" && req.method === "POST") return await apiFind(req, res);
    if (p === "/api/generate" && req.method === "POST") return await apiGenerate(req, res);

    // generated client sites: /sites/<slug>/...
    if (p.startsWith("/sites/")) {
      let rel = p.slice("/sites/".length);
      if (rel === "" || rel.endsWith("/")) rel += "index.html";
      const filePath = path.join(OUT_DIR, rel);
      if (!filePath.startsWith(OUT_DIR)) return send(res, 403, "Forbidden");
      return serveFile(res, filePath);
    }

    // the mobile app (static from /public)
    let rel = p === "/" ? "index.html" : p.replace(/^\/+/, "");
    const filePath = path.join(PUBLIC_DIR, rel);
    if (!filePath.startsWith(PUBLIC_DIR)) return send(res, 403, "Forbidden");
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) return serveFile(res, filePath);

    // SPA-ish fallback to the app shell
    return serveFile(res, path.join(PUBLIC_DIR, "index.html"));
  } catch (e) {
    sendJson(res, 500, { error: e.message });
  }
});

server.listen(PORT, HOST, () => {
  const live = Boolean(process.env.GOOGLE_PLACES_API_KEY);
  console.log(`\n  🖨️  Money Printer — mobile app`);
  console.log(`  ────────────────────────────────`);
  console.log(`  Local:    http://localhost:${PORT}/`);
  console.log(`  Network:  http://<your-computer-ip>:${PORT}/   (open this on your phone)`);
  console.log(`  Data:     ${live ? "LIVE Google Places API" : "offline demo data (set GOOGLE_PLACES_API_KEY for real leads)"}`);
  console.log(`\n  Tip: run  node src/whoami.js  to print your network URL.\n`);
});
