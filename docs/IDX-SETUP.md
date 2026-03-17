# IDX (Internet Data Exchange) Setup for Your Realtor Site

IDX is the standard way to show **live MLS listings** on a realtor website. Your site is set up so you can drop in an IDX feed from a provider.

## What is IDX?

- **IDX** = Internet Data Exchange. It’s the system that lets agents display MLS (Multiple Listing Service) listings on their own sites.
- Listings update automatically from the MLS; you don’t maintain them by hand.
- To use IDX you must be a **licensed agent/broker** (or work with one) and your **MLS/board** must allow IDX. The provider you choose must support your MLS.

## How it’s set up on your site

1. **Buy page**  
   At the top there is an **“Search MLS Listings”** section. Right now it shows placeholder text.

2. **Where to paste the IDX code**  
   In **`buy.html`**, find the section that looks like:
   ```html
   <div class="idx-embed" id="idx-embed">
     <!-- Replace this placeholder with your IDX provider's embed code. -->
     <div class="idx-placeholder"> ... </div>
   </div>
   ```
   **Delete** the inner `<div class="idx-placeholder">...</div>` and **paste your IDX provider’s embed code** in its place.  
   That code is usually:
   - an **iframe** (e.g. search + results from IDX Broker, RealtyNinja), or  
   - a **script** tag that injects a search widget.

3. **Styling**  
   The container `.idx-embed` and `iframe` are styled in **`css/styles.css`** so the embed is full width and has a minimum height. You can tweak those rules if needed.

## Getting an IDX feed

You don’t get IDX directly from the MLS. You get it through an **IDX provider** that is approved for your board/MLS. Common options:

| Provider        | Notes |
|----------------|--------|
| **IDX Broker**  | Very common. Custom HTML/static sites use their “wrapper” + embed. You get a URL or iframe to embed. [idxbroker.com](https://idxbroker.com) |
| **RealtyNinja** | MLS/IDX widgets with embed code for any site. [realtyninja.com](https://www.realtyninja.com/mls-idx-widget) |
| **IDX Plugin**  | Works with IDX Broker; gives embed code for search/carousels. [idxplugin.com](https://idxplugin.com) |
| **SimplyRETS**   | API-based; better if you want to build a custom search UI instead of an iframe. [simplyrets.com](https://simplyrets.com) |

Your **MLS or broker** often has a preferred or required IDX vendor—check with them first.

## Steps (summary)

1. Confirm you’re allowed to use IDX (licensed agent/broker, MLS rules).
2. Sign up with an IDX provider that supports your MLS.
3. In their dashboard, create a **search** or **search + results** widget and copy the **embed code** (iframe or script).
4. In **`buy.html`**, open the `div.idx-embed` section, remove the placeholder div, and paste the embed code inside `div.idx-embed`.
5. Save and open the Buy page in a browser to confirm the MLS search appears.

## Optional: IDX on the home page

If you want a small “Search listings” teaser on the home page (e.g. a search form that links to the Buy page or opens the full IDX in a new tab), you can add a second embed or a link:

- **Link:** e.g. “Search MLS Listings” → `buy.html` (where the full IDX embed lives).
- **Mini embed:** If your provider gives a “search form only” embed, you can add another `div.idx-embed` (or a separate class) on **`index.html`** and paste that embed code there. Use the same CSS or a smaller min-height if you want.

## Listings below the IDX section

The **“Featured Listings”** section below the IDX block is still driven by **`data/listings.json`** and **`js/listings.js`**. You can:

- Keep it as curated/featured listings you edit by hand, or  
- Remove or hide that section once your IDX search/results are the main listing experience.

If you tell me your IDX provider (e.g. IDX Broker, RealtyNinja), I can give you exact steps for that provider’s embed code and where to paste it in `buy.html`.
