# ROOTS — asset inventory

Handover notes for the site's images. Nothing here is loaded by the website.

## Folders

| Folder | Deployed? | Contents |
|---|---|---|
| `assets/images/` | **Yes** | Everything the live site loads |
| `assets/masters/` | **No — exclude from deploy** | Full-resolution sources and unused icon variants |

`assets/masters/` exists so the originals are never lost when a served asset is
optimised. It must not be uploaded: it is ~2.3 MB of source material the
browser never needs.

## ROOTS-owned assets currently served

| File | Size | Used by |
|---|---|---|
| `images/roots-logo.png` | 50 KB | Header and footer, both pages |
| `images/roots-logo-mark.png` | 31 KB | Homepage loading screen only |
| `images/roots-hero-craftsmanship.webp` | 154 KB | Homepage hero, ≥801px |
| `images/roots-hero-craftsmanship-mobile.webp` | 75 KB | Homepage hero, ≤800px |
| `../favicon.ico` | 2.15 KB | Tabs and bookmarks — 16, 32 and 48px in one file |
| `../favicon-32.png` | 0.68 KB | Tab icon for browsers that prefer PNG (32×32) |
| `../favicon-180.png` | 5.74 KB | High-res icon / Apple touch icon (180×180) |
| `../apple-touch-icon.png` | 5.74 KB | Apple touch icon (180×180) |

### Favicons — optimized technical rasterization

Now **~14 KB total package** across all formats, with the exact approved ROOTS signature wordmark preserved:
- Canvas cropped tightly to ink bounds (94% width fill vs previous 68%).
- Alpha-boosted gamma-corrected rasterization at 16×16, 20×20, 24×24, and 32×32 so fine script strokes maintain solid opacity and high contrast.
- Un-matted pure transparency on dark and light browser chrome.

What was wrong, and none of it was the artwork:

- `favicon.svg` was a 128x128 `<svg>` whose entire content was one base64 PNG at
  912x713 — roughly 28x the pixels a 32px tab icon can show.
- The source was **not square** (912x713), so it was letterboxed inside the
  square viewBox rather than filling it.
- It was **fully opaque**, so on dark browser chrome the icon read as a white
  plate with a small red mark inside it.
- A detached 12px wedge sat in columns 0-11, cut off from the wordmark by 40
  columns of white — a crop remnant that rendered as a speck beside the mark.

The replacements are resampled from that same approved wordmark: cropped to the
mark's own ink box (remnant excluded), squared, and un-matted so the white
ground becomes transparency and the script reads on light and dark chrome alike.
Composited back over white it is identical to the original.

The originals are kept at `masters/favicon-wordmark-full.svg` and
`masters/favicon-wordmark-912x713.png`.

**Known limitation, not a defect:** the ROOTS wordmark is a script signature, so
at 16px it reduces to a red flourish rather than a readable word. That is
inherent to the mark, not to the encoding. `masters/favicon-monogram.svg`
(1.6 KB) holds an "R" monogram that stays legible at 16px if a more functional
tab icon is ever wanted; it is not currently used, and swapping it in is a brand
decision rather than a technical one.

### `roots-logo-mark.png`

The same ROOTS artwork as `roots-logo.png`, resampled from
`masters/roots-logo-1536x1024.png` and trimmed to its ink box so CSS sizes the
lettering itself rather than transparent canvas. Nothing about the shapes,
proportions or colour is altered.

It is an **indexed PNG**: one palette entry per alpha step, all carrying the
artwork's single red (`rgb(248,0,6)`). Flat line art on transparency is
dominated by its alpha plane, which WebP stores losslessly — the same image as
an RGBA WebP is 55 KB. Indexing it costs a maximum alpha error of 2/255 and
saves 45%. 1080px wide, which is exactly 1:1 at the loader's 540px cap on a
2× display. If the artwork is ever re-cut, regenerate at 1080px rather than
scaling this file.

### The two favicons are 1.1 MB between them

`favicon.svg` (629 KB) is a 128×128 SVG wrapping a base64 **912×713** PNG, and
`favicon.png` (472 KB) is that same 912×713 raster. Both are fetched on first
load, where they render at 16–180px. Together they are ~78% of the homepage's
same-origin transfer and four times the hero photograph.

They were 1.6 KB and 11 KB when this file was first written. Re-exporting at
display resolution — 128px for the SVG payload, 180px for the apple-touch
icon — restores roughly a megabyte on every cold visit. Left as found: these
are client-supplied brand exports, not generated assets.

**The hero photograph is flagged TEMPORARY** in `index.html` and `css/style.css`.
It is 1376px wide, so it upscales on displays above that, and its JPEG master
carries an embedded C2PA manifest declaring AI generation. Replacing it with
real ROOTS photography is the single highest-value asset change available.
Target: a 2560–2880px WebP for desktop plus a separately composed portrait crop
for phones.

## External photography — 18 placements, 17 distinct photos, all Unsplash

None are ROOTS-owned. All are hotlinked, so they remain an availability
dependency and an unverified commercial-licensing question.

### Status, checked 2026-09-06

All 18 placements returned 200 and rendered correctly. Every one is
**temporary** — topically truthful stock standing in for photography ROOTS does
not yet own. None has a local replacement. See the replacement priority below.

Two things worth recording:

- **The availability risk is real, not theoretical.** During the previous audit
  the machine briefly lost its connection and all 18 images failed at once while
  the rest of the site rendered normally. That is exactly what a visitor on a
  poor connection, a restricted corporate network, or a region that blocks the
  CDN would see. Hosting these locally is the fix, and it also settles the
  licensing question.
- **They are now served responsively.** Each `<img>` carries `srcset`/`sizes`
  and the Unsplash CDN returns any width from the same photo id, so a phone
  fetches roughly a 340px file where it used to fetch the 1200px desktop one.
  Homepage image payload dropped from 1,484 KB to 333 KB on a 390px phone and
  to 768 KB at 1440px. **When these move to local files, the same `srcset`
  widths must be generated as real files** — the responsive behaviour is
  currently doing the CDN's resizing for free.

### Corrected 2026-09-05 — subject now matches label

Eleven photographs were replaced because they showed something unrelated to
their caption. Every replacement was rendered and visually verified before use.

| Placement | Was | Now |
|---|---|---|
| MATERIAL / 01 DENIM | Jeans on a retail rail | Denim twill with a folded seam |
| MATERIAL / 02 LINEN | **A furnished living room** | Linen fabric showing its weave |
| MATERIAL / 03 STITCH | Two dress shirts | Needle and presser foot on dark fabric |
| MATERIAL / 04 FINISH | **A camera and lighting rig** | A garment being pressed |
| FOCUS / 03 BOYS | A toddler outdoors, garment not visible | A boy in a patterned shirt |
| PROCESS / DESIGN | The same camera rig | A hand tracing a paper pattern |
| PROCESS / SOURCING | **Ceramic vessels** | Rolls of fabric |
| PROCESS / DEVELOPMENT | Garments on a rail | Thread, scissors, tape and pattern |
| PROCESS / MANUFACTURING | Two shirts laid flat | Operators at machines on a factory floor |
| PROCESS / QUALITY | Folded knitwear on a bed | Hands inspecting a garment seam |
| PROCESS / DELIVERY | T-shirts on hangers | Finished pressed shirts on a rail |

### Reuse resolved

Before, four photographs carried eleven different claims — one image appeared
three times as design, finishing and a process frame. The site now uses **17
distinct photographs across 18 placements**. The single remaining duplicate is
structural: the process visual's initial frame must match its DESIGN stage.

### What these images still are not

**They are stock, not ROOTS.** They are now topically truthful — a photograph
of stitching sits under STITCH — but they show other people's fabric, other
people's hands and another company's factory floor. No alt text, caption or
metadata claims otherwise, and none should ever be added.

The MANUFACTURING frame deserves particular care: it shows a real, identifiable
garment production floor beneath a heading about ROOTS' manufacturing. It is
accurate to the concept and borrowed as evidence. Replacing it with ROOTS' own
floor is the highest-value photograph on the list.

### Replacement priority

| Priority | Assets | Why |
|---|---|---|
| **1** | PROCESS / MANUFACTURING and QUALITY | These carry the capability claim; borrowed evidence is weakest here |
| **2** | Homepage hero | Temporary, 1376px, AI-generated master |
| **3** | MATERIAL ×4 | Real ROOTS denim, linen, stitching and pressing; one table, one afternoon |
| **4** | FOCUS ×4 | One finished ROOTS garment per category, consistent light and background |
| **5** | Remaining process stages and the three CSS backgrounds | Lower visibility |

Once real photography exists, also point `og:image`, `twitter:image` and the
JSON-LD `image` at a purpose-made 1200×630 crop. All three currently reuse the
temporary hero.
