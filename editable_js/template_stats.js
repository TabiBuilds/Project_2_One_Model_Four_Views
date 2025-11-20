/** STATS VIEW - ENHANCED WITH CHART.JS */

// Define the Chart.js colors (must be outside functions that use them)
const compliantColor = '#28a745'; // Green
const nonCompliantColor = '#dc3545'; // Red
const scheduleColor = '#ffc107'; // Yellow/Orange
const closedColor = '#6c757d'; // Gray
const reopenedColor = '#17a2b8'; // Blue
const neutralColor = '#CCCCCC'; // Gray for the non-compliant part of the stacked bar

// Helper: Determine compliance status from inspection results
function getComplianceStatus(item) {
  const props = item.properties || item;
  const resultVal = (props.inspection_results || '').toLowerCase();
  
  if (resultVal.includes('compliant') && resultVal.includes('no health risk')) {
    return 'Compliant'; // 'green'
  } else if (resultVal.includes('violations') || resultVal.includes('non-compliant')) {
    return 'Non-Compliant/Violations'; // 'red'
  } else if (resultVal.includes('compliance schedule')) {
    return 'Compliance Schedule'; // 'orange'
  // FIX: Change 'facility opened' to 'Facility Reopened'
  } else if (resultVal.includes('facility closed')) {
    return 'Facility Closed'; // 'gray'
  } else if (resultVal.includes('facility opened') || resultVal.includes('reopened')) {
    return 'Facility Reopened'; // 'blue'
  } else {
    // Treat any remaining "------" or other ambiguous results as Compliant
    return 'Compliant';
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
    const counts = { 
        total: data.length, 
        compliant: 0, 
        nonCompliant: 0, 
        schedule: 0, 
        closed: 0, 
        // FIX: Change 'opened' to 'reopened'
        reopened: 0 
    };
    
    data.forEach(item => {
        const status = getComplianceStatus(item);
        if (status === 'Compliant') {
            counts.compliant++;
        } else if (status === 'Non-Compliant/Violations') {
            counts.nonCompliant++;
        } else if (status === 'Compliance Schedule') {
            counts.schedule++;
        } else if (status === 'Facility Closed') {
            counts.closed++;
        // FIX: Change counting logic for 'reopened'
        } else if (status === 'Facility Reopened') {
            counts.reopened++;
        }
    });
    
    // The rate calculation should focus on clear 'Compliant' vs 'Non-Compliant/Violations'
    const totalCounted = counts.compliant + counts.nonCompliant;
    counts.complianceRate = totalCounted > 0 
        ? ((counts.compliant / totalCounted) * 100).toFixed(1) 
        : '0.0';
        
    return counts;
}

// Helper: Count unique cities
function countUniqueCities(data) {
    const cities = new Set();
    data.forEach(item => {
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
        // NOTE: This uses 'Non-Compliant' in the analysis, which will mostly match 
        // the 'Non-Compliant/Violations' group, but not perfectly.
        const status = getComplianceStatus(item); 
        
        const props = item.properties || item;
        const category = props.category || 'Uncategorized';
        if (!category) return;

        if (!categoryCompliance[category]) {
            categoryCompliance[category] = { total: 0, compliant: 0, nonCompliant: 0 };
        }
        categoryCompliance[category].total++;
        if (status === 'Compliant') {
            categoryCompliance[category].compliant++;
        } 
        // Only count 'Non-Compliant/Violations' as Non-Compliant for the bar chart rate calculation
        else if (status === 'Non-Compliant/Violations') { 
            categoryCompliance[category].nonCompliant++;
        }
    });

    return Object.entries(categoryCompliance)
        .map(([category, counts]) => ({
            category,
            total: counts.compliant + counts.nonCompliant, // Only count Compliant/Non-Compliant for this rate
            compliant: counts.compliant,
            nonCompliant: counts.nonCompliant,
            compliantRate: (counts.compliant + counts.nonCompliant) > 0 
              ? (counts.compliant / (counts.compliant + counts.nonCompliant)) * 100 
              : 0
        }))
        // Only show categories with at least 10 inspections counted in the rate
        .filter(d => d.total >= 10) 
        .sort((a, b) => b.total - a.total) 
        .slice(0, 10); 
}

// Helper: Draw a simple progress bar chart for the compliance rate card (RESTORATION)
function drawRateProgress(rate, elementId) {
    const canvas = document.getElementById(elementId);
    if (!canvas) return;

    // Use standard canvas size for clarity within the card
    canvas.width = 240; 
    canvas.height = 10;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    ctx.clearRect(0, 0, width, height);

    // Get color based on rate 
    const rateClass = getComplianceColorClass(rate);
    const colorMap = {
        'compliant-high': compliantColor, 
        'compliant-mid': scheduleColor, 
        'compliant-low': nonCompliantColor, 
    };
    const barColor = colorMap[rateClass] || neutralColor;
    const complimentColor = '#e9ecef'; // Light gray background

    const percentage = parseFloat(rate) / 100;
    const barHeight = height;

    // Background bar (100%)
    ctx.fillStyle = complimentColor;
    ctx.fillRect(0, 0, width, barHeight);
    
    // Progress bar
    ctx.fillStyle = barColor;
    ctx.fillRect(0, 0, width * percentage, barHeight);
}


// Function to initialize Chart.js charts
function initCharts(data) {
  const categoryData = analyzeCategoryCompliance(data);

  // --- Chart 1: Overall Compliance Distribution (Doughnut Chart) ---
  const complianceCtx = document.getElementById('overallComplianceChart');
  if (complianceCtx) {
    const summary = summarizeCompliance(data);
    new Chart(complianceCtx.getContext('2d'), {
      type: 'doughnut', 
      data: {
        // FIX: Update label for Facility Reopened
        labels: ['Compliant', 'Non-Compliant/Violations', 'Compliance Schedule', 'Facility Closed', 'Facility Reopened'],
        datasets: [{
          label: 'Overall Inspection Results',
          // FIX: Use summary.reopened
          data: [summary.compliant, summary.nonCompliant, summary.schedule, summary.closed, summary.reopened],
          backgroundColor: [
            compliantColor,    
            nonCompliantColor, 
            scheduleColor,
            closedColor,
            reopenedColor // Use new color constant
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
    
    // The compliant rates are used to determine the color of the compliant segment
    const compliantBarColors = compliantRates.map(rate => {
        const rateClass = getComplianceColorClass(rate);
        return rateClass === 'compliant-high' ? compliantColor : 
               rateClass === 'compliant-mid' ? scheduleColor : 
               nonCompliantColor;
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

/** Main render function for the Statistics View */
function showStats(data) {
  const complianceSummary = summarizeCompliance(data);
  const uniqueCityCount = countUniqueCities(data);

  // Combine chart initialization and custom progress bar drawing
  setTimeout(() => {
    initCharts(data);
    // RESTORATION: Draw the progress bar chart in the second card
    drawRateProgress(complianceSummary.complianceRate, 'rateProgressChart');
  }, 50);

  /*html*/
  return ` 
    <h2 class="view-title">📈 Statistics View</h2>
    
    <div class="stats-grid">
      <div class="stat-card total-restaurants">
        <h3>Total Restaurants</h3>
        <p class="big-number">${complianceSummary.total}</p>
      </div>
      <div class="stat-card compliance-rate">
        <h3>Overall Compliance Rate</h3>
        <p class="big-number ${getComplianceColorClass(complianceSummary.complianceRate)}">${complianceSummary.complianceRate}%</p>
        <!-- FIX: Add canvas element for the small progress bar diagram -->
        <canvas id="rateProgressChart"></canvas> 
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