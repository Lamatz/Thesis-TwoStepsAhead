 // ===================================
    // FEATURE IMPORTANCE CHART DATA
    // ===================================
    const featureImportanceData = {
        labels: [
            'soil_type', 'cumulative_rainfall_3hr', 'rainfall_intensity_3hr',
            'rainfall_intensity_6hr', 'cumulative_rainfall_6hr', 'cumulative_rainfall_12hr',
            'rainfall_intensity_12hr', 'cumulative_rainfall_1d', 'soil_moisture',
            'rainfall_intensity_1d', 'rainfall_intensity_5d', 'cumulative_rainfall_5d',
            'rainfall_intensity_3d', 'cumulative_rainfall_3d', 'slope'
        ],
        datasets: [{
            label: 'Importance',
            data: [
                0.01, 0.015, 0.018, 0.02, 0.025, 0.03, 0.035,
                0.06, 0.065, 0.07, 0.075, 0.08, 0.085, 0.11, 0.295
            ],
            backgroundColor: '#006fddcc', // A color matching the navbar
            borderColor: '#006fddcc',
            borderWidth: 1
        }]
    };

    // ===================================
    // FEATURE IMPORTANCE CHART CONFIG
    // ===================================
    const featureImportanceConfig = {
        type: 'bar',
        data: featureImportanceData,
        options: {
            indexAxis: 'y', // This creates the horizontal bar chart
            responsive: true,
            maintainAspectRatio: false, // Important: Allows the chart to fill the container's height
            plugins: {
                legend: {
                    display: false // Legend is not needed here
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Importance Score'
                    },
                    min: 0,
                    max: 0.30, // Set a max value for better scale visualization
                    ticks: {
                        stepSize: 0.05
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Feature'
                    }
                }
            }
        }
    };

    // --- Render Chart ---
    const ctxfeat = document.getElementById('featureImportanceChart').getContext('2d');
    new Chart(ctxfeat, featureImportanceConfig);


    