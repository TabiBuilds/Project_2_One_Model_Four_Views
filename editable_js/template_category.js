function showCategories(data, fields) {
  const groups = groupByFields(data, fields);
  const html = Object.entries(groups).map(([groupKey, group]) => {
    const { total, compliant, nonCompliant, critical } = group.counts;
    const compliancePercent = total > 0 ? ((compliant / total) * 100).toFixed(1) : 'N/A';

    // Optional: parse group key back into labels
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
          ${group.items.slice(0, 3).map(item => `
            <div class="category-item">
              <strong>Name:</strong> ${item.name} <br/>
              <strong>Address:</strong> ${item.city || 'N/A'} <br/>
              <strong>Result:</strong> ${item.inspection_results || 'N/A'}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }).join('');

  return `
    <h2 class="view-title">📂 Grouped Categories</h2>
    ${html}
  `;
}

export default showCategories;