# Image assets

Put your image files here so the site can use them.

## NAR & Via Group logos

- **Via Group:** `via-group-logo.png` (or `via-group-logo.jpg`)
- **NAR (National Association of Realtors):** `nar-logo.png` (or `nar-logo.jpg`)
- **Used in:** Footer on every page, and the “Affiliations” section on the About page.

If your logo files have different names, rename them to match the paths above so they display correctly.

## Headshot (home page hero)

- **File:** `headshot.jpg` or `headshot.png`
- **Location:** `images/headshot.jpg` (or `images/headshot.png`)
- **Used in:** Hero section on the home page (`index.html`)

If you use a different name (e.g. `realtor-photo.jpg`), update the `src` in `index.html` in the hero section.

## Listing photos (Trending / Featured Listings)

- **Files:** One image per listing, e.g. `listing-1.jpg`, `listing-2.jpg`, …
- **Location:** `images/listings/`
- **Used in:** Home page “Trending Listings” and Buy page “Featured Listings” (paths are set in `data/listings.json`)

Current setup expects:
- Listing 1 (123 Oak Street): `images/listings/listing-1.jpg`
- Listing 2 (456 Maple Avenue): `images/listings/listing-2.jpg`
- Listing 3 (789 Pine Lane): `images/listings/listing-3.jpg`
- Listing 4 (321 Elm Drive): `images/listings/listing-4.jpg`

You can use `.jpg`, `.jpeg`, or `.png`. If you use different filenames, edit the `"image"` field for each listing in `data/listings.json`.
