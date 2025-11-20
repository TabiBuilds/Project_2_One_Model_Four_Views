// template_stats.js

/**
 * STATS VIEW - ENHANCED WITH CHART.JS
 */

// Helper: Determine compliance status from inspection results
function getComplianceStatus(item) {
  // FIX: Ensure we access item.properties for GeoJSON feature structure.
  const props = item.properties || item; 
  const resultVal = (props.inspection_results || '').toLowerCase();
  
  if (resultVal.includes('compliant')) {
    return 'Compliant';
  } else if (resultVal.includes('non-compliant')) {
    return 'Non-Compliant';
  } else {
    return 'Other/Unknown';
  }
}

// Helper: Define colors based on user's compliance thresholds
function getComplianceColorClass(rate) {
    const r = parseFloat(rate);
    // These classes should match CSS variables defined in style.css
    if (r >= 70) {
        return 'compliant-high'; 
    } else if (r >= 50) {
        return 'compliant-mid'; 
    } else {
        return 'compliant-low'; 
    }
}

// Helper: Calculate total count and overall compliance
function summarizeCompliance(data) {
    const counts = { total: data.length, compliant: 0, nonCompliant: 0 };
    data.forEach(item => {
        const status = getComplianceStatus(item);
        if (status === 'Compliant') {
            counts.compliant++;
        } else if (status === 'Non-Compliant') {
            counts.nonCompliant++;
        }
    });
    counts.complianceRate = counts.total > 0 
        ? ((counts.compliant / counts.total) * 100).toFixed(1) 
        : '0.0';
    return counts;
}

// Helper: Count unique cities
function countUniqueCities(data) {
    const cities = new Set();
    data.forEach(item => {
        // FIX: Ensure we access item.properties for GeoJSON feature structure.
        const city = item.properties ? item.properties.city : item.city;
        if (city && city !== '------') {
            cities.add(city);
        }
    });
    return cities.size;
}

// Helper: Group data and calculate rates for the Category Chart
function analyzeCategoryCompliance(data) {
    const categoryCompliance = {};

    data.forEach(item => {
        const status = getComplianceStatus(item);
        // FIX: Ensure we access item.properties for GeoJSON feature structure.
        const props = item.properties || item;
        const category = props.category || 'Uncategorized';
        if (!category) return;

        if (!categoryCompliance[category]) {
            categoryCompliance[category] = { total: 0, compliant: 0, nonCompliant: 0 };
        }
        categoryCompliance[category].total++;
        if (status === 'Compliant') {
            categoryCompliance[category].compliant++;
        } else if (status === 'Non-Compliant') {
            categoryCompliance[category].nonCompliant++;
        }
    });

    return Object.entries(categoryCompliance)
        .map(([category, counts]) => ({
            category,
            total: counts.total,
            compliant: counts.compliant,
            nonCompliant: counts.nonCompliant,
            compliantRate: counts.total > 0 ? (counts.compliant / counts.total) * 100 : 0
        }))
        .filter(d => d.total >= 10) 
        .sort((a, b) => b.total - a.total) 
        .slice(0, 10); 
}

// Function to initialize Chart.js charts
function initCharts(data) {
  const categoryData = analyzeCategoryCompliance(data);

  // Define semantic colors for Chart.js
  const compliantColor = '#28a745'; // Green
  const nonCompliantColor = '#dc3545'; // Red
  const warningColor = '#ffc107'; // Yellow/Amber
  const neutralColor = '#CCCCCC'; // Gray for the non-compliant part of the stacked bar

  const colorMap = {
      'compliant-high': compliantColor, 
      'compliant-mid': warningColor,  
      'compliant-low': nonCompliantColor
  };
  
  // --- Chart 1: Overall Compliance Distribution (Doughnut Chart) ---
  const complianceCtx = document.getElementById('overallComplianceChart');
  if (complianceCtx) {
    const summary = summarizeCompliance(data);
    new Chart(complianceCtx.getContext('2d'), {
      type: 'doughnut', 
      data: {
        labels: ['Compliant', 'Non-Compliant', 'Other/Unknown'],
        datasets: [{
          label: 'Overall Inspection Results',
          data: [summary.compliant, summary.nonCompliant, summary.total - summary.compliant - summary.nonCompliant],
          backgroundColor: [
            compliantColor,    // Compliant (Green)
            nonCompliantColor, // Non-Compliant (Red)
            warningColor       // Other/Unknown (Yellow/Amber)
          ],
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top' },
          title: { display: true, text: 'Overall Compliance Distribution' }
        }
      }
    });
  }

  // --- Chart 2: Compliance Rate by Category (Stacked Bar Chart) ---
  const categoryCtx = document.getElementById('categoryComplianceChart');
  if (categoryCtx) {
    const categories = categoryData.map(d => d.category);
    const compliantRates = categoryData.map(d => d.compliantRate);
    const nonCompliantRates = categoryData.map(d => 100 - d.compliantRate);
    
    // Apply dynamic compliance color based on the rate (uses colorMap defined above)
    const compliantBarColors = compliantRates.map(rate => {
        return colorMap[getComplianceColorClass(rate)];
    });
    
    new Chart(categoryCtx.getContext('2d'), {
      type: 'bar', 
      data: {
        labels: categories,
        datasets: [{
          label: 'Compliant Rate (%)',
          data: compliantRates,
          backgroundColor: compliantBarColors, // Dynamic color: Green, Yellow, or Red
        },
        {
          label: 'Non-Compliant Rate (%)',
          data: nonCompliantRates,
          backgroundColor: neutralColor, // Consistent Gray for the non-compliant segment
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y', 
        scales: {
          x: {
            stacked: true,
            max: 100,
            title: { display: true, text: 'Percentage of Inspections' }
          },
          y: {
            stacked: true,
            title: { display: true, text: 'Restaurant Category (Top 10 by Volume)' }
          }
        },
        plugins: {
          legend: { position: 'bottom' },
          title: { display: true, text: 'Compliance Rate by Top Restaurant Category' }
        }
      }
    });
  }
}

/**
 * Main render function for the Statistics View
 */
function showStats(data) {
  const complianceSummary = summarizeCompliance(data);
  const uniqueCityCount = countUniqueCities(data);

  setTimeout(() => initCharts(data), 50);

  /*html*/
  return ` 
    <div class="stats-grid">
      <div class="stat-card total-restaurants">
        <h3>Total Restaurants</h3>
        <p class="big-number">${complianceSummary.total}</p>
      </div>
      <div class="stat-card compliance-rate">
        <h3>Overall Compliance Rate</h3>
        <p class="big-number ${getComplianceColorClass(complianceSummary.complianceRate)}">${complianceSummary.complianceRate}%</p>
      </div>
      <div class="stat-card unique-cities">
        <h3>Unique Cities Served</h3>
        <p class="big-number">${uniqueCityCount}</p>
      </div>
    </div>
    
    <div class="chart-container-flex">
      <div class="chart-box chart-doughnut">
        <canvas id="overallComplianceChart"></canvas>
      </div>
      
      <div class="chart-box chart-bar">
        <canvas id="categoryComplianceChart"></canvas>
      </div>
    </div>
  `;
}

export default showStats;