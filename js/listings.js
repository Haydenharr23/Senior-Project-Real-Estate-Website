/**
 * Listings loader – fetches listings from data/listings.json (or your API)
 * and renders them into any .listings-grid on the page.
 *
 * Optional data attributes on .listings-grid:
 *   data-limit="4"     – show only first N listings (e.g. 4 for home page)
 *   data-featured="true" – show only featured listings
 */

(function () {
  'use strict';

  var LISTINGS_URL = 'data/listings.json';

  // Fallback when fetch fails (e.g. opening as file:// or no server)
  var FALLBACK_LISTINGS = {
    listings: [
      { id: '1', title: '123 Oak Street', address: '123 Oak St, City, ST 12345', price: '$349,000', beds: 3, baths: 2, sqft: '1,850', description: 'Spacious family home with updated kitchen and large backyard.', image: 'images/home1.jpg', link: '#', featured: true },
      { id: '2', title: '456 Maple Avenue', address: '456 Maple Ave, City, ST 12345', price: '$425,000', beds: 4, baths: 3, sqft: '2,200', description: 'Modern open floor plan with premium finishes.', image: 'images/home2.jpg', link: '#', featured: true },
      { id: '3', title: '789 Pine Lane', address: '789 Pine Ln, City, ST 12345', price: '$289,000', beds: 2, baths: 2, sqft: '1,400', description: 'Cozy condo in a quiet neighborhood.', image: 'images/home3.jpg', link: '#', featured: true },
      { id: '4', title: '321 Elm Drive', address: '321 Elm Dr, City, ST 12345', price: '$525,000', beds: 5, baths: 4, sqft: '3,100', description: 'Luxury estate with pool and outdoor living space.', image: 'images/home4.jpg', link: '#', featured: true },
      { id: '5', title: '555 Cedar Court', address: '555 Cedar Ct, City, ST 12345', price: '$379,000', beds: 3, baths: 2, sqft: '1,920', description: 'Move-in ready with new roof and HVAC.', image: 'images/home5.jpg', link: '#', featured: false }
    ]
  };

  function formatSubtext(listing) {
    var parts = [];
    if (listing.beds) parts.push(listing.beds + ' bed' + (listing.beds !== 1 ? 's' : ''));
    if (listing.baths) parts.push(listing.baths + ' bath' + (listing.baths !== 1 ? 's' : ''));
    if (listing.sqft) parts.push(listing.sqft + ' sq ft');
    if (listing.price) parts.push(listing.price);
    return parts.length ? parts.join(' · ') : (listing.description || '');
  }

  function buildCard(listing) {
    var subtext = formatSubtext(listing);
    var imgHtml = listing.image
      ? '<img src="' + escapeHtml(listing.image) + '" alt="" class="listing-card-img" onerror="var w=this.parentNode;var d=document.createElement(\'div\');d.className=\'img-placeholder\';d.innerHTML=\'✕\';w.innerHTML=\'\';w.appendChild(d);">'
      : '<div class="img-placeholder">✕</div>';
    var link = listing.link || '#';

    return (
      '<div class="listing-card" data-listing-id="' + escapeHtml(listing.id) + '">' +
        '<a href="' + escapeHtml(link) + '" class="listing-card-image-wrap">' + imgHtml + '</a>' +
        '<h3>' + escapeHtml(listing.title) + '</h3>' +
        '<p>' + escapeHtml(subtext) + '</p>' +
        '<a href="' + escapeHtml(link) + '" class="more-info">More info</a>' +
      '</div>'
    );
  }

  function escapeHtml(text) {
    if (!text) return '';
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function renderGrids(data) {
    var listings = data.listings || [];
    var grids = document.querySelectorAll('.listings-grid[data-listings]');

    grids.forEach(function (grid) {
      var limit = grid.getAttribute('data-limit');
      var featuredOnly = grid.getAttribute('data-featured') === 'true';
      var list = featuredOnly ? listings.filter(function (l) { return l.featured; }) : listings;
      var max = limit ? parseInt(limit, 10) : list.length;
      var toShow = list.slice(0, isNaN(max) ? list.length : max);

      grid.innerHTML = toShow.map(buildCard).join('');
    });
  }

  function loadListings() {
    fetch(LISTINGS_URL)
      .then(function (res) { return res.ok ? res.json() : Promise.reject(new Error('Failed to load listings')); })
      .then(renderGrids)
      .catch(function (err) {
        console.warn('Listings: ' + err.message + '; using fallback.');
        renderGrids(FALLBACK_LISTINGS);
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadListings);
  } else {
    loadListings();
  }
})();
