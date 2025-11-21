// constants we'll need for pagination controls
const ITEMS_PER_PAGE = 30;

// The data passed to this function should be the full, unfiltered array.
function showCards(data, currentPage = 1) {
  const totalItems = data.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  // Calculate the slice indices
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;

  // Slice the data to get only the items for the current page
  const pageData = data.slice(startIndex, endIndex);

  // --- Rendering the Cards ---
  const cardHTML = pageData
    .map(
      (restaurant) => {
        // Define phrase-to-color mappings
        const phraseColorMap = [
          { phrase: 'violations', color: 'red' },
          { phrase: 'compliant - no health risk', color: 'green' },
          { phrase: 'compliance schedule', color: 'orange' },
          { phrase: 'facility closed', color: 'gray' },
          { phrase: 'facility opened', color: 'blue' },
        ];

        // Determine the color based on inspection results
        let resultsColor = 'black'; // default color
        if (restaurant.inspection_results) {
          const resultText = restaurant.inspection_results.toLowerCase();
          for (const { phrase, color } of phraseColorMap) {
            if (resultText.includes(phrase)) {
              resultsColor = color;
              break;
            }
          }
        }

        // Truncating the Restaurant's address
        const address = restaurant.address_line_1 || 'N/A';
        const addressSnippet = address.length > 30 ? address.substring(0, 30) + '...' : address;

        // Linking to Google Maps
        // FIX: The URL format was incorrect. Assuming google maps uses standard lat/long.
        const coords = restaurant.geocoded_column_1?.coordinates;
        const mapLink = coords ? `https://www.google.com/maps/search/?api=1&query=${coords[1]},${coords[0]}` : '#';

        // --- NEW: Format Inspection Date ---
        const fullDate = restaurant.inspection_date || 'N/A';
        const dateOnly = fullDate !== 'N/A' ? fullDate.split('T')[0] : 'N/A';
        // --- END NEW ---

        return `
        <div class="restaurant-card">
            <h3> ${restaurant.name || 'N/A'}</h3>
            <p><strong>🍽️ Category:</strong> ${restaurant.category || 'N/A'}</p>
            <p><strong>📍 Address:</strong> ${addressSnippet}</p>
            <p><strong>🗓️ Inspected On:</strong> ${dateOnly}</p>
            <p style="color: ${resultsColor};"><strong>✅ Results:</strong> ${restaurant.inspection_results || 'N/A'}</p>
            <p><strong>👤 Owner:</strong> ${restaurant.owner || 'N/A'}</p>
            <button class="map-button" onclick="window.open('${mapLink}', '_blank')">Get Directions</button>
        </div>
        `;
      }
    )
    .join("");
    
  // --- Rendering the Full Card View HTML (Cards + Pagination) ---
  return `
    <div class="card-grid">
      ${cardHTML}
    </div>
    ${renderPaginationControls(currentPage, totalPages)}
  `;
}

// Helper function to generate the pagination controls HTML
function renderPaginationControls(currentPage, totalPages) {
    if (totalPages <= 1) return '';
    
    // Always include first, previous, next, and last buttons
    const prevDisabled = currentPage === 1 ? 'disabled' : '';
    const nextDisabled = currentPage === totalPages ? 'disabled' : '';

    let pagesHTML = '';
    // Determine which page numbers to show (e.g., current, current-1, current+1)
    const startPage = Math.max(1, currentPage - 1);
    const endPage = Math.min(totalPages, currentPage + 1);

    // Show first page button if not near the start
    if (currentPage > 2) {
        pagesHTML += `<button class="page-btn" data-page="1">1</button>`;
        if (currentPage > 3) pagesHTML += `<span class="ellipsis">...</span>`;
    }

    // Show pages around the current page
    for (let i = startPage; i <= endPage; i++) {
        const activeClass = i === currentPage ? 'active' : '';
        pagesHTML += `<button class="page-btn ${activeClass}" data-page="${i}">${i}</button>`;
    }

    // Show last page button if not near the end
    if (currentPage < totalPages - 1) {
        if (currentPage < totalPages - 2) pagesHTML += `<span class="ellipsis">...</span>`;
        pagesHTML += `<button class="page-btn" data-page="${totalPages}">${totalPages}</button>`;
    }
    

    return `
        <div class="pagination-controls" data-current-page="${currentPage}">
            <button class="page-btn control-btn" data-page="${currentPage - 1}" ${prevDisabled}>« Prev</button>
            ${pagesHTML}
            <button class="page-btn control-btn" data-page="${currentPage + 1}" ${nextDisabled}>Next »</button>
        </div>
    `;
}

// You will need to export the main function
export { showCards, ITEMS_PER_PAGE };