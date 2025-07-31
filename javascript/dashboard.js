document.addEventListener('DOMContentLoaded', function () {


    console.log("testing");

    // --- CHART & MAP INITIALIZATION ---
    let map;
    let allData = []; // To store CSV data
    let geojsonData = { type: 'FeatureCollection', features: [] }; // For Mapbox

    // --- --- --- ACTION REQUIRED --- --- ---
    // REPLACE with your Mapbox access token and style URL
    mapboxgl.accessToken = 'pk.eyJ1IjoibGFtYXR6IiwiYSI6ImNtZDczb3pyNDA1am8ya3M4czB3bjVocXIifQ.tNJchBN53I2HcuIGXJMmTQ'; // <-- PASTE YOUR TOKEN HERE
    const philippinesBounds = [[116.0, 4.0], [127.0, 21.0]];

    map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/lamatz/cmcvi5j5g00g601sr0rva51xp', // <-- e.g., 'mapbox://styles/mapbox/streets-v12'
        center: [121.7740, 12.8797],
        zoom: 5,
        maxBounds: philippinesBounds,
        antialias: true
    });

    // Add zoom and rotation controls to the map.
    map.addControl(new mapboxgl.NavigationControl());

    map.on('load', () => {
        // Add the GeoJSON source for landslide points
        map.addSource('landslide-points', {
            type: 'geojson',
            data: geojsonData
        });

        // Add the layer to visualize the points
        map.addLayer({
            id: 'landslide-layer',
            type: 'circle',
            source: 'landslide-points',
            paint: {
                'circle-radius': 6,
                'circle-color': '#FF4136',
                'circle-stroke-color': 'white',
                'circle-stroke-width': 1,
                'circle-opacity': 0.8
            }
        });

        // Create a popup, but don't add it to the map yet.
        const popup = new mapboxgl.Popup({
            closeButton: false,
            closeOnClick: false
        });

        map.on('mouseenter', 'landslide-layer', (e) => {
            // Change the cursor style as a UI indicator.
            map.getCanvas().style.cursor = 'pointer';

            const coordinates = e.features[0].geometry.coordinates.slice();
            const region = e.features[0].properties.region;

            // Ensure that if the map is zoomed out such that multiple
            // copies of the feature are visible, the popup appears
            // over the copy being pointed to.
            while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
            }

            // Populate the popup and set its coordinates
            popup.setLngLat(coordinates).setHTML(`<strong>Region:</strong> ${region}`).addTo(map);
        });

        map.on('mouseleave', 'landslide-layer', () => {
            map.getCanvas().style.cursor = '';
            popup.remove();
        });

    });

    // --- Chart Data (static part for examples) ---
    const allDataa = {
        labels: ['Region I - Ilocos Region', 'Region II - Cagayan Valley', 'Region III - Central Luzon', 'Region IV-A - CALABARZON', 'Region IV-B - MIMAROPA', 'Region V - Bicol Region', 'Region VI - Western Visayas', 'Region VII - Central Visayas', 'Region VIII - Eastern Visayas', 'Region IX - Zamboanga Peninsula', 'Region X - Northern Mindanao', 'Region XI - Davao Region', 'Region XII - SOCCSKSARGEN', 'Region XIII - Caraga', 'NCR - National Capital Region', 'CAR - Cordillera Administrative Region', 'BARMM - Bangsamoro Autonomous Region in Muslim Mindanao'],
        datasets: [{ label: 'Alerts Issued', data: [10, 15, 12, 8, 13, 7, 9, 14, 6, 11, 10, 13, 15, 12, 14, 9, 16], backgroundColor: '#007BFF' }, { label: 'Actual Landslides', data: [8, 16, 10, 12, 9, 10, 8, 13, 7, 15, 14, 11, 9, 10, 13, 8, 12], backgroundColor: '#FF4136' }]
    };
    // const regionMonthlyData = { 'Region I - Ilocos Region': [3, 5, 12, 20, 35, 42, 50, 45, 30, 15, 8, 4], 'Region II - Cagayan Valley': [2, 4, 8, 15, 25, 30, 38, 35, 25, 12, 6, 3], 'Region III - Central Luzon': [1, 3, 6, 10, 18, 25, 30, 28, 20, 10, 5, 2], 'Region IV-A - CALABARZON': [4, 6, 10, 18, 28, 35, 40, 38, 25, 14, 7, 3], 'Region IV-B - MIMAROPA': [2, 3, 7, 12, 22, 30, 34, 32, 20, 9, 4, 2], 'Region V - Bicol Region': [3, 5, 9, 16, 26, 33, 37, 35, 22, 11, 6, 3], 'Region VI - Western Visayas': [2, 4, 6, 14, 24, 28, 32, 31, 19, 10, 5, 2], 'Region VII - Central Visayas': [3, 5, 8, 13, 21, 27, 29, 28, 18, 9, 4, 2], 'Region VIII - Eastern Visayas': [2, 4, 7, 11, 20, 26, 30, 29, 17, 8, 4, 1], 'Region IX - Zamboanga Peninsula': [1, 3, 5, 10, 18, 24, 28, 27, 16, 7, 3, 1], 'Region X - Northern Mindanao': [2, 4, 6, 12, 20, 25, 27, 26, 15, 7, 3, 1], 'Region XI - Davao Region': [2, 5, 7, 13, 22, 28, 30, 29, 18, 8, 4, 2], 'Region XII - SOCCSKSARGEN': [1, 3, 5, 11, 19, 24, 26, 25, 14, 6, 2, 1], 'Region XIII - Caraga': [2, 4, 6, 12, 21, 27, 29, 28, 17, 8, 3, 1], 'NCR - National Capital Region': [1, 2, 4, 8, 15, 20, 22, 21, 12, 6, 3, 1], 'CAR - Cordillera Administrative Region': [3, 6, 9, 14, 23, 29, 33, 31, 19, 10, 5, 2], 'BARMM - Bangsamoro Autonomous Region in Muslim Mindanao': [2, 4, 6, 10, 18, 22, 25, 24, 14, 6, 3, 1] };

    // --- Chart Instantiation ---
    // const alertsChart = new Chart(document.getElementById('structureChart').getContext('2d'), { type: 'bar', data: { labels: [], datasets: [{ label: 'Alerts Issued', data: [0], backgroundColor: '#007BFF' }, { label: 'Actual Landslides', data: [0], backgroundColor: '#FF4136' }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } }, scales: { y: { beginAtZero: true } } } });
    const historyChart = new Chart(document.getElementById('roadsChart').getContext('2d'), { type: 'bar', data: { labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], datasets: [{ label: 'Landslides', data: [], backgroundColor: '#E67300' }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } } });
    const historyChartYearly = new Chart(document.getElementById('structureChart').getContext('2d'), {
        type: 'bar',
        data: {
            labels: [], // Years will go here
            datasets: [{
                label: 'Landslides per Year',
                data: [], // Yearly counts will go here
                backgroundColor: '#4BC0C0' // A different color for the new chart
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top' }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0 // Ensure whole numbers for counts
                    }
                }
            }
        }
    });
    const soilChart = new Chart(document.getElementById('soilPieChart').getContext('2d'), { type: 'pie', data: { labels: ['1 - Clay', '2 - Clay Loam', '3 - Sandy Loam', '4 - Loam'], datasets: [{ data: [15, 40, 20, 30], backgroundColor: ['#2ecc71', '#f1c40f', '#e67e22', '#e74c3c', '#9b59b6'] }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: true, position: 'right' } } } });
    const slopeChart = new Chart(document.getElementById('rainChart').getContext('2d'), { type: 'bar', data: { labels: ['1 - <10° Flat', '2 - 10°-20° Gentle', '3 - 20°-30° Moderate', '4 - 30°-40° Substantial', '5 - 40°-50° Steep', '6 - >50° Very Steep'], datasets: [{ label: 'Slope Vulnerability Level', data: [5, 10, 15, 20, 25, 30], backgroundColor: '#2980b9' }] }, options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true } } } });
    let agriChart; // Will be created after data loads


    let monthlyCountsByRegion = {};
    let yearlyCountsByRegion = {};

    // --- DATA LOADING & PROCESSING (DEBUGGING VERSION) ---
    console.log("Starting Papa.parse for datas.csv...");
    Papa.parse("../datas_final_standardized_withTime.csv", {
        download: true,
        header: true,
        complete: function (results) {
            console.log("1. Papa.parse complete. Raw results:", results);

            // Check if data is empty or has issues
            if (!results.data || results.data.length === 0) {
                console.error("CSV parsing resulted in no data. Check the CSV file and its structure.");
                return; // Stop execution if there's no data
            }

            // --- Initialize all data structures we need to build ---
            const geojsonFeatures = [];
            const regionCounts = {};
            let validMapDataRowCount = 0;

            // --- Process all data in a SINGLE LOOP ---
            console.log("2. Starting combined data processing loop...");
            results.data.forEach(row => {
                // Skip empty rows which Papa.parse sometimes adds at the end
                if (!row || !row.region) {
                    console.log("Skipping empty or region-less row:", row);
                    return;
                }

                const region = row.region.trim();

                // --- Part 1: Process data for the Map and Top Regions Chart ---
                // This replaces the first .filter() and .map()
                if (row.lat && row.long) {
                    validMapDataRowCount++;
                    // a. Convert to GeoJSON Feature
                    geojsonFeatures.push({
                        type: 'Feature',
                        geometry: {
                            type: 'Point',
                            coordinates: [parseFloat(row.long), parseFloat(row.lat)]
                        },
                        properties: { region: region }
                    });

                    // b. Count occurrences for the "Top Regions" chart
                    regionCounts[region] = (regionCounts[region] || 0) + 1;
                } else {
                    console.log("Filtering out row for map (missing lat/long):", row);
                }

                // --- Part 2: Process data for the Monthly/Yearly History Charts ---
                // This replaces the second Papa.parse call entirely
                if (row.date) {
                    const dateParts = row.date.split('/'); // e.g., "23/10/2024"

                    if (dateParts.length === 3) {
                        // a. Process for Monthly Chart
                        const monthIndex = parseInt(dateParts[1], 10) - 1;
                        if (monthIndex >= 0 && monthIndex < 12) {
                            if (!monthlyCountsByRegion[region]) {
                                monthlyCountsByRegion[region] = Array(12).fill(0);
                            }
                            monthlyCountsByRegion[region][monthIndex]++;
                        }

                        // b. Process for Yearly Chart
                        const year = dateParts[2];
                        if (year) {
                            if (!yearlyCountsByRegion[region]) {
                                yearlyCountsByRegion[region] = {};
                            }
                            yearlyCountsByRegion[region][year] = (yearlyCountsByRegion[region][year] || 0) + 1;
                        }
                    }
                } else {
                    console.log("Skipping row for history charts (missing date):", row);
                }
            });

            console.log("3. Data processing finished.");
            console.log("   - Total valid rows for map:", validMapDataRowCount);
            console.log("   - Monthly counts by region:", monthlyCountsByRegion);
            console.log("   - Yearly counts by region:", yearlyCountsByRegion);

            // --- Part 3: Update UI elements with the processed data ---

            // Update GeoJSON object
            geojsonData.features = geojsonFeatures;
            console.log("4. Final GeoJSON object:", geojsonData);

            // Update the map source
            if (typeof map !== 'undefined' && map.getSource('landslide-points')) {
                console.log("5. Updating map source 'landslide-points'.");
                map.getSource('landslide-points').setData(geojsonData);
            } else {
                console.warn("Map or source 'landslide-points' not ready. It should be updated on map 'load'.");
            }

            // Update "Top Regions" chart
            const sortedRegions = Object.entries(regionCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
            const chartElement = document.getElementById('agriChart');
            if (chartElement) {
                console.log("6. Creating/updating the 'Top Regions' chart.", sortedRegions);
                if (window.agriChart instanceof Chart) {
                    window.agriChart.destroy();
                }
                window.agriChart = new Chart(chartElement.getContext('2d'), { type: 'bar', data: { labels: sortedRegions.map(e => e[0]), datasets: [{ label: 'Landslide Incidents', data: sortedRegions.map(e => e[1]), backgroundColor: ['#3498db', '#1abc9c', '#9b59b6', '#e74c3c', '#f1c40f'] }] }, options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true } } } });
            } else {
                console.error("Could not find the chart canvas element with id='agriChart'!");
            }



            // Finally, trigger the change event ONCE to initialize the history chart
            console.log("7. All data loaded. Triggering 'change' event to show initial history chart.");

            // Call other update functions
            updateDashboard("");

            if (typeof regionSelect !== 'undefined' && regionSelect) {
                regionSelect.dispatchEvent(new Event('change'));
            } else {
                console.error("The 'regionSelect' element is not defined!");
            }
        },
        error: (err, file) => {
            console.error("!!! Papa.parse ERROR:", err, file);
        }
    });




    function updateDashboard(selectedRegion) {

        console.log("trying 1");




        console.log("trying 122");
        // Update Monthly History Chart
        if (selectedRegion === "") {
            const totalMonthlyCounts = Array(12).fill(0);
            for (const region in monthlyCountsByRegion) {
                for (let i = 0; i < 12; i++) {
                    totalMonthlyCounts[i] += monthlyCountsByRegion[region][i];
                }
            }
            historyChart.data.datasets[0].data = totalMonthlyCounts;
        } else if (monthlyCountsByRegion[selectedRegion]) {
            historyChart.data.datasets[0].data = monthlyCountsByRegion[selectedRegion];
        } else {
            historyChart.data.datasets[0].data = Array(12).fill(0); // Default to zeros if no data
        }
        historyChart.update();

        // Update Yearly History Chart
        if (selectedRegion === "") {
            // Recalculate total for "All Regions"
            const totalYearlyCounts = {};
            for (const region in yearlyCountsByRegion) {
                for (const year in yearlyCountsByRegion[region]) {
                    totalYearlyCounts[year] = (totalYearlyCounts[year] || 0) + yearlyCountsByRegion[region][year];
                }
            }
            const sortedYears = Object.keys(totalYearlyCounts).sort();
            historyChartYearly.data.labels = sortedYears;
            historyChartYearly.data.datasets[0].data = sortedYears.map(year => totalYearlyCounts[year]);

            console.log("trying 5");
        } else if (yearlyCountsByRegion[selectedRegion]) {
            // Data for a specific region
            const regionData = yearlyCountsByRegion[selectedRegion];
            const sortedYears = Object.keys(regionData).sort();
            historyChartYearly.data.labels = sortedYears;
            historyChartYearly.data.datasets[0].data = sortedYears.map(year => regionData[year]);
        } else {
            // No data for the selected region
            historyChartYearly.data.labels = [];
            historyChartYearly.data.datasets[0].data = [];
        }
        historyChartYearly.update();


                // Update Mapbox Filter
        if (selectedRegion === "") {
            map.setFilter('landslide-layer', null); // Show all points
        } else {
            map.setFilter('landslide-layer', ['==', ['get', 'region'], selectedRegion]);
        }
        console.log("Testing mapbox filter");
    }



    // --- Step 2: Set up the event listener to call the named function ---
    const regionSelect = document.getElementById('regionSelect');
    regionSelect.addEventListener('change', function () {
        // "this.value" refers to the selected option's value
        updateDashboard(this.value);
    });



}); // End DOMContentLoaded




document.addEventListener('DOMContentLoaded', function () {
    console.log("trying 2");
    updateDashboard("");
});

