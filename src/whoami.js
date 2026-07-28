#!/usr/bin/env node
"use strict";

/* Prints the LAN URLs you can open on your phone while the server is running
 * on this computer (same Wi-Fi network). */

const os = require("os");
const PORT = Number(process.env.PORT) || 4000;

const nets = os.networkInterfaces();
const urls = [];
for (const name of Object.keys(nets)) {
  for (const net of nets[name] || []) {
    if (net.family === "IPv4" && !net.internal) {
      urls.push(`http://${net.address}:${PORT}/`);
    }
  }
}

console.log("\n  Open one of these on your phone (same Wi-Fi):\n");
if (urls.length) urls.forEach((u) => console.log("   • " + u));
else console.log("   (no LAN address found — are you connected to Wi-Fi?)");
console.log(`\n  Local (this computer): http://localhost:${PORT}/\n`);
