# 🖨️ Money Printer

> go **brrr**

An incremental / idle clicker game where you tap a printer to make money, then
reinvest it in upgrades that print money for you. Pure vanilla HTML/CSS/JS — no
build step, no dependencies, no server.

## Play

Just open `index.html` in any modern browser:

```bash
# from the repo root
open index.html          # macOS
xdg-open index.html      # Linux
start index.html         # Windows
```

Or serve it (handy for mobile testing on the same network):

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## How it works

- **Tap the printer** to print money by hand (money-per-click).
- **Buy upgrades** to increase money-per-click and unlock passive
  money-per-second income.
- Each upgrade gets more expensive the more you own — classic idle-game
  exponential cost curve.
- Progress **auto-saves** to your browser's `localStorage` every few seconds and
  on exit, so you can close the tab and pick up where you left off.

### Upgrades

| Upgrade | Effect |
| --- | --- |
| 🖋️ Better Ink | +$1 per click |
| 🧑‍💼 Intern | +$0.5/s |
| 🖨️ Second Printer | +$3/s |
| 🎨 Premium Toner | +$5 per click |
| 🏭 Print Warehouse | +$40/s |
| 🏦 Private Mint | +$250/s |
| 🏛️ Federal Reserve | +$2,000/s |
| 🌀 Quantum Presses | +$100 per click, +$18,000/s |

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Markup and layout |
| `styles.css` | Styling, animations, responsive layout |
| `game.js` | Game engine: economy, upgrades, save/load, render loop |

## Reset

Use the **Reset progress** button at the bottom of the page, or clear the
`money-printer-save-v1` key from your browser's local storage.

---

Made for fun. No actual money is printed. 💸
