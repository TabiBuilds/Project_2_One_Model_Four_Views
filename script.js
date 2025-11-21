// script.js (Main Entry Point)

// Import view functions.
import { showCards, ITEMS_PER_PAGE } from './editable_js/template_cards.js';
import showGroupedCategories from './editable_js/template_category.js';
import showStats from './editable_js/template_stats.js';
import showTable from './editable_js/template_table.js'; // Must be a default import

import loadData from './editable_js/load_data.js';

// --- APPLICATION STATE ---
let cardCurrentPage = 1;
let tableCurrentPage = 1; 

// FIX: Change default sort order state to 'random'
let cardSortOrder = 'random';


// Map view names to functions
const viewsMap = {
  cards: showCards,
  table: showTable,
  categories: showGroupedCategories, 
  stats: showStats
};

/**
 * Update the display with new content
 */
function updateDisplay(content) {
  document.getElementById("data-display").innerHTML = content;
}

/**
 * Update button (nav item) active states
 */
function updateNavActive(selectedView) {
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.classList.remove("active");
  });
  const activeItem = document.querySelector(`.nav-item[data-view="${selectedView}"]`);
  if (activeItem) activeItem.classList.add("active");
}

/**
 * Show loading state
 */
function showLoading() {
  updateDisplay('<div class="loading">Loading data from API...</div>');
}

/**
 * Show error state
 */
function showError(message) {
  updateDisplay(`
    <div class="error">
      <h3>Error Loading Data</h3>
      <p>${message}</p>
      <button onclick="location.reload()">Try Again</button>
    </div>
  `);
}

/**
 * NEW HELPER: Sorts the data based on the current cardSortOrder.
 */
function sortDataForCards(data) {
    let sortedData = [...data]; // Create a shallow copy

    if (cardSortOrder === 'a-z') {
        sortedData.sort((a, b) => {
            const nameA = a.name ? a.name.toUpperCase() : '';
            const nameB = b.name ? b.name.toUpperCase() : '';
            return nameA.localeCompare(nameB);
        });
    } else if (cardSortOrder === 'z-a') {
        sortedData.sort((a, b) => {
            const nameA = a.name ? a.name.toUpperCase() : '';
            const nameB = b.name ? b.name.toUpperCase() : '';
            return nameB.localeCompare(nameA);
        });
    } else if (cardSortOrder === 'random') {
        // Implement Fisher-Yates (Knuth) Shuffle for true random sort
        let currentIndex = sortedData.length, randomIndex;
        
        while (currentIndex !== 0) {
            // Pick a remaining element.
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;

            // And swap it with the current element.
            [sortedData[currentIndex], sortedData[randomIndex]] = [
                sortedData[randomIndex], sortedData[currentIndex]
            ];
        }
    }
    
    return sortedData;
}


/**
 * Centralized handler to switch views, manage arguments, and attach event listeners.
 */
function handleViewSwitch(viewName, data) {
    if (viewsMap[viewName]) {
        let content;
        // Determine the current page for this view
        const currentPage = viewName === 'cards' ? cardCurrentPage : 
                            viewName === 'table' ? tableCurrentPage : 1; 

        // Apply sorting only if in Card View
        const dataToRender = viewName === 'cards' ? sortDataForCards(data) : data;

        // --- VIEW-SPECIFIC RENDERING LOGIC ---
        if (viewName === 'cards' || viewName === 'table') {
            // Pass the current page number and the potentially sorted data
            content = viewsMap[viewName](dataToRender, currentPage, cardSortOrder); // Pass sort order to card view
        } else if (viewName === 'categories') {
            const groupingFields = ['category', 'city']; // Fields to group by
            content = viewsMap[viewName](dataToRender, groupingFields);
        } else {
            // Stats view
            content = viewsMap[viewName](dataToRender);
        }

        // --- UPDATE DISPLAY AND NAV ---
        updateDisplay(content);
        updateNavActive(viewName);

        // --- ATTACH LISTENERS AFTER RENDER ---
        if (viewName === 'table') {
            // Attach table-specific handlers AND pagination
            setTimeout(() => {
                attachTableSorting();
                attachTableFilter();
                attachExportButton();
                attachPaginationHandler(data, 'table');
            }, 50); 
        } else if (viewName === 'cards') {
            // ATTACH PAGINATION & NEW SORT HANDLERS
            attachPaginationHandler(data, 'cards');
            attachCardSortHandler(data); // Attach handler for card sorting
        }

        // When switching away from cards or table, reset their pages for the next time
        if (viewName !== 'cards') {
            cardCurrentPage = 1;
            cardSortOrder = 'random'; // FIX: Reset sort to 'random' when leaving card view
        }
        if (viewName !== 'table') {
            tableCurrentPage = 1;
        }
    }
}


/**
 * Attaches the change listener for the sorting dropdown in Card View.
 * @param {Array} data - The full dataset.
 */
function attachCardSortHandler(data) {
    const sortSelect = document.getElementById('cardSortSelect');
    if (!sortSelect) return;

    sortSelect.addEventListener('change', (event) => {
        const newSort = event.target.value;
        if (newSort !== cardSortOrder) {
            cardSortOrder = newSort;
            cardCurrentPage = 1; // Reset to page 1 after sorting
            // Re-render the cards with the full data array, allowing handleViewSwitch to apply sorting
            handleViewSwitch('cards', data); 
        }
    });
}


/**
 * Attaches the click listener for both Card and Table View pagination buttons.
 * @param {Array} data - The full dataset.
 * @param {string} viewName - 'cards' or 'table'.
 */
function attachPaginationHandler(data, viewName) {
    // Use event delegation on the controls container
    const paginationControls = document.querySelector('.pagination-controls');
    if (!paginationControls) return;

    paginationControls.addEventListener('click', (event) => {
        const target = event.target.closest('.page-btn');
        if (target && !target.disabled) {
            const newPage = parseInt(target.getAttribute('data-page'));
            
            // Validate the page number
            if (!isNaN(newPage) && newPage >= 1) {
                const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE);

                if (newPage <= totalPages) {
                    // Check if page actually changed and update the correct state variable
                    if (viewName === 'cards') {
                        if (newPage === cardCurrentPage) return;
                        cardCurrentPage = newPage;
                    } else if (viewName === 'table') {
                        if (newPage === tableCurrentPage) return;
                        tableCurrentPage = newPage;
                    } else {
                        return; // Safety check
                    }
                    
                    // RENDER THE CURRENT VIEW AGAIN with the new page
                    handleViewSwitch(viewName, data);

                    // Scroll to the top of the display container for better UX
                    document.querySelector('.display-container').scrollIntoView({ behavior: 'smooth' });
                }
            }
        }
    });
}


// Main app initialization
document.addEventListener("DOMContentLoaded", async () => {
  console.log("Starting application...");
  try {
    showLoading();
    const data = await loadData();
    console.log(`Loaded ${data.length} items from API`);

    // Set up nav bar click handler (event delegation)
    document.querySelector('.navbar').addEventListener('click', (event) => {
      const target = event.target.closest('.nav-item');
      if (target && target.classList.contains('nav-item')) {
        const viewName = target.getAttribute('data-view');
        handleViewSwitch(viewName, data);
      }
    });

    // Show initial view (Card View)
    handleViewSwitch('cards', data);

    console.log("Application ready!");
  } catch (error) {
    console.error("Failed to start:", error);
    showError(error.message);
  }
});


// --- Helper Functions (MUST BE EXPORTED FOR template_category.js to work) ---
// This is used by template_category.js
export function groupByFields(data, fields) {
  const groups = {};

  data.forEach(item => {
    // Determine where the properties are (item.properties for GeoJSON, item otherwise)
    const props = item.properties || item; 

    // Build the group key based on selected fields
    const key = fields.map(field => props[field] || 'Unknown').join(' | ');
    
    if (!groups[key]) {
      groups[key] = {
        items: [],
        counts: {
          total: 0,
          compliant: 0,
          nonCompliant: 0,
          critical: 0,
        }
      };
    }

    groups[key].items.push(item);
    groups[key].counts.total += 1;

    // Access inspection results
    const resultVal = (props.inspection_results || '').toLowerCase();
    
    if (resultVal.includes('compliant')) {
      groups[key].counts.compliant += 1;
    } else if (resultVal.includes('non-compliant')) {
      groups[key].counts.nonCompliant += 1;
    } else if (resultVal.includes('critical')) {
      groups[key].counts.critical += 1;
    }
  });

  return groups;
}

// --- Table Attachment Functions (Unchanged) ---

function attachTableSorting() {
  document.querySelectorAll('.sortable').forEach(header => {
    header.addEventListener('click', () => {
      const currentOrder = header.dataset.order || 'asc';
      const newOrder = currentOrder === 'asc' ? 'desc' : 'asc';
      header.dataset.order = newOrder;
      const tbody = header.closest('table').querySelector('tbody');
      const rows = Array.from(tbody.querySelectorAll('tr'));
      rows.sort((a, b) => {
        const aText = a.querySelector(`td:nth-child(${header.cellIndex + 1})`).innerText;
        const bText = b.querySelector(`td:nth-child(${header.cellIndex + 1})`).innerText;
        if (!isNaN(aText) && !isNaN(bText)) {
          return newOrder === 'asc' ? aText - bText : bText - aText;
        } else {
          return newOrder === 'asc' ? aText.localeCompare(bText) : bText.localeCompare(aText);
        }
      });
      rows.forEach(row => tbody.appendChild(row));
    });
  });
}

function attachTableFilter() {
  const searchInput = document.getElementById('tableSearch');
  const tbody = document.querySelector('.restaurant-table tbody');
  
  if (!searchInput || !tbody) return;

  searchInput.addEventListener('input', () => {
    const filterText = searchInput.value.toLowerCase();
    Array.from(tbody.rows).forEach(row => {
      const nameText = row.cells[0]?.innerText.toLowerCase() || '';
      const categoryText = row.cells[4]?.innerText.toLowerCase() || '';
      if (nameText.includes(filterText) || categoryText.includes(filterText)) {
        row.style.display = '';
      } else {
        row.style.display = 'none';
      }
    });
  });
}

function attachExportButton() {
  const exportBtn = document.getElementById('exportBtn');
  if (!exportBtn) return;
  
  exportBtn.addEventListener('click', () => {
    const table = document.querySelector('.restaurant-table');
    const rows = Array.from(table.querySelectorAll('tbody tr')).filter(row => row.style.display !== 'none');
    const columns = ['name', 'date', 'result', 'location', 'category']; 
    const csvRows = [];
    csvRows.push(columns.join(','));
    rows.forEach(row => {
      const cells = Array.from(row.cells);
      const rowData = columns.map((col, index) => {
        return `"${(cells[index]?.innerText || '').replace(/"/g, '""')}"`;
      });
      csvRows.push(rowData.join(','));
    });
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'filtered-data.csv';
    a.click();
    URL.revokeObjectURL(url);
  });
}