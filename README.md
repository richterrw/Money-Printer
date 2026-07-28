# 🖨️ Money Printer

**Find local businesses that need a website, generate an outstanding site for each one in seconds, then call and sell it.**

This is the toolkit behind the pitch: *"Hi, I noticed [Business] doesn't have a
website — I actually already built you one. Can I text you the link?"* You
automate the boring parts (finding leads, building sites) and keep the human
part human (the phone call).

```
  find leads  ──▶  score them  ──▶  generate sites  ──▶  call & close
 (Places API)     (who needs it)   (self-contained)    (you, on the phone)
```

---

## What's in the box

| Piece | What it does |
| --- | --- |
| **Lead finder** (`src/finder`) | Queries Google Places for local businesses, flags the ones with **no website or an outdated one**, and returns their **phone numbers** — ranked best-prospect-first. |
| **Website generator** (`src/generator`) | Turns one business into a polished, **mobile-ready, self-contained website** (single HTML file) — themed automatically by category, with click-to-call, reviews, hours, and map links. |
| **📱 Mobile app** (`src/server.js` + `public/`) | Run the whole thing **from your phone**: search leads, tap-to-call, build a site in one tap, and text the link — all from a phone-friendly, installable web app. |
| **CLI** (`src/cli.js`) | Same pipeline from a terminal: `find`, `generate`, `pipeline`, `serve`. |
| **Agency sales site** (`site/`) | *Our own* marketing site to sell the service — the conversion engine. Open `site/index.html`. |
| **Examples** (`examples/`) | Screenshots + a live sample generated site. |

---

## 📱 Run it from your phone

A phone can't run the command line, so the app runs as a tiny web server you
open in your phone's browser. Two ways to do it:

### Option A — same Wi-Fi (fastest to try, free)

Run the server on your computer; open it on your phone over Wi-Fi.

```bash
npm start           # starts the app on port 4000
npm run whoami      # prints the exact URL to type on your phone
```

On your phone (connected to the **same Wi-Fi**), open the printed
`http://192.168.x.x:4000/` address. In Safari/Chrome tap **Share → Add to Home
Screen** and it installs like a real app.

> Downside: the links you build are only reachable on your Wi-Fi, so you can't
> text them to a prospect yet. For that, use Option B.

### Option B — deploy it (reach it anywhere + real links to text)

Host the server so it has a public URL. Now the app *and* every website you
build get real links you can text to prospects on the spot. It's a plain Node
app with no dependencies, so almost anything works:

```bash
# any Docker host (Render, Railway, Fly.io, a VPS, ...)
docker build -t money-printer .
docker run -e GOOGLE_PLACES_API_KEY=your-key -p 4000:4000 money-printer
```

Or point a Node host (Render/Railway/Heroku-style) at this repo with:
- **Start command:** `npm start`
- **Env var:** `GOOGLE_PLACES_API_KEY` (for live leads)

Then open the public URL on your phone and Add to Home Screen.

> ⚡ **Instant public link without deploying:** run `npm start` on your laptop,
> then `npx ngrok http 4000` — ngrok gives you a temporary public URL you can
> open on your phone and whose built sites you can text to prospects.

### What the phone app does

1. **Search** a town + business type → ranked leads appear, best prospects first.
2. **Tap 📞 Call** — dials straight from your phone; the lead auto-marks "Called".
3. **Tap 🛠️ Build site** — generates their website in a second.
4. **Tap 💬 Text link** — opens your messages with *"I built you a free website
   preview — take a look: <link>"* prefilled.
5. **Tap the status chip** to cycle New → Called → Interested → Sold. Your call
   list state is saved on the phone.

---

## Quick start (command line)

No dependencies, no build step. Just Node 18+.

```bash
# 1. Find leads (uses offline demo data until you add an API key)
node src/cli.js find "restaurants in Boise, ID"

# 2. Build a website for every lead
node src/cli.js generate

# 3. Preview them in your browser
node src/cli.js serve      # open the printed URL

# Or do steps 1–2 in one go:
node src/cli.js pipeline "coffee shops in Meridian, ID"
```

Generated sites land in `output/<business-name>/index.html` — each a single
file you can host anywhere or text as a link.

### npm scripts

```bash
npm run find -- "plumbers in Boise, ID"
npm run generate
npm run serve
npm run demo        # full pipeline on demo data + preview server
```

---

## Going live with real data (Google Places)

The finder runs on an **offline demo dataset** out of the box so you can try
everything immediately. To query real businesses:

1. Create a Google Cloud project and enable the **Places API (New)**.
2. Create an API key.
3. Export it:

   ```bash
   export GOOGLE_PLACES_API_KEY="your-key-here"
   node src/cli.js find "hair salons in Nampa, ID" --only-no-website
   ```

Useful flags:

| Flag | Command | Effect |
| --- | --- | --- |
| `--only-no-website` | `find` | Keep only businesses with **no** website (strongest leads) |
| `--no-probe` | `find` | Skip fetching/inspecting existing sites (faster) |
| `--min-score <n>` | `generate` | Only build sites for leads scoring ≥ n |
| `--file <path>` | `generate` | Build from a specific leads JSON file |
| `--port <n>` | `serve` | Preview server port (default 4173) |

### How leads are scored (0–100)

Higher = better prospect to call.

- **95** — No website at all (the dream lead)
- **80–90** — Site is broken, unreachable, or on a dated free-host platform
- **55–80** — Site loads but looks outdated: not mobile-friendly, no HTTPS,
  legacy table layout, stale copyright year, Flash
- **< 40** — Already has a solid modern site (skip)

Leads export to `output/leads.json` **and** `output/leads.csv` (open the CSV in
your phone's spreadsheet app to work a call list on the go).

---

## The workflow that actually converts

1. **`find`** a city + category → get a ranked call list with phone numbers.
2. **`generate`** sites for the top leads *before* you call.
3. Host each site somewhere temporary (any static host, or `serve` on your
   laptop) so you have a shareable link.
4. **Call** the business, reference the specific site you already built, and
   offer to text them the link while you're on the phone.
5. Close on the **Launch** plan ($299 in the sample pricing — set your own),
   move the site to their domain, done.

> **A note on the law:** In the US, genuine business-to-business calls to a
> business line are generally exempt from the National Do-Not-Call Registry —
> much friendlier ground than cold email. But rules vary by **state and
> country** (Canada/EU are stricter), there are call-time limits, and you must
> not spoof caller ID. Check your local rules before dialing at volume.

---

## Rebranding the sales site

`site/index.html` is a ready-to-ship agency landing page. To make it yours,
search-and-replace:

- `MainStreet Sites` → your business name
- The phone/email in the contact section (marked with `⚙️` comments)
- Prices in the pricing section

---

## Project layout

```
Money-Printer/
├── src/
│   ├── server.js            # 📱 mobile web app server (API + serves sites)
│   ├── whoami.js            # prints your phone-reachable LAN URL
│   ├── cli.js               # command-line entry point
│   ├── finder/
│   │   ├── places.js        # Google Places API client (+ demo fallback)
│   │   ├── score.js         # "does this business need a site?" scorer
│   │   └── demoData.js      # offline sample businesses
│   └── generator/
│       ├── template.js      # the outstanding site template
│       ├── themes.js        # category → color theme
│       └── generate.js      # writes output files
├── public/                  # the mobile app front-end (installable PWA)
│   ├── index.html
│   ├── app.css / app.js
│   ├── manifest.webmanifest / sw.js
│   └── icon*.png
├── site/                    # our own agency sales site
├── examples/                # screenshots + a live sample generated site
├── output/                  # generated client sites (gitignored)
├── Dockerfile               # deploy the app anywhere
└── package.json
```

---

## Roadmap ideas

- ~~Wrap the CLI in a mobile-friendly web UI (run it from your phone).~~ ✅ done
- ~~CRM-style status tracking per lead (called / interested / sold).~~ ✅ done
- Auto-deploy each generated site to its own subdomain and return a live URL.
- Pull business photos from Places into the hero.
- A/B test site templates against reply rates.
- Optional accounts so your call-list syncs across devices.

---

*Automate the finding and the building. Keep the selling human.*
