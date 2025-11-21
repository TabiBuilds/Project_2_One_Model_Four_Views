// script.js (Main Entry Point)

// Import showCards and the ITEMS_PER_PAGE constant from the template file
import { showCards, ITEMS_PER_PAGE } from './editable_js/template_cards.js';
import showGroupedCategories from './editable_js/template_category.js';
import showStats from './editable_js/template_stats.js';
import showTable from './editable_js/template_table.js';

import loadData from './editable_js/load_data.js';

// --- APPLICATION STATE ---
let cardCurrentPage = 1;

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
 * Centralized handler to switch views, manage arguments, and attach event listeners.
 */
function handleViewSwitch(viewName, data) {
    if (viewsMap[viewName]) {
        let content;
        
        // --- VIEW-SPECIFIC RENDERING LOGIC ---
        if (viewName === 'cards') {
            // PASS THE CURRENT PAGE NUMBER FOR CARD VIEW
            content = viewsMap[viewName](data, cardCurrentPage);
        } else if (viewName === 'categories') {
            const groupingFields = ['category', 'city']; // Fields to group by
            content = viewsMap[viewName](data, groupingFields);
        } else {
            // Table and Stats views
            content = viewsMap[viewName](data);
        }

        // --- UPDATE DISPLAY AND NAV ---
        updateDisplay(content);
        updateNavActive(viewName);

        // --- ATTACH LISTENERS AFTER RENDER ---
        if (viewName === 'table') {
            setTimeout(() => {
                attachTableSorting();
                attachTableFilter();
                attachExportButton();
            }, 50); 
        } else if (viewName === 'cards') {
            // ATTACH THE NEW PAGINATION HANDLER
            attachCardPaginationHandler(data);
        }

        // When switching away from cards, reset the page for the next time
        if (viewName !== 'cards') {
            cardCurrentPage = 1;
        }
    }
}


/**
 * Attaches the click listener for the Card View pagination buttons.
 */
function attachCardPaginationHandler(data) {
    document.querySelector('.pagination-controls').addEventListener('click', (event) => {
        const target = event.target.closest('.page-btn');
        if (target && !target.disabled) {
            const newPage = parseInt(target.getAttribute('data-page'));
            
            // Validate the page number
            if (!isNaN(newPage) && newPage >= 1 && newPage !== cardCurrentPage) {
                const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE);
                if (newPage <= totalPages) {
                    cardCurrentPage = newPage;
                    
                    // RENDER ONLY THE CARD VIEW AGAIN (do not switch tabs)
                    handleViewSwitch('cards', data);

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

// FIX: Export groupByFields and correct logic for GeoJSON structure.
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

// --- Table Attachment Functions (Unchanged logic, just ensuring they are here) ---

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