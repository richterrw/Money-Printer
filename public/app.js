"use strict";

/* Money Printer — mobile web app front-end.
 * Talks to the local server API (/api/find, /api/generate) and keeps a little
 * per-lead call-status in localStorage so you can work a call list on the go. */

const $ = (sel, root = document) => root.querySelector(sel);
const el = {
  q: $("#q"),
  onlyNoSite: $("#onlyNoSite"),
  findBtn: $("#findBtn"),
  status: $("#status"),
  results: $("#results"),
  empty: $("#empty"),
  toast: $("#toast"),
  dataMode: $("#dataMode"),
  tpl: $("#leadTpl")
};

const STATUS_CYCLE = ["new", "called", "interested", "sold"];
const STATUS_LABEL = { new: "New", called: "Called", interested: "Interested", sold: "Sold ✓" };

// --- persistence ---------------------------------------------------------
const store = {
  statusKey: "mp-status",
  builtKey: "mp-built",
  getStatus(slug) { return JSON.parse(localStorage.getItem(this.statusKey) || "{}")[slug] || "new"; },
  setStatus(slug, v) {
    const all = JSON.parse(localStorage.getItem(this.statusKey) || "{}");
    all[slug] = v; localStorage.setItem(this.statusKey, JSON.stringify(all));
  },
  getBuilt(slug) { return JSON.parse(localStorage.getItem(this.builtKey) || "{}")[slug] || null; },
  setBuilt(slug, url) {
    const all = JSON.parse(localStorage.getItem(this.builtKey) || "{}");
    all[slug] = url; localStorage.setItem(this.builtKey, JSON.stringify(all));
  }
};

// --- ui helpers ----------------------------------------------------------
function toast(msg, ms = 1800) {
  el.toast.textContent = msg;
  el.toast.hidden = false;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => (el.toast.hidden = true), ms);
}

function scoreClass(s) { return s >= 80 ? "hot" : s >= 50 ? "warm" : "cold"; }

function absoluteUrl(pathPart) {
  return location.origin + pathPart;
}

// --- rendering -----------------------------------------------------------
function renderLead(b) {
  const node = el.tpl.content.firstElementChild.cloneNode(true);
  const slug = b.slug;
  const score = (b.lead && b.lead.score) || 0;

  const scoreEl = $(".score", node);
  scoreEl.textContent = score;
  scoreEl.classList.add(scoreClass(score));

  $(".lead-name", node).textContent = b.name || "Unknown";
  $(".lead-cat", node).textContent = [b.category, [b.city, b.region].filter(Boolean).join(", ")]
    .filter(Boolean).join(" · ");
  $(".lead-reason", node).textContent = (b.lead && b.lead.reasons && b.lead.reasons.join("; ")) || "";

  // call button
  const callBtn = $("[data-call]", node);
  if (b.phone) callBtn.href = "tel:" + b.phone.replace(/[^\d+]/g, "");
  else { callBtn.classList.add("disabled"); callBtn.textContent = "No phone"; }
  callBtn.addEventListener("click", () => {
    if (store.getStatus(slug) === "new") setStatus(node, slug, "called");
  });

  // status chip
  const chip = $("[data-status]", node);
  applyStatus(chip, store.getStatus(slug));
  chip.addEventListener("click", () => {
    const cur = store.getStatus(slug);
    const next = STATUS_CYCLE[(STATUS_CYCLE.indexOf(cur) + 1) % STATUS_CYCLE.length];
    setStatus(node, slug, next);
  });

  // build button
  const buildBtn = $("[data-build]", node);
  const builtBox = $(".built", node);
  const existing = store.getBuilt(slug);
  if (existing) showBuilt(node, slug, existing, b);
  buildBtn.addEventListener("click", () => buildSite(node, b));

  return node;
}

function applyStatus(chip, v) {
  chip.dataset.v = v;
  chip.textContent = STATUS_LABEL[v] || "New";
}
function setStatus(node, slug, v) {
  store.setStatus(slug, v);
  applyStatus($("[data-status]", node), v);
  if (v === "sold") toast("💰 Marked as sold!");
}

function showBuilt(node, slug, url, business) {
  const abs = absoluteUrl(url);
  const builtBox = $(".built", node);
  const buildBtn = $("[data-build]", node);
  buildBtn.textContent = "✅ Built";
  buildBtn.classList.remove("working");
  builtBox.hidden = false;

  $("[data-preview]", node).href = url;

  $("[data-text]", node).onclick = () => {
    const msg = `Hi${business && business.name ? " " + business.name : ""}! I built you a free website preview — take a look: ${abs}`;
    // sms: opens the messaging app with the body prefilled
    location.href = "sms:?&body=" + encodeURIComponent(msg);
  };
  $("[data-copy]", node).onclick = async () => {
    try { await navigator.clipboard.writeText(abs); toast("Link copied"); }
    catch { prompt("Copy this link:", abs); }
  };
}

async function buildSite(node, business) {
  const buildBtn = $("[data-build]", node);
  buildBtn.classList.add("working");
  buildBtn.innerHTML = '<span class="spin"></span> Building…';
  try {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(business)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed");
    store.setBuilt(business.slug, data.url);
    showBuilt(node, business.slug, data.url, business);
    toast("🛠️ Site ready — preview or text it");
  } catch (e) {
    buildBtn.classList.remove("working");
    buildBtn.textContent = "🛠️ Build site";
    toast("Couldn't build: " + e.message, 2500);
  }
}

// --- search --------------------------------------------------------------
async function find() {
  const query = el.q.value.trim();
  if (!query) { toast("Type a search first"); el.q.focus(); return; }

  el.findBtn.disabled = true;
  el.findBtn.innerHTML = '<span class="spin"></span> Finding…';
  el.status.hidden = true;
  try {
    const res = await fetch("/api/find", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, onlyNoWebsite: el.onlyNoSite.checked })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Search failed");

    el.dataMode.textContent = data.source === "live" ? "live" : "demo";
    el.dataMode.classList.toggle("live", data.source === "live");

    el.results.innerHTML = "";
    if (!data.leads.length) {
      el.empty.hidden = false;
      el.empty.querySelector("p").textContent = "No businesses found for that search.";
    } else {
      el.empty.hidden = true;
      data.leads.forEach((b) => el.results.appendChild(renderLead(b)));
    }
    el.status.hidden = false;
    el.status.textContent =
      `${data.count} lead${data.count === 1 ? "" : "s"} · ${data.source === "live" ? "live data" : "demo data"} · best prospects first`;
    localStorage.setItem("mp-last-query", query);
  } catch (e) {
    toast(e.message, 2500);
  } finally {
    el.findBtn.disabled = false;
    el.findBtn.innerHTML = "🔎 Find leads";
  }
}

// --- init ----------------------------------------------------------------
el.findBtn.addEventListener("click", find);
el.q.addEventListener("keydown", (e) => { if (e.key === "Enter") find(); });
el.q.value = localStorage.getItem("mp-last-query") || "";

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js").catch(() => {});
}
