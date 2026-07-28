"use strict";

/* Heuristic "does this business need a new website?" scorer.
 *
 * Two inputs matter:
 *   1. Whether a website exists at all (from Places data).
 *   2. If it exists, how outdated it looks (fetched + inspected).
 *
 * Returns a lead score 0-100 (higher = better prospect) plus reasons, so the
 * caller can rank who to phone first. No website at all = the strongest lead. */

const OUTDATED_HOST = /angelfire|geocities|tripod|wix\.com\/website|weebly|blogspot|wordpress\.com|godaddysites|\.webs\.com/i;

async function fetchWithTimeout(url, ms) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: { "User-Agent": "Mozilla/5.0 (compatible; LeadScout/1.0)" }
    });
    const html = await res.text();
    return { ok: res.ok, status: res.status, url: res.url, html: html.slice(0, 200000) };
  } finally {
    clearTimeout(t);
  }
}

/* Inspect fetched HTML for common signs of an old/low-quality site. */
function inspectHtml(html, finalUrl) {
  const reasons = [];
  let penalty = 0; // how "bad" the existing site is, 0-100

  if (!/<meta[^>]+viewport/i.test(html)) {
    penalty += 35;
    reasons.push("Not mobile-friendly (no viewport tag)");
  }
  if (/<(table|font|center|marquee|frameset)\b/i.test(html) && !/<meta[^>]+viewport/i.test(html)) {
    penalty += 20;
    reasons.push("Legacy table/font-based layout");
  }
  if (/\.swf|application\/x-shockwave-flash/i.test(html)) {
    penalty += 25;
    reasons.push("Uses Flash");
  }
  const yearMatch = html.match(/(?:©|&copy;|copyright)[^0-9]{0,12}(19|20)\d{2}/i);
  if (yearMatch) {
    const year = parseInt(yearMatch[0].match(/(19|20)\d{2}/)[0], 10);
    const age = new Date().getFullYear() - year;
    if (age >= 4) {
      penalty += Math.min(25, age * 3);
      reasons.push(`Copyright ${year} (${age}+ years stale)`);
    }
  }
  if (finalUrl && finalUrl.startsWith("http://")) {
    penalty += 15;
    reasons.push("No HTTPS (insecure)");
  }
  return { penalty: Math.min(100, penalty), reasons };
}

/* Score a single business. `probe` toggles the network fetch for existing sites. */
async function scoreBusiness(business, opts = {}) {
  const { probe = true, timeoutMs = 6000 } = opts;
  const b = business || {};

  if (!b.website) {
    return {
      score: 95,
      status: "no-website",
      reasons: ["No website found on their listing"],
      website: null
    };
  }

  // Quick host-based flag before we even fetch.
  if (OUTDATED_HOST.test(b.website)) {
    // still try to fetch for detail, but we already know it's a strong lead
  }

  if (!probe) {
    const hostFlag = OUTDATED_HOST.test(b.website);
    return {
      score: hostFlag ? 80 : 30,
      status: hostFlag ? "outdated-host" : "has-website",
      reasons: hostFlag ? ["Hosted on a dated free-site platform"] : ["Has a website (not inspected)"],
      website: b.website
    };
  }

  try {
    const res = await fetchWithTimeout(b.website, timeoutMs);
    if (!res.ok) {
      return {
        score: 85,
        status: "broken",
        reasons: [`Website returns HTTP ${res.status} (broken/unreachable)`],
        website: b.website
      };
    }
    const { penalty, reasons } = inspectHtml(res.html, res.url);
    if (OUTDATED_HOST.test(b.website)) reasons.unshift("Hosted on a dated free-site platform");
    // Map "how bad it is" onto a lead score. A pristine modern site is a weak lead.
    const score = Math.max(10, Math.min(90, 15 + penalty));
    return {
      score,
      status: score >= 55 ? "outdated" : "has-website",
      reasons: reasons.length ? reasons : ["Modern site — likely not a prospect"],
      website: b.website
    };
  } catch (e) {
    // Could not load the site at all — that itself is a selling point.
    return {
      score: 80,
      status: "unreachable",
      reasons: ["Website did not load (timeout/DNS error)"],
      website: b.website
    };
  }
}

async function scoreAll(businesses, opts = {}) {
  const out = [];
  for (const b of businesses || []) {
    const result = await scoreBusiness(b, opts);
    out.push({ ...b, lead: result });
  }
  out.sort((a, b) => b.lead.score - a.lead.score);
  return out;
}

module.exports = { scoreBusiness, scoreAll, inspectHtml };
