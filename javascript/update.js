// Initialize Leaflet map
var map = L.map('map', {
    maxBounds: [[4, 116], [21, 127]], // Restrict map bounds to roughly the Philippines
    maxBoundsViscosity: 1.0
  }).setView([12.8797, 121.7740], 6); // Initial view set for Philippines

// Add OpenStreetMap Tile Layer
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' // Added proper attribution link
}).addTo(map);


// --- ADDITION: Soil Type Mapping ---
const soilTypeMapping = {
    "4413": { category: 3, label: "Clay Loam" },
    "4424": { category: 2, label: "Loam" },
    "4465": { category: 2, label: "Loam" }, // Assuming 4465 maps to Loam (category 2)
    "4478": { category: 3, label: "Clay Loam" },
    "4503": { category: 1, label: "Sandy Loam" },
    "4504": { category: 3, label: "Clay Loam" },
    "4517": { category: 1, label: "Sandy Loam" },
    "4537": { category: 2, label: "Loam" },
    "4546": { category: 5, label: "Clay" },
    "4564": { category: 1, label: "Sandy Loam" },
    "4578": { category: 3, label: "Clay Loam" }, // Assuming typo "clay_cloam" is "Clay Loam"
    "4582": { category: 5, label: "Clay" },
    "4589": { category: 5, label: "Clay" },
    "Unknown": { category: 0, label: "Unknown" }, // Handle unknown explicitly
    "Error": { category: 0, label: "Error Fetching" } // Handle error explicitly
};

// Helper function to get soil label from SNUM string
function getSoilLabel(snumString) {
     if (!snumString) return soilTypeMapping["Unknown"].label; // Handle null/empty
     const mapping = soilTypeMapping[snumString];
     return mapping ? mapping.label : soilTypeMapping["Unknown"].label;
}

// Helper function to get soil category number from SNUM string
function getSoilCategory(snumString) {
     if (!snumString) return soilTypeMapping["Unknown"].category; // Handle null/empty
     const mapping = soilTypeMapping[snumString];
     return mapping ? mapping.category : soilTypeMapping["Unknown"].category;
}
// --- END ADDITION ---

// --- Initial UI Setup on Load ---
 const datePicker = document.getElementById("date-picker");
    if(datePicker) {
        datePicker.value = "";
    }
// Clear search input value
const searchInput = document.getElementById("search-input");
if (searchInput) {
    searchInput.value = "";
} else {
    console.error("Search input element (#search-input) not found!");
}

// Reset location info div
document.getElementById("location-info").innerHTML = `<strong>Location:</strong> Search for a location or click on the map.`;

// Clear default Empty Values for info inputs
document.getElementById("slope").value = "";
document.getElementById("soil-type").value = "";
document.getElementById("soil-moisture").value = "";

// Clear rainfall input values
document.getElementById("rainfall-1-day").value = "";
document.getElementById("rainfall-3-day").value = "";
document.getElementById("rainfall-5-day").value = "";
document.getElementById("rain-intensity-1-day").value = "";
document.getElementById("rain-intensity-3-day").value = "";
document.getElementById("rain-intensity-5-day").value = "";

// Store the current marker
let currentMarker = null; // Using 'let' and camelCase for consistency

// Store the heatmap layer
let landslideHeatmapLayer = null; // Variable to hold the heatmap layer

// --- ADD THESE GLOBAL VARIABLES ---
let selectedLocation = { lat: null, lng: null, name: null }; // Stores selected location details
let fetchedLocationData = { soil_type: null, slope: null }; // Stores fetched soil/slope
let lastFetchedWeatherData = null; // Stores the complete weather data object from the backend, including daily details
let lastPredictionResult = { prediction: null, confidence: null }; // Stores the last prediction result
let selectedPredictionDate = null; // Store the selected date string
// --- END ADDITION ---


// --- Data Fetching Functions ---
      
// --- ADD THIS FUNCTION ---
function populateReportSummary() {
    // Get elements in the report section
    const reportCoords = document.getElementById("report-coords");
    const reportLocationName = document.getElementById("report-location-name");
    const reportPredictionDate = document.getElementById("report-prediction-date");
    const reportSoilType = document.getElementById("report-soil-type");
    const reportSlope = document.getElementById("report-slope");
    const reportSoilMoisture = document.getElementById("report-soil-moisture");


    const reportRainfall1 = document.getElementById("report-rainfall-1-day");
    const reportRainfall3 = document.getElementById("report-rainfall-3-day");
    const reportRainfall5 = document.getElementById("report-rainfall-5-day");
    const reportIntensity1 = document.getElementById("report-rain-intensity-1-day");
    const reportIntensity3 = document.getElementById("report-rain-intensity-3-day");
    const reportIntensity5 = document.getElementById("report-rain-intensity-5-day");

    const reportDailyRainfallBody = document.getElementById("report-daily-rainfall-body");

    const reportPrediction = document.getElementById("report-prediction");
    const reportConfidence = document.getElementById("report-confidence");
    const reportDescription = document.getElementById("report-detailed-description");

    // Populate Location Details using stored data
    reportCoords.innerText = selectedLocation.lat !== null ? `${selectedLocation.lat.toFixed(4)}, ${selectedLocation.lng.toFixed(4)}` : "N/A";
    reportLocationName.innerText = selectedLocation.name || "N/A";
    reportPredictionDate.innerText = selectedPredictionDate || "N/A"; // Use stored date
    reportSoilType.innerText = fetchedLocationData.soil_type_label || "N/A";
     reportSlope.innerText = fetchedLocationData.slope !== null ? fetchedLocationData.slope : "N/A"; // Handle null/undefined slope
    reportSoilMoisture.innerText = document.getElementById("soil-moisture").value || "N/A"; // Get current value from input or stored weather data

    // Populate Cumulative Rainfall using current input values (or stored weather data)
     reportRainfall1.innerText = document.getElementById("rainfall-1-day").value || "N/A";
     reportRainfall3.innerText = document.getElementById("rainfall-3-day").value || "N/A";
     reportRainfall5.innerText = document.getElementById("rainfall-5-day").value || "N/A";

    // Populate Rainfall Intensity using current input values (or stored weather data)
     reportIntensity1.innerText = document.getElementById("rain-intensity-1-day").value || "N/A";
     reportIntensity3.innerText = document.getElementById("rain-intensity-3-day").value || "N/A";
     reportIntensity5.innerText = document.getElementById("rain-intensity-5-day").value || "N/A";

    // Populate Detailed Daily Rainfall Data from stored weather data
    reportDailyRainfallBody.innerHTML = ""; // Clear previous rows
    if (lastFetchedWeatherData && lastFetchedWeatherData.daily_data && lastFetchedWeatherData.daily_data.length > 0) {
        lastFetchedWeatherData.daily_data.forEach(dayData => {
            let row = reportDailyRainfallBody.insertRow();
            row.insertCell(0).innerText = dayData.date || "N/A";
            row.insertCell(1).innerText = dayData.cumulative !== undefined ? dayData.cumulative.toFixed(1) : "N/A";
            row.insertCell(2).innerText = dayData.intensity !== undefined ? dayData.intensity.toFixed(2) : "N/A"; // Intensity often needs more precision
        });
    } else {
         let row = reportDailyRainfallBody.insertRow();
         let cell = row.insertCell(0);
         cell.colSpan = 3; // Span across all 3 columns
         cell.innerText = "No detailed daily rainfall data available.";
         cell.style.fontStyle = "italic";
         cell.style.textAlign = "center"; // Center the message
    }

    // Populate Prediction Result using stored data
    reportPrediction.innerText = lastPredictionResult.prediction || "N/A";
    reportConfidence.innerText = lastPredictionResult.confidence || "N/A";

    // Clear description textarea on report generation for a fresh start
    reportDescription.value = "";
}
// --- END ADDITION ---

      
// --- ADD THIS FUNCTION ---
function hideAndClearReportSummary() {
    const reportSection = document.getElementById("report-summary-section");
    if (reportSection) {
        reportSection.style.display = "none"; // Hide the section

        // Clear the content within the section
        document.getElementById("report-coords").innerText = "N/A";
        document.getElementById("report-location-name").innerText = "N/A";
        document.getElementById("report-prediction-date").innerText = "N/A";
        document.getElementById("report-soil-type").innerText = "N/A";
        document.getElementById("report-slope").innerText = "N/A";
        document.getElementById("report-soil-moisture").innerText = "N/A";

        document.getElementById("report-rainfall-1-day").innerText = "N/A";
        document.getElementById("report-rainfall-3-day").innerText = "N/A";
        document.getElementById("report-rainfall-5-day").innerText = "N/A";
        document.getElementById("rain-intensity-1-day").innerText = "N/A";
        document.getElementById("rain-intensity-3-day").innerText = "N/A";
        document.getElementById("rain-intensity-5-day").innerText = "N/A";

        const reportDailyRainfallBody = document.getElementById("report-daily-rainfall-body");
         reportDailyRainfallBody.innerHTML = '<tr><td colspan="3" style="font-style: italic; text-align: center;">No daily data available.</td></tr>'; // Reset table body

        document.getElementById("report-prediction").innerText = "N/A";
        document.getElementById("report-confidence").innerText = "N/A";
         document.getElementById("report-detailed-description").value = ""; // Clear textarea
    }
}
// --- END ADDITION ---

    
      
// Function to fetch weather data (soil moisture, rainfall)
async function fetchWeatherData(latitude, longitude, date) {
    // Ensure lat, lon, and date are provided
    if (latitude === undefined || longitude === undefined || !date) {
        console.error("Cannot fetch weather data: Missing latitude, longitude, or date.");
        // Optionally clear fields if data cannot be fetched
        document.getElementById("soil-moisture").value = "";
        document.getElementById("rainfall-1-day").value = "";
        document.getElementById("rainfall-3-day").value = "";
        document.getElementById("rainfall-5-day").value = "";
        document.getElementById("rain-intensity-1-day").value = "";
        document.getElementById("rain-intensity-3-day").value = "";
        document.getElementById("rain-intensity-5-day").value = "";
         // --- ADDITION: Clear stored weather data here too ---
         lastFetchedWeatherData = null;
         // selectedPredictionDate is already cleared in caller if date is null, but safety:
         if (!date) selectedPredictionDate = null;
         // --- END ADDITION ---
        return;
    }

    try {
        console.log(`Fetching weather data for lat: ${latitude}, lon: ${longitude}, date: ${date}`); // Debug log

        let response = await fetch(`http://127.0.0.1:5000/get_weather?latitude=${latitude}&longitude=${longitude}&date=${date}`);

        if (!response.ok) {
            // --- ADDITION: Clear stored data on HTTP error ---
            lastFetchedWeatherData = null;
            selectedPredictionDate = null; // Clear date if weather fetch failed
             // --- END ADDITION ---
            const errorText = await response.text(); // Get error details from backend
            throw new Error(`HTTP error! status: ${response.status}, Details: ${errorText}`); // Include details
        }

        let data = await response.json();

        if (data.error) {
            // --- ADDITION: Clear stored data on backend error ---
            lastFetchedWeatherData = null;
            selectedPredictionDate = null; // Clear date if weather fetch failed
             // --- END ADDITION ---
            console.error("Error fetching weather data:", data.error);
            // Clear rainfall fields on error
            document.getElementById("soil-moisture").value = "";
            document.getElementById("rainfall-1-day").value = "";
            document.getElementById("rainfall-3-day").value = "";
            document.getElementById("rainfall-5-day").value = "";
            document.getElementById("rain-intensity-1-day").value = "";
            document.getElementById("rain-intensity-3-day").value = "";
            document.getElementById("rain-intensity-5-day").value = "";
             // --- ADDITION: Alert user on backend error ---
             alert("Error fetching weather data: " + data.error);
             // --- END ADDITION ---
            return;
        }

        // --- ADDITION: Store the fetched weather data on SUCCESS ---
        lastFetchedWeatherData = data; // Store the entire response object (needed for daily_data)
        // selectedPredictionDate is set BEFORE this function is called. Good.
        // --- END ADDITION ---

        // Set soil moisture value
        document.getElementById("soil-moisture").value = data.soil_moisture !== undefined ? data.soil_moisture.toFixed(1) : "N/A"; // Check for undefined

        // **Directly update the rainfall input fields**
        // Check if data properties exist before accessing
        document.getElementById("rainfall-1-day").value = data.cumulative_rainfall && data.cumulative_rainfall["1_day"] !== undefined ? data.cumulative_rainfall["1_day"].toFixed(1) : "N/A";
        document.getElementById("rainfall-3-day").value = data.cumulative_rainfall && data.cumulative_rainfall["3_day"] !== undefined ? data.cumulative_rainfall["3_day"].toFixed(1) : "N/A";
        document.getElementById("rainfall-5-day").value = data.cumulative_rainfall && data.cumulative_rainfall["5_day"] !== undefined ? data.cumulative_rainfall["5_day"].toFixed(1) : "N/A";

        document.getElementById("rain-intensity-1-day").value = data.rain_intensity && data.rain_intensity["1_day"] !== undefined ? data.rain_intensity["1_day"].toFixed(1) : "N/A";
        document.getElementById("rain-intensity-3-day").value = data.rain_intensity && data.rain_intensity["3_day"] !== undefined ? data.rain_intensity["3_day"].toFixed(1) : "N/A";
        document.getElementById("rain-intensity-5-day").value = data.rain_intensity && data.rain_intensity["5_day"] !== undefined ? data.rain_intensity["5_day"].toFixed(1) : "N/A";


        console.log("Weather data fetched and inputs updated.");

    } catch (error) {
        // --- ADDITION: Clear stored data on fetch error ---
        lastFetchedWeatherData = null;
        selectedPredictionDate = null; // Clear date if weather fetch failed
         // --- END ADDITION ---
        console.error("Error fetching weather data:", error);
         // Clear rainfall fields on error
         document.getElementById("soil-moisture").value = "";
         document.getElementById("rainfall-1-day").value = "";
         document.getElementById("rainfall-3-day").value = "";
         document.getElementById("rainfall-5-day").value = "";
         document.getElementById("rain-intensity-1-day").value = "";
         document.getElementById("rain-intensity-3-day").value = "";
         document.getElementById("rain-intensity-5-day").value = "";
          // --- ADDITION: Alert user on fetch error ---
         alert("An error occurred while fetching weather data: " + error.message);
          // --- END ADDITION ---
    }
}
// ... rest of fetchWeatherData

    

// Function to reverse geocode coordinates to get location name using Nominatim
async function getLocationFromCoordinates(lat, lng) {
    let url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=18&addressdetails=1`; // Added zoom/addressdetails

    try {
        let response = await fetch(url);
         if (!response.ok) {
             throw new Error(`HTTP error! status: ${response.status}`);
        }
        let data = await response.json();

        // More robust way to get location parts from Nominatim
        let address = data.address;
        let name3 = address.village || address.suburb || address.hamlet || address.county || ""; // Barangay/Local Area
        let name2 = address.city || address.town || address.municipality || ""; // Municipality/City
        let name1 = address.state || address.province || ""; // Province/State

        let full = data.display_name || "Unknown Location"; // Fallback to full display name

        return { name1, name2, name3, full: full }; // Return structured and full name
    } catch (error) {
        console.error("Error fetching location from coordinates:", error);
        return { name1: "", name2: "", name3: "", full: "Unknown Location" };
    }
}


// Function to get search suggestions from Flask (using Nominatim via Flask)
async function getSearchSuggestions(query) {
    const suggestionsContainer = document.getElementById("suggestions");

    // Ensure query is long enough before fetching suggestions
    if (!query || query.length < 3) {
        suggestionsContainer.innerHTML = ""; // Clear dropdown if query is too short or empty
        suggestionsContainer.style.display = "none";
        return;
    }

    try {
        // Fetch simplified data from Flask (Flask handles Nominatim call now)
        let response = await fetch(`http://127.0.0.1:5000/search_locations?query=${query}`);
         if (!response.ok) {
             throw new Error(`HTTP error! status: ${response.status}`);
        }
        let data = await response.json();

        suggestionsContainer.innerHTML = ""; // Clear previous suggestions

        // Check if suggestions array exists and is not empty
        if (!data.suggestions || data.suggestions.length === 0) {
            let noResult = document.createElement("p");
            noResult.innerText = "No matching locations found.";
            noResult.classList.add("suggestion-item");
            suggestionsContainer.appendChild(noResult);
            suggestionsContainer.style.display = "block"; // Show message
            return;
        }

        // Create and append suggestion items
        data.suggestions.forEach(location => {
            let suggestion = document.createElement("p");
            suggestion.innerText = location.name; // Use display name from Nominatim (provided by Flask)
            suggestion.classList.add("suggestion-item");

            // On click, update search box, location info, and map
            suggestion.addEventListener("click", async () => {
            document.getElementById("search-input").value = location.name; // Set search box value
            suggestionsContainer.innerHTML = ""; // Hide dropdown
            suggestionsContainer.style.display = "none"; // Hide dropdown

            let lat = parseFloat(location.lat);
            let lon = parseFloat(location.lon);

            // --- ADDITION: Store selected location and clear previous data ---
            selectedLocation = { lat: lat, lng: lon, name: location.name };
            fetchedLocationData = { soil_type: null, slope: null }; // Clear old location data
            lastFetchedWeatherData = null; // Clear old weather data
            lastPredictionResult = { prediction: null, confidence: null }; // Clear old prediction result
            selectedPredictionDate = null; // Clear old date
            hideAndClearReportSummary(); // Hide report summary on new location select
            // --- END ADDITION ---


            // Move map to selected location and zoom in
            map.setView([lat, lon], 14); // Zoom level 14 is often good for specific locations

            // Update Info Section immediately with location name and "Fetching..." for others
            document.getElementById("location-info").innerHTML = `
                <strong>Coordinates:</strong> ${lat.toFixed(4)}, ${lon.toFixed(4)} <br>
                <strong>Location:</strong> ${location.name} <br>
                <strong>Soil Type:</strong> Fetching... <br>
                <strong>Slope:</strong> Fetching...
            `;

            // Clear previous soil/slope/weather inputs
            document.getElementById("slope").value = "Fetching...";
            document.getElementById("soil-type").value = "Fetching...";
            document.getElementById("soil-moisture").value = "";
            document.getElementById("rainfall-1-day").value = "";
            document.getElementById("rainfall-3-day").value = "";
            document.getElementById("rainfall-5-day").value = "";
            document.getElementById("rain-intensity-1-day").value = "";
            document.getElementById("rain-intensity-3-day").value = "";
            document.getElementById("rain-intensity-5-day").value = "";


            // --- Fetch Soil Type & Slope from Flask API ---
            let fetchedSoilType = "Unknown";
            let fetchedSlope = "Unknown";
            try {
                let response = await fetch(`http://127.0.0.1:5000/get_weather?lat=${lat}&lon=${lon}`);
                if (!response.ok) {
                    // --- ADDITION: Handle HTTP error ---
                    const errorText = await response.text();
                    throw new Error(`HTTP error! status: ${response.status}, Details: ${errorText}`);
                    // --- END ADDITION ---
                }
                let data = await response.json();

                if (data.error) {
                    console.error("Error fetching soil/slope data after search:", data.error);
                    fetchedSoilType = "Error";
                    fetchedSlope = "Error";
                    // --- ADDITION: Alert user on backend error ---
                    alert("Error fetching soil/slope data: " + data.error);
                    // --- END ADDITION ---
                } else {
                    fetchedSoilType = data.soil_type || "Unknown";
                    fetchedSlope = data.slope !== undefined && data.slope !== null ? data.slope : "Unknown"; // Handle null from backend
                }
            } catch (error) {
                console.error("Error fetching soil/slope data after search:", error);
                fetchedSoilType = "Error";
                fetchedSlope = "Error";
                // --- ADDITION: Alert user on fetch error ---
                alert("An error occurred while fetching soil/slope data: " + error.message);
                // --- END ADDITION ---
            }

            // --- ADDITION: Store fetched location data AFTER determining final values ---
            fetchedLocationData = { soil_type: fetchedSoilType, slope: fetchedSlope };
            // --- END ADDITION ---

            // Update UI again with fetched soil/slope
            document.getElementById("location-info").innerHTML = `
                <strong>Coordinates:</strong> ${lat.toFixed(4)}, ${lon.toFixed(4)} <br>
                <strong>Location:</strong> ${location.name} <br>
                <strong>Soil Type:</strong> ${fetchedSoilType} <br>
                <strong>Slope:</strong> ${fetchedSlope}
            `;
            document.getElementById("slope").value = fetchedSlope;
            document.getElementById("soil-type").value = fetchedSoilType;


            // Remove old marker and add new one
            if (currentMarker) {
                map.removeLayer(currentMarker);
            }
            currentMarker = L.marker([lat, lon]).addTo(map); // Add marker without popup initially
                // --- ADDITION: Update marker popup after fetching soil/slope ---
                currentMarker.bindPopup(`
                    <b>Coordinates:</b> ${lat.toFixed(4)}, ${lon.toFixed(4)} <br>
                    <b>Location:</b> ${location.name} <br>
                    <b>Soil Type:</b> ${fetchedSoilType} <br>
                    <b>Slope:</b> ${fetchedSlope}
                `).openPopup(); // Bind popup and open
                // --- END ADDITION ---


            // Fetch weather data if a date is selected AND soil/slope were fetched okay
            let date = document.getElementById("date-picker").value;
            // --- ADDITION: Store the selected date (or null if empty) BEFORE calling fetchWeatherData ---
            selectedPredictionDate = date || null;
            // --- END ADDITION ---

            if (date && fetchedLocationData.soil_type !== "Error" && fetchedLocationData.slope !== "Error" && fetchedLocationData.soil_type !== null && fetchedLocationData.slope !== null) {
                fetchWeatherData(lat, lon, date);
            } else {
                console.log("No date selected or soil/slope error. Weather data not fetched after search.");
                // Ensure weather inputs are cleared if no date is selected (already done above)
            }

            // Open the marker popup after all fetching (or decide if you want to wait) - Moved above
            // currentMarker.openPopup();

        }); // End of suggestion click event listener   
            suggestionsContainer.appendChild(suggestion);
        }); // End of forEach loop

        // Show dropdown below the search box
        suggestionsContainer.style.display = "block";

    } catch (error) {
        console.error("Error fetching search suggestions:", error);
         suggestionsContainer.innerHTML = ""; // Clear dropdown
         suggestionsContainer.style.display = "none";
         let errorMsg = document.createElement("p");
         errorMsg.innerText = "Error fetching suggestions.";
         errorMsg.classList.add("suggestion-item");
         suggestionsContainer.appendChild(errorMsg);
         suggestionsContainer.style.display = "block"; // Show error message
    }
}




// --- Event Listeners ---

// Get the search SVG element
const searchSVG = document.querySelector(".searchs"); // Assuming the class is 'searchs'
const suggestionsContainer = document.getElementById("suggestions"); // Ensure this is defined here too


// Listen for input changes on the search box (for instant suggestions)
if (searchInput) {
    searchInput.addEventListener("input", function () {
        let query = this.value.trim();
        // This calls getSearchSuggestions as the user types
        getSearchSuggestions(query);
    });

    // Add keydown listener for Enter key
    searchInput.addEventListener("keydown", function(event) {
        if (event.key === 'Enter') {
            event.preventDefault(); // Prevent default form submission

            let query = this.value.trim();
            console.log("Enter key pressed, triggering search for:", query);
            // Trigger search suggestion fetch on Enter
            getSearchSuggestions(query);

            // Hide the suggestions dropdown after pressing Enter
             if (suggestionsContainer) {
                 suggestionsContainer.innerHTML = "";
                 suggestionsContainer.style.display = "none";
             }

            // Blur the input to remove focus
             this.blur();
        }
    });

} else {
    console.error("Search input element (#search-input) not found! Cannot add input/keydown listeners.");
}


// Add click listener for the search SVG
// Ensure both the SVG and the input exist before adding the listener
if (searchSVG && searchInput) { // Check both elements exist
    searchSVG.style.cursor = 'pointer'; // Add a pointer cursor

    searchSVG.addEventListener("click", function() {
        let query = searchInput.value.trim();
        console.log("Search SVG clicked, triggering search for:", query);
        // Call the function to get suggestions based on current input value
        getSearchSuggestions(query);

        // Hide the suggestions dropdown after clicking the SVG
         if (suggestionsContainer) {
             suggestionsContainer.innerHTML = "";
             suggestionsContainer.style.display = "none";
         }

         // Optional: Focus back on the input after clicking the icon
         searchInput.focus();
    });
} else {
     // Log error if SVG is missing (searchInput is checked above)
     if (!searchSVG && searchInput) console.error("Search SVG element (.searchs) not found! Cannot add click listener.");
     // If searchInput itself is missing, the first block handles that error
}


// Close search suggestions dropdown when clicking outside
document.addEventListener("click", (event) => {
    let searchContainer = document.querySelector(".search-container");
    let suggestionsContainer = document.getElementById("suggestions"); // Ensure this is defined again if scope requires

    if (suggestionsContainer && searchContainer && !searchContainer.contains(event.target) && event.target !== searchInput && event.target !== searchSVG) {
        suggestionsContainer.innerHTML = ""; // Hide dropdown
        suggestionsContainer.style.display = "none";
    }
});


document.getElementById("date-picker").addEventListener("change", function () {
    // Check if a location has been selected (i.e., if a marker exists)
    // A more robust check might be if selectedLocation.lat is not null
    if (currentMarker) {
        // Get latitude and longitude from the current marker's position
        let latLon = currentMarker.getLatLng();
        let lat = latLon.lat;
        let lng = latLon.lng;

        let date = this.value; // Get the selected date from the input

        // --- ADDITION: Store the selected date in the global variable ---
        selectedPredictionDate = date || null; // Store date or null if empty
        // --- END ADDITION ---


        // --- ADDITION: Hide report summary on date change ---
        hideAndClearReportSummary();
        // --- END ADDITION ---


        if (date) { // Make sure a date was actually selected
             // --- ADDITION: Also check if location data (soil/slope) is okay before fetching weather ---
             // (This prevents trying to fetch weather if the location data fetch failed earlier)
             if (fetchedLocationData.soil_type !== "Error" && fetchedLocationData.slope !== "Error" && fetchedLocationData.soil_type !== null && fetchedLocationData.slope !== null) {
                 fetchWeatherData(lat, lng, date); // Call the fetch function
             } else {
                 console.warn("Soil or slope data has errors. Cannot fetch weather data after date change.");
                 alert("Cannot fetch weather data: Soil type or slope data has errors or is not yet loaded.");
                  // Clear weather data inputs if location data is bad
                  document.getElementById("soil-moisture").value = "";
                  document.getElementById("rainfall-1-day").value = "";
                  document.getElementById("rainfall-3-day").value = "";
                  document.getElementById("rainfall-5-day").value = "";
                  document.getElementById("rain-intensity-1-day").value = "";
                  document.getElementById("rain-intensity-3-day").value = "";
                  document.getElementById("rain-intensity-5-day").value = "";
                  lastFetchedWeatherData = null; // Clear stored weather data
                  selectedPredictionDate = null; // Ensure date is null in stored data if weather fetch fails
             }
             // --- END ADDITION ---
        } else {
             // Clear weather data inputs if the date is unset
             console.log("Date unset. Clearing weather data.");
             document.getElementById("soil-moisture").value = "";
             document.getElementById("rainfall-1-day").value = "";
             document.getElementById("rainfall-3-day").value = "";
             document.getElementById("rainfall-5-day").value = "";
             document.getElementById("rain-intensity-1-day").value = "";
             document.getElementById("rain-intensity-3-day").value = "";
             document.getElementById("rain-intensity-5-day").value = "";
              // --- ADDITION: Clear stored weather data and date if date is unset ---
              lastFetchedWeatherData = null;
              selectedPredictionDate = null;
              // --- END ADDITION ---
        }
    } else {
        console.log("No location selected. Date change ignored for weather data.");
        // Clear date picker value or inform user? Depends on desired UX
         this.value = ""; // Clear the date picker if no location is selected
         alert("Please select a location on the map or via search first.");
         // --- ADDITION: Ensure date is not stored if no location ---
         selectedPredictionDate = null;
          // --- END ADDITION ---
    }
});


// ... inside map.on("click", async function (e) { ... });
map.on("click", async function (e) {
    let lat = e.latlng.lat;
    let lng = e.latlng.lng;

    console.log("Clicked coordinates:", lat, lng);

    // --- ADDITION: Store selected location and clear previous data ---
    selectedLocation = { lat: lat, lng: lng, name: null }; // Name will be fetched
    fetchedLocationData = { soil_type: null, slope: null }; // Clear old location data
    lastFetchedWeatherData = null; // Clear old weather data
    lastPredictionResult = { prediction: null, confidence: null }; // Clear old prediction result
    selectedPredictionDate = null; // Clear old date
    hideAndClearReportSummary(); // Hide report summary on new location select
    // --- END ADDITION ---


    // Update location-info immediately with coordinates while fetching
    document.getElementById("location-info").innerHTML = `
        <strong>Coordinates:</strong> ${lat.toFixed(4)}, ${lng.toFixed(4)} <br>
        <strong>Location:</strong> Fetching... <br>
        <strong>Soil Type:</strong> Fetching... <br>
        <strong>Slope:</strong> Fetching...
    `;

    // Clear previous info section inputs while fetching new data
    document.getElementById("slope").value = "Fetching...";
    document.getElementById("soil-type").value = "Fetching...";
    // Clear weather inputs immediately too
    document.getElementById("soil-moisture").value = "";
    document.getElementById("rainfall-1-day").value = "";
    document.getElementById("rainfall-3-day").value = "";
    document.getElementById("rainfall-5-day").value = "";
    document.getElementById("rain-intensity-1-day").value = "";
    document.getElementById("rain-intensity-3-day").value = "";
    document.getElementById("rain-intensity-5-day").value = "";


    // Remove existing marker if it exists
    if (currentMarker) {
        map.removeLayer(currentMarker);
    }

    // Add marker at clicked location immediately
    currentMarker = L.marker([lat, lng]).addTo(map); // Add marker without popup initially

    // --- Fetch Location Details (Reverse Geocoding) ---
    let place = await getLocationFromCoordinates(lat, lng);
    // --- ADDITION: Store fetched location name ---
    selectedLocation.name = place.full;
    // --- END ADDITION ---


    // --- Fetch Soil Type & Slope from Flask API ---
    // --- Fetch Soil Type & Slope from Flask API ---
    let soilSNUM = null; // Store the raw SNUM string
    let soilLabel = "Unknown"; // Store the display label
    let slopeValue = "Unknown"; // Store the slope value

    try {
        let response = await fetch(`http://127.0.0.1:5000/get_weatherlat=${lat}&lon=${lng}`);
         if (!response.ok) {
             const errorText = await response.text();
             throw new Error(`HTTP error! status: ${response.status}, Details: ${errorText}`);
        }
        let data = await response.json();

        if (data.error) {
            console.error("Error fetching soil/slope data:", data.error);
            soilLabel = "Error Fetching";
            slopeValue = "Error";
             alert("Error fetching soil/slope data: " + data.error);
        } else {
            soilSNUM = data.soil_type; // Store the raw SNUM string
            soilLabel = getSoilLabel(soilSNUM); // Get the display label
            slopeValue = data.slope !== undefined && data.slope !== null ? data.slope : "Unknown";
        }
    } catch (error) {
        console.error("Error fetching soil/slope data:", error);
        soilLabel = "Error Fetching";
        slopeValue = "Error";
        alert("An error occurred while fetching soil/slope data: " + error.message);
    }

    // --- ADDITION: Store fetched location data AFTER determining final values ---
   fetchedLocationData = {
        soil_type_snum: soilSNUM, // Store the backend value for prediction
        soil_type_label: soilLabel, // Store the human-readable label for display/report
        slope: slopeValue
    };


    // Update HTML to display final location info, soil type, and slope
     document.getElementById("location-info").innerHTML = `
        <strong>Coordinates:</strong> ${lat.toFixed(4)}, ${lng.toFixed(4)} <br>
        <strong>Location:</strong> ${selectedLocation.name} <br>
        <strong>Soil Type:</strong> ${soilLabel} <br>
        <strong>Slope:</strong> ${slopeValue}
    `;

    // Update input fields with final values
    document.getElementById("slope").value = slopeValue;
    document.getElementById("soil-type").value = soilLabel;

    // Update marker popup with final data
      currentMarker.bindPopup(`
         <b>Coordinates:</b> ${lat.toFixed(4)}, ${lng.toFixed(4)} <br>
         <b>Location:</b> ${selectedLocation.name} <br>
         <b>Soil Type:</b> ${soilLabel} <br>
         <b>Slope:</b> ${slopeValue}
     `).openPopup();  // Open popup after binding

    // Fetch weather data (Make sure a date is selected AND soil/slope are okay)
    let date = document.getElementById("date-picker").value; // Get the selected date
    selectedPredictionDate = date || null;
    // --- END ADDITION ---

     if (date && fetchedLocationData.soil_type_label !== "Error Fetching" && fetchedLocationData.slope !== "Error" && fetchedLocationData.soil_type_label !== "Unknown" && fetchedLocationData.slope !== "Unknown") {
        fetchWeatherData(lat, lng, date);
    } else {
        console.log("No date selected or location data errors. Weather data not fetched on map click.");
        // Clear existing weather data fields if no date is selected (already done above)
    }
});
// ... rest of map click listener

document.getElementById("predict-btn").addEventListener("click", async function () {
    // Collect values from inputs (using correct IDs this time)
    let soilTypeInput = document.getElementById("soil-type").value; // Get the value currently displayed (label)
    let slopeInput = document.getElementById("slope").value;
    let soilMoistureInput = document.getElementById("soil-moisture").value;

    let rainfall_1day_cumulative = document.getElementById("rainfall-1-day").value;
    let rainfall_3day_cumulative = document.getElementById("rainfall-3-day").value;
    let rainfall_5day_cumulative = document.getElementById("rainfall-5-day").value;

    let rain_intensity_1day = document.getElementById("rain-intensity-1-day").value;
    let rain_intensity_3day = document.getElementById("rain-intensity-3-day").value;
    let rain_intensity_5day = document.getElementById("rain-intensity-5-day").value;

    
    // **Add robust frontend validation back!** Check if values are not empty, "Fetching...", "Unknown", "Error", "N/A"
    // More robust check: Are any of the required fields in an invalid state?
     // --- MODIFICATION: Robust Validation Check ---
    // Check if essential global variables are populated with valid data
    const validationItems = [
        { label: "Location Name", value: selectedLocation.name, stored: true },
        { label: "Location Coordinates", value: selectedLocation.lat, stored: true },
        { label: "Date to Predict", value: selectedPredictionDate, stored: true }, // Use stored date
        { label: "Soil Type", value: fetchedLocationData.soil_type_snum, stored: true }, // Check stored SNUM
        { label: "Slope", value: fetchedLocationData.slope, stored: true }, // Check stored slope
        { label: "Weather Data", value: lastFetchedWeatherData, stored: true }, // Check if weather data object exists
        // Check specific input values for placeholders/errors (already populated from stored/fetched data)
        { label: "Soil Moisture", value: soilMoistureInput, stored: false },
        { label: "1-day Cumulative Rainfall", value: rainfall_1day_cumulative, stored: false },
        { label: "3-day Cumulative Rainfall", value: rainfall_3day_cumulative, stored: false },
        { label: "5-day Cumulative Rainfall", value: rainfall_5day_cumulative, stored: false },
        { label: "1-day Rain Intensity", value: rain_intensity_1day, stored: false },
        { label: "3-day Rain Intensity", value: rain_intensity_3day, stored: false },
        { label: "5-day Rain Intensity", value: rain_intensity_5day, stored: false }
    ];

    let validationFailed = false;
    let missingFieldName = "";

    for (const item of validationItems) {
         // Check for null, undefined, empty string for stored data
         if (item.stored && (item.value === null || item.value === undefined || item.value === "")) {
             validationFailed = true;
             missingFieldName = item.label;
             break;
         }
         // Check input values for placeholders/errors
         if (!item.stored && (
             !item.value || // Check if value is empty
             item.value.includes("Fetch") ||
             item.value.includes("Unknown") ||
             item.value.includes("Error") ||
             item.value.includes("N/A")
             ))
          {
             validationFailed = true;
             missingFieldName = item.label;
             break;
          }

         // Also check if numeric input fields contain valid numbers
         if (!item.stored && (item.label.includes("Soil Moisture") || item.label.includes("Rainfall") || item.label.includes("Rain Intensity"))) {
              if (isNaN(parseFloat(item.value))) {
                  validationFailed = true;
                  missingFieldName = item.label + " (invalid number)";
                  break;
              }
         }
         // Special check for Slope, which might come from fetchedLocationData
          if (item.label === "Slope" && item.stored && (typeof item.value === 'string' && (item.value.includes("Error") || item.value.includes("Unknown")) || isNaN(parseFloat(item.value)))) {
             validationFailed = true;
             missingFieldName = item.label + " (invalid value)";
             break;
          }

           // Special check for Soil Type (SNUM), which comes from stored data
           if (item.label === "Soil Type" && item.stored && (item.value === null || item.value === "Unknown" || item.value === "Error" || isNaN(parseInt(item.value)))) {
               validationFailed = true;
               missingFieldName = item.label + " (invalid value)";
               break;
           }

    }

    if (validationFailed) {
        console.log("Prediction validation failed. Missing or invalid field:", missingFieldName);
        alert("Please ensure all required data is loaded before predicting. Data for '" + missingFieldName + "' is missing or invalid.");
        lastPredictionResult = { prediction: "Validation Error", confidence: "N/A" };
        showPredictionModal("Validation Error", "N/A. Please check inputs.");
        return;
    }
    // --- END MODIFICATION ---


    // **Construct requestData with keys matching backend expectations**
    // **Apply parseFloat() to all numeric values here before sending**
     let requestData = {
        soil_type: fetchedLocationData.soil_type_snum, // Send the original SNUM string
        slope: parseFloat(fetchedLocationData.slope), // Use stored slope
        soil_moisture: parseFloat(soilMoistureInput), // Use value from input
        "rainfall-1-day": parseFloat(rainfall_1day_cumulative),
        "rainfall-3-day": parseFloat(rainfall_3day_cumulative),
        "rainfall-5-day": parseFloat(rainfall_5day_cumulative),
        "rain-intensity-1-day": parseFloat(rain_intensity_1day),
        "rain-intensity-3-day": parseFloat(rain_intensity_3day),
        "rain-intensity-5-day": parseFloat(rain_intensity_5day)
    };
    // No need for the second NaN check loop here if the validation above is robust
    console.log("Sending data for prediction:", requestData);

    try {
        let response = await fetch("http://127.0.0.1:5000/predict", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestData)
        });

         if (!response.ok) {
             const errorDetails = await response.text(); // Get error details from backend
             console.error("HTTP error response:", response.status, errorDetails);
             throw new Error(`HTTP error! status: ${response.status}. Details: ${errorDetails}`);
         }

        let result = await response.json();

         if (result.error) {
            lastPredictionResult = { prediction: "Backend Error", confidence: "N/A" };
            console.error("Prediction Error from Backend:", result.error);
            alert("Prediction Error: " + result.error);
             showPredictionModal("Backend Error", "N/A. " + result.error);
        } else {
            lastPredictionResult = { prediction: result.prediction, confidence: result.confidence };
             // Assuming backend sends confidence as a formatted string like "54.89%"
            showPredictionModal(result.prediction, result.confidence);
        }

    } catch (error) {
        lastPredictionResult = { prediction: "Frontend Error", confidence: "N/A" };
        console.error("Error fetching prediction:", error);
        alert("An error occurred while trying to get a prediction: " + error.message);
    }
});

// Event Listener for Reset Button
document.getElementById("reset-btn").addEventListener("click", function () {
    // Clear info section inputs
    document.getElementById("slope").value = "";
    document.getElementById("soil-type").value = "";
    document.getElementById("soil-moisture").value = "";

    // Clear rainfall inputs
    document.getElementById("rainfall-1-day").value = "";
    document.getElementById("rainfall-3-day").value = "";
    document.getElementById("rainfall-5-day").value = "";
    document.getElementById("rain-intensity-1-day").value = "";
    document.getElementById("rain-intensity-3-day").value = "";
    document.getElementById("rain-intensity-5-day").value = "";

    // Reset location info display
    document.getElementById("location-info").innerHTML = `<strong>Location:</strong> Search for a location or click on the map.`;

    // Clear search input
    const searchInput = document.getElementById("search-input");
     if (searchInput) {
         searchInput.value = "";
     }

    // Clear search suggestions
    const suggestionsContainer = document.getElementById("suggestions");
    if(suggestionsContainer) {
         suggestionsContainer.innerHTML = "";
         suggestionsContainer.style.display = "none";
    }

    // Clear date picker value
    const datePicker = document.getElementById("date-picker");
    if(datePicker) {
        datePicker.value = "";
    }

    // Remove marker from map
    if (currentMarker) {
        map.removeLayer(currentMarker);
        currentMarker = null;
    }

    

      // Clear stored data (already added in a previous step's summary)
    selectedLocation = { lat: null, lng: null, name: null };
    fetchedLocationData = { soil_type: null, slope: null };
    lastFetchedWeatherData = null;
    lastPredictionResult = { prediction: null, confidence: null };
    selectedPredictionDate = null;


    // Hide and clear the report summary section ADDITION
    hideAndClearReportSummary();

    console.log("UI, stored data, and map marker reset successfully.");
});


// --- Prediction Modal Functions ---

// Function to show modal with prediction result
function showPredictionModal(prediction, confidence) {
    let modal = document.getElementById("prediction-modal");
    let modalBody = document.getElementById("modal-body");

    // Just display the confidence string received from the backend
    modalBody.innerHTML = `<p><strong>Prediction:</strong> ${prediction}</p><p><strong>Confidence:</strong> ${confidence}</p>`;

    modal.style.display = "block"; // Show modal
}

// Close modal when clicking outside
window.onclick = function(event) {
    let modal = document.getElementById("prediction-modal");
    if (event.target == modal) {
        modal.style.display = "none";
    }
};

// --- Date Picker Restriction on Load ---

// Function to format a Date object into YYYY-MM-DD
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Restrict the date picker on page load (today + next 5 days)
document.addEventListener('DOMContentLoaded', (event) => {
    const datePicker = document.getElementById("date-picker");

    if (datePicker) { // Ensure the element exists
        const today = new Date();
        const maxDate = new Date();
        maxDate.setDate(today.getDate() + 5); // Allow up to 5 days from today

        const minDateFormatted = formatDate(today);
        const maxDateFormatted = formatDate(maxDate);

        datePicker.setAttribute('min', minDateFormatted);
        datePicker.setAttribute('max', maxDateFormatted);

    } else {
        console.error("Date picker element not found!");
    }

     // Initialize Bootstrap tooltips after DOM is ready
     // Ensure you have Bootstrap JS included BEFORE this script, or use window.onload
     // or defer/async attributes correctly.
     const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
     const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
     




       const reportButton = document.getElementById("report");

    if (reportButton) { // Check if the button element exists
        reportButton.addEventListener("click", function() {
            console.log("Report Summary button clicked."); // Optional log

            // 1. Hide the prediction modal
            const predictionModal = document.getElementById("prediction-modal");
            if (predictionModal) {
                predictionModal.style.display = "none";
            } else {
                 console.error("Prediction modal element (#prediction-modal) not found!");
            }

            // 2. Populate the report summary section with data
            // This assumes populateReportSummary function exists and is accessible
            if (typeof populateReportSummary === 'function') {
                 populateReportSummary();
            } else {
                 console.error("populateReportSummary function not found!");
            }


            // 3. Show the report summary section
            const reportSection = document.getElementById("report-summary-section");
            if (reportSection) {
                reportSection.style.display = "block";

                // 4. Optional: Scroll to the report section for better UX
                reportSection.scrollIntoView({ behavior: 'smooth' });
            } else {
                console.error("Report summary section element (#report-summary-section) not found!");
                 alert("Error: Report summary section not found on the page."); // Inform user
            }
        });
    } else {
        console.error("Report Summary button (#report) not found in the modal HTML! Cannot attach listener.");
    }



});

// Helper function (might not be strictly necessary anymore)
// function extractRelevantLocation(placeName) {
//     let parts = placeName.split(",").map(part => part.trim());
//     let name3 = parts.length > 0 ? parts[0] : "";
//     let name2 = parts.length > 1 ? parts[1] : "";
//     let name1 = parts.length > 2 ? parts[2] : "";
//     const nameCorrections = {"Babuyan Island": "Babuyan Claro"};
//     if (nameCorrections[name3]) { name3 = nameCorrections[name3]; }
//     return { name1, name2, name3, full: `${name3}, ${name2}, ${name1}` };
// }