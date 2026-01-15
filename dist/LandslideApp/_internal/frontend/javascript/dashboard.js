document.addEventListener('DOMContentLoaded', function () {

    // --- 1. CONFIGURATION & CONSTANTS ---
    const CONFIG = {
        mapboxToken: 'pk.eyJ1IjoibGFtYXR6IiwiYSI6ImNtZDczb3pyNDA1am8ya3M4czB3bjVocXIifQ.tNJchBN53I2HcuIGXJMmTQ',
        mapboxStyle: 'mapbox://styles/lamatz/cmcvi5j5g00g601sr0rva51xp',
        csvUrl: '../csv/complete_landslide_1.csv',
        philippinesBounds: [[116.0, 4.0], [127.0, 21.0]],
        colors: {
            default: '#aaaaaa',
            highlight: '#FF6384',
            primary: '#E67300',
            secondary: '#4BC0C0',
            mapSteps: [
                ['#aaaaaa'], // Default/Older
                [2014, '#FDB813'],
                [2019, '#F26522'],
                [2022, '#D93B24'],
                [2024, '#B30000']
            ]
        },
        months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        fullMonths: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    };

    // --- 2. STATE MANAGEMENT ---
    const state = {
        rawData: [],      // Cleaned data objects
        geoJson: { type: 'FeatureCollection', features: [] },
        filters: {
            region: '',
            year: null,
            month: null // Stores index (0-11) or null
        }
    };

    // --- 3. INITIALIZATION (MAP & CHARTS) ---
    mapboxgl.accessToken = CONFIG.mapboxToken;

    const map = new mapboxgl.Map({
        container: 'map',
        style: CONFIG.mapboxStyle,
        center: [121.7740, 12.8797],
        zoom: 5,
        maxBounds: CONFIG.philippinesBounds,
        antialias: true
    });
    map.addControl(new mapboxgl.NavigationControl());

    const popup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false });

    // Chart References
    let historyChartMonthly;
    let historyChartYearly;
    let topRegionsChart;

    initializeCharts();

    // --- 4. DATA LOADING & PROCESSING ---
    Papa.parse(CONFIG.csvUrl, {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: function (results) {
            processRawData(results.data);
            initMapLayers();
            updateVisuals(); // Initial Render
        },
        error: (err) => console.error("CSV Parse Error:", err)
    });

    /**
     * cleans and formats raw CSV data into state.rawData
     */
    function processRawData(data) {
        state.rawData = data.map(row => {
            // Basic Validation
            if (!row.region) return null;

            // Date Parsing
            let year = null;
            let monthIndex = null;
            let dateStr = row.date || 'N/A';

            if (row.date) {
                const parts = row.date.split('/'); // Assumes DD/MM/YYYY
                if (parts.length === 3) {
                    year = parseInt(parts[2], 10);
                    monthIndex = parseInt(parts[1], 10) - 1;
                }
            }

            // GeoJSON Feature Construction
            if (row.lat && row.long) {
                state.geoJson.features.push({
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: [parseFloat(row.long), parseFloat(row.lat)]
                    },
                    properties: {
                        region: row.region.trim(),
                        date: dateStr,
                        year: year || 0,
                        month: monthIndex
                    }
                });
            }

            // Return cleaned object
            return {
                region: row.region.trim(),
                lat: row.lat,
                long: row.long,
                date: dateStr,
                year: year,
                monthIndex: monthIndex
            };
        }).filter(item => item !== null && item.year !== null && item.monthIndex >= 0 && item.monthIndex < 12);

        // Initial Top Regions Chart (Static based on total data)
        renderTopRegionsChart();
    }

    // --- 5. MAP SETUP ---
    function initMapLayers() {
        map.on('load', () => {
            map.addSource('landslide-points', { type: 'geojson', data: state.geoJson });

            // Construct dynamic color expression from CONFIG
            const colorExpression = ['step', ['to-number', ['get', 'year']]];
            CONFIG.colors.mapSteps.forEach(step => {
                if (step.length === 2) { colorExpression.push(step[0]); colorExpression.push(step[1]); }
                else { colorExpression.push(step[0]); }
            });

            map.addLayer({
                id: 'landslide-layer',
                type: 'circle',
                source: 'landslide-points',
                paint: {
                    'circle-radius': 6,
                    'circle-color': colorExpression,
                    'circle-stroke-color': 'white',
                    'circle-stroke-width': 1,
                    'circle-opacity': 0.8
                }
            });

            // Mouse Events
            map.on('mouseenter', 'landslide-layer', (e) => {
                map.getCanvas().style.cursor = 'pointer';
                const coords = e.features[0].geometry.coordinates.slice();
                const props = e.features[0].properties;

                while (Math.abs(e.lngLat.lng - coords[0]) > 180) {
                    coords[0] += e.lngLat.lng > coords[0] ? 360 : -360;
                }

                popup.setLngLat(coords)
                    .setHTML(`<strong>Region:</strong> ${props.region}<br><strong>Date:</strong> ${props.date}`)
                    .addTo(map);
            });

            map.on('mouseleave', 'landslide-layer', () => {
                map.getCanvas().style.cursor = '';
                popup.remove();
            });
        });
    }

    // --- 6. CHART INITIALIZATION ---
    function initializeCharts() {
        // Monthly Chart
        const ctxMonth = document.getElementById('roadsChart').getContext('2d');
        historyChartMonthly = new Chart(ctxMonth, {
            type: 'bar',
            data: {
                labels: CONFIG.months,
                datasets: [{ label: 'Landslides', data: [], backgroundColor: CONFIG.colors.primary }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                onHover: (e, el) => e.native.target.style.cursor = el.length ? 'pointer' : 'default',
                onClick: (e, elements) => {
                    if (!elements.length) return;
                    const index = elements[0].index;

                    // Toggle Filter
                    if (state.filters.month === index) {
                        state.filters.month = null;
                    } else {
                        state.filters.month = index;
                        state.filters.year = null; // Clear year if month selected
                    }
                    updateVisuals();
                }
            }
        });

        // Yearly Chart
        const ctxYear = document.getElementById('structureChart').getContext('2d');
        historyChartYearly = new Chart(ctxYear, {
            type: 'bar',
            data: { labels: [], datasets: [{ label: 'Landslides per Year', data: [], backgroundColor: CONFIG.colors.secondary }] },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { y: { ticks: { precision: 0 } } },
                onHover: (e, el) => e.native.target.style.cursor = el.length ? 'pointer' : 'default',
                onClick: (e, elements) => {
                    if (!elements.length) return;
                    const index = elements[0].index;
                    const year = parseInt(historyChartYearly.data.labels[index]);

                    // Toggle Filter
                    if (state.filters.year === year) {
                        state.filters.year = null;
                    } else {
                        state.filters.year = year;
                        state.filters.month = null; // Clear month if year selected
                    }
                    updateVisuals();
                }
            }
        });
    }

    function renderTopRegionsChart() {
        const counts = {};
        state.rawData.forEach(r => counts[r.region] = (counts[r.region] || 0) + 1);
        const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);

        const ctx = document.getElementById('agriChart').getContext('2d');
        topRegionsChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: sorted.map(i => i[0]),
                datasets: [{ label: 'Total Incidents', data: sorted.map(i => i[1]), backgroundColor: ['#3498db', '#1abc9c', '#9b59b6', '#e74c3c', '#f1c40f'] }]
            },
            options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
        });
    }

    // --- 7. CORE LOGIC: UPDATE VISUALS ---
    function updateVisuals() {
        const { region, year, month } = state.filters;

        // 1. Update Map Filter
        if (map.getLayer('landslide-layer')) {
            // We start with 'all', which means ALL conditions must be true
            const activeFilters = ['all'];

            // Condition 1: Region
            if (region) {
                activeFilters.push(['==', ['get', 'region'], region]);
            }

            // Condition 2: Year
            if (year !== null) {
                activeFilters.push(['==', ['get', 'year'], year]);
            }

            // Condition 3: Month
            if (month !== null) {
                // Note: We use the 'month' property we added in Step 1
                activeFilters.push(['==', ['get', 'month'], month]);
            }

            // If we have added any conditions to 'all', apply them. 
            // Otherwise, pass null to show everything.
            const finalFilter = activeFilters.length > 1 ? activeFilters : null;

            map.setFilter('landslide-layer', finalFilter);
            
            if (region === '' && year === null && month === null) {
                map.flyTo({ center: [121.7740, 12.8797], zoom: 5 });
            }
        }

        // 2. Prepare Data for Charts
        // We need two distinct datasets:
        // A: Data to show in Yearly Chart (Filtered by Region + Month, ignoring Year)
        // B: Data to show in Monthly Chart (Filtered by Region + Year, ignoring Month)

        const dataForYearlyChart = state.rawData.filter(d => {
            const regionMatch = region === '' || d.region === region;
            const monthMatch = month === null || d.monthIndex === month;
            return regionMatch && monthMatch;
        });

        const dataForMonthlyChart = state.rawData.filter(d => {
            const regionMatch = region === '' || d.region === region;
            const yearMatch = year === null || d.year === year;
            return regionMatch && yearMatch;
        });

        // 3. Aggregate Data
        const yearlyCounts = {};
        dataForYearlyChart.forEach(d => yearlyCounts[d.year] = (yearlyCounts[d.year] || 0) + 1);

        const monthlyCounts = Array(12).fill(0);
        dataForMonthlyChart.forEach(d => monthlyCounts[d.monthIndex]++);

        // 4. Update Yearly Chart UI
        const sortedYears = Object.keys(yearlyCounts).sort();
        historyChartYearly.data.labels = sortedYears;
        historyChartYearly.data.datasets[0].data = sortedYears.map(y => yearlyCounts[y]);
        historyChartYearly.data.datasets[0].backgroundColor = sortedYears.map(y => parseInt(y) === year ? CONFIG.colors.highlight : CONFIG.colors.secondary);
        historyChartYearly.update();

        // 5. Update Monthly Chart UI
        historyChartMonthly.data.datasets[0].data = monthlyCounts;
        historyChartMonthly.data.datasets[0].backgroundColor = CONFIG.months.map((m, i) => i === month ? CONFIG.colors.highlight : CONFIG.colors.primary);
        historyChartMonthly.update();

        // 6. Update Headers
        document.getElementById("yearly-chart-header-title").textContent = month !== null
            ? `Landslides in ${CONFIG.fullMonths[month]} (by Year)`
            : 'History of All Landslides (Yearly)';

        document.getElementById("monthly-chart-header-title").textContent = year !== null
            ? `Monthly Landslides in ${year}`
            : 'History of All Landslides (Monthly)';

        // 7. Toggle Reset Button
        const resetBtn = document.getElementById('resetFilters');
        if (resetBtn) resetBtn.style.display = (year || month !== null || region) ? 'flex' : 'none';
    }

    // --- 8. DOM EVENT LISTENERS ---
    const regionSelect = document.getElementById('regionSelect');
    if (regionSelect) {
        regionSelect.addEventListener('change', (e) => {
            state.filters.region = e.target.value;
            // Optional: Clear other filters on region change? 
            // state.filters.year = null; state.filters.month = null; 
            updateVisuals();
        });
    }

    const resetButton = document.getElementById('resetFilters');
    if (resetButton) {
        resetButton.addEventListener('click', () => {
            state.filters.region = '';
            state.filters.year = null;
            state.filters.month = null;
            if (regionSelect) regionSelect.value = '';
            updateVisuals();
        });
    }
});