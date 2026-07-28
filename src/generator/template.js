"use strict";

const { themeFor } = require("./themes");

/* Renders a complete, self-contained website (single HTML file, inline CSS)
 * for one business. Self-contained on purpose: the whole pitch is "here's a
 * link, open it on your phone" — one file hosts and shares trivially. */

// --- small helpers -------------------------------------------------------

function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function telHref(phone) {
  return "tel:" + String(phone || "").replace(/[^\d+]/g, "");
}

function mapsHref(b) {
  if (b.placeId) return "https://www.google.com/maps/place/?q=place_id:" + encodeURIComponent(b.placeId);
  const q = [b.name, b.address, b.city, b.region].filter(Boolean).join(", ");
  return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(q);
}

function initials(name) {
  return String(name || "?")
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] || "")
    .join("")
    .toUpperCase();
}

function stars(rating) {
  const r = Math.round(Number(rating) || 0);
  return "★★★★★☆☆☆☆☆".slice(5 - r, 10 - r);
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function normalizeHours(hours) {
  if (!hours) return null;
  if (Array.isArray(hours)) return hours.map((h) => String(h)); // already display strings
  // object keyed by day (full or 3-letter) -> string
  const out = [];
  for (const day of DAYS) {
    const k3 = day.slice(0, 3).toLowerCase();
    const val = hours[day] || hours[day.toLowerCase()] || hours[k3] || hours[k3.toUpperCase()];
    out.push(`${day}: ${val ? val : "Closed"}`);
  }
  return out;
}

// --- sections ------------------------------------------------------------

function servicesList(b, theme) {
  const items = (b.services && b.services.length ? b.services : theme.sampleServices).slice(0, 6);
  return items
    .map(
      (s) => `
        <li class="service">
          <span class="service-dot"></span>
          <span>${esc(s)}</span>
        </li>`
    )
    .join("");
}

function reviewsSection(b) {
  const reviews = (b.reviews || []).filter((r) => r && r.text).slice(0, 3);
  if (!reviews.length) return "";
  const cards = reviews
    .map(
      (r) => `
        <figure class="review">
          <div class="review-stars">${stars(r.rating || 5)}</div>
          <blockquote>${esc(r.text)}</blockquote>
          <figcaption>— ${esc(r.author || "Verified customer")}</figcaption>
        </figure>`
    )
    .join("");
  return `
    <section class="section reviews" id="reviews">
      <h2 class="section-title">What people say</h2>
      <div class="reviews-grid">${cards}</div>
    </section>`;
}

function hoursSection(b) {
  const hours = normalizeHours(b.hours);
  if (!hours) return "";
  const rows = hours
    .map((line) => {
      const [day, ...rest] = line.split(":");
      return `<div class="hours-row"><span>${esc(day.trim())}</span><span>${esc(rest.join(":").trim())}</span></div>`;
    })
    .join("");
  return `
    <div class="card hours-card">
      <h3 class="card-title">Hours</h3>
      ${rows}
    </div>`;
}

// --- main render ---------------------------------------------------------

function renderSite(business) {
  const b = business || {};
  const theme = themeFor(b.category, b.name);
  const cityLine = [b.city, b.region].filter(Boolean).join(", ");
  const tagline =
    b.tagline ||
    b.description ||
    `${b.category ? b.category + " in " : ""}${b.city || "your neighborhood"} — quality service you can count on.`;
  const hasPhone = Boolean(b.phone);
  const ratingBadge =
    b.rating && b.reviewsCount
      ? `<div class="rating-badge"><span class="rating-num">${esc(b.rating)}</span><span class="rating-stars">${stars(
          b.rating
        )}</span><span class="rating-count">${esc(b.reviewsCount)} reviews</span></div>`
      : "";

  const title = `${b.name || "Local Business"}${cityLine ? " | " + cityLine : ""}`;
  const metaDesc = String(tagline).slice(0, 155);

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
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>${encodeURIComponent(
    theme.hero
  )}</text></svg>" />
<style>
  :root{
    --accent:${theme.accent};--accent2:${theme.accent2};--ink:${theme.ink};
    --bg:${theme.bg};--surface:${theme.surface};--muted:#5b6875;--line:#e7ebf0;
  }
  *{box-sizing:border-box;margin:0;padding:0}
  html{scroll-behavior:smooth}
  body{font-family:"Segoe UI",system-ui,-apple-system,Roboto,Helvetica,Arial,sans-serif;
    color:var(--ink);background:var(--bg);line-height:1.6;-webkit-font-smoothing:antialiased}
  a{color:inherit;text-decoration:none}
  .wrap{max-width:1080px;margin:0 auto;padding:0 20px}
  .btn{display:inline-flex;align-items:center;gap:8px;padding:14px 26px;border-radius:999px;
    font-weight:700;font-size:1rem;cursor:pointer;border:2px solid transparent;transition:.15s;white-space:nowrap}
  .btn-primary{background:var(--accent);color:#fff;box-shadow:0 8px 24px -6px var(--accent)}
  .btn-primary:hover{transform:translateY(-2px)}
  .btn-ghost{background:transparent;border-color:var(--line);color:var(--ink)}
  .btn-ghost:hover{border-color:var(--accent);color:var(--accent)}

  /* header */
  .site-header{position:sticky;top:0;z-index:40;background:color-mix(in srgb,var(--surface) 88%,transparent);
    backdrop-filter:blur(10px);border-bottom:1px solid var(--line)}
  .site-header .wrap{display:flex;align-items:center;justify-content:space-between;height:64px}
  .brand{display:flex;align-items:center;gap:10px;font-weight:800;font-size:1.15rem}
  .brand .mark{width:36px;height:36px;border-radius:10px;display:grid;place-items:center;
    background:linear-gradient(135deg,var(--accent),var(--accent2));font-size:1.1rem}
  .nav{display:flex;gap:22px;align-items:center}
  .nav a{color:var(--muted);font-weight:600;font-size:.95rem}
  .nav a:hover{color:var(--accent)}
  @media(max-width:720px){.nav a:not(.btn){display:none}}

  /* hero */
  .hero{position:relative;overflow:hidden;padding:76px 0 64px;
    background:radial-gradient(900px 420px at 78% -10%,color-mix(in srgb,var(--accent2) 22%,transparent),transparent),
      linear-gradient(180deg,var(--surface),var(--bg))}
  .hero-grid{display:grid;grid-template-columns:1.15fr .85fr;gap:40px;align-items:center}
  @media(max-width:820px){.hero-grid{grid-template-columns:1fr;text-align:center}}
  .eyebrow{display:inline-block;font-weight:700;letter-spacing:.5px;text-transform:uppercase;
    font-size:.78rem;color:var(--accent);background:color-mix(in srgb,var(--accent) 12%,transparent);
    padding:6px 14px;border-radius:999px;margin-bottom:18px}
  .hero h1{font-size:clamp(2.1rem,5vw,3.4rem);line-height:1.08;letter-spacing:-.5px}
  .hero p.lead{margin-top:16px;font-size:1.15rem;color:var(--muted);max-width:34ch}
  @media(max-width:820px){.hero p.lead{margin-inline:auto}}
  .hero-cta{margin-top:28px;display:flex;gap:12px;flex-wrap:wrap}
  @media(max-width:820px){.hero-cta{justify-content:center}}
  .hero-visual{aspect-ratio:1;border-radius:24px;display:grid;place-items:center;position:relative;
    background:linear-gradient(135deg,var(--accent),var(--accent2));box-shadow:0 30px 60px -20px var(--accent)}
  .hero-visual .emoji{font-size:clamp(5rem,16vw,9rem);filter:drop-shadow(0 8px 16px rgba(0,0,0,.25))}
  .rating-badge{position:absolute;bottom:-18px;left:50%;transform:translateX(-50%);background:var(--surface);
    border:1px solid var(--line);border-radius:16px;padding:12px 18px;display:flex;flex-direction:column;
    align-items:center;box-shadow:0 12px 30px -12px rgba(0,0,0,.3);min-width:140px}
  .rating-num{font-size:1.6rem;font-weight:800;line-height:1}
  .rating-stars{color:#f5a623;letter-spacing:2px}
  .rating-count{font-size:.75rem;color:var(--muted)}

  /* sections */
  .section{padding:64px 0}
  .section-title{font-size:1.9rem;letter-spacing:-.3px;margin-bottom:8px;text-align:center}
  .section-sub{text-align:center;color:var(--muted);margin-bottom:36px}
  .services{background:var(--surface);border-block:1px solid var(--line)}
  .services-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:14px 40px;max-width:760px;margin:0 auto;list-style:none}
  @media(max-width:640px){.services-grid{grid-template-columns:1fr}}
  .service{display:flex;align-items:center;gap:14px;padding:16px 18px;border:1px solid var(--line);
    border-radius:14px;background:var(--bg);font-weight:600}
  .service-dot{width:12px;height:12px;border-radius:50%;flex:none;
    background:linear-gradient(135deg,var(--accent),var(--accent2))}

  /* reviews */
  .reviews-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
  @media(max-width:820px){.reviews-grid{grid-template-columns:1fr}}
  .review{background:var(--surface);border:1px solid var(--line);border-radius:18px;padding:24px}
  .review-stars{color:#f5a623;letter-spacing:2px;margin-bottom:10px}
  .review blockquote{font-size:1.02rem;margin-bottom:14px}
  .review figcaption{color:var(--muted);font-weight:600;font-size:.9rem}

  /* contact */
  .contact{background:var(--surface);border-top:1px solid var(--line)}
  .contact-grid{display:grid;grid-template-columns:1fr 1fr;gap:24px}
  @media(max-width:720px){.contact-grid{grid-template-columns:1fr}}
  .card{background:var(--bg);border:1px solid var(--line);border-radius:18px;padding:26px}
  .card-title{font-size:1.15rem;margin-bottom:14px}
  .contact-line{display:flex;align-items:center;gap:12px;padding:8px 0;font-weight:600}
  .contact-line .ic{width:38px;height:38px;border-radius:10px;flex:none;display:grid;place-items:center;
    background:color-mix(in srgb,var(--accent) 12%,transparent);color:var(--accent)}
  .contact-line a:hover{color:var(--accent)}
  .hours-row{display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px dashed var(--line);font-size:.95rem}
  .hours-row:last-child{border-bottom:none}
  .hours-row span:first-child{color:var(--muted)}

  /* cta band */
  .cta-band{background:linear-gradient(135deg,var(--accent),var(--accent2));color:#fff;text-align:center;padding:56px 0}
  .cta-band h2{font-size:1.9rem;margin-bottom:10px}
  .cta-band p{opacity:.92;margin-bottom:24px}
  .cta-band .btn{background:#fff;color:var(--accent)}

  /* footer */
  .site-footer{padding:34px 0;text-align:center;color:var(--muted);font-size:.9rem}

  /* sticky mobile call bar */
  .callbar{position:fixed;left:0;right:0;bottom:0;z-index:50;display:none;
    background:var(--surface);border-top:1px solid var(--line);padding:10px 14px}
  .callbar .btn{width:100%;justify-content:center}
  @media(max-width:720px){.callbar{display:block}body{padding-bottom:76px}}
</style>
</head>
<body>
  <header class="site-header">
    <div class="wrap">
      <a class="brand" href="#top">
        <span class="mark">${esc(theme.hero)}</span>
        <span>${esc(b.name || "Local Business")}</span>
      </a>
      <nav class="nav">
        <a href="#services">Services</a>
        ${b.reviews && b.reviews.length ? '<a href="#reviews">Reviews</a>' : ""}
        <a href="#contact">Contact</a>
        ${hasPhone ? `<a class="btn btn-primary" href="${telHref(b.phone)}">Call ${esc(b.phone)}</a>` : ""}
      </nav>
    </div>
  </header>

  <main id="top">
    <section class="hero">
      <div class="wrap hero-grid">
        <div class="hero-copy">
          <span class="eyebrow">${esc(b.category || "Local business")}${cityLine ? " · " + esc(cityLine) : ""}</span>
          <h1>${esc(b.name || "Welcome")}</h1>
          <p class="lead">${esc(tagline)}</p>
          <div class="hero-cta">
            ${hasPhone ? `<a class="btn btn-primary" href="${telHref(b.phone)}">📞 Call now</a>` : ""}
            <a class="btn btn-ghost" href="${mapsHref(b)}" target="_blank" rel="noopener">📍 Get directions</a>
          </div>
        </div>
        <div class="hero-visual">
          <span class="emoji">${esc(theme.hero)}</span>
          ${ratingBadge}
        </div>
      </div>
    </section>

    <section class="section services" id="services">
      <h2 class="section-title">What we offer</h2>
      <p class="section-sub">${esc(cityLine || "Serving the local community")}</p>
      <ul class="services-grid">
        ${servicesList(b, theme)}
      </ul>
    </section>

    ${reviewsSection(b)}

    <section class="section contact" id="contact">
      <h2 class="section-title">Visit or get in touch</h2>
      <p class="section-sub">We'd love to hear from you</p>
      <div class="wrap contact-grid">
        <div class="card">
          <h3 class="card-title">Contact</h3>
          ${
            hasPhone
              ? `<div class="contact-line"><span class="ic">📞</span><a href="${telHref(b.phone)}">${esc(
                  b.phone
                )}</a></div>`
              : ""
          }
          ${
            b.address || b.city
              ? `<div class="contact-line"><span class="ic">📍</span><a href="${mapsHref(
                  b
                )}" target="_blank" rel="noopener">${esc([b.address, cityLine].filter(Boolean).join(", "))}</a></div>`
              : ""
          }
          ${
            b.email
              ? `<div class="contact-line"><span class="ic">✉️</span><a href="mailto:${esc(b.email)}">${esc(
                  b.email
                )}</a></div>`
              : ""
          }
          <div style="margin-top:18px">
            <a class="btn btn-primary" href="${mapsHref(b)}" target="_blank" rel="noopener">Open in Maps</a>
          </div>
        </div>
        ${hoursSection(b) || '<div class="card"><h3 class="card-title">Find us</h3><p style="color:var(--muted)">Call ahead for current hours and availability.</p></div>'}
      </div>
    </section>

    <section class="cta-band">
      <div class="wrap">
        <h2>Ready when you are</h2>
        <p>${hasPhone ? "Give us a call — we're happy to help." : "Reach out today and let's get started."}</p>
        ${
          hasPhone
            ? `<a class="btn" href="${telHref(b.phone)}">📞 Call ${esc(b.phone)}</a>`
            : `<a class="btn" href="${mapsHref(b)}" target="_blank" rel="noopener">📍 Find us</a>`
        }
      </div>
    </section>
  </main>

  <footer class="site-footer">
    <div class="wrap">
      <p>&copy; ${new Date().getFullYear()} ${esc(b.name || "Local Business")}${
    cityLine ? " · " + esc(cityLine) : ""
  }</p>
    </div>
  </footer>

  ${
    hasPhone
      ? `<div class="callbar"><a class="btn btn-primary" href="${telHref(b.phone)}">📞 Call ${esc(b.name || "us")}</a></div>`
      : ""
  }
</body>
</html>`;
}

module.exports = { renderSite };
