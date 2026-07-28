"use strict";

const demoData = require("./demoData");

/* Google Places API (v1) client — Text Search.
 * Docs: https://developers.google.com/maps/documentation/places/web-service/text-search
 *
 * Set GOOGLE_PLACES_API_KEY in the environment to hit the live API. Without a
 * key, findBusinesses() returns the offline demo dataset so the pipeline still
 * runs end-to-end (great for development and demos). */

const ENDPOINT = "https://places.googleapis.com/v1/places:searchText";

const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.primaryTypeDisplayName",
  "places.formattedAddress",
  "places.shortFormattedAddress",
  "places.nationalPhoneNumber",
  "places.internationalPhoneNumber",
  "places.websiteUri",
  "places.rating",
  "places.userRatingCount",
  "places.regularOpeningHours",
  "places.reviews",
  "places.photos",
  "places.location"
].join(",");

/* Map one Places API result onto our internal business shape. */
function mapPlace(p) {
  const addr = p.shortFormattedAddress || p.formattedAddress || "";
  // Best-effort split of "Street, City, ST ZIP" -> parts.
  const parts = addr.split(",").map((s) => s.trim());
  const street = parts[0] || "";
  const city = parts[1] || "";
  const region = (parts[2] || "").split(/\s+/)[0] || "";

  let hours = null;
  if (p.regularOpeningHours && Array.isArray(p.regularOpeningHours.weekdayDescriptions)) {
    hours = p.regularOpeningHours.weekdayDescriptions; // display strings, template handles arrays
  }

  const reviews = (p.reviews || []).slice(0, 3).map((r) => ({
    author: r.authorAttribution && r.authorAttribution.displayName,
    rating: r.rating,
    text: (r.text && r.text.text) || (r.originalText && r.originalText.text) || ""
  }));

  // Raw photo resource names — resolved to real image URLs later, only when a
  // site is actually built (keeps the find step cheap: no per-photo API calls).
  const photoNames = (p.photos || []).slice(0, 4).map((ph) => ph.name).filter(Boolean);

  return {
    name: p.displayName && p.displayName.text,
    category: p.primaryTypeDisplayName && p.primaryTypeDisplayName.text,
    phone: p.nationalPhoneNumber || p.internationalPhoneNumber || null,
    address: street,
    city,
    region,
    country: "US",
    website: p.websiteUri || null,
    rating: p.rating || null,
    reviewsCount: p.userRatingCount || null,
    placeId: p.id || null,
    lat: p.location && p.location.latitude,
    lng: p.location && p.location.longitude,
    hours,
    reviews,
    photoNames
  };
}

/* Resolve a Places photo resource name to a usable image URL.
 * Uses skipHttpRedirect so we get JSON with a direct photoUri back. */
async function resolvePhotoUrl(photoName, { apiKey, maxWidthPx = 1200 } = {}) {
  const url =
    `https://places.googleapis.com/v1/${photoName}/media` +
    `?maxWidthPx=${maxWidthPx}&skipHttpRedirect=true&key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json().catch(() => null);
  return (data && data.photoUri) || null;
}

/* Resolve up to `limit` photo names to URLs, dropping any that fail. */
async function resolvePhotos(photoNames, { apiKey, maxWidthPx = 1200, limit = 4 } = {}) {
  if (!apiKey || !Array.isArray(photoNames) || !photoNames.length) return [];
  const chosen = photoNames.slice(0, limit);
  const urls = await Promise.all(
    chosen.map((n) => resolvePhotoUrl(n, { apiKey, maxWidthPx }).catch(() => null))
  );
  return urls.filter(Boolean);
}

/* Query the live API for a text query like "plumbers in Boise, ID". */
async function searchTextLive(query, { apiKey, maxResults = 20 } = {}) {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": FIELD_MASK
    },
    body: JSON.stringify({ textQuery: query, maxResultCount: Math.min(20, maxResults) })
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Places API error ${res.status}: ${body.slice(0, 300)}`);
  }
  const data = await res.json();
  return (data.places || []).map(mapPlace);
}

/* Main entry: find businesses for a query.
 *   query        e.g. "coffee shops in Meridian, ID"
 *   opts.onlyNoWebsite  when true, drop results that already have a website
 * Falls back to demo data when no API key is configured. */
async function findBusinesses(query, opts = {}) {
  const apiKey = opts.apiKey || process.env.GOOGLE_PLACES_API_KEY;
  let businesses;
  let source;

  if (!apiKey) {
    businesses = demoData.map((b) => ({ ...b }));
    source = "demo";
  } else {
    businesses = await searchTextLive(query, { apiKey, maxResults: opts.maxResults });
    source = "live";
  }

  if (opts.onlyNoWebsite) {
    businesses = businesses.filter((b) => !b.website);
  }

  return { source, query, count: businesses.length, businesses };
}

module.exports = { findBusinesses, searchTextLive, mapPlace, resolvePhotoUrl, resolvePhotos };
