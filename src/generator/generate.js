"use strict";

const fs = require("fs");
const path = require("path");
const { renderSite } = require("./template");

function slugify(s) {
  return String(s || "business")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "business";
}

/* Generate a self-contained website for one business object.
 * Writes <outDir>/<slug>/index.html and returns the file path. */
function generateSite(business, outDir) {
  const html = renderSite(business);
  const slug = slugify(business && business.name);
  const dir = path.join(outDir, slug);
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, "index.html");
  fs.writeFileSync(file, html, "utf8");
  return file;
}

/* Generate sites for many businesses; returns an array of results. */
function generateAll(businesses, outDir) {
  return (businesses || []).map((b) => {
    const file = generateSite(b, outDir);
    return { name: b.name, file };
  });
}

module.exports = { generateSite, generateAll, slugify };
