// editable_js/template_cards.js

// constants we'll need for pagination controls
const ITEMS_PER_PAGE = 30;

// Helper function to generate the pagination controls HTML
function renderPaginationControls(currentPage, totalPages) {
    if (totalPages <= 1) return '';
    
    const prevDisabled = currentPage === 1 ? 'disabled' : '';
    const nextDisabled = currentPage === totalPages ? 'disabled' : '';

    let pagesHTML = '';
    const startPage = Math.max(1, currentPage - 1);
    const endPage = Math.min(totalPages, currentPage + 1);

    if (currentPage > 2) {
        pagesHTML += `<button class="page-btn" data-page="1">1</button>`;
        if (currentPage > 3) pagesHTML += `<span class="ellipsis">...</span>`;
    }

    for (let i = startPage; i <= endPage; i++) {
        const activeClass = i === currentPage ? 'active' : '';
        pagesHTML += `<button class="page-btn ${activeClass}" data-page="${i}">${i}</button>`;
    }

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

// Helper function for color
function getResultsColor(inspection_results) {
    const phraseColorMap = [
        { phrase: 'violations', color: 'red' },
        { phrase: 'compliant - no health risk', color: 'green' },
        { phrase: 'compliance schedule', color: 'orange' },
        { phrase: 'facility closed', color: 'gray' },
        { phrase: 'facility opened', color: 'blue' },
    ];

    let resultsColor = 'black';
    if (inspection_results) {
        const resultText = inspection_results.toLowerCase();
        for (const { phrase, color } of phraseColorMap) {
            if (resultText.includes(phrase)) {
                resultsColor = color;
                break;
            }
        }
    }
    return resultsColor;
}


// The data passed to this function should be the full, unfiltered array.
function showCards(data, currentPage = 1, currentSortOrder = 'random') {
    const totalItems = data.length;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

    // Calculate the slice indices
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;

    // Slice the data to get only the items for the current page
    const pageData = data.slice(startIndex, endIndex);

    // --- HTML for the Sort Control (FIX: Renamed 'recommended' to 'random') ---
    const sortControlHTML = `
        <div class="card-controls">
            <label for="cardSortSelect">Sort by:</label>
            <select id="cardSortSelect" aria-label="Sort restaurant data">
                <option value="random" ${currentSortOrder === 'random' ? 'selected' : ''}>Random</option>
                <option value="a-z" ${currentSortOrder === 'a-z' ? 'selected' : ''}>Name (A-Z)</option>
                <option value="z-a" ${currentSortOrder === 'z-a' ? 'selected' : ''}>Name (Z-A)</option>
            </select>
        </div>
    `;

    // --- Rendering the Cards ---
    const cardHTML = pageData
        .map(
            (restaurant) => {
                const resultsColor = getResultsColor(restaurant.inspection_results);
                
                // Truncating the Restaurant's address
                const address = restaurant.address_line_1 || 'N/A';
                const addressSnippet = address.length > 30 ? address.substring(0, 30) + '...' : address;

                // Linking to Google Maps
                const coords = restaurant.geocoded_column_1?.coordinates;
                const mapLink = coords ? `https://www.google.com/maps/search/?api=1&query=${coords[1]},${coords[0]}` : '#';

                const fullDate = restaurant.inspection_date || 'N/A';
                const dateOnly = fullDate !== 'N/A' ? fullDate.split('T')[0] : 'N/A';

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
        ${sortControlHTML}
        <div class="card-grid">
        ${cardHTML}
        </div>
        ${renderPaginationControls(currentPage, totalPages)}
    `;
}

// Only export what is absolutely necessary for script.js
export { showCards, ITEMS_PER_PAGE };