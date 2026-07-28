"use strict";

/* Category-aware visual themes. The generator picks a theme from a business's
 * category so a plumber's site feels different from a salon's — without any
 * per-client design work. Each theme is a small palette + a hero emoji/icon
 * and a couple of default service ideas used only when real data is missing. */

const THEMES = {
  food: {
    match: /restaurant|cafe|coffee|bakery|bar|pizza|grill|diner|deli|food|eatery|bistro|pub|taco|sushi|kitchen/i,
    accent: "#e8632c",
    accent2: "#f6a13d",
    ink: "#2b1a12",
    bg: "#fffaf4",
    surface: "#ffffff",
    hero: "🍽️",
    sampleServices: ["Fresh daily menu", "Dine-in & takeout", "Catering available"]
  },
  trades: {
    match: /plumb|electric|hvac|roof|construct|contractor|handyman|repair|landscap|paint|garage|mechanic|auto|pest|lock|clean|mov/i,
    accent: "#1f6feb",
    accent2: "#3aa0ff",
    ink: "#0b1b2b",
    bg: "#f5f9ff",
    surface: "#ffffff",
    hero: "🔧",
    sampleServices: ["Licensed & insured", "Free estimates", "Same-day service"]
  },
  beauty: {
    match: /salon|spa|hair|nail|beauty|barber|lash|brow|skin|massage|wax|cosmet/i,
    accent: "#b0468a",
    accent2: "#e07bb8",
    ink: "#2a1622",
    bg: "#fdf6fb",
    surface: "#ffffff",
    hero: "💇",
    sampleServices: ["By appointment", "Walk-ins welcome", "Gift cards available"]
  },
  health: {
    match: /dental|dentist|clinic|health|medical|chiro|physio|therap|wellness|vet|optom|pharmac|fitness|gym|yoga/i,
    accent: "#0f9d8f",
    accent2: "#3fc9b9",
    ink: "#0c211f",
    bg: "#f3fbfa",
    surface: "#ffffff",
    hero: "🩺",
    sampleServices: ["New patients welcome", "Flexible scheduling", "Most insurance accepted"]
  },
  retail: {
    match: /shop|store|boutique|market|florist|jewel|gift|book|apparel|clothing|furniture|hardware/i,
    accent: "#6f42c1",
    accent2: "#9a6dd7",
    ink: "#1e1330",
    bg: "#faf7ff",
    surface: "#ffffff",
    hero: "🛍️",
    sampleServices: ["Curated selection", "Local & handmade", "In-store pickup"]
  },
  pro: {
    match: /law|attorney|account|tax|insur|real estate|realtor|consult|financ|agency|notary|marketing/i,
    accent: "#334155",
    accent2: "#64748b",
    ink: "#0f172a",
    bg: "#f8fafc",
    surface: "#ffffff",
    hero: "💼",
    sampleServices: ["Free consultation", "Trusted local experts", "Personalized service"]
  }
};

const DEFAULT_THEME = {
  accent: "#2563eb",
  accent2: "#60a5fa",
  ink: "#111827",
  bg: "#f7f8fa",
  surface: "#ffffff",
  hero: "⭐",
  sampleServices: ["Trusted local business", "Quality you can count on", "Get in touch today"]
};

/* Font pairing per theme. `display` is a Google Font for headings; body is
 * always Inter for legibility. Warm/editorial categories get a serif display;
 * modern/technical ones get a strong geometric sans. */
const FONTS = {
  food: { display: "Fraunces", weights: "Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700" },
  beauty: { display: "Fraunces", weights: "Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700" },
  retail: { display: "Fraunces", weights: "Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700" },
  trades: { display: "Sora", weights: "Sora:wght@600;700;800" },
  health: { display: "Sora", weights: "Sora:wght@600;700;800" },
  pro: { display: "Sora", weights: "Sora:wght@600;700;800" },
  default: { display: "Sora", weights: "Sora:wght@600;700;800" }
};

function themeFor(category, name) {
  const haystack = `${category || ""} ${name || ""}`;
  let key = "default";
  let theme = DEFAULT_THEME;
  for (const k of Object.keys(THEMES)) {
    if (THEMES[k].match.test(haystack)) { key = k; theme = THEMES[k]; break; }
  }
  return { key, ...theme, font: FONTS[key] || FONTS.default };
}

module.exports = { themeFor, THEMES, DEFAULT_THEME, FONTS };
