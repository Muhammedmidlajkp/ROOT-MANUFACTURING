# ROOTS — asset inventory

Handover notes for the site's images. This file is documentation; nothing here
is loaded by the website.

## Deploy boundary

| Path | Deploy? | Contents |
|---|---|---|
| `assets/images/` | **Yes** | Every image the site loads — nothing else |
| `source/` | **No — exclude from upload** | Masters, raw client drops, documentation |

`assets/` is now wholly deployable: if it is in `assets/`, it ships. Everything
that must not ship lives in `source/`, outside `assets/` entirely, so the
deploy rule is one sentence rather than a list of exceptions.

## assets/images/ — the served set

| Folder | Files | What |
|---|---|---|
| `brand/` | 2 | `roots-logo.png` (header + footer, all pages), `roots-logo-mark.png` (loader only) |
| `hero/` | 2 | Homepage hero, desktop (≥801px) and mobile (≤800px) |
| `focus/` | 12 | The four FOCUS tiles — denim, linen, cargos, kids — at 400/800/1200 |
| `process/` | 27 | The nine process stages at 600/1200/1600 |
| `editorial/` | 16 | Story background, four material figures at 300/600/800, closing background at 1200/1600/2400 |

Root-level icons (`favicon.ico`, `favicon-32.png`, `apple-touch-icon.png`,
`icon-192.png`, `icon-512.png`) stay at the root deliberately. Browsers and
crawlers probe `/favicon.ico` directly, and `site.webmanifest` references the
others by absolute path.

## Every photograph is now self-hosted

Sixteen photographs were previously hotlinked from `images.unsplash.com`. All of
them have been downloaded, re-encoded as WebP at exactly the widths the markup
asks for, and committed. **No stylesheet, page or script reaches a third-party
origin any more** — the two Google Fonts origins have since been removed too
(see *Self-hosted fonts* below).

Measured on the live site before and after: homepage total transfer
**1,670 KB → 1,385 KB**, third-party image bytes **1,014 KB → 0**.

### Naming

`roots-<section>-<subject>[-<width>].webp`. The top width carries no suffix, so
`roots-process-03-sourcing.webp` is the 1600px file and
`roots-process-03-sourcing-600.webp` is the 600px one. `js/main.js` builds its
srcset from that convention — see `processSrcset()` — so a new stage image must
follow it exactly or the widths will 404.

### Encoding notes

- **Material figures are encoded greyscale.** `.material-item img` is
  `filter: grayscale(1)` with no hover rule, so the colour data was never shown.
  Encoding greyscale at q50 is visually identical at the size they render and
  removes the chroma planes. If that filter is ever removed, re-encode from the
  masters in colour.
- **Focus tiles keep their colour.** `.focus-tile:hover img` relaxes to
  `grayscale(0.4)`, so chroma is visible on hover and must be retained.
- **`roots-focus-denim`** is exposure-lifted (`linear(1.85, -12)`). The source is
  black denim on a dark ground and collapsed to a flat rectangle under the
  greyscale filter; the lift restores the pocket seam and topstitching.


## Self-hosted fonts

`assets/fonts/` — 6 woff2 files, 178 KB on disk, of which a visitor downloads 3
(108 KB): Cormorant Garamond 500 roman and italic, plus the DM Sans variable file.

These are the exact faces Google Fonts was serving. The `@font-face` block lives
at the top of `css/style.css`, so there is no extra request for it, and the two
faces painted above the fold are preloaded from every page.

**The site now makes zero third-party requests.** Measured after a full scroll and
all nine process stages: 32 requests, and the only non-same-origin entry is an
inline `data:` SVG (the hero grain texture), which is not a network request.

| File | Serves |
|---|---|
| `cormorant-garamond-500-latin.woff2` | Headings, roman |
| `cormorant-garamond-500-italic-latin.woff2` | Heading `<em>` accents |
| `dm-sans-variable-latin.woff2` | All DM Sans weights — 400, 500 and 600 |
| the three `-latin-ext` siblings | Only fetched if an extended-latin glyph appears |

Notes for whoever touches this next:

- **DM Sans is ONE variable file.** Google emits three weight blocks all pointing
  at the same URL; that is mirrored here rather than "improved" into a
  `font-weight: 400 600` range, because the discrete declarations are what the
  browser resolves today and reproducing them exactly is what made the swap
  invisible.
- **Only latin and latin-ext are kept.** Google also serves cyrillic,
  cyrillic-ext and vietnamese, but `unicode-range` meant a browser never fetched
  them for this English-language site.
- **Arrow and tick glyphs (→ ↗ ✓ ✉) sit outside every subset** and fall back to a
  system font. That was equally true with Google Fonts — not a regression.
- **The swap was verified, not assumed.** Rendered text metrics were captured
  before and after for nine elements spanning both families and all four weights;
  every value came back byte-identical, and every section height matches the
  pre-swap build. If these files are ever regenerated, re-run that comparison.
- `font-display: swap` is preserved and every `font-family` still ends in a real
  fallback stack, so a failed font load degrades to Georgia / the system sans.
- **Hosting note:** the server must send `font/woff2`. Vercel does by default.
  The local `scratch/serve.js` needed it added.

## Photography that still needs replacing

Every photograph on this site is stock standing in for work ROOTS does not yet
own. Self-hosting fixed the availability risk. It did not make the pictures
true. In priority order:

| Priority | Where | Problem |
|---|---|---|
| **1** | `--img-quality` (section 06) | **Removed, not replaced.** The photograph showed two shirts wearing a legible "THE TIE BAR" neck label — another company's retail product behind the ROOTS quality statement. The section now uses a gradient in the brand's ink. It needs a real photograph of ROOTS inspection. |
| **2** | `focus/roots-focus-denim` | The source frame was three pairs of **Levi's** jeans with patches, red tabs and style numbers legible. It is cropped to unbranded fabric and pocket construction only — but it is still someone else's garment. |
| **3** | `process/roots-process-07-washing` | Shows **a basket of domestic laundry**. The stage claims industrial washing, bleaching and special wash effects. Nothing in the picture supports that. |
| **4** | `process/roots-process-02-planning` | Shows a hand sketching what reads as a **UI wireframe**, not apparel production planning. |
| **5** | `hero/roots-hero-craftsmanship` | Has marketing copy — "CRAFTED FOR GLOBAL BRANDS" — **burned into the pixels**. Invisible to search engines and screen readers, uneditable, and cropped away entirely on mobile. Its JPEG master carries a C2PA manifest declaring AI generation. |
| **6** | `process/roots-process-09-delivery` | A retail rail of finished shirts rather than packed, labelled goods. |
| **7** | `process/roots-process-03-sourcing` | Undyed natural-fibre rolls, not the denim the stage copy describes. Alt text has been corrected to match the picture. |
| **8** | `editorial/roots-closing-cta` | A lifestyle flat-lay — knitwear, jeans, a watch and tulips — not manufacturing. |

**Alt text describes the photograph, not the stage it illustrates.** Where the
two disagreed, the alt text was corrected rather than the caption, so nothing on
the page claims a picture shows something it does not. When real photography
lands, the alt text should be rewritten with it.

## Re-fetching the stock originals

The JPEG masters were deliberately **not** committed — they are ~14 MB of
placeholder material due for replacement. To regenerate a width, re-fetch from
`https://images.unsplash.com/photo-<id>?auto=format&fit=crop&w=2600&q=92`:

```
focus/denim        1542272604-787c3835535d     editorial/material-denim   1616411598297-e0053c6ee59d
process/01-order   1454165804606-c3d57bc86b40  editorial/material-linen   1608424371207-ab70d9d68e80
process/02-planning 1581291518857-4e27b48ff24e editorial/material-stitch  1497997092403-f091fcf5b6c4
process/03-sourcing 1621882844178-fa8129633ce4 editorial/material-finish  1696546760882-1d34a7af6800
process/04-designing 1721664195489-7448042bf305 editorial/closing-cta     1556905055-8f358a7a47b2
process/05-sampling 1578353022142-09264fd64295 (withdrawn: quality        1598032895397-b9472444bf93)
process/06-production 1589793463357-5fb813435467
process/07-washing  1582735689369-4fe89db7114c
process/08-finishing 1772291320136-7bfb40006088
process/09-delivery 1549040634-41fbcd2eb623
```

## source/ — not deployable

| Folder | Contents |
|---|---|
| `source/masters/` | Full-resolution brand masters — logo, favicon wordmark, icon variants, the superseded hero master |
| `source/client-assets/` | The ten untouched files the client supplied, which the served images were derived from |

`source/masters/roots-favicon-1312x1199.png` is the app-icon master — the ROOTS
script in red on a black rounded tile. `icon-192.png` and `icon-512.png` are
derived from it.

`source/masters/roots-hero-craftsmanship.jpg` is 1376×768 — **smaller than the
1672×941 file it supposedly masters**, so it is a superseded master from an
earlier hero. Kept because that cannot be proven without the owner.

**Known limitation, not a defect:** the ROOTS wordmark is a script signature, so
at 16px it reduces to a red flourish rather than a readable word. That is
inherent to the mark. `source/masters/favicon-monogram.svg` holds an "R"
monogram that stays legible at 16px if a more functional tab icon is ever
wanted; swapping it in is a brand decision, not a technical one.

`apple-touch-icon.png` is 88% transparent, so iOS composites it onto black.
`icon-192.png` / `icon-512.png` avoid this by using the tile master, which
carries its own ground.
