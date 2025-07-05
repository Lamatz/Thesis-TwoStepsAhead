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
let selectedForecastPeriod = { value: null, text: null };

// Chart instances
let hourlyChart = null;
let dailyChart = null;

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

// Resets the entire UI to its initial state
function resetUI() {
    console.log("Resetting UI and all data.");

    // Clear search and location panel
    document.getElementById("search-input").value = "";
    document.getElementById("suggestions").style.display = "none";
    document.getElementById("loc-lat").innerText = "N/A";
    document.getElementById("loc-lng").innerText = "N/A";
    document.getElementById("loc-name").innerText = "No location selected.";

    // Clear forecast settings
    document.getElementById("date-picker").value = "";
    document.getElementById("forecast-period").selectedIndex = 0;

    // Clear hidden data inputs
    document.getElementById("slope").value = "";
    document.getElementById("soil-type").value = "";
    document.getElementById("soil-moisture").value = "";
    document.getElementById("rainfall-1-day").value = "";
    document.getElementById("rainfall-3-day").value = "";
    document.getElementById("rainfall-5-day").value = "";
    document.getElementById("rain-intensity-1-day").value = "";
    document.getElementById("rain-intensity-3-day").value = "";
    document.getElementById("rain-intensity-5-day").value = "";

    // Remove map marker
    if (currentMarker) {
        map.removeLayer(currentMarker);
        currentMarker = null;
    }

    // Reset global state variables
    selectedLocation = { lat: null, lng: null, name: null };
    fetchedLocationData = { soil_type: null, slope: null };
    lastFetchedWeatherData = null;
    lastPredictionResult = { prediction: null, confidence: null };
    selectedPredictionDate = null;
    selectedForecastPeriod = { value: null, text: null };

    // Hide and clear the report summary
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
        document.getElementById("loc-name").innerText = selectedLocation.name;
        currentMarker.bindPopup(`<b>${selectedLocation.name}</b><br>Slope: ${fetchedLocationData.slope}<br>Soil: ${fetchedLocationData.soil_type_label}`).openPopup();

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


// Fetches weather data and updates hidden inputs
async function fetchWeatherData(lat, lon, date) {
    if (!lat || !lon || !date) return;
    console.log(`Fetching weather for: ${lat}, ${lon}, on ${date}`);
    try {
        const response = await fetch(`http://127.0.0.1:5000/get_weather?latitude=${lat}&longitude=${lon}&date=${date}`);
        const data = await response.json();
        if (data.error) throw new Error(data.error);

        lastFetchedWeatherData = data;
        selectedPredictionDate = date;

        // Populate hidden inputs (your original logic)
        document.getElementById("soil-moisture").value = data.soil_moisture?.toFixed(1) || "N/A";
        
        document.getElementById("rainfall-3-hr").value = data.cumulative_rainfall["3_hr"].toFixed(1);
        document.getElementById("rainfall-6-hr").value = data.cumulative_rainfall["6_hr"].toFixed(1);
        document.getElementById("rainfall-12-hr").value = data.cumulative_rainfall["12_hr"].toFixed(1);

        document.getElementById("rain-intensity-3-hr").value = data.rain_intensity["3_hr"].toFixed(1);
        document.getElementById("rain-intensity-6-hr").value = data.rain_intensity["6_hr"].toFixed(1);
        document.getElementById("rain-intensity-12-hr").value = data.rain_intensity["12_hr"].toFixed(1);
        document.getElementById("rainfall-1-day").value = data.cumulative_rainfall?.["1_day"]?.toFixed(1) || "N/A";
        document.getElementById("rainfall-3-day").value = data.cumulative_rainfall?.["3_day"]?.toFixed(1) || "N/A";
        document.getElementById("rainfall-5-day").value = data.cumulative_rainfall?.["5_day"]?.toFixed(1) || "N/A";
        document.getElementById("rain-intensity-1-day").value = data.rain_intensity?.["1_day"]?.toFixed(1) || "N/A";
        document.getElementById("rain-intensity-3-day").value = data.rain_intensity?.["3_day"]?.toFixed(1) || "N/A";
        document.getElementById("rain-intensity-5-day").value = data.rain_intensity?.["5_day"]?.toFixed(1) || "N/A";

        console.log("Weather data fetched and stored.", lastFetchedWeatherData);
    } catch (error) {
        console.error("Failed to fetch weather data:", error);
        alert("Error fetching weather data: " + error.message);
        lastFetchedWeatherData = null;
    }
}

// Populates the entire report summary section
function populateReportSummary() {
    // Basic Details
    document.getElementById("report-location-name").innerText = selectedLocation.name || "N/A";
    document.getElementById("report-coords").innerText = selectedLocation.lat ? `${selectedLocation.lat.toFixed(4)}, ${selectedLocation.lng.toFixed(4)}` : "N/A";
    document.getElementById("report-prediction-date").innerText = selectedPredictionDate || "N/A";
    document.getElementById("report-prediction").innerText = lastPredictionResult.prediction || "N/A";
    document.getElementById("report-confidence").innerText = lastPredictionResult.confidence || "N/A";

    // Environmental Variables
    document.getElementById("report-slope").innerText = fetchedLocationData.slope ?? "N/A";
    document.getElementById("report-soil-type").innerText = fetchedLocationData.soil_type_label || "N/A";
    document.getElementById("report-soil-moisture").innerText = lastFetchedWeatherData?.soil_moisture?.toFixed(1) ?? "N/A";

    // Rainfall for Selected Period
    document.getElementById("report-forecast-period").innerText = selectedForecastPeriod.text || "N/A";
    const periodKey = selectedForecastPeriod.value; // e.g., "3_days"
    if (periodKey && lastFetchedWeatherData) {
         document.getElementById("report-cumulative-rain").innerText = lastFetchedWeatherData.cumulative_rainfall?.[periodKey]?.toFixed(1) ?? "N/A";
         document.getElementById("report-intensity-rain").innerText = lastFetchedWeatherData.rain_intensity?.[periodKey]?.toFixed(2) ?? "N/A";
    }

    // --- CHART GENERATION ---
    // Destroy old charts if they exist to prevent artifacts
    if (hourlyChart) hourlyChart.destroy();
    if (dailyChart) dailyChart.destroy();

    // Chart 1: Hourly Rainfall (Using placeholder data)
    // TODO: The backend needs to be updated to provide real hourly data in `lastFetchedWeatherData`.
    const hourlyCtx = document.getElementById('hourly-rainfall-chart').getContext('2d');
    const placeholderHourlyData = {
        labels: ['-12h', '-11h', '-10h', '-9h', '-8h', '-7h', '-6h', '-5h', '-4h', '-3h', '-2h', '-1h'],
        data: [0, 0, 0.5, 1.2, 2.5, 1.0, 0.8, 0.2, 0, 0, 0, 0] // Example data
    };
    hourlyChart = new Chart(hourlyCtx, {
        type: 'bar',
        data: {
            labels: placeholderHourlyData.labels,
            datasets: [{
                label: 'Rainfall (mm/hr)',
                data: placeholderHourlyData.data,
                backgroundColor: 'rgba(54, 162, 235, 0.6)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: { scales: { y: { beginAtZero: true } } }
    });

    // Chart 2: Daily Rainfall (Using real fetched data)
    const dailyCtx = document.getElementById('daily-rainfall-chart').getContext('2d');
    let dailyLabels = ['Day -5', 'Day -4', 'Day -3', 'Day -2', 'Day -1'];
    let dailyData = [0, 0, 0, 0, 0];
    if(lastFetchedWeatherData && lastFetchedWeatherData.daily_data) {
        dailyLabels = lastFetchedWeatherData.daily_data.map(d => d.date);
        dailyData = lastFetchedWeatherData.daily_data.map(d => d.cumulative);
    }
    dailyChart = new Chart(dailyCtx, {
        type: 'bar',
        data: {
            labels: dailyLabels.slice(-5), // Ensure only 5 days
            datasets: [{
                label: 'Cumulative Rainfall (mm)',
                data: dailyData.slice(-5),
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: { scales: { y: { beginAtZero: true } } }
    });

    
}



function hideAndClearReportSummary() {
    const reportSection = document.getElementById("report-summary-section");
    if (reportSection) {
        reportSection.style.display = "none";
        document.getElementById("report-detailed-description").value = "";
        // Destroy charts when hiding to free up memory
        if (hourlyChart) hourlyChart.destroy();
        if (dailyChart) dailyChart.destroy();
        hourlyChart = null;
        dailyChart = null;
    }
}


// ===================================
// == EVENT LISTENERS
// ===================================

document.addEventListener('DOMContentLoaded', () => {
    resetUI(); // Initialize the UI on load

    // Restrict date picker
    const datePicker = document.getElementById("date-picker");
    const today = new Date();
    const maxDate = new Date();
    maxDate.setDate(today.getDate() + 5);
    datePicker.min = today.toISOString().split("T")[0];
    datePicker.max = maxDate.toISOString().split("T")[0];
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


// Date picker change event
document.getElementById("date-picker").addEventListener("change", function () {
    if (selectedLocation.lat) {
        fetchWeatherData(selectedLocation.lat, selectedLocation.lng, this.value);
    } else {
        alert("Please select a location first.");
        this.value = "";
    }
});

// Predict button click
document.getElementById("predict-btn").addEventListener("click", async () => {
    // --- 1. Validation ---
    const forecastSelect = document.getElementById("forecast-period");
    selectedForecastPeriod.value = forecastSelect.value;
    selectedForecastPeriod.text = forecastSelect.options[forecastSelect.selectedIndex].text;

    if (!selectedLocation.lat || !selectedPredictionDate || !selectedForecastPeriod.value || !lastFetchedWeatherData) {
        alert("Validation Error: Please ensure a Location, a valid Date, and a Forecast Period are selected, and all data is loaded.");
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