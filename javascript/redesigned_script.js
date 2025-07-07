// ===================================
// == MAP AND UI INITIALIZATION
// ===================================
var map = L.map('map', {
    maxBounds: [[4, 116], [21, 127]],
    maxBoundsViscosity: 1.0
}).setView([12.8797, 121.7740], 6);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Global variables to store state
let currentMarker = null;
let selectedLocation = { lat: null, lng: null, name: null };
let fetchedLocationData = { soil_type: null, slope: null };
let lastFetchedWeatherData = null;
let lastPredictionResult = { prediction: null, confidence: null };
let selectedPredictionDate = null;
let selectedPredictionTime = null; // NEW
let selectedForecastPeriod = { value: null, text: null };

// MODIFIED: Chart instances (now four)
let hourlyCumulativeChart = null;
let hourlyIntensityChart = null;
let dailyCumulativeChart = null;
let dailyIntensityChart = null;

// --- Soil Type Mapping (same as your original)
const soilTypeMapping = {
    "4413": { category: 3, label: "Clay Loam" }, "4424": { category: 2, label: "Loam" },
    "4465": { category: 2, label: "Loam" }, "4478": { category: 3, label: "Clay Loam" },
    "4503": { category: 1, label: "Sandy Loam" }, "4504": { category: 3, label: "Clay Loam" },
    "4517": { category: 1, label: "Sandy Loam" }, "4537": { category: 2, label: "Loam" },
    "4546": { category: 5, label: "Clay" }, "4564": { category: 1, label: "Sandy Loam" },
    "4578": { category: 3, label: "Clay Loam" }, "4582": { category: 5, label: "Clay" },
    "4589": { category: 5, label: "Clay" }, "Unknown": { category: 0, label: "Unknown" },
    "Error": { category: 0, label: "Error Fetching" }
};
function getSoilLabel(snum) { return (soilTypeMapping[snum] || soilTypeMapping["Unknown"]).label; }

// ===================================
// == CORE FUNCTIONS (Fetch, Update UI, etc.)
// ===================================

// MODIFIED: resetUI to clear new inputs and charts
function resetUI() {
    console.log("Resetting UI and all data.");
    document.getElementById("search-input").value = "";
    document.getElementById("suggestions").style.display = "none";
    document.getElementById("loc-lat").innerText = "N/A";
    document.getElementById("loc-lng").innerText = "N/A";
    document.getElementById("loc-name").innerText = "No location selected.";
    document.getElementById("date-picker").value = "";
    document.getElementById("time-picker").value = ""; // NEW
    document.getElementById("forecast-period").selectedIndex = 0;
    // Clear hidden inputs...
    const hiddenInputs = document.querySelectorAll('.visually-hidden input');
    hiddenInputs.forEach(input => input.value = "");
    if (currentMarker) { map.removeLayer(currentMarker); currentMarker = null; }
    selectedLocation = { lat: null, lng: null, name: null };
    fetchedLocationData = { soil_type: null, slope: null };
    lastFetchedWeatherData = null;
    lastPredictionResult = { prediction: null, confidence: null };
    selectedPredictionDate = null;
    selectedPredictionTime = null; // NEW
    selectedForecastPeriod = { value: null, text: null };
    hideAndClearReportSummary();
}

// Update the "Selected Location" card and other UI elements after a location is chosen
async function updateLocationInfo(lat, lng) {
    // --- 1. Store location, clear old data ---
    selectedLocation = { lat, lng, name: "Fetching..." };
    fetchedLocationData = { soil_type: null, slope: null };
    lastFetchedWeatherData = null;
    hideAndClearReportSummary();

    // --- 2. Update UI immediately with "Fetching..." status ---
    document.getElementById("loc-lat").innerText = lat.toFixed(4);
    document.getElementById("loc-lng").innerText = lng.toFixed(4);
    document.getElementById("loc-name").innerText = "Fetching name...";

    // --- 3. Place marker on map ---
    if (currentMarker) map.removeLayer(currentMarker);
    currentMarker = L.marker([lat, lng]).addTo(map);

    // --- 4. Fetch data from APIs in parallel ---
    const locationPromise = fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`)
        .then(res => res.json());
    const dataPromise = fetch(`http://127.0.0.1:5000/get_location_data?lat=${lat}&lon=${lng}`)
        .then(res => res.json());

    try {
        const [locationData, siteData] = await Promise.all([locationPromise, dataPromise]);

        // --- 5. Process and store fetched data ---
        selectedLocation.name = locationData.display_name || "Unknown Location";

        if (siteData.error) throw new Error(siteData.error);
        fetchedLocationData = {
            soil_type_snum: siteData.soil_type,
            soil_type_label: getSoilLabel(siteData.soil_type),
            slope: siteData.slope
        };
        // Populate hidden inputs for prediction
        document.getElementById("slope").value = fetchedLocationData.slope;
        document.getElementById("soil-type").value = fetchedLocationData.soil_type_label;


        // --- 6. Update UI with final data ---
        document.getElementById("loc-name").innerText = selectedLocation.name;;
        currentMarker.bindPopup(`Location: <b>${selectedLocation.name}</b><br>Slope: <b>${fetchedLocationData.slope}</b><br>Soil: <b>${fetchedLocationData.soil_type_label}</b>`).openPopup();

        // --- 7. Fetch weather if date is already selected ---
        const date = document.getElementById("date-picker").value;
        if (date) {
            fetchWeatherData(lat, lng, date);
        }

    } catch (error) {
        console.error("Error updating location info:", error);
        alert("Could not fetch all data for this location. " + error.message);
        document.getElementById("loc-name").innerText = "Error fetching data.";
    }
}


// MODIFIED: fetchWeatherData to accept and send time
async function fetchWeatherData(lat, lon, date, time) {
    if (!lat || !lon || !date || !time) return;
    console.log(`Fetching weather for: ${lat}, ${lon}, on ${date} at ${time}`);
    try {
        const response = await fetch(`http://127.0.0.1:5000/get_weather?latitude=${lat}&longitude=${lon}&date=${date}&time=${time}`);
        const data = await response.json();
        if (data.error) throw new Error(data.error);

        lastFetchedWeatherData = data;
        selectedPredictionDate = date;
        selectedPredictionTime = time; // NEW

        // Populate hidden inputs (no change to logic, just sourcing from new backend response)
        document.getElementById("soil-moisture").value = data.soil_moisture?.toFixed(3) || "N/A";
        for (const key in data.cumulative_rainfall) {
            const id = `rainfall-${key.replace('_', '-')}`;
            if(document.getElementById(id)) document.getElementById(id).value = data.cumulative_rainfall[key].toFixed(4);
        }
        for (const key in data.rain_intensity) {
            const id = `rain-intensity-${key.replace('_', '-')}`;
            if(document.getElementById(id)) document.getElementById(id).value = data.rain_intensity[key].toFixed(4);
        }
        console.log("Weather data fetched and stored.", lastFetchedWeatherData);
    } catch (error) {
        console.error("Failed to fetch weather data:", error);
        alert("Error fetching weather data: " + error.message);
        lastFetchedWeatherData = null;
    }
}

// ===================================
// == CORRECTED JAVASCRIPT FUNCTION
// ===================================


function populateReportSummary() {
    // --- 1. Validation ---
    if (!lastPredictionResult || !lastFetchedWeatherData) {
        alert("Cannot generate report: Critical data is missing. Please try the prediction again.");
        return;
    }

    // --- 2. Show the report section ---
    const reportSection = document.getElementById("report-summary-section");
    reportSection.style.display = "block";

    // --- 3. Populate all text fields ---
    document.getElementById("report-location-name").innerText = selectedLocation.name || "N/A";
    document.getElementById("report-coords").innerText = selectedLocation.lat ? `${selectedLocation.lat.toFixed(4)}, ${selectedLocation.lng.toFixed(4)}` : "N/A";
    document.getElementById("report-prediction-date").innerText = (selectedPredictionDate && selectedPredictionTime) ? `${selectedPredictionDate} at ${selectedPredictionTime}` : "N/A";
    document.getElementById("report-prediction").innerText = lastPredictionResult.prediction || "N/A";
    document.getElementById("report-confidence").innerText = lastPredictionResult.confidence || "N/A";
    document.getElementById("report-slope").innerText = fetchedLocationData.slope ?? "N/A";
    document.getElementById("report-soil-type").innerText = fetchedLocationData.soil_type_label || "N/A";
    document.getElementById("report-soil-moisture").innerText = lastFetchedWeatherData.soil_moisture?.toFixed(1) ?? "N/A";
    
    const forecastSelect = document.getElementById("forecast-period");
    const periodValue = forecastSelect.value;
    const periodText = periodValue !== 'none' ? forecastSelect.options[forecastSelect.selectedIndex].text : "N/A";
    document.getElementById("report-forecast-period").innerText = periodText;
    if (periodValue !== 'none') {
        document.getElementById("report-cumulative-rain").innerText = lastFetchedWeatherData.cumulative_rainfall?.[periodValue]?.toFixed(1) ?? "N/A";
        document.getElementById("report-intensity-rain").innerText = lastFetchedWeatherData.rain_intensity?.[periodValue]?.toFixed(2) ?? "N/A";
    } else {
        document.getElementById("report-cumulative-rain").innerText = "N/A";
        document.getElementById("report-intensity-rain").innerText = "N/A";
    }

    // --- 4. Destroy old charts ---
    if (hourlyCumulativeChart) hourlyCumulativeChart.destroy();
    if (hourlyIntensityChart) hourlyIntensityChart.destroy();
    if (dailyCumulativeChart) dailyCumulativeChart.destroy();
    if (dailyIntensityChart) dailyIntensityChart.destroy();

    // --- 5. Generate all four new charts with FULL CONFIGURATIONS ---
    const hourlyData = lastFetchedWeatherData.hourly_chart_data || [];
    const dailyData = lastFetchedWeatherData.daily_chart_data || [];

    // Chart 1: Hourly Cumulative
    hourlyCumulativeChart = new Chart(document.getElementById('hourly-cumulative-chart').getContext('2d'), {
        type: 'line',
        data: {
            labels: hourlyData.map(d => d.hour),
            datasets: [{
                label: 'Cumulative Rainfall (mm)',
                data: hourlyData.map(d => d.cumulative),
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                borderColor: 'rgba(54, 162, 235, 1)',
                fill: true
            }]
        },
        options: { scales: { y: { beginAtZero: true } } }
    });

    // Chart 2: Hourly Intensity
    hourlyIntensityChart = new Chart(document.getElementById('hourly-intensity-chart').getContext('2d'), {
        type: 'bar',
        data: {
            labels: hourlyData.map(d => d.hour),
            datasets: [{
                label: 'Intensity (mm/hr)',
                data: hourlyData.map(d => d.intensity),
                backgroundColor: 'rgba(255, 99, 132, 0.6)',
                borderColor: 'rgba(255, 99, 132, 1)'
            }]
        },
        options: { scales: { y: { beginAtZero: true } } }
    });

    // Chart 3: Daily Cumulative
    dailyCumulativeChart = new Chart(document.getElementById('daily-cumulative-chart').getContext('2d'), {
        type: 'bar',
        data: {
            labels: dailyData.map(d => d.date),
            datasets: [{
                label: 'Cumulative Rainfall (mm)',
                data: dailyData.map(d => d.cumulative),
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                borderColor: 'rgba(75, 192, 192, 1)'
            }]
        },
        options: { scales: { y: { beginAtZero: true } } }
    });

    // Chart 4: Daily Intensity
    dailyIntensityChart = new Chart(document.getElementById('daily-intensity-chart').getContext('2d'), {
        type: 'line',
        data: {
            labels: dailyData.map(d => d.date),
            datasets: [{
                label: 'Avg. Intensity (mm/hr)',
                data: dailyData.map(d => d.intensity),
                backgroundColor: 'rgba(255, 206, 86, 0.5)',
                borderColor: 'rgba(255, 206, 86, 1)',
                fill: true
            }]
        },
        options: { scales: { y: { beginAtZero: true } } }
    });
    
    // --- 6. Scroll the report into view ---
    reportSection.scrollIntoView({ behavior: 'smooth' });
}
// MODIFIED: hideAndClearReportSummary to destroy all four charts
function hideAndClearReportSummary() {
    const reportSection = document.getElementById("report-summary-section");
    if (reportSection) {
        reportSection.style.display = "none";
        document.getElementById("report-detailed-description").value = "";
        if (hourlyCumulativeChart) hourlyCumulativeChart.destroy();
        if (hourlyIntensityChart) hourlyIntensityChart.destroy();
        if (dailyCumulativeChart) dailyCumulativeChart.destroy();
        if (dailyIntensityChart) dailyIntensityChart.destroy();
        hourlyCumulativeChart = hourlyIntensityChart = dailyCumulativeChart = dailyIntensityChart = null;
    }
}

// ===================================
// == EVENT LISTENERS
// ===================================

document.addEventListener('DOMContentLoaded', () => {
    // --- Helper function to get a date in YYYY-MM-DD format for the local timezone ---
    function toLocalISOString(date) {
        const year = date.getFullYear();
        // getMonth() is zero-based, so we add 1
        let month = date.getMonth() + 1;
        let day = date.getDate();

        // Pad with a leading zero if needed
        if (month < 10) {
            month = '0' + month;
        }
        if (day < 10) {
            day = '0' + day;
        }

        return `${year}-${month}-${day}`;
    }

    resetUI(); // Initialize the UI on load

    // --- Restrict date picker using the local timezone ---
    const datePicker = document.getElementById("date-picker");
    const today = new Date();
    
    // Set the minimum date to today (local time)
    datePicker.min = toLocalISOString(today);

    // Set the maximum date to 5 days from now
    const maxDate = new Date();
    maxDate.setDate(today.getDate() + 5);
    datePicker.max = toLocalISOString(maxDate);
});

// Map click event
map.on("click", (e) => {
    updateLocationInfo(e.latlng.lat, e.latlng.lng);
});

// Search input event
const searchInput = document.getElementById("search-input");
searchInput.addEventListener("input", async () => {
    const query = searchInput.value;
    const suggestionsContainer = document.getElementById("suggestions");
    if (query.length < 3) {
        suggestionsContainer.innerHTML = "";
        suggestionsContainer.style.display = "none";
        return;
    }
    const response = await fetch(`http://127.0.0.1:5000/search_locations?query=${query}`);
    const data = await response.json();
    suggestionsContainer.innerHTML = "";
    if (data.suggestions && data.suggestions.length > 0) {
        data.suggestions.forEach(loc => {
            const item = document.createElement("div");
            item.className = "suggestion-item";
            item.innerText = loc.name;
            item.onclick = () => {
                searchInput.value = loc.name;
                suggestionsContainer.style.display = "none";
                map.setView([loc.lat, loc.lon], 14);
                updateLocationInfo(parseFloat(loc.lat), parseFloat(loc.lon));
            };
            suggestionsContainer.appendChild(item);
        });
        suggestionsContainer.style.display = "block";
    }
});
// Hide suggestions when clicking outside
document.addEventListener("click", (e) => {
    if (!document.querySelector('.card-body').contains(e.target)) {
        document.getElementById("suggestions").style.display = "none";
    }
});
document.getElementById('search-btn-icon').addEventListener('click', () => searchInput.dispatchEvent(new Event('input')));


// MODIFIED: Combined listener for Date and Time pickers
function handleDateTimeChange() {
    const date = document.getElementById("date-picker").value;
    const time = document.getElementById("time-picker").value;
    if (selectedLocation.lat && date && time) {
        fetchWeatherData(selectedLocation.lat, selectedLocation.lng, date, time);
    } else if (date && time) {
        alert("Please select a location first.");
        document.getElementById("date-picker").value = "";
        document.getElementById("time-picker").value = "";
    }
}
document.getElementById("date-picker").addEventListener("change", handleDateTimeChange);
document.getElementById("time-picker").addEventListener("change", handleDateTimeChange);

// Predict button click
document.getElementById("predict-btn").addEventListener("click", async () => {
    // --- 1. Validation ---
    const forecastSelect = document.getElementById("forecast-period");
    selectedForecastPeriod.value = forecastSelect.value;
    selectedForecastPeriod.text = forecastSelect.options[forecastSelect.selectedIndex].text;

     if (!selectedLocation.lat || !selectedPredictionDate || !selectedPredictionTime || !selectedForecastPeriod.value || !lastFetchedWeatherData) {
        alert("Validation Error: Please ensure a Location, a valid Date, Time, and Forecast Period are selected.");
        return;
    }
    
    // Your original model needs all 6 rainfall features. We still send them.
    const requestData = {
        soil_type: fetchedLocationData.soil_type_snum,
        slope: parseFloat(document.getElementById("slope").value),
        soil_moisture: parseFloat(document.getElementById("soil-moisture").value),
        
        "rainfall-3_hr": parseFloat(document.getElementById("rainfall-3-hr").value),
        "rainfall-6_hr": parseFloat(document.getElementById("rainfall-6-hr").value),
        "rainfall-12_hr": parseFloat(document.getElementById("rainfall-12-hr").value),

        "rain-intensity-3_hr": parseFloat(document.getElementById("rain-intensity-3-hr").value),
        "rain-intensity-6_hr": parseFloat(document.getElementById("rain-intensity-6-hr").value),
        "rain-intensity-12_hr": parseFloat(document.getElementById("rain-intensity-12-hr").value),
        "rainfall-1-day": parseFloat(document.getElementById("rainfall-1-day").value),
        "rainfall-3-day": parseFloat(document.getElementById("rainfall-3-day").value),
        "rainfall-5-day": parseFloat(document.getElementById("rainfall-5-day").value),
        "rain-intensity-1-day": parseFloat(document.getElementById("rain-intensity-1-day").value),
        "rain-intensity-3-day": parseFloat(document.getElementById("rain-intensity-3-day").value),
        "rain-intensity-5-day": parseFloat(document.getElementById("rain-intensity-5-day").value),
    };
    
    // Check for NaN values before sending
    for(const key in requestData) {
        if(isNaN(requestData[key])) {
            alert(`Validation Error: Invalid data for "${key}". Cannot predict.`);
            return;
        }
    }

    // --- 2. API Call ---
    console.log("Sending for prediction:", requestData);
    try {
        const response = await fetch("http://127.0.0.1:5000/predict", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestData)
        });
        const result = await response.json();
        if (result.error) throw new Error(result.error);

        lastPredictionResult = { prediction: result.prediction, confidence: result.confidence };
        
        // --- 3. Show Modal ---
        document.getElementById("modal-body").innerHTML = `<p><strong>Prediction:</strong> ${result.prediction}</p><p><strong>Confidence:</strong> ${result.confidence}</p>`;
        document.getElementById("prediction-modal").style.display = "flex";

    } catch (error) {
        console.error("Prediction failed:", error);
        alert("Prediction Error: " + error.message);
    }
});


// Report Summary button in modal
document.getElementById("report-btn").addEventListener("click", () => {
    document.getElementById("prediction-modal").style.display = "none";
    populateReportSummary();
    const reportSection = document.getElementById("report-summary-section");
    reportSection.style.display = "block";
    reportSection.scrollIntoView({ behavior: 'smooth' });
});

// Reset All button
document.getElementById("reset-btn").addEventListener("click", resetUI);




// ===================================
// == SCROLL BUTTON
// ===================================


let scrollTopButton = document.getElementById("scrollTopBtn");

// When the user scrolls down 20px from the top of the document, show the button
window.onscroll = function() {
  scrollFunction();
};

function scrollFunction() {
  // The threshold for showing the button (e.g., 100 pixels)
  const showButtonThreshold = 500;

  if (document.body.scrollTop > showButtonThreshold || document.documentElement.scrollTop > showButtonThreshold) {
    scrollTopButton.style.display = "block";
  } else {
    scrollTopButton.style.display = "none";
  }
}

// When the user clicks on the button, scroll to the top of the document smoothly
scrollTopButton.addEventListener("click", function() {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
});