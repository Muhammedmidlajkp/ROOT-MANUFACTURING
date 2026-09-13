# Content needed from ROOTS

Every item below is a question a professional apparel buyer asks before they
send an enquiry, and which this website currently does not answer.

**Nothing here has been guessed, inferred or filled in.** No capacity figure, no
lead time, no certification and no client name appears anywhere in the codebase,
because none of it has been supplied. Where a page would benefit from one, it has
been left out rather than invented.

This list is the input needed to build the product pages in the SEO roadmap.
Until it exists, those pages would be thin doorway pages and should not be built.

---

## Tier 1 — blocks the most valuable pages

These are the three questions a sourcing manager asks first. A manufacturing site
that answers none of them loses the enquiry to one that answers all three.

| Field | Status | Where it would go |
|---|---|---|
| Minimum order quantity, per product type | **CLIENT INPUT REQUIRED** | Capabilities section; a future `/private-label-manufacturing/` page; FAQ schema |
| Sampling lead time (sketch → approved sample) | **CLIENT INPUT REQUIRED** | Process stage 05; a future `/process/` page |
| Bulk production lead time (approval → dispatch) | **CLIENT INPUT REQUIRED** | Process stage 06 / 09 |
| Monthly production capacity, in pieces | **CLIENT INPUT REQUIRED** | Why ROOTS; About |
| Which of denim / linen / cargos / kidswear are produced in-house vs. partnered | **CLIENT INPUT REQUIRED** | Focus tiles; product pages |

## Tier 2 — trust and credibility

The site currently asserts quality and experience without anything a buyer can
verify. These are what convert a browsing buyer into an enquiring one.

| Field | Status | Notes |
|---|---|---|
| Certifications (e.g. GOTS, OEKO-TEX, SEDEX, BSCI, WRAP) | **CLIENT INPUT REQUIRED** | Do **not** display any badge until the certificate number and expiry are supplied |
| Factory size, unit count, machine count | **CLIENT INPUT REQUIRED** | Currently no factory detail of any kind on the site |
| Compliance and audit status | **CLIENT INPUT REQUIRED** | |
| Export markets actually served | **CLIENT INPUT REQUIRED** | Schema currently says `areaServed: ["India", "Global"]` — "Global" is unsubstantiated and should be narrowed to real markets |
| Client names or anonymised case studies | **CLIENT INPUT REQUIRED** | Even "a UK menswear label, 12,000 pieces" is worth more than nothing — but only if true |
| Testimonials | **CLIENT INPUT REQUIRED** | No review or rating schema may be added without real, attributable reviews |
| "20+ years" — from what date, and for which entity | **NEEDS VERIFICATION** | Used in the hero, the About stat and the meta description. It is the site's single strongest claim and nothing on the page supports it |
| "Sustainable blends" (capability 02) | **NEEDS VERIFICATION** | The site's only environmental claim. Unsupported claims of this kind attract regulatory attention — either substantiate it or remove the word |

## Tier 3 — operational detail

| Field | Status |
|---|---|
| Fabric sources / mill relationships (named or characterised) | **CLIENT INPUT REQUIRED** |
| In-house wash capability — what processes, what equipment | **CLIENT INPUT REQUIRED** |
| Packaging options (polybag, hangtag, carton spec, barcode) | **CLIENT INPUT REQUIRED** |
| Shipping / incoterms handled | **CLIENT INPUT REQUIRED** |
| Payment terms structure | **CLIENT INPUT REQUIRED** |
| Size range and grading standards offered | **CLIENT INPUT REQUIRED** |
| Company registration / GSTIN for the footer | **CLIENT INPUT REQUIRED** |

## Photography

See `assets/README.md` for the ranked list. Summary: **every photograph on the
site is stock.** Two carried identifiable third-party branding and have been
withdrawn or cropped. The highest-value asset commission is a half-day shoot
covering: the production floor, an inspection station, a wash line, fabric
storage, and packed goods.

## Verification needed

| Item | Why |
|---|---|
| Phone number `+91 82963 76673` | Consistent across every surface, well-formed — but never checked against the real line |
| Address `#1862/4, 3rd Cross, 2nd Main, Micro Layout, Hongsandra, Begur, 560068` | Appears in visible copy and in `LocalBusiness` schema; must match the Google Business Profile exactly or local ranking suffers |
| Geo coordinates `12.8906, 77.6271` | Should point at the actual premises |
| `legalName: "ROOTS Business Connect"` vs `name: "ROOTS Manufacturing"` | Two entity names in one schema node; confirm which is the registered entity |

---

## How to use this

Send the Tier 1 answers first. Those five fields unblock the private-label page,
the process page and the FAQ schema — which together are the difference between
a brochure site and one that a sourcing manager can qualify from.
