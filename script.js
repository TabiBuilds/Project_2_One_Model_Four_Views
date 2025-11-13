import showCards from './editable_js/template_cards.js';
import showCategories from './editable_js/template_category.js';
import showStats from './editable_js/template_stats.js';
import showTable from './editable_js/template_table.js';

import loadData from './editable_js/load_data.js';

// Map view names to functions
const viewsMap = {
  cards: showCards,
  table: showTable,
  categories: showCategories,
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