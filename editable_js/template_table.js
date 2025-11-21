// editable_js/template_table.js

// Duplicated constants & helpers for self-contained pagination
const ITEMS_PER_PAGE = 30;

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

function showTable(data, currentPage = 1) {
    const totalItems = data.length;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

    // Calculate the slice indices
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;

    // Slice the data to get only the items for the current page
    const pageData = data.slice(startIndex, endIndex);

    // --- 1. Generate the table rows for the current page ---
    const tableRowsHTML = pageData.map((restaurant) => {
        const resultsColor = getResultsColor(restaurant.inspection_results);
        const dateOnly = restaurant.inspection_date ? restaurant.inspection_date.split('T')[0] : 'N/A';
        
        return `
            <tr>
                <td>${restaurant.name || 'N/A'}</td>
                <td>${restaurant.category || 'N/A'}</td>
                <td>${restaurant.address_line_1 || 'N/A'}</td>
                <td style="color: ${resultsColor};">${restaurant.inspection_results || 'N/A'}</td>
                <td>${dateOnly}</td>
                <td>${restaurant.owner || 'N/A'}</td>
            </tr>
        `;
    }).join('');

    // --- 2. Assemble the Table HTML (including responsive wrapper) ---
    const tableHTML = `
        <div class="table-controls">
            <input type="text" id="tableSearch" placeholder="Filter by Name or Category..." aria-label="Filter table data">
            <button id="exportBtn">Export to CSV</button>
        </div>
        <div class="table-responsive">
            <table class="restaurant-table">
                <thead>
                    <tr>
                        <th class="sortable" data-column="name">Name</th>
                        <th class="sortable" data-column="category">Category</th>
                        <th data-column="address">Address</th>
                        <th class="sortable" data-column="results">Inspection Results</th>
                        <th class="sortable" data-column="date">Inspection Date</th>
                        <th data-column="owner">Owner</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRowsHTML}
                </tbody>
            </table>
        </div>
    `;

    // --- 3. Return the Table and Pagination Controls ---
    return `
        ${tableHTML}
        ${renderPaginationControls(currentPage, totalPages)}
    `;
}

export default showTable;