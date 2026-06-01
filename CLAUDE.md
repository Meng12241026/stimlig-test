# CLAUDE.md

Guidance for AI assistants working in this repository.

## What this is

A Taiwan invoice (發票) scanner: photograph an invoice → OCR → extract
seller / amount / line-items → auto-classify into Taiwanese accounting
categories → export CSV / sync to Google Sheets.

The same product is implemented twice, in one repo:

- **`web/`** — PWA version (primary, actively used). Runs in a mobile
  browser, no install / App Store / Mac required. OCR runs in-browser with
  Tesseract.js.
- **`StimligInvoice/`** — native iOS version (SwiftUI + SwiftData), uses
  Apple Vision for OCR (more accurate). Only buildable on a Mac with Xcode;
  treat it as the secondary target.

The two share product logic but **share no code** — changes usually need to
be made in both places to keep parity.

The codebase comments and UI are written in **Traditional Chinese
(zh-Hant)**. Follow that convention: keep comments and user-facing strings in
Traditional Chinese.

## Repository layout

```
web/                        # PWA (primary)
├── index.html              # 3 tabs (invoices / stats / export) + scan modal shell
├── manifest.json           # PWA manifest
├── service-worker.js       # cache-first; bump CACHE version + ASSETS list on file changes
├── css/styles.css          # iOS-like styling + dark mode
├── icons/                  # SVG icons
└── js/
    ├── app.js              # main controller: tabs, scan flow, list/stats/export rendering
    ├── categories.js       # 19 Taiwan accounting categories (id/name/icon)
    ├── parser.js           # Taiwan invoice text → structured fields (regex rules)
    ├── classifier.js       # keyword-score auto-categorization
    ├── ocr.js              # Tesseract.js wrapper (chi_tra + eng)
    ├── storage.js          # IndexedDB persistence
    ├── sync.js             # POST invoices to a Google Apps Script Web App
    ├── format.js           # date / amount formatting
    ├── chart.js            # pure-Canvas donut chart
    └── export.js           # CSV + Web Share / download / mailto

StimligInvoice/             # native iOS (secondary, needs Mac)
├── StimligInvoiceApp.swift # @main entry; builds SwiftData container
├── Models/                 # Invoice (@Model) + AccountingCategory
├── Services/               # OCR / Parser / Classifier / CSVExporter + InvoiceProcessingService
├── Persistence/            # DataController (SwiftData)
├── Views/                  # SwiftUI views
└── Resources/Info.plist

project.yml                 # XcodeGen project spec (the .xcodeproj is gitignored)
.github/workflows/pages.yml # deploys web/ to GitHub Pages on push to main
README.md                   # detailed end-user setup (Chinese), incl. Apps Script snippet
```

## Web architecture (the part you'll touch most)

- **No build step, no framework, no npm.** Plain ES modules loaded directly
  by the browser. Tesseract.js is loaded from a CDN `<script>` and lives on
  `window.Tesseract` (see `ocr.js`).
- **Data flow on scan** (`app.js`): capture/select image → `resizeForOCR`
  (downscale to longest edge 1600px for speed) → `recognize` (ocr.js) →
  `parseFull` (parser.js) → `classify` (classifier.js) → fill the form →
  user confirms → `saveInvoice` (storage.js) → optional background
  `syncInvoice` (sync.js).
- **Persistence** is IndexedDB (`storage.js`, DB `stimlig-invoices`). Dates
  are stored as ISO strings and rehydrated to `Date` on read. Each invoice
  has a `syncStatus` of `unsynced | pending | synced | failed`.
- **Sync** (`sync.js`) POSTs to a user-supplied Google Apps Script Web App
  URL stored in `localStorage`. Important constraint: the request must be a
  CORS "simple request" — do **not** set `Content-Type`, send the JSON as a
  plain string body so the browser uses `text/plain` and skips the OPTIONS
  preflight (Apps Script doesn't handle preflight). The Apps Script side does
  `JSON.parse(e.postData.contents)`.
- **Offline**: `service-worker.js` is cache-first over same-origin GETs.
  **When you add/rename/remove a file under `web/`, update the `ASSETS` array
  AND bump the `CACHE` version** (e.g. `stimlig-v3` → `stimlig-v4`), otherwise
  clients keep serving stale assets.

## Parsing & classification conventions

- Taiwan-specific rules live in `parser.js` (web) and
  `TaiwanInvoiceParser.swift` (iOS): invoice number `[A-Z]{2}-\d{8}`, 8-digit
  tax IDs (統編), ROC-year dates (年 < 200 → `+1911`) and AD dates, amount
  detection by keyword (`總計/合計/應付/TOTAL`…).
- `classifier.js` / `CategoryClassifier.swift` score categories by summing
  matched-keyword lengths; longest total wins, default `other`.
- The 19 categories are the source of truth in `categories.js` /
  `AccountingCategory`. If you add or rename a category, update **both**
  language versions and keep the `id`/`rawValue` strings in sync.

## Running & deploying

**Web (local):** PWA needs HTTPS or `localhost`. Any static server works:

```bash
cd web
python3 -m http.server 8080
# open http://localhost:8080
```

There is **no test suite, linter, or package manager** for the web app — it's
verified by running it in a browser. When you change scan/parse/classify
behavior, exercise it manually (camera + gallery, light/dark mode, the export
and sync tabs) rather than claiming success from a green build.

**Web (deploy):** push to `main` → `.github/workflows/pages.yml` publishes
the `web/` directory to GitHub Pages.

**iOS:** requires macOS + Xcode 15+, iOS 17+ device, and XcodeGen
(`brew install xcodegen`). The `.xcodeproj` is gitignored and generated:

```bash
xcodegen generate
open StimligInvoice.xcodeproj
```

## Working in this repo

- Keep the **PWA and iOS versions at feature parity** when changing shared
  product logic (categories, parsing rules, classification keywords, CSV
  columns). A change in one almost always needs a mirror in the other.
- Match the existing **Traditional Chinese** for comments and UI strings.
- Web code style: vanilla ES modules, small focused files, no new
  dependencies or build tooling unless explicitly requested.
- Don't commit the generated Xcode project, `DerivedData`, or other artifacts
  already covered by `.gitignore`.
