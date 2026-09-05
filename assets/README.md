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
| `images/roots-hero-craftsmanship.webp` | 99 KB | Homepage hero, ≥801px |
| `images/roots-hero-craftsmanship-mobile.webp` | 34 KB | Homepage hero, ≤800px |
| `../favicon.svg` | 1.6 KB | Favicon, all sizes |
| `../favicon.png` | 11 KB | Apple touch icon |

**The hero photograph is flagged TEMPORARY** in `index.html` and `css/style.css`.
It is 1376px wide, so it upscales on displays above that, and its JPEG master
carries an embedded C2PA manifest declaring AI generation. Replacing it with
real ROOTS photography is the single highest-value asset change available.
Target: a 2560–2880px WebP for desktop plus a separately composed portrait crop
for phones.

## External photography — 18 placements, 17 distinct photos, all Unsplash

None are ROOTS-owned. All are hotlinked, so they remain an availability
dependency and an unverified commercial-licensing question.

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
