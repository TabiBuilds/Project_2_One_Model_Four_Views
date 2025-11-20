import showCards from './editable_js/template_cards.js';
import showGroupedCategories from './editable_js/template_category.js';
import showStats from './editable_js/template_stats.js';
import showTable from './editable_js/template_table.js';

import loadData from './editable_js/load_data.js';

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
    if (viewsMap[viewName]) {
      updateDisplay(viewsMap[viewName](data));
      updateNavActive(viewName);
    }
    attachTableSorting();
attachTableFilter();
attachExportButton();
  }
});

    // Show initial view
    updateDisplay(showCards(data));
    updateNavActive('cards');

    console.log("Application ready!");
  } catch (error) {
    console.error("Failed to start:", error);
    showError(error.message);
  }
});

function attachTableSorting() {
  document.querySelectorAll('.sortable').forEach(header => {
    header.addEventListener('click', () => {
      const key = header.dataset.key;
      // Toggle sort order: asc / desc
      const currentOrder = header.dataset.order || 'asc';
      const newOrder = currentOrder === 'asc' ? 'desc' : 'asc';
      header.dataset.order = newOrder;

      // Get rows
      const tbody = header.closest('table').querySelector('tbody');
      const rows = Array.from(tbody.querySelectorAll('tr'));

      // Sort rows
      rows.sort((a, b) => {
        const aText = a.querySelector(`td:nth-child(${header.cellIndex + 1})`).innerText;
        const bText = b.querySelector(`td:nth-child(${header.cellIndex + 1})`).innerText;

        // Basic comparison, can be extended for dates/numbers
        if (!isNaN(aText) && !isNaN(bText)) {
          return newOrder === 'asc' ? aText - bText : bText - aText;
        } else {
          return newOrder === 'asc' ? aText.localeCompare(bText) : bText.localeCompare(aText);
        }
      });

      // Append sorted rows
      rows.forEach(row => tbody.appendChild(row));
    });
  });
}

function attachTableFilter() {
  const searchInput = document.getElementById('tableSearch');
  const tbody = document.querySelector('.restaurant-table tbody');

  searchInput.addEventListener('input', () => {
    const filterText = searchInput.value.toLowerCase();

    Array.from(tbody.rows).forEach(row => {
      const nameCell = row.cells[0]; // assuming name is first column
      const categoryCell = row.cells[4]; // assuming category is fifth column

      const nameText = nameCell ? nameCell.innerText.toLowerCase() : '';
      const categoryText = categoryCell ? categoryCell.innerText.toLowerCase() : '';

      // Show row if either name or category includes the search term
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
  exportBtn.addEventListener('click', () => {
    const table = document.querySelector('.restaurant-table');

    // Select all data rows that are **not hidden**
    const rows = Array.from(table.querySelectorAll('tbody tr')).filter(row => row.style.display !== 'none');

    // Prepare CSV
    const columns = ['name', 'date', 'result', 'location', 'category']; // your columns
    const csvRows = [];

    // Add headers
    csvRows.push(columns.join(','));

    // Add only visible rows data
    rows.forEach(row => {
      const cells = Array.from(row.cells);
      const rowData = columns.map((col, index) => {
        // match columns with cells
        return `"${(cells[index]?.innerText || '').replace(/"/g, '""')}"`;
      });
      csvRows.push(rowData.join(','));
    });

    const csvContent = csvRows.join('\n');

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'filtered-data.csv';
    a.click();
    URL.revokeObjectURL(url);
  });
}


function groupByFields(data, fields) {
  const groups = {};

  data.forEach(item => {
    // Build the group key based on selected fields
    const key = fields.map(field => item[field] || 'Unknown').join(' | ');
    
    if (!groups[key]) {
      groups[key] = {
        items: [],
        counts: {
          total: 0,
          compliant: 0,
          nonCompliant: 0,
          critical: 0,
          // add more if needed
        }
      };
    }

    // Push item into group
    groups[key].items.push(item);
    groups[key].counts.total += 1;

    // Count based on result
    const resultVal = (item.result || '').toLowerCase();
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