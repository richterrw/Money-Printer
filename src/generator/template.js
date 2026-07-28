"use strict";

const { themeFor } = require("./themes");
const { profileFor } = require("./layouts");

/* Renders a complete, high-quality website (single HTML file) for one business.
 * Structure is driven by a category *layout profile* (see layouts.js) so a
 * restaurant, a barbershop and a plumber come out as genuinely different sites
 * — different hero, section order, labels, galleries and calls-to-action —
 * not one recolored template. Generated sites are hosted normally, so we use
 * Google Fonts and a keyless embedded Google Map. */

// --- helpers -------------------------------------------------------------

function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function telHref(phone) { return "tel:" + String(phone || "").replace(/[^\d+]/g, ""); }
function locQuery(b) { return [b.name, b.address, b.city, b.region].filter(Boolean).join(", "); }
function mapsHref(b) {
  if (b.placeId) return "https://www.google.com/maps/place/?q=place_id:" + encodeURIComponent(b.placeId);
  return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(locQuery(b));
}
function mapEmbed(b) { return "https://www.google.com/maps?q=" + encodeURIComponent(locQuery(b)) + "&output=embed"; }
function stars(rating) { const r = Math.round(Number(rating) || 0); return "★★★★★☆☆☆☆☆".slice(5 - r, 10 - r); }

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
function normalizeHours(hours) {
  if (!hours) return null;
  if (Array.isArray(hours)) return hours.map(String);
  const out = [];
  for (const day of DAYS) {
    const k3 = day.slice(0, 3).toLowerCase();
    const val = hours[day] || hours[day.toLowerCase()] || hours[k3] || hours[k3.toUpperCase()];
    out.push(`${day}: ${val ? val : "Closed"}`);
  }
  return out;
}
function todayHours(b) {
  const norm = normalizeHours(b.hours);
  if (!norm) return null;
  const today = DAYS[(new Date().getDay() + 6) % 7];
  const hit = norm.find((l) => l.toLowerCase().startsWith(today.toLowerCase()));
  if (!hit) return null;
  const val = hit.split(":").slice(1).join(":").trim();
  return val && !/closed/i.test(val) ? val : (val ? "Closed today" : null);
}
function aboutCopy(b) {
  if (b.description) return b.description;
  const cat = (b.category || "local business").toLowerCase();
  const where = b.city ? `in ${b.city}${b.region ? ", " + b.region : ""}` : "in the neighborhood";
  const trust = b.rating && b.reviewsCount
    ? ` We're proud of the ${b.rating}★ reputation we've earned across ${b.reviewsCount} reviews from customers just like you.`
    : "";
  return `${b.name} is a ${cat} ${where}, built on doing right by our neighbors. Whether it's your first visit or your fiftieth, we bring the same care and quality every time.${trust}`;
}

// --- context ------------------------------------------------------------

function buildContext(b) {
  const theme = themeFor(b.category, b.name);
  const profile = profileFor(theme.key, b);
  const photos = (b.photos || []).filter((u) => typeof u === "string" && u);
  return {
    b, theme, profile, photos,
    heroPhoto: photos[0] || null,
    cityLine: [b.city, b.region].filter(Boolean).join(", "),
    hasPhone: Boolean(b.phone),
    today: todayHours(b)
  };
}

// --- reusable bits ------------------------------------------------------

function chips(ctx) {
  const { b, today } = ctx;
  const rating = b.rating && b.reviewsCount
    ? `<span class="chip"><b>${esc(b.rating)}</b> <span class="chip-stars">${stars(b.rating)}</span> · ${esc(b.reviewsCount)} reviews</span>`
    : "";
  const open = today ? `<span class="chip">🕒 Today: ${esc(today)}</span>` : "";
  return rating + open;
}
function heroButtons(ctx, variant) {
  const { b, hasPhone, profile } = ctx;
  const primary = hasPhone
    ? `<a class="btn btn-primary" href="${telHref(b.phone)}">📞 ${esc(profile.cta)}</a>`
    : `<a class="btn btn-primary" href="${mapsHref(b)}" target="_blank" rel="noopener">📍 Find us</a>`;
  const dirClass = variant === "light" ? "btn-outline" : "btn-ghost";
  const secondary = `<a class="btn ${dirClass}" href="${mapsHref(b)}" target="_blank" rel="noopener">📍 Directions</a>`;
  return `<div class="hero-cta">${primary}${secondary}</div>`;
}

// --- hero variants ------------------------------------------------------

function heroPhotoFull(ctx) {
  const { b, theme, cityLine, heroPhoto } = ctx;
  const tagline = b.tagline || `${b.category || "Your local favorite"}${cityLine ? " in " + cityLine : ""}`;
  return `
  <section class="hero photofull">
    <div class="hero-bg ${heroPhoto ? "" : "grad"}">${heroPhoto ? `<img src="${esc(heroPhoto)}" alt="${esc(b.name || "")}" />` : ""}</div>
    <div class="hero-overlay"></div>
    <div class="wrap"><div class="hero-content">
      <span class="eyebrow">${esc(b.category || "Local business")}${cityLine ? " · " + esc(cityLine) : ""}</span>
      <h1>${esc(b.name || "Welcome")}</h1>
      <p class="lead">${esc(tagline)}</p>
      ${heroButtons(ctx, "dark")}
      <div class="hero-meta">${chips(ctx)}</div>
    </div></div>
    <a class="scroll-cue" href="#main-start" aria-label="Scroll down">▾</a>
  </section>`;
}

function heroSplit(ctx) {
  const { b, theme, cityLine, heroPhoto, photos } = ctx;
  const img = heroPhoto || photos[1];
  const tagline = b.tagline || `${b.category || "Your local favorite"}${cityLine ? " in " + cityLine : ""}`;
  return `
  <section class="hero split">
    <div class="split-grid">
      <div class="split-copy">
        <span class="eyebrow">${esc(b.category || "Local business")}${cityLine ? " · " + esc(cityLine) : ""}</span>
        <h1>${esc(b.name || "Welcome")}</h1>
        <p class="lead">${esc(tagline)}</p>
        ${heroButtons(ctx, "light")}
        <div class="hero-meta">${chips(ctx)}</div>
      </div>
      <div class="split-photo ${img ? "" : "grad"}">${img ? `<img src="${esc(img)}" alt="${esc(b.name || "")}" />` : esc(theme.hero)}</div>
    </div>
  </section>`;
}

function heroMinimal(ctx) {
  const { b, cityLine, profile } = ctx;
  const tagline = b.tagline || `${b.category || "Your trusted local pro"}${cityLine ? " serving " + cityLine : ""}`;
  const badges = (profile.trustBadges || [])
    .map((t) => `<span>${esc(t)}</span>`).join("");
  return `
  <section class="hero minimal">
    <div class="hero-overlay soft"></div>
    <div class="wrap"><div class="hero-content">
      <span class="eyebrow">${esc(b.category || "Local business")}${cityLine ? " · " + esc(cityLine) : ""}</span>
      <h1>${esc(b.name || "Welcome")}</h1>
      <p class="lead">${esc(tagline)}</p>
      ${heroButtons(ctx, "dark")}
      <div class="hero-meta">${chips(ctx)}</div>
      ${badges ? `<div class="trust">${badges}</div>` : ""}
    </div></div>
  </section>`;
}

function renderHero(ctx) {
  switch (ctx.profile.heroStyle) {
    case "split": return heroSplit(ctx);
    case "minimal": return heroMinimal(ctx);
    default: return heroPhotoFull(ctx);
  }
}

// --- content sections ---------------------------------------------------

function renderAbout(ctx) {
  const { b, theme, photos, cityLine, profile } = ctx;
  const sidePhoto = photos[1] || photos[0] || null;
  return `
  <section class="section about" id="about">
    <div class="wrap about-grid">
      <div class="about-copy reveal">
        <p class="kicker">${esc(profile.about.kicker)}</p>
        <h2 class="h2" style="margin-bottom:8px">${esc(profile.about.title)}</h2>
        <p>${esc(aboutCopy(b))}</p>
        <div class="about-stats">
          ${b.rating ? `<div><div class="n">${esc(b.rating)}★</div><div class="l">Average rating</div></div>` : ""}
          ${b.reviewsCount ? `<div><div class="n">${esc(b.reviewsCount)}</div><div class="l">Happy reviews</div></div>` : ""}
          ${b.city ? `<div><div class="n">${esc(b.city)}</div><div class="l">Proudly local</div></div>` : ""}
        </div>
      </div>
      <div class="about-photo ${sidePhoto ? "" : "grad"} reveal" style="--d:120ms">
        ${sidePhoto ? `<img src="${esc(sidePhoto)}" alt="${esc(b.name || "")}" loading="lazy" />` : esc(theme.hero)}
      </div>
    </div>
  </section>`;
}

function renderGallery(ctx) {
  const { b, photos, profile } = ctx;
  const g = photos.slice(1, 9);
  if (g.length < (profile.gallery.min || 2)) return "";
  const style = profile.gallery.style; // "menu" | "showcase"
  const items = g.map((u, i) =>
    `<figure class="gi ${style === "showcase" ? "gi-" + (i % 5) : ""}"><img src="${esc(u)}" alt="${esc(b.name || "")}" loading="lazy" /></figure>`
  ).join("");
  return `
  <section class="section gallery ${style} reveal" id="gallery">
    <div class="wrap">
      <p class="kicker">${esc(profile.gallery.kicker)}</p>
      <h2 class="h2">${esc(profile.gallery.title)}</h2>
      <div class="gallery-grid ${style}">${items}</div>
    </div>
  </section>`;
}

function renderServices(ctx) {
  const { b, theme, profile } = ctx;
  const items = (b.services && b.services.length ? b.services : theme.sampleServices).slice(0, 6);
  const label = profile.services;
  let body;
  if (label.style === "list") {
    body = `<div class="svc-list">${items.map((s) =>
      `<div class="row reveal"><span class="name">${esc(s)}</span><span class="dots"></span><span class="tick">✦</span></div>`
    ).join("")}</div>`;
  } else {
    body = `<div class="svc-grid">${items.map((s, i) =>
      `<article class="svc reveal" style="--d:${i * 50}ms"><span class="svc-ic">${["✦","◆","❖","✧","◈","❉"][i % 6]}</span><h3>${esc(s)}</h3></article>`
    ).join("")}</div>`;
  }
  return `
  <section class="section services" id="services">
    <div class="wrap">
      <p class="kicker reveal">${esc(label.kicker)}</p>
      <h2 class="h2 reveal">${esc(label.title)}</h2>
      ${body}
    </div>
  </section>`;
}

function renderReviews(ctx) {
  const reviews = (ctx.b.reviews || []).filter((r) => r && r.text).slice(0, 3);
  if (!reviews.length) return "";
  return `
  <section class="section reviews reveal" id="reviews">
    <div class="wrap">
      <p class="kicker">Reviews</p>
      <h2 class="h2">Loved by locals</h2>
      <div class="reviews-grid">
        ${reviews.map((r) => `
          <figure class="review">
            <div class="qmark">“</div>
            <div class="review-stars">${stars(r.rating || 5)}</div>
            <blockquote>${esc(r.text)}</blockquote>
            <figcaption>${esc(r.author || "Verified customer")}</figcaption>
          </figure>`).join("")}
      </div>
    </div>
  </section>`;
}

function renderVisit(ctx) {
  const { b, hasPhone, cityLine } = ctx;
  const hours = normalizeHours(b.hours);
  const todayName = DAYS[(new Date().getDay() + 6) % 7];
  const hoursCard = hours
    ? `<div class="panel"><h3 class="panel-title">Opening hours</h3>${hours.map((line) => {
        const [day, ...rest] = line.split(":");
        const isToday = day.trim().toLowerCase() === todayName.toLowerCase();
        return `<div class="hrow${isToday ? " today" : ""}"><span>${esc(day.trim())}</span><span>${esc(rest.join(":").trim())}</span></div>`;
      }).join("")}</div>`
    : "";
  return `
  <section class="section visit" id="visit">
    <div class="wrap">
      <p class="kicker reveal">Visit us</p>
      <h2 class="h2 reveal">Come say hello</h2>
      <div class="visit-grid reveal">
        <div class="map"><iframe title="Map to ${esc(b.name || "us")}" src="${mapEmbed(b)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe></div>
        <div>
          <div class="panel">
            <h3 class="panel-title">Get in touch</h3>
            ${hasPhone ? `<div class="cline"><span class="ic">📞</span><a href="${telHref(b.phone)}">${esc(b.phone)}</a></div>` : ""}
            ${b.address || b.city ? `<div class="cline"><span class="ic">📍</span><a href="${mapsHref(b)}" target="_blank" rel="noopener">${esc([b.address, cityLine].filter(Boolean).join(", "))}</a></div>` : ""}
            ${b.email ? `<div class="cline"><span class="ic">✉️</span><a href="mailto:${esc(b.email)}">${esc(b.email)}</a></div>` : ""}
            <div style="margin-top:16px"><a class="btn btn-dark" href="${mapsHref(b)}" target="_blank" rel="noopener">Open in Maps</a></div>
          </div>
          ${hoursCard}
        </div>
      </div>
    </div>
  </section>`;
}

function renderCta(ctx) {
  const { b, hasPhone, profile } = ctx;
  return `
  <section class="cta">
    <div class="wrap">
      <h2>Ready when you are</h2>
      <p>${hasPhone ? "Give us a call — we'd love to help." : "Stop by or reach out today."}</p>
      ${hasPhone
        ? `<a class="btn btn-primary" href="${telHref(b.phone)}">📞 ${esc(profile.cta)}</a>`
        : `<a class="btn btn-primary" href="${mapsHref(b)}" target="_blank" rel="noopener">📍 Find us</a>`}
    </div>
  </section>`;
}

const SECTIONS = {
  hero: renderHero, about: renderAbout, gallery: renderGallery,
  services: renderServices, reviews: renderReviews, visit: renderVisit, cta: renderCta
};

// --- page shell ---------------------------------------------------------

function renderSite(business) {
  const b = business || {};
  const ctx = buildContext(b);
  const { theme, profile, cityLine, hasPhone, heroPhoto } = ctx;

  // Assemble sections in the profile's order; drop empties.
  const order = profile.order;
  const rendered = order.map((k) => (SECTIONS[k] ? SECTIONS[k](ctx) : "")).filter(Boolean);
  // anchor so photo-full hero's scroll cue lands on the first content section
  const bodyHtml = rendered.map((html, i) =>
    i === 1 ? html.replace("<section", '<span id="main-start"></span><section') : html
  ).join("\n");

  const title = `${b.name || "Local Business"}${cityLine ? " | " + cityLine : ""}`;
  const metaDesc = String(aboutCopy(b)).slice(0, 155);
  const fontsHref = `https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=${encodeURIComponent(theme.font.weights)}&display=swap`;
  const navReviews = b.reviews && b.reviews.length ? '<a href="#reviews">Reviews</a>' : "";
  const navGallery = ctx.photos.length > 2 ? '<a href="#gallery">Gallery</a>' : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(title)}</title>
<meta name="description" content="${esc(metaDesc)}" />
<meta property="og:title" content="${esc(b.name || "Local Business")}" />
<meta property="og:description" content="${esc(metaDesc)}" />
<meta property="og:type" content="business.business" />
${heroPhoto ? `<meta property="og:image" content="${esc(heroPhoto)}" />` : ""}
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="stylesheet" href="${esc(fontsHref)}" />
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>${encodeURIComponent(theme.hero)}</text></svg>" />
<style>
  :root{
    --accent:${profile.accent};--accent2:${theme.accent2};--ink:${theme.ink};
    --bg:${theme.bg};--surface:${theme.surface};--muted:#5b6875;--line:#e6e9f0;
    --display:'${theme.font.display}',Georgia,serif;--sans:'Inter',system-ui,sans-serif;
  }
  *{box-sizing:border-box;margin:0;padding:0}
  html{scroll-behavior:smooth}
  body{font-family:var(--sans);color:var(--ink);background:var(--bg);line-height:1.65;-webkit-font-smoothing:antialiased}
  a{color:inherit;text-decoration:none}
  img{display:block;max-width:100%}
  .wrap{max-width:1140px;margin:0 auto;padding:0 24px}
  h1,h2,h3,.display{font-family:var(--display);font-weight:700;line-height:1.1;letter-spacing:-.01em}
  .kicker{text-transform:uppercase;letter-spacing:.18em;font-size:.74rem;font-weight:700;color:var(--accent);margin-bottom:10px}
  .h2{font-size:clamp(1.8rem,3.6vw,2.7rem);margin-bottom:34px}
  .btn{display:inline-flex;align-items:center;gap:9px;padding:15px 28px;border-radius:999px;font-weight:700;font-size:1rem;cursor:pointer;border:2px solid transparent;transition:.18s}
  .btn-primary{background:var(--accent);color:#fff;box-shadow:0 10px 30px -8px var(--accent)}
  .btn-primary:hover{transform:translateY(-2px);filter:brightness(1.06)}
  .btn-ghost{background:rgba(255,255,255,.12);border-color:rgba(255,255,255,.5);color:#fff}
  .btn-ghost:hover{background:rgba(255,255,255,.2)}
  .btn-outline{background:transparent;border-color:var(--line);color:var(--ink)}
  .btn-outline:hover{border-color:var(--accent);color:var(--accent)}
  .btn-dark{background:var(--ink);color:#fff}
  .btn-dark:hover{transform:translateY(-2px)}
  .hero-cta{margin-top:32px;display:flex;gap:14px;flex-wrap:wrap}
  .hero-meta{margin-top:28px;display:flex;gap:12px;flex-wrap:wrap}
  .chip{display:inline-flex;align-items:center;gap:7px;padding:9px 16px;border-radius:999px;font-size:.92rem;font-weight:600}
  .chip-stars{color:#ffd15c;letter-spacing:1px}

  /* header */
  header.site{position:fixed;top:0;left:0;right:0;z-index:40;transition:.3s}
  header.site .wrap{display:flex;align-items:center;justify-content:space-between;height:74px}
  .brand{display:flex;align-items:center;gap:11px;font-family:var(--display);font-weight:700;font-size:1.2rem;color:#fff}
  .brand .mark{width:40px;height:40px;border-radius:12px;display:grid;place-items:center;background:linear-gradient(135deg,var(--accent),var(--accent2));font-size:1.15rem}
  header.site .nav{display:flex;gap:26px;align-items:center}
  header.site .nav a{color:rgba(255,255,255,.9);font-weight:600;font-size:.95rem}
  header.site.solid{background:var(--surface);box-shadow:0 2px 20px rgba(0,0,0,.08)}
  header.site.solid .brand,header.site.solid .nav a{color:var(--ink)}
  header.site .nav .btn-primary{color:#fff}
  header.site.light .brand,header.site.light .nav a{color:var(--ink)}
  @media(max-width:760px){header.site .nav a:not(.btn){display:none}}

  /* hero shared */
  .hero{position:relative;overflow:hidden}
  .eyebrow{display:inline-flex;gap:8px;font-weight:700;font-size:.82rem;padding:8px 16px;border-radius:999px;margin-bottom:22px}
  .hero h1{font-size:clamp(2.5rem,6vw,4.4rem)}
  .hero .lead{margin-top:18px;font-size:clamp(1.05rem,2vw,1.3rem);max-width:48ch}
  .scroll-cue{position:absolute;bottom:26px;left:50%;transform:translateX(-50%);z-index:3;color:rgba(255,255,255,.85);font-size:1.5rem;animation:bob 1.8s ease-in-out infinite}
  @keyframes bob{0%,100%{transform:translate(-50%,0)}50%{transform:translate(-50%,8px)}}

  /* hero: photo-full */
  .hero.photofull{min-height:92vh;display:flex;align-items:center;color:#fff}
  .hero.photofull .hero-bg{position:absolute;inset:0;z-index:0}
  .hero.photofull .hero-bg img{width:100%;height:100%;object-fit:cover}
  .hero.photofull .hero-bg.grad{background:radial-gradient(1000px 600px at 75% 15%,var(--accent2),transparent),linear-gradient(135deg,var(--accent),var(--ink))}
  .hero.photofull .hero-overlay{position:absolute;inset:0;z-index:1;background:linear-gradient(180deg,rgba(10,12,16,.55),rgba(10,12,16,.32) 42%,rgba(10,12,16,.82))}
  .hero.photofull .hero-content{position:relative;z-index:2;padding:120px 0 74px;max-width:760px}
  .hero.photofull .eyebrow{background:rgba(255,255,255,.16);backdrop-filter:blur(6px)}
  .hero.photofull h1{text-shadow:0 2px 30px rgba(0,0,0,.3)}
  .hero.photofull .lead{color:rgba(255,255,255,.92)}
  .hero.photofull .chip{background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.22);backdrop-filter:blur(6px)}

  /* hero: split */
  .hero.split{color:var(--ink);background:var(--surface)}
  .hero.split .split-grid{display:grid;grid-template-columns:1.02fr .98fr;min-height:90vh}
  .hero.split .split-copy{display:flex;flex-direction:column;justify-content:center;padding:120px 5.5vw 74px}
  .hero.split .split-photo{position:relative;overflow:hidden}
  .hero.split .split-photo img{width:100%;height:100%;object-fit:cover}
  .hero.split .split-photo.grad{background:linear-gradient(135deg,var(--accent),var(--accent2));display:grid;place-items:center;font-size:8rem;color:#fff}
  .hero.split .eyebrow{background:color-mix(in srgb,var(--accent) 12%,transparent);color:var(--accent)}
  .hero.split .lead{color:var(--muted)}
  .hero.split .chip{background:var(--bg);border:1px solid var(--line)}
  .hero.split .btn-ghost{background:var(--ink);border-color:var(--ink);color:#fff}
  @media(max-width:860px){.hero.split .split-grid{grid-template-columns:1fr}.hero.split .split-photo{min-height:44vh;order:-1}.hero.split .split-copy{padding:110px 24px 54px}}

  /* hero: minimal */
  .hero.minimal{color:#fff;background:linear-gradient(140deg,var(--accent),var(--ink))}
  .hero.minimal .hero-overlay.soft{position:absolute;inset:0;z-index:0;background:radial-gradient(800px 500px at 80% 0%,rgba(255,255,255,.14),transparent)}
  .hero.minimal .hero-content{position:relative;z-index:1;padding:150px 0 96px;max-width:860px}
  .hero.minimal .eyebrow{background:rgba(255,255,255,.16)}
  .hero.minimal .lead{color:rgba(255,255,255,.92)}
  .hero.minimal .chip{background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.22)}
  .hero.minimal .trust{margin-top:30px;display:flex;gap:24px;flex-wrap:wrap}
  .hero.minimal .trust span{display:flex;align-items:center;gap:9px;font-weight:600}
  .hero.minimal .trust span::before{content:"✓";display:grid;place-items:center;width:24px;height:24px;border-radius:50%;background:rgba(255,255,255,.22);font-size:.8rem}

  /* sections */
  .section{padding:92px 0}
  .about-grid{display:grid;grid-template-columns:1fr 1fr;gap:56px;align-items:center}
  @media(max-width:860px){.about-grid{grid-template-columns:1fr;gap:32px}}
  .about-copy p{font-size:1.12rem;color:var(--muted);margin-top:14px}
  .about-photo{border-radius:22px;overflow:hidden;aspect-ratio:4/3;box-shadow:0 30px 60px -28px rgba(0,0,0,.4)}
  .about-photo.grad{background:linear-gradient(135deg,var(--accent),var(--accent2));display:grid;place-items:center;font-size:6rem}
  .about-photo img{width:100%;height:100%;object-fit:cover}
  .about-stats{display:flex;gap:34px;margin-top:26px;flex-wrap:wrap}
  .about-stats .n{font-family:var(--display);font-size:2rem;color:var(--accent)}
  .about-stats .l{color:var(--muted);font-size:.9rem}

  .services{background:var(--surface);border-block:1px solid var(--line)}
  .svc-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}
  @media(max-width:820px){.svc-grid{grid-template-columns:1fr 1fr}}
  @media(max-width:520px){.svc-grid{grid-template-columns:1fr}}
  .svc{background:var(--bg);border:1px solid var(--line);border-radius:18px;padding:26px 24px;transition:.2s}
  .svc:hover{transform:translateY(-4px);border-color:var(--accent);box-shadow:0 20px 40px -24px var(--accent)}
  .svc-ic{display:inline-grid;place-items:center;width:46px;height:46px;border-radius:12px;font-size:1.2rem;color:var(--accent);background:color-mix(in srgb,var(--accent) 12%,transparent);margin-bottom:14px}
  .svc h3{font-size:1.18rem}
  .svc-list{max-width:780px;margin:0 auto}
  .svc-list .row{display:flex;align-items:baseline;gap:12px;padding:18px 4px;border-bottom:1px solid var(--line)}
  .svc-list .row .name{font-family:var(--display);font-size:1.3rem}
  .svc-list .row .dots{flex:1;border-bottom:2px dotted var(--line);transform:translateY(-5px)}
  .svc-list .row .tick{color:var(--accent)}

  .gallery-grid.showcase{display:grid;grid-template-columns:repeat(4,1fr);grid-auto-rows:170px;gap:14px}
  @media(max-width:820px){.gallery-grid.showcase{grid-template-columns:repeat(2,1fr)}}
  .gallery-grid.menu{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
  @media(max-width:720px){.gallery-grid.menu{grid-template-columns:repeat(2,1fr)}}
  .gallery-grid.menu .gi{aspect-ratio:4/3}
  .gi{overflow:hidden;border-radius:16px;border:1px solid var(--line);background:var(--surface)}
  .gi img{width:100%;height:100%;object-fit:cover;transition:.4s}
  .gi:hover img{transform:scale(1.06)}
  .gallery-grid.showcase .gi-0{grid-column:span 2;grid-row:span 2}
  @media(max-width:820px){.gallery-grid.showcase .gi-0{grid-column:span 2;grid-row:span 1}}

  .reviews-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:22px}
  @media(max-width:860px){.reviews-grid{grid-template-columns:1fr}}
  .review{position:relative;background:var(--surface);border:1px solid var(--line);border-radius:20px;padding:30px 28px 26px}
  .qmark{font-family:var(--display);font-size:4rem;line-height:.6;color:color-mix(in srgb,var(--accent) 30%,transparent);height:26px}
  .review-stars{color:#f5a623;letter-spacing:2px;margin:6px 0 10px}
  .review blockquote{font-size:1.05rem}
  .review figcaption{margin-top:14px;font-weight:700;color:var(--accent)}

  .visit-grid{display:grid;grid-template-columns:1.3fr .7fr;gap:28px;align-items:stretch}
  @media(max-width:860px){.visit-grid{grid-template-columns:1fr}}
  .map{border-radius:20px;overflow:hidden;border:1px solid var(--line);min-height:380px;background:var(--surface)}
  .map iframe{width:100%;height:100%;min-height:380px;border:0;filter:saturate(1.05)}
  .panel{background:var(--surface);border:1px solid var(--line);border-radius:20px;padding:26px;margin-bottom:20px}
  .panel:last-child{margin-bottom:0}
  .panel-title{font-size:1.2rem;margin-bottom:14px}
  .cline{display:flex;align-items:center;gap:12px;padding:9px 0;font-weight:600}
  .cline .ic{width:40px;height:40px;border-radius:11px;flex:none;display:grid;place-items:center;background:color-mix(in srgb,var(--accent) 12%,transparent);color:var(--accent)}
  .hrow{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px dashed var(--line);font-size:.96rem}
  .hrow:last-child{border-bottom:none}
  .hrow span:first-child{color:var(--muted)}
  .hrow.today{font-weight:700;color:var(--accent)}
  .hrow.today span:first-child{color:var(--accent)}

  .cta{color:#fff;text-align:center;padding:96px 0;background:linear-gradient(135deg,var(--accent),var(--ink))}
  .cta h2{font-size:clamp(2rem,4.5vw,3rem);margin-bottom:14px}
  .cta p{opacity:.92;margin-bottom:28px;font-size:1.15rem}
  .cta .btn-primary{background:#fff;color:var(--accent)}

  footer.site{background:var(--ink);color:rgba(255,255,255,.75);padding:40px 0}
  footer.site .wrap{display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;align-items:center}
  footer.site .brand{color:#fff;font-size:1.05rem}

  .callbar{position:fixed;left:0;right:0;bottom:0;z-index:50;display:none;padding:12px 16px;background:var(--surface);border-top:1px solid var(--line)}
  .callbar .btn{width:100%;justify-content:center}
  @media(max-width:760px){.callbar{display:block}body{padding-bottom:80px}}

  .reveal{opacity:0;transform:translateY(26px);transition:opacity .7s ease,transform .7s ease;transition-delay:var(--d,0ms)}
  .reveal.in{opacity:1;transform:none}
  @media(prefers-reduced-motion:reduce){.reveal{opacity:1;transform:none}}
</style>
</head>
<body>
  <header class="site ${profile.heroStyle === "split" ? "light" : ""}" id="hdr">
    <div class="wrap">
      <a class="brand" href="#top"><span class="mark">${esc(theme.hero)}</span> ${esc(b.name || "Local Business")}</a>
      <nav class="nav">
        <a href="#about">About</a>
        <a href="#services">Services</a>
        ${navGallery}
        ${navReviews}
        <a href="#visit">Visit</a>
        ${hasPhone ? `<a class="btn btn-primary" href="${telHref(b.phone)}">${esc(profile.ctaShort)}</a>` : ""}
      </nav>
    </div>
  </header>

  <main id="top">
    ${bodyHtml}
  </main>

  <footer class="site">
    <div class="wrap">
      <span class="brand"><span class="mark" style="width:32px;height:32px">${esc(theme.hero)}</span> ${esc(b.name || "Local Business")}</span>
      <span>© ${new Date().getFullYear()} ${esc(b.name || "Local Business")}${cityLine ? " · " + esc(cityLine) : ""}</span>
    </div>
  </footer>

  ${hasPhone ? `<div class="callbar"><a class="btn btn-primary" href="${telHref(b.phone)}">📞 ${esc(profile.cta)}</a></div>` : ""}

  <script>
    var hdr = document.getElementById('hdr');
    var splitHero = ${profile.heroStyle === "split" ? "true" : "false"};
    var onScroll = function(){
      var solid = window.scrollY > window.innerHeight * (splitHero ? 0.5 : 0.7);
      hdr.classList.toggle('solid', solid);
      if (splitHero) hdr.classList.toggle('light', !solid);
    };
    onScroll(); window.addEventListener('scroll', onScroll, { passive: true });
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    document.querySelectorAll('.reveal').forEach(function(el){ io.observe(el); });
  </script>
</body>
</html>`;
}

module.exports = { renderSite };
