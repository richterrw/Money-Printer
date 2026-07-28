/* Money Printer — an incremental "go brrr" clicker.
 * Pure vanilla JS, no dependencies, state persisted to localStorage. */
(function () {
  "use strict";

  var SAVE_KEY = "money-printer-save-v1";
  var TICK_MS = 100; // game loop resolution

  // Upgrade catalogue. Each purchase multiplies the next cost by `growth`.
  // `clickPower` adds to money-per-click; `rate` adds to money-per-second.
  var UPGRADES = [
    { id: "ink",       icon: "🖋️", name: "Better Ink",       desc: "+$1 per click",            baseCost: 15,      growth: 1.15, clickPower: 1,      rate: 0 },
    { id: "intern",    icon: "🧑‍💼", name: "Intern",           desc: "Presses the button. +$0.5/s", baseCost: 50,   growth: 1.15, clickPower: 0,      rate: 0.5 },
    { id: "printer2",  icon: "🖨️", name: "Second Printer",    desc: "+$3/s",                    baseCost: 250,     growth: 1.16, clickPower: 0,      rate: 3 },
    { id: "toner",     icon: "🎨", name: "Premium Toner",     desc: "+$5 per click",            baseCost: 1000,    growth: 1.17, clickPower: 5,      rate: 0 },
    { id: "warehouse", icon: "🏭", name: "Print Warehouse",   desc: "+$40/s",                   baseCost: 6000,    growth: 1.18, clickPower: 0,      rate: 40 },
    { id: "mint",      icon: "🏦", name: "Private Mint",      desc: "+$250/s",                  baseCost: 45000,   growth: 1.19, clickPower: 0,      rate: 250 },
    { id: "reserve",   icon: "🏛️", name: "Federal Reserve",  desc: "+$2,000/s",                baseCost: 350000,  growth: 1.20, clickPower: 0,      rate: 2000 },
    { id: "quantum",   icon: "🌀", name: "Quantum Presses",   desc: "+$100 per click, +$18k/s", baseCost: 3000000, growth: 1.22, clickPower: 100,    rate: 18000 }
  ];

  var state = {
    balance: 0,
    totalPrinted: 0,
    owned: {} // id -> count
  };

  // ---- persistence ----
  function load() {
    try {
      var raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return;
      var data = JSON.parse(raw);
      state.balance = Number(data.balance) || 0;
      state.totalPrinted = Number(data.totalPrinted) || 0;
      state.owned = data.owned && typeof data.owned === "object" ? data.owned : {};
    } catch (e) { /* ignore corrupt save */ }
  }
  function save() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (e) {}
  }

  // ---- derived values ----
  function ownedCount(id) { return state.owned[id] || 0; }

  function perClick() {
    var base = 1;
    UPGRADES.forEach(function (u) { base += u.clickPower * ownedCount(u.id); });
    return base;
  }
  function perSecond() {
    var total = 0;
    UPGRADES.forEach(function (u) { total += u.rate * ownedCount(u.id); });
    return total;
  }
  function costOf(u) {
    return Math.floor(u.baseCost * Math.pow(u.growth, ownedCount(u.id)));
  }

  // ---- formatting ----
  var SUFFIXES = ["", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc"];
  function fmt(n) {
    if (n < 1000) return "$" + (Number.isInteger(n) ? n : n.toFixed(1));
    var tier = Math.floor(Math.log10(n) / 3);
    if (tier >= SUFFIXES.length) tier = SUFFIXES.length - 1;
    var scaled = n / Math.pow(10, tier * 3);
    return "$" + scaled.toFixed(2) + SUFFIXES[tier];
  }

  // ---- DOM ----
  var el = {
    balance: document.getElementById("balance"),
    rate: document.getElementById("rate"),
    perClick: document.getElementById("perClick"),
    total: document.getElementById("total"),
    printer: document.getElementById("printer"),
    floaters: document.getElementById("floaters"),
    shopList: document.getElementById("shopList"),
    resetBtn: document.getElementById("resetBtn")
  };

  function renderStats() {
    el.balance.textContent = fmt(state.balance);
    el.rate.textContent = fmt(perSecond()) + "/s";
    el.perClick.textContent = fmt(perClick());
    el.total.textContent = fmt(state.totalPrinted);
  }

  function buildShop() {
    el.shopList.innerHTML = "";
    UPGRADES.forEach(function (u) {
      var btn = document.createElement("button");
      btn.className = "upgrade";
      btn.dataset.id = u.id;
      btn.innerHTML =
        '<span class="icon">' + u.icon + "</span>" +
        '<span class="info">' +
          '<span class="name">' + u.name + "</span>" +
          '<span class="desc">' + u.desc + "</span>" +
          '<span class="owned" data-owned></span>' +
        "</span>" +
        '<span class="cost" data-cost></span>';
      btn.addEventListener("click", function () { buy(u.id); });
      el.shopList.appendChild(btn);
    });
    refreshShop();
  }

  function refreshShop() {
    UPGRADES.forEach(function (u) {
      var btn = el.shopList.querySelector('[data-id="' + u.id + '"]');
      if (!btn) return;
      var cost = costOf(u);
      var affordable = state.balance >= cost;
      btn.disabled = !affordable;
      btn.classList.toggle("cant", !affordable);
      btn.querySelector("[data-cost]").textContent = fmt(cost);
      var count = ownedCount(u.id);
      btn.querySelector("[data-owned]").textContent = count ? "Owned: " + count : "";
    });
  }

  // ---- actions ----
  function earn(amount) {
    state.balance += amount;
    state.totalPrinted += amount;
  }

  function buy(id) {
    var u = UPGRADES.filter(function (x) { return x.id === id; })[0];
    if (!u) return;
    var cost = costOf(u);
    if (state.balance < cost) return;
    state.balance -= cost;
    state.owned[id] = ownedCount(id) + 1;
    renderStats();
    refreshShop();
    save();
  }

  function floatText(text) {
    var f = document.createElement("span");
    f.className = "floater";
    f.textContent = text;
    var rect = el.printer.getBoundingClientRect();
    var host = el.floaters.getBoundingClientRect();
    f.style.left = (rect.left - host.left + rect.width / 2 - 20 + (Math.random() * 60 - 30)) + "px";
    f.style.top = (rect.top - host.top + 20) + "px";
    el.floaters.appendChild(f);
    setTimeout(function () { f.remove(); }, 1000);
  }

  var printingTimeout = null;
  function handleClick() {
    var gain = perClick();
    earn(gain);
    floatText("+" + fmt(gain));
    el.printer.classList.add("printing");
    clearTimeout(printingTimeout);
    printingTimeout = setTimeout(function () {
      el.printer.classList.remove("printing");
    }, 200);
    renderStats();
    refreshShop();
  }

  // ---- loop ----
  var lastTick = Date.now();
  function loop() {
    var now = Date.now();
    var dt = (now - lastTick) / 1000;
    lastTick = now;
    var rate = perSecond();
    if (rate > 0) {
      earn(rate * dt);
      renderStats();
      refreshShop();
      el.printer.classList.add("printing"); // keep the lights on while passive income flows
    }
  }

  function reset() {
    if (!confirm("Reset all progress? This cannot be undone.")) return;
    state.balance = 0;
    state.totalPrinted = 0;
    state.owned = {};
    save();
    renderStats();
    refreshShop();
  }

  // ---- init ----
  function init() {
    load();
    buildShop();
    renderStats();
    el.printer.addEventListener("click", handleClick);
    el.resetBtn.addEventListener("click", reset);
    setInterval(loop, TICK_MS);
    setInterval(save, 5000);
    window.addEventListener("beforeunload", save);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
