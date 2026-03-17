# Listings on Your Realtor Site

Listings are loaded from **`data/listings.json`** and rendered on the Home and Buy pages.

## 1. Use the JSON file (current setup)

- Edit **`data/listings.json`** to add or change properties.
- Each listing can have: `id`, `title`, `address`, `price`, `beds`, `baths`, `sqft`, `description`, `image` (URL), `link`, `featured`.
- Leave `image` as `""` to show the placeholder; set a URL to show a real photo.
- **Run the site through a local server** so `fetch()` can load the JSON (e.g. VS Code “Live Server” or `npx serve .` in the project folder). Opening `index.html` directly as a file may block loading `listings.json`.

## 2. Listings from VIA Realtors (or another API)

**VIA** exposes property data via an API (often XML, refreshed every 4 hours). To use it:

1. Get your API key and feed URL from VIA (CRM / Property Editor → Property tab → generate API key).
2. **Option A – Backend proxy (recommended):**  
   Add a small server (e.g. Node, PHP, or serverless) that:
   - Calls VIA’s API with your key
   - Converts the response to the same shape as `listings.json` (array of objects with the fields above)
   - Exposes it at a URL like `/api/listings` or `https://yoursite.com/api/listings`
3. **Option B – Point the front end at that URL:**  
   In **`js/listings.js`**, set:
   ```js
   var LISTINGS_URL = '/api/listings';   // or your full API URL
   ```
   Your API should return JSON in this form:
   ```json
   { "listings": [ { "id": "1", "title": "123 Oak St", "price": "$349,000", "beds": 3, "baths": 2, "sqft": "1,850", "description": "...", "image": "https://...", "link": "#", "featured": true } ] }
   ```

## 3. Optional grid behavior

- **Home page:** shows the first 4 listings (`data-limit="4"`).
- **Buy page:** shows all featured listings (`data-featured="true"`).
- You can add more grids elsewhere with `class="listings-grid" data-listings` and optional `data-limit="6"` or `data-featured="true"`.
