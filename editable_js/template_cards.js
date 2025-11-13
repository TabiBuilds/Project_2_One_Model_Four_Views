function showCards(data) {
  const cardHTML = data
    .map(
      (restaurant) => {
        // Define phrase-to-color mappings
        const phraseColorMap = [
          { phrase: 'violations', color: 'red' },
          { phrase: 'compliant - no health risk', color: 'green' },
          { phrase: 'compliance schedule', color: 'orange' },
          { phrase: 'facility closed', color: 'gray' },
          { phrase: 'facility opened', color: 'blue' },
        ];

        // Determine the color based on inspection results
        let resultsColor = 'black'; // default color
        if (restaurant.inspection_results) {
          const resultText = restaurant.inspection_results.toLowerCase();
          for (const { phrase, color } of phraseColorMap) {
            if (resultText.includes(phrase)) {
              resultsColor = color;
              break;
            }
          }
        }

        // Truncating the Restaurant's address
        const address = restaurant.address_line_1 || 'N/A';
        const addressSnippet = address.length > 30 ? address.substring(0, 30) + '...' : address;

        // Linking to Google Maps
        const coords = restaurant.geocoded_column_1?.coordinates;
        const mapLink = coords ? `https://www.google.com/maps/search/?api=1&query=${coords[1]},${coords[0]}` : '#';

        return `
        <div class="restaurant-card">
            <h3> ${restaurant.name || 'N/A'}</h3>
            <p><strong>🍽️ Category:</strong> ${restaurant.category || 'N/A'}</p>
            <p><strong>📍 Address:</strong> ${addressSnippet}</p>
            <p><strong>🗓️ Inspection Date:</strong> ${restaurant.inspection_date || 'N/A'}</p>
            <p style="color: ${resultsColor};"><strong>✅ Results:</strong> ${restaurant.inspection_results || 'N/A'}</p>
            <p><strong>👤 Owner:</strong> ${restaurant.owner || 'N/A'}</p>
            <button class="map-button" onclick="window.open('${mapLink}', '_blank')">View Restaurant on Maps</button>
        </div>
        `;
      }
    )
    .join("");

  return `
    <div class="card-grid">
      ${cardHTML}
    </div>
  `;
}

export default showCards;