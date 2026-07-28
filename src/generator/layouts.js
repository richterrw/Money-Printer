"use strict";

/* Category layout profiles.
 *
 * A profile changes the STRUCTURE of a site, not just its colors: the hero
 * style, the order of sections, the section labels, the gallery treatment, and
 * the calls-to-action. That's what makes a restaurant, a barbershop and a
 * plumber feel like three different sites instead of one recolored template.
 *
 * Section keys the renderer understands:
 *   hero · about · gallery · services · reviews · visit · cta
 */

const PROFILES = {
  food: {
    heroStyle: "photo-full",
    cta: "Call to reserve",
    ctaShort: "Reserve",
    accents: ["#e8632c", "#d1442f", "#b91c1c", "#c2410c"],
    gallery: { style: "menu", kicker: "The menu", title: "A taste of what we serve", min: 2 },
    services: { style: "cards", kicker: "Why us", title: "What to expect" },
    about: { kicker: "Our story", title: "Where the neighborhood eats" },
    order: ["hero", "gallery", "about", "services", "reviews", "visit", "cta"]
  },
  beauty: {
    heroStyle: "split",
    cta: "Book an appointment",
    ctaShort: "Book now",
    accents: ["#b0468a", "#9d3b7d", "#c14b95", "#8e5cd0"],
    gallery: { style: "showcase", kicker: "Our work", title: "Fresh looks, every visit", min: 2 },
    services: { style: "list", kicker: "Services", title: "What we do" },
    about: { kicker: "About us", title: "Your chair is ready" },
    order: ["hero", "gallery", "services", "about", "reviews", "visit", "cta"]
  },
  retail: {
    heroStyle: "split",
    cta: "Call to order",
    ctaShort: "Order",
    accents: ["#6f42c1", "#7c3aed", "#9333ea", "#b0468a"],
    gallery: { style: "showcase", kicker: "In store", title: "Fresh picks & favorites", min: 2 },
    services: { style: "cards", kicker: "What we offer", title: "Made for you" },
    about: { kicker: "About us", title: "A local favorite" },
    order: ["hero", "gallery", "services", "about", "reviews", "visit", "cta"]
  },
  trades: {
    heroStyle: "minimal",
    cta: "Get a free quote",
    ctaShort: "Free quote",
    accents: ["#1f6feb", "#1d4ed8", "#0e7490", "#075985"],
    trustBadges: ["Licensed & insured", "Free estimates", "Satisfaction guaranteed"],
    gallery: { style: "showcase", kicker: "Recent work", title: "See the difference", min: 3 },
    services: { style: "cards", kicker: "Services", title: "How we can help" },
    about: { kicker: "About us", title: "Work done right, the first time" },
    order: ["hero", "services", "about", "gallery", "reviews", "visit", "cta"]
  },
  health: {
    heroStyle: "split",
    cta: "Request an appointment",
    ctaShort: "Book visit",
    accents: ["#0f9d8f", "#0d9488", "#0891b2", "#059669"],
    trustBadges: ["New patients welcome", "Most insurance accepted", "Flexible scheduling"],
    gallery: { style: "showcase", kicker: "Our practice", title: "A place you'll feel at ease", min: 3 },
    services: { style: "cards", kicker: "Services", title: "How we care for you" },
    about: { kicker: "About us", title: "Care that puts you first" },
    order: ["hero", "services", "about", "reviews", "gallery", "visit", "cta"]
  },
  pro: {
    heroStyle: "minimal",
    cta: "Request a consultation",
    ctaShort: "Consult",
    accents: ["#334155", "#1e293b", "#0f766e", "#3730a3"],
    trustBadges: ["Free consultation", "Trusted local experts", "Personalized service"],
    gallery: { style: "showcase", kicker: "Our office", title: "Meet the team", min: 3 },
    services: { style: "cards", kicker: "Practice areas", title: "How we help" },
    about: { kicker: "About us", title: "Experience you can trust" },
    order: ["hero", "services", "reviews", "about", "visit", "cta"]
  },
  default: {
    heroStyle: "photo-full",
    cta: "Get in touch",
    ctaShort: "Contact",
    accents: ["#2563eb", "#4f46e5", "#0891b2", "#7c3aed"],
    gallery: { style: "showcase", kicker: "Gallery", title: "Take a look", min: 2 },
    services: { style: "cards", kicker: "What we offer", title: "How we can help" },
    about: { kicker: "About us", title: "Your neighborhood favorite" },
    order: ["hero", "about", "gallery", "services", "reviews", "visit", "cta"]
  }
};

/* Small stable hash so per-business choices (accent shade, hero alignment)
 * are varied but consistent across regenerations of the same business. */
function seedFrom(str) {
  let h = 2166136261;
  const s = String(str || "");
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function profileFor(themeKey, business) {
  const base = PROFILES[themeKey] || PROFILES.default;
  const seed = seedFrom(business && business.name);
  const accent = base.accents[seed % base.accents.length];
  return { key: themeKey, ...base, seed, accent };
}

module.exports = { profileFor, PROFILES, seedFrom };
