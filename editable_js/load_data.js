// ============================================
// DATA LOADING - Students modify this
// ============================================
/**
 * Load data from API - Students replace with their chosen endpoint
 */
async function loadData() {
  try {
    const response = await fetch('https://data.princegeorgescountymd.gov/resource/umjn-t2iz.json');
    const data = await response.json();
    console.log("data loaded", data);
    return data;
  } 
  catch (error) {
    console.error("Failed to load data:", error);
    throw new Error("Could not load data from API");
  }
}

export default loadData