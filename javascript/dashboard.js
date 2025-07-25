document.addEventListener('DOMContentLoaded', function () {


    console.log("testing");

    // --- CHART & MAP INITIALIZATION ---
    let map;
    let allData = []; // To store CSV data
    let geojsonData = { type: 'FeatureCollection', features: [] }; // For Mapbox

    // --- --- --- ACTION REQUIRED --- --- ---
    // REPLACE with your Mapbox access token and style URL
    mapboxgl.accessToken = 'pk.eyJ1IjoibGFtYXR6IiwiYSI6ImNtY2l0M3g4ZTBhcnIyanF2dTY2Y284ZHMifQ.2BdFI8Lqjg8TXi2LGH7xUA'; // <-- PASTE YOUR TOKEN HERE
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
    const regionMonthlyData = { 'Region I - Ilocos Region': [3, 5, 12, 20, 35, 42, 50, 45, 30, 15, 8, 4], 'Region II - Cagayan Valley': [2, 4, 8, 15, 25, 30, 38, 35, 25, 12, 6, 3], 'Region III - Central Luzon': [1, 3, 6, 10, 18, 25, 30, 28, 20, 10, 5, 2], 'Region IV-A - CALABARZON': [4, 6, 10, 18, 28, 35, 40, 38, 25, 14, 7, 3], 'Region IV-B - MIMAROPA': [2, 3, 7, 12, 22, 30, 34, 32, 20, 9, 4, 2], 'Region V - Bicol Region': [3, 5, 9, 16, 26, 33, 37, 35, 22, 11, 6, 3], 'Region VI - Western Visayas': [2, 4, 6, 14, 24, 28, 32, 31, 19, 10, 5, 2], 'Region VII - Central Visayas': [3, 5, 8, 13, 21, 27, 29, 28, 18, 9, 4, 2], 'Region VIII - Eastern Visayas': [2, 4, 7, 11, 20, 26, 30, 29, 17, 8, 4, 1], 'Region IX - Zamboanga Peninsula': [1, 3, 5, 10, 18, 24, 28, 27, 16, 7, 3, 1], 'Region X - Northern Mindanao': [2, 4, 6, 12, 20, 25, 27, 26, 15, 7, 3, 1], 'Region XI - Davao Region': [2, 5, 7, 13, 22, 28, 30, 29, 18, 8, 4, 2], 'Region XII - SOCCSKSARGEN': [1, 3, 5, 11, 19, 24, 26, 25, 14, 6, 2, 1], 'Region XIII - Caraga': [2, 4, 6, 12, 21, 27, 29, 28, 17, 8, 3, 1], 'NCR - National Capital Region': [1, 2, 4, 8, 15, 20, 22, 21, 12, 6, 3, 1], 'CAR - Cordillera Administrative Region': [3, 6, 9, 14, 23, 29, 33, 31, 19, 10, 5, 2], 'BARMM - Bangsamoro Autonomous Region in Muslim Mindanao': [2, 4, 6, 10, 18, 22, 25, 24, 14, 6, 3, 1] };

    // --- Chart Instantiation ---
    // const alertsChart = new Chart(document.getElementById('structureChart').getContext('2d'), { type: 'bar', data: { labels: [], datasets: [{ label: 'Alerts Issued', data: [0], backgroundColor: '#007BFF' }, { label: 'Actual Landslides', data: [0], backgroundColor: '#FF4136' }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } }, scales: { y: { beginAtZero: true } } } });
    const historyChart = new Chart(document.getElementById('roadsChart').getContext('2d'), { type: 'bar', data: { labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], datasets: [{ label: 'Landslides', data: [], backgroundColor: '#E67300' }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } } });
    const soilChart = new Chart(document.getElementById('soilPieChart').getContext('2d'), { type: 'pie', data: { labels: ['1 - Clay', '2 - Clay Loam', '3 - Sandy Loam', '4 - Loam'], datasets: [{ data: [15, 40, 20, 30], backgroundColor: ['#2ecc71', '#f1c40f', '#e67e22', '#e74c3c', '#9b59b6'] }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: true, position: 'right' } } } });
    const slopeChart = new Chart(document.getElementById('rainChart').getContext('2d'), { type: 'bar', data: { labels: ['1 - <10° Flat', '2 - 10°-20° Gentle', '3 - 20°-30° Moderate', '4 - 30°-40° Substantial', '5 - 40°-50° Steep', '6 - >50° Very Steep'], datasets: [{ label: 'Slope Vulnerability Level', data: [5, 10, 15, 20, 25, 30], backgroundColor: '#2980b9' }] }, options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true } } } });
    let agriChart; // Will be created after data loads

    // --- DATA LOADING & PROCESSING (DEBUGGING VERSION) ---
    console.log("Starting Papa.parse for datas.csv...");

    Papa.parse("../datas.csv", {
        download: true,
        header: true,
        complete: function (results) {
            console.log("1. Papa.parse complete. Raw results:", results);

            // Check if data is empty or has issues
            if (!results.data || results.data.length === 0) {
                console.error("CSV parsing resulted in no data. Check the CSV file and its structure.");
                return; // Stop execution if there's no data
            }

            allData = results.data.filter(row => {
                // Check the condition for each row to see why it might be filtered out
                const isValid = row && row.lat && row.long && row.region;
                if (!isValid) {
                    // This log is very helpful. It tells you exactly which rows are being skipped.
                    // console.log("Filtering out invalid row:", row);
                }
                return isValid;
            });
            console.log("2. Data filtered. Total valid rows:", allData.length, "rows.", "Filtered data:", allData);

            // Check if all data was filtered out
            if (allData.length === 0) {
                console.error("All rows were filtered out. Check your column names ('lat', 'long', 'region') and ensure they have values in the CSV.");
                return; // Stop if no data is left
            }

            // Convert CSV data to GeoJSON format
            geojsonData.features = allData.map(row => ({
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [parseFloat(row.long), parseFloat(row.lat)]
                },
                properties: {
                    region: row.region.trim()
                }
            }));
            console.log("3. Converted to GeoJSON:", geojsonData);

            // Check the map source
            console.log("4. Checking for map object and source 'landslide-points'...");
            // Make sure the 'map' object is not undefined!
            if (typeof map === 'undefined' || !map) {
                console.error("The 'map' object is not available at this point!");
            } else if (map.getSource('landslide-points')) {
                console.log("   Source 'landslide-points' found. Updating data.");
                map.getSource('landslide-points').setData(geojsonData);
            } else {
                console.warn("   Source 'landslide-points' NOT found. It must be added when the map 'load' event fires.");
            }

            // Update "Top Regions" chart
            const regionCounts = {};
            allData.forEach(row => {
                const region = row.region.trim();
                if (region) regionCounts[region] = (regionCounts[region] || 0) + 1;
            });
            const sortedRegions = Object.entries(regionCounts).sort((a, b) => b[1] - a[1]).slice(0, 5); // Top 5
            console.log("5. Calculated Top 5 regions for chart:", sortedRegions);

            // Check if chart element exists before creating chart
            const chartElement = document.getElementById('agriChart');
            if (!chartElement) {
                console.error("Could not find the chart canvas element with id='agriChart'!");
            } else {
                console.log("6. Creating/updating the chart.");
                // To prevent errors, destroy the old chart if it exists
                if (window.agriChart instanceof Chart) {
                    window.agriChart.destroy();
                }
                window.agriChart = new Chart(chartElement.getContext('2d'), { type: 'bar', data: { labels: sortedRegions.map(e => e[0]), datasets: [{ label: 'Landslide Points', data: sortedRegions.map(e => e[1]), backgroundColor: ['#3498db', '#1abc9c', '#9b59b6', '#e74c3c', '#f1c40f'] }] }, options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true } } } });
            }

            // Manually trigger change to show initial state
            console.log("7. Triggering 'change' event on regionSelect element.");
            if (typeof regionSelect === 'undefined' || !regionSelect) {
                console.error("The 'regionSelect' element is not defined!");
            } else {
                regionSelect.dispatchEvent(new Event('change'));
            }
        },
        error: (err, file) => {
            console.error("!!! Papa.parse ERROR:", err, file);
        }
    });


    console.log("testing");
    // --- EVENT LISTENERS ---
    const regionSelect = document.getElementById('regionSelect');
    regionSelect.addEventListener('change', function () {
        const selectedRegion = this.value;

        // Update Mapbox Filter
        if (selectedRegion === "") {
            map.setFilter('landslide-layer', null); // Show all points
        } else {
            map.setFilter('landslide-layer', ['==', ['get', 'region'], selectedRegion]);
        }

        // Update linked charts
        const regionIndexInStatic = allDataa.labels.indexOf(selectedRegion);
        if (regionIndexInStatic !== -1) {
            alertsChart.data.labels = [allDataa.labels[regionIndexInStatic]];
            alertsChart.data.datasets[0].data = [allDataa.datasets[0].data[regionIndexInStatic]];
            alertsChart.data.datasets[1].data = [allDataa.datasets[1].data[regionIndexInStatic]];
        } else {
            alertsChart.data.labels = [];
            alertsChart.data.datasets[0].data = [];
            alertsChart.data.datasets[1].data = [];
        }
        alertsChart.update();

        if (regionMonthlyData[selectedRegion]) {
            historyChart.data.datasets[0].data = regionMonthlyData[selectedRegion];
        } else {
            historyChart.data.datasets[0].data = [];
        }
        historyChart.update();
    });


    console.log("testing");

}); // End DOMContentLoaded