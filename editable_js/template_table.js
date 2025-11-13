function showTable(data) {
  const columns = [
    { key: 'name', label: 'Restaurant Name' },
    { key: 'address_line_1', label: 'Location' },
    { key: 'category', label: 'Category' }
  ];

  // Generate table header with sortable columns
  const headers = columns.map((col, index) => `
    <th
      scope="col"
      role="button"
      aria-sort="none"
      data-key="${col.key}"
      class="sortable"
      aria-label="Sort by ${col.label}"
    >
      ${col.label}
      <span class="sort-indicator" aria-hidden="true"></span>
    </th>
  `).join('');

  // Generate table rows
  const rows = data.map(item => {
    const rowCells = columns.map(col => {
      const value = item[col.key] || 'N/A'; // handle missing data
      return `<td>${value}</td>`;
    }).join('');
    return `<tr>${rowCells}</tr>`;
  }).join('');

  return `
    <div class="table-controls">
  <input type="text" id="tableSearch" placeholder="Search by Name or Category" aria-label="Search table" />
  <button id="exportBtn">Export CSV</button>
</div>
    <div class="table-responsive" role="region" aria-label="Data table">
      <table class="restaurant-table" aria-labelledby="tableLabel">
        <caption id="tableLabel" style="display:none;">Data table of restaurants</caption>
        <thead>
          <tr>${headers}</tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
  `;
}

export default showTable;