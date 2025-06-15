var map = L.map('map', {
    maxBounds: [[4, 116], [21, 127]],
    maxBoundsViscosity: 1.0
  }).setView([12.8797, 121.7740], 6); // Initial view set for Philippines


// Add OpenStreetMap Tile Layer
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);


// --- Add Search Input Clearing Logic Here ---
const searchInput = document.getElementById("search-input");
if (searchInput) {
    searchInput.value = ""; // Set the search input value to an empty string on page load
} else {
    console.error("Search input element not found!");
}

// --- Also reset the location info div ---
document.getElementById("location-info").innerHTML = `<strong>Location:</strong> Search for a location.`;

// Default Empty Values
document.getElementById("slope").value = "";
document.getElementById("soil-type").value = "";
document.getElementById("soil-moisture").value = "";


    // Cumulative Rainfall
document.getElementById("rainfall-1-day").value = "";
document.getElementById("rainfall-3-day").value = "";
document.getElementById("rainfall-5-day").value = "";
    // Rainfall Intensity
document.getElementById("rain-intensity-1-day").value = "";
document.getElementById("rain-intensity-3-day").value = "";
document.getElementById("rain-intensity-5-day").value = "";
document.getElementById("location-info").innerHTML = `<strong>Location:</strong> Search for a location.`;

// Store last marker
let lastMarker = null;

// Function to update UI with fetched data
function updateInfoSection(locationData) {
    document.getElementById("slope").value = locationData.slope;
    document.getElementById("soil-type").value = locationData.soil_type;
    document.getElementById("soil-moisture").value = locationData.weather_data.soil_moisture;

    // Cumulative Rainfall
    document.getElementById("rainfall-1-day").value = locationData.weather_data.cumulative_rainfall["1_day"];
    document.getElementById("rainfall-3-day").value = locationData.weather_data.cumulative_rainfall["3_day"];
    document.getElementById("rainfall-5-day").value = locationData.weather_data.cumulative_rainfall["5_day"];

    // Rainfall Intensity
    document.getElementById("rain-intensity-1-day").value = locationData.weather_data.rain_intensity["1_day"];
    document.getElementById("rain-intensity-3-day").value = locationData.weather_data.rain_intensity["3_day"];
    document.getElementById("rain-intensity-5-day").value = locationData.weather_data.rain_intensity["5_day"];
}

function fetchLocationData(query) {
    fetch(`/search_locations?query=${query}`)
        .then(response => response.json())
        .then(data => {
            if (data.suggestions.length > 0) {
                updateInfoSection(data.suggestions[0]);  // Update UI with first result
            }
        })
        .catch(error => console.error("Error fetching location data:", error));
}



// Function to get search suggestions from Flask
async function getSearchSuggestions(query) {
    if (query.length < 1) {
        document.getElementById("suggestions").innerHTML = ""; // Clear dropdown if query is too short
        return;
    }

    try {
        let response = await fetch(`http://127.0.0.1:5000/search_locations?query=${query}`);
        let data = await response.json();
        let suggestionsContainer = document.getElementById("suggestions");

        suggestionsContainer.innerHTML = ""; // Clear previous suggestions

        if (data.suggestions.length === 0) {
            suggestionsContainer.innerHTML = "<p class='suggestion-item'>No matching locations found.</p>";
            return;
        }

        // Create and append suggestion items
        data.suggestions.forEach(location => {
            let suggestion = document.createElement("p");
            suggestion.innerText = location.name; // Use display name from Nominatim
            suggestion.classList.add("suggestion-item");

            // On click, update search box and location info
            suggestion.addEventListener("click", async () => {
                document.getElementById("search-input").value = location.name;
                suggestionsContainer.innerHTML = ""; // Hide dropdown

                let lat = parseFloat(location.lat);
                let lon = parseFloat(location.lon);

                // Move map to selected location
                map.setView([lat, lon], 14);

                // Fetch location details (same function as map click)
                let place = await getLocationFromCoordinates(lat, lon);

                // Fetch soil type & slope
                let soilType = "Fetching...";
                let slope = "Fetching...";

                try {
                    let response = await fetch(`http://127.0.0.1:5000/get_weather?lat=${lat}&lon=${lon}`);
                    let data = await response.json();
                    soilType = data.soil_type || "Unknown";
                    slope = data.slope !== undefined ? data.slope : "Unknown";
                } catch (error) {
                    console.error("Error fetching soil/slope data:", error);
                    soilType = "Error";
                    slope = "Error";
                }

                // Update Info Section (Same as Map Click)
                document.getElementById("location-info").innerHTML = `
                    <strong>Coordinates:</strong> ${lat}, ${lon} <br>
                    <strong>Location:</strong> ${place.full} <br>
                    <strong>Soil Type:</strong> ${soilType} <br>
                    <strong>Slope:</strong> ${slope}
                `;

                document.getElementById("slope").value = slope;
                document.getElementById("soil-type").value = soilType;

                // Remove old marker and add new one
                if (window.currentMarker) {
                    map.removeLayer(window.currentMarker);
                }
                window.currentMarker = L.marker([lat, lon]).addTo(map)
                    .bindPopup(`
                        <b>Coordinates:</b> ${lat}, ${lon} <br>
                        <b>Location:</b> ${place.full} <br>
                        <b>Soil Type:</b> ${soilType} <br>
                        <b>Slope:</b> ${slope}
                    `)
                    .openPopup();

                // Fetch weather data if a date is selected
                let date = document.getElementById("date-picker").value;
                if (date) {
                    fetchWeatherData(lat, lon, date);
                }
            });

            suggestionsContainer.appendChild(suggestion); // **This was missing**
        }); // **Closing the forEach loop properly**

        // Show dropdown below the search box
        suggestionsContainer.style.display = "block";

    } catch (error) {
        console.error("Error fetching search suggestions:", error);
    }
}


// Close dropdown when clicking outside
document.addEventListener("click", (event) => {
    let searchContainer = document.querySelector(".search-container");
    let suggestionsContainer = document.getElementById("suggestions");

    if (!searchContainer.contains(event.target)) {
        suggestionsContainer.innerHTML = ""; // Hide dropdown
    }
});

// Listen for input changes
document.getElementById("search-input").addEventListener("input", function () {
    let query = this.value.trim();
    getSearchSuggestions(query);
});


// Event Listener for Date Picker Change (Re-fetch Data)
document.getElementById("date-picker").addEventListener("change", function () {
    let locationInfo = document.getElementById("location-info").value;
    if (locationInfo.includes("Search for a location")) return;

    let latLon = lastMarker ? lastMarker.getLatLng() : null;
    if (latLon) {
        fetchWeatherData(latLon.lat, latLon.lng);
    }
});

// Event Listener for Rainfall Selection Change
document.querySelector(".form-select").addEventListener("change", updateRainfallValues);

function updateRainfallValues() {
    let select = document.querySelector(".form-select");
    document.getElementById("rainfall-1-day").value = select.dataset.cumulative1;
    document.getElementById("rainfall-3-day").value = select.dataset.cumulative2;
    document.getElementById("rainfall-5-day").value = select.dataset.cumulative3;

    document.getElementById("rain-intensity-1-day").value = select.dataset.intensity1;
    document.getElementById("rain-intensity-3-day").value = select.dataset.intensity2;
    document.getElementById("rain-intensity-5-day").value = select.dataset.intensity3;
}



function extractRelevantLocation(placeName) {
    let parts = placeName.split(",").map(part => part.trim());

    let name3 = parts.length > 0 ? parts[0] : ""; // Barangay
    let name2 = parts.length > 1 ? parts[1] : ""; // Municipality
    let name1 = parts.length > 2 ? parts[2] : ""; // Province

    //  Manually handle known name variations
    const nameCorrections = {
        "Babuyan Island": "Babuyan Claro", // Fix incorrect Nominatim output
    };

    if (nameCorrections[name3]) {
        name3 = nameCorrections[name3];
    }

    return { name1, name2, name3, full: `${name3}, ${name2}, ${name1}` };
}async function fetchWeatherData(latitude, longitude, date) {
    try {

        console.log("Fetching data for:", latitude, longitude, date); // Debug log

        let response = await fetch(`http://127.0.0.1:5000/get_weather?latitude=${latitude}&longitude=${longitude}&date=${date}`);
        let data = await response.json();

        if (data.error) {
            console.error("Error fetching weather data:", data.error);
            return;
        }

        // Set soil moisture value
        document.getElementById("soil-moisture").value = data.soil_moisture.toFixed(1) ;

        let select = document.querySelector(".form-select");

        // Store rainfall data in the select element (corrected dataset usage)
        select.dataset.cumulative1 = data.cumulative_rainfall["1_day"].toFixed(1);
        select.dataset.cumulative2 = data.cumulative_rainfall["3_day"].toFixed(1);
        select.dataset.cumulative3 = data.cumulative_rainfall["5_day"].toFixed(1) ;

        select.dataset.intensity1 = data.rain_intensity["1_day"].toFixed(1);
        select.dataset.intensity2 = data.rain_intensity["3_day"].toFixed(1);
        select.dataset.intensity3 = data.rain_intensity["5_day"].toFixed(1);

        //  Update UI with new values
        updateRainfallValues();
    } catch (error) {
        console.error("Error fetching weather data:", error);
    }
}

// Ensure soil moisture and rainfall inputs remain manual
document.querySelector(".form-select").addEventListener("change", function () {
    console.log("Rainfall type changed, but inputs remain unchanged.");
});

// Reset soil moisture and rainfall inputs only when reset button is clicked
document.getElementById("reset-btn").addEventListener("click", function () {
    document.getElementById("soil-moisture").value = ""; // Clear soil moisture input
    document.getElementById("soil-type").value = "";
    document.getElementById("slope").value = "";

    document.querySelectorAll(".custom-input").forEach(input => {
        input.value = ""; // Clear all rainfall inputs (1-day, 2-day, 3-day)
    });

    console.log("Inputs reset successfully.");
});

document.getElementById("predict-btn").addEventListener("click", async function () {
    let soilType = document.getElementById("soil-type").value;
    let slope = document.getElementById("slope").value;
    let soilMoisture = document.getElementById("soil-moisture").value;
    
    // Collect all 6 rainfall inputs
    let rainfallInputs = document.querySelectorAll(".custom-input");
    let rainfallValues = Array.from(rainfallInputs).map(input => input.value);

    // Ensure we have all 6 rainfall values
    if (rainfallValues.length !== 6) {
        alert("Error: Missing rainfall values!");
        return;
    }

    let requestData = {
        soil_type: soilType,
        slope: slope,
        soil_moisture: soilMoisture,
        rainfall_1day_cumulative: rainfallValues[0],
        rainfall_2day_cumulative: rainfallValues[1],
        rainfall_3day_cumulative: rainfallValues[2],
        rainfall_1day_intensity: rainfallValues[3],
        rainfall_2day_intensity: rainfallValues[4],
        rainfall_3day_intensity: rainfallValues[5]
    };

    try {
        let response = await fetch("http://127.0.0.1:5000/predict", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestData)
        });

        let result = await response.json();

        if (result.error) {
            alert("Error: " + result.error);
        } else {
            showPredictionModal(result.prediction, result.confidence);
        }

    } catch (error) {
        console.error("Error fetching prediction:", error);
    }
});

// Function to show modal with prediction result
function showPredictionModal(prediction, confidence) {
    let modal = document.getElementById("prediction-modal");
    let modalBody = document.getElementById("modal-body");

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


// Initialize map click event
map.on("click", async function (e) {
    let lat = e.latlng.lat;
    let lng = e.latlng.lng;

    console.log("Clicked coordinates:", lat, lng);

    // Fetch location details using reverse geocoding
    let place = await getLocationFromCoordinates(lat, lng);

    // Fetch soil type & slope from Flask API
    let soilType = "Fetching...";
    let slope = "Fetching...";

    try {
        let response = await fetch(`http://127.0.0.1:5000/get_weatherlat=${lat}&lon=${lng}`);
        let data = await response.json();

        if (data.error) {
            soilType = "Unknown";
            slope = "Unknown";
        } else {
            soilType = data.soil_type || "Unknown";
            slope = data.slope !== undefined ? data.slope : "Unknown";
        }
    } catch (error) {
        console.error("Error fetching soil/slope data:", error);
        soilType = "Error";
        slope = "Error";
    }

    // Update HTML to display location info, soil type, and slope
    document.getElementById("location-info").innerHTML = `
        <strong>Coordinates:</strong> ${lat}, ${lng} <br>
        <strong>Location:</strong> ${place.full} <br>
        <strong>Soil Type:</strong> ${soilType} <br>
        <strong>Slope:</strong> ${slope}
    `;

    // Update input fields
    document.getElementById("slope").value = slope;
    document.getElementById("soil-type").value = soilType;

    // Remove existing marker if it exists
    if (window.currentMarker) {
        map.removeLayer(window.currentMarker);
    }

    // Add marker at clicked location
    window.currentMarker = L.marker([lat, lng]).addTo(map)
        .bindPopup(`
            <b>Coordinates:</b> ${lat}, ${lng} <br>
            <b>Location:</b> ${place.full} <br>
            <b>Soil Type:</b> ${soilType} <br>
            <b>Slope:</b> ${slope}
        `)
        .openPopup();

    // Fetch weather data (Make sure a date is selected)
    let date = document.getElementById("date-picker").value;
    if (date) {
        fetchWeatherData(lat, lng, date);
    } else {
        console.log("No date selected. Weather data not fetched.");
    }
});


// Function to reverse geocode coordinates to get location name
async function getLocationFromCoordinates(lat, lng) {
    let url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;

    try {
        let response = await fetch(url);
        let data = await response.json();

        let placeName = data.display_name;
        let parts = placeName.split(",").map(part => part.trim());

        let name3 = parts.length > 0 ? parts[0] : ""; // Barangay
        let name2 = parts.length > 1 ? parts[1] : ""; // Municipality
        let name1 = parts.length > 2 ? parts[2] : ""; // Province

        return { name1, name2, name3, full: `${name3}, ${name2}, ${name1}` };
    } catch (error) {
        console.error("Error fetching location:", error);
        return { full: "Unknown Location" };
    }
}

// Function to format a Date object into YYYY-MM-DD
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Restrict the date picker on page load
document.addEventListener('DOMContentLoaded', (event) => {
    const datePicker = document.getElementById("date-picker");

    if (datePicker) { // Ensure the element exists
        const today = new Date();
        const maxDate = new Date(); // Start from today
        maxDate.setDate(today.getDate() + 5); // Add 5 days

        const minDateFormatted = formatDate(today);
        const maxDateFormatted = formatDate(maxDate);

        datePicker.setAttribute('min', minDateFormatted);
        datePicker.setAttribute('max', maxDateFormatted);

        // Optional: Set the default value to today's date initially
        datePicker.value = "";

        // Trigger change event if you want subsequent logic (like fetching data for today) to run
        // datePicker.dispatchEvent(new Event('change')); // Uncomment if you need this behavior on load
    } else {
        console.error("Date picker element not found!"); // Log an error if the element isn't there
    }
});
