// template_category.js

import { groupByFields } from '../script.js';

// Helper to get all unique categories for the dropdown filter
function getUniqueCategories(data) {
  const categories = new Set();
  data.forEach(item => {
    const props = item.properties || item;
    if (props.category) {
      categories.add(props.category);
    }
  });
  return [...categories].sort();
}

/**
 * Attaches event listeners for search and filter controls
 * @param {Array<Object>} originalData - The complete, unfiltered dataset
 * @param {Array<string>} fields - The fields used for grouping
 */
function attachCategoryControls(originalData, fields) {
  const container = document.getElementById('category-view-content');
  const searchInput = document.getElementById('categorySearch');
  const categorySelect = document.getElementById('categoryFilter');

  function renderFilteredView() {
    const searchTerm = searchInput.value.toLowerCase();
    const selectedCategory = categorySelect.value;

    // 1. Filter Data
    const filteredData = originalData.filter(item => {
      const props = item.properties || item;

      // Filter by Search Term (applied to name, city, or address)
      const matchesSearch = searchTerm === '' ||
        (props.name && props.name.toLowerCase().includes(searchTerm)) ||
        (props.city && props.city.toLowerCase().includes(searchTerm)) ||
        (props.address_line_1 && props.address_line_1.toLowerCase().includes(searchTerm));

      // Filter by Category
      const matchesCategory = selectedCategory === 'all' || props.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });

    // 2. Group and Render
    const groups = groupByFields(filteredData, fields);
    container.innerHTML = createCategoryHTML(groups);
  }

  // Attach event listeners
  searchInput.addEventListener('input', renderFilteredView);
  categorySelect.addEventListener('change', renderFilteredView);

  // Initial render when controls are attached
  renderFilteredView();
}

/**
 * Creates the HTML for the grouped categories
 * This function was updated to use <ol> and <li> for item numbering.
 * @param {Object} groups - The object returned by groupByFields
 */
function createCategoryHTML(groups) {
    const html = Object.entries(groups).map(([groupKey, group]) => {
        const { total, compliant, nonCompliant, critical } = group.counts;
        const compliancePercent = total > 0 ? ((compliant / total) * 100).toFixed(1) : 'N/A';

        const labels = groupKey.split(' | ');

        return `
            <div class="category-section">
                <h3 class="category-header">
                    ${labels.join(' | ')}
                </h3>
                <div class="category-stats">
                    <p>Total Items: ${total}</p>
                    <p>Compliance: ${compliancePercent}% (✔️ ${compliant}, ❌ ${nonCompliant}, ⚠️ ${critical})</p>
                </div>
                <div class="category-items">
                    <h4>Sample Items (3 most recent):</h4>
                    <ol class="category-list">
                        ${group.items.slice(0, 3).map(item => {
                            const props = item.properties || item;
                            
                            return `
                            <li class="category-item">
                                <strong>${props.name || 'N/A'}</strong> <br/>
                                Result: ${props.inspection_results || 'N/A'}
                            </li>
                            `;
                        }).join('')}
                    </ol>
                    </div>
            </div>
        `;
    }).join('');

    return html === '' ? '<div class="no-results">No results match the current filters.</div>' : `<div class="category-grid">${html}</div>`;
}


/**
 * Main render function for Category View
 */
function showCategories(data, fields) {
  const uniqueCategories = getUniqueCategories(data);

  // Schedule the control setup after the HTML is rendered
  setTimeout(() => {
    attachCategoryControls(data, fields);
  }, 0);

  /*html*/
  return `
    <h2 class="view-title">📂 Grouped Categories</h2>
    
    <div class="category-controls">
        <input type="text" id="categorySearch" placeholder="Search by name, city, or address..." />
        <select id="categoryFilter">
            <option value="all">Filter by Type (All)</option>
            ${uniqueCategories.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
        </select>
    </div>

    <div id="category-view-content" class="category-grid">
      <div class="loading">Loading categories...</div>
    </div>
  `;
}

export default showCategories;