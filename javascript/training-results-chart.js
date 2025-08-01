



// // =======================
// // RECALL CHART
// // =======================
// // X-axis values (number of training examples)
// const x_values = [180, 360, 540, 720, 900, 1080, 1260, 1440, 1620, 1800];

// // Y-axis values for the 'Training Recall' line
// const y_train_recall = [0.99, 0.998, 0.995, 0.995, 0.998, 0.998, 0.995, 0.998, 0.998, 0.995];

// // Y-axis values for the 'Test Recall' line (the mean)
// const y_test_recall_mean = [0.50, 0.53, 0.825, 0.825, 0.89, 0.91, 0.915, 0.915, 0.915, 0.91];

// // Estimated standard deviation for the test recall shaded area
// const y_test_recall_std = [0.08, 0.08, 0.135, 0.125, 0.09, 0.07, 0.065, 0.065, 0.065, 0.06];

// // --- Prepare Data for Chart.js ---
// // Map the raw data into {x, y} points for a linear scale chart
// const trainingData = x_values.map((val, i) => ({ x: val, y: y_train_recall[i] }));
// const testMeanData = x_values.map((val, i) => ({ x: val, y: y_test_recall_mean[i] }));

// // Calculate the upper and lower bounds for the shaded area
// const testLowerBoundData = x_values.map((val, i) => ({ x: val, y: y_test_recall_mean[i] - y_test_recall_std[i] }));
// const testUpperBoundData = x_values.map((val, i) => ({ x: val, y: y_test_recall_mean[i] + y_test_recall_std[i] }));

// // --- Chart Configuration ---
// const config = {
//     type: 'line',
//     data: {
//         datasets: [
//             // Dataset 0: Training Recall (Red Line)
//             {
//                 label: 'Training Recall',
//                 data: trainingData,
//                 borderColor: '#e41a1c', // A strong red color
//                 backgroundColor: '#e41a1c',
//                 fill: false,
//                 tension: 0, // Straight lines between points
//                 pointRadius: 4,
//                 pointHoverRadius: 6,
//             },
//             // Dataset 1: Test Recall (Blue Line)
//             {
//                 label: 'Test Recall',
//                 data: testMeanData,
//                 borderColor: '#377eb8', // A clear blue color
//                 backgroundColor: '#377eb8',
//                 fill: false,
//                 tension: 0, // Straight lines between points
//                 pointRadius: 4,
//                 pointHoverRadius: 6,
//             },
//             // Dataset 2: Lower bound of the shaded area (hidden)
//             {
//                 data: testLowerBoundData,
//                 borderColor: 'transparent',
//                 pointRadius: 0,
//             },
//             // Dataset 3: Upper bound of the shaded area (fills down to the lower bound)
//             {
//                 data: testUpperBoundData,
//                 borderColor: 'transparent',
//                 backgroundColor: 'rgba(55, 126, 184, 0.2)', // Light, transparent blue
//                 pointRadius: 0,
//                 fill: 2, // Fill to dataset at index 2 (the lower bound)
//             }
//         ]
//     },
//     options: {
//         responsive: true,
//         maintainAspectRatio: true,
//         plugins: {
//             title: {
//                 display: true,
//                 text: 'Learning Curve for Recall (Training vs Test)',
//                 font: {
//                     size: 18,
//                     weight: 'bold'
//                 },
//                 padding: {
//                     bottom: 20
//                 }
//             },
//             legend: {
//                 position: 'bottom',
//                 align: 'end',
//                 labels: {
//                     // This filter function hides the datasets used for the shaded area from the legend
//                     filter: (legendItem) => {
//                         return legendItem.datasetIndex < 2;
//                     }
//                 }
//             }
//         },
//         scales: {
//             x: {
//                 type: 'linear',
//                 title: {
//                     display: true,
//                     text: 'Training Examples',
//                     font: { size: 14 }
//                 },
//                 min: 0,
//                 max: 1900,
//                 grid: {
//                     color: '#e0e0e0' // Lighter grid lines
//                 }
//             },
//             y: {
//                 title: {
//                     display: true,
//                     text: 'Recall Score',
//                     font: { size: 14 }
//                 },
//                 min: 0.4,
//                 max: 1.05,
//                 grid: {
//                     color: '#e0e0e0'
//                 }
//             }
//         }
//     }
// };

// // --- Render Chart ---
// const ctx = document.getElementById('learningCurveChart').getContext('2d');
// new Chart(ctx, config);










// // =======================
// // MATRIX CHART
// // =======================

// const matrixData = [
//     { x: '0', y: '0', v: 312 }, // True Negative
//     { x: '1', y: '0', v: 30 },  // False Positive
//     { x: '0', y: '1', v: 28 },  // False Negative
//     { x: '1', y: '1', v: 313 }   // True Positive
// ];

// // --- Helper Functions for Styling ---
// const values = matrixData.map(d => d.v);
// const minValue = Math.min(...values);
// const maxValue = Math.max(...values);

// // This function creates a color from light blue to dark blue based on the cell value
// function getBackgroundColor(value) {
//     const ratio = (value - minValue) / (maxValue - minValue);
//     // We interpolate from a very light blue (hsl(210, 80%, 95%)) to a dark blue (hsl(210, 80%, 25%))
//     const lightness = 95 - (ratio * 70);
//     return `hsl(210, 80%, ${lightness}%)`;
// }

// // This function returns 'white' for dark backgrounds and 'black' for light ones
// function getTextColor(value) {
//     const threshold = minValue + (maxValue - minValue) / 2;
//     return value > threshold ? '#FFFFFF' : '#000000';
// }

// // --- Chart Configuration ---
// const config1 = {
//     type: 'matrix',
//     data: {
//         datasets: [{
//             label: 'Confusion Matrix',
//             data: matrixData,
//             // Use our helper function to set the background color for each cell
//             backgroundColor: (context) => getBackgroundColor(context.dataset.data[context.dataIndex].v),
//             borderColor: 'rgba(255, 255, 255, 0.5)',
//             borderWidth: 2,
//             // Set cell dimensions
//             width: ({ chart }) => (chart.chartArea || {}).width / chart.scales.x.getLabels().length,
//             height: ({ chart }) => (chart.chartArea || {}).height / chart.scales.y.getLabels().length,
//         }]
//     },
//     options: {
//         responsive: true,
//         maintainAspectRatio: true,
//         plugins: {
//             title: {
//                 display: true,
//                 text: 'Confusion Matrix',
//                 font: { size: 20 },
//                 padding: { bottom: 20 }
//             },
//             legend: {
//                 display: false // A legend is not needed for a confusion matrix
//             },
//             tooltip: {
//                 enabled: false // Tooltips are redundant since values are displayed
//             },
//             // Configure the datalabels plugin
//             datalabels: {
//                 display: true,
//                 // Use our helper function to set the text color
//                 color: (context) => getTextColor(context.dataset.data[context.dataIndex].v),
//                 // Display the 'v' property from our data object
//                 formatter: (value) => value.v,
//                 font: {
//                     size: 18,
//                     weight: 'bold'
//                 }
//             }
//         },
//         scales: {
//             x: {
//                 type: 'category',
//                 labels: ['0', '1'],
//                 position: 'bottom',
//                 title: {
//                     display: true,
//                     text: 'Predicted',
//                     font: { size: 14 }
//                 },
//                 grid: {
//                     display: true // Hide grid lines
//                 }
//             },
//             y: {
//                 type: 'category',
//                 labels: ['0', '1'],
//                 title: {
//                     display: true,
//                     text: 'Actual',
//                     font: { size: 14 }
//                 },
//                 // Reverse the axis to put '0' at the top
//                 reverse: true,
//                 grid: {
//                     display: false // Hide grid lines
//                 }
//             }
//         }
//     },
//     // Register the datalabels plugin
//     plugins: [ChartDataLabels]
// };

// // --- Render Chart ---
// const ctx1 = document.getElementById('confusionMatrixChart').getContext('2d');
// new Chart(ctx1, config1);



// console.log("Matrix chart printed")



// // =======================
// // ROC CHART
// // =======================
// const rocData = {
//     fold1: [
//         { x: 0, y: 0 }, { x: 0.01, y: 0.6 }, { x: 0.04, y: 0.7 }, { x: 0.08, y: 0.8 },
//         { x: 0.12, y: 0.88 }, { x: 0.2, y: 0.94 }, { x: 0.3, y: 0.98 }, { x: 0.4, y: 0.99 }, { x: 1, y: 1 }
//     ],
//     fold2: [
//         { x: 0, y: 0 }, { x: 0.02, y: 0.62 }, { x: 0.06, y: 0.68 }, { x: 0.1, y: 0.75 },
//         { x: 0.18, y: 0.86 }, { x: 0.25, y: 0.92 }, { x: 0.4, y: 0.98 }, { x: 0.5, y: 1 }, { x: 1, y: 1 }
//     ],
//     fold3: [
//         { x: 0, y: 0 }, { x: 0.01, y: 0.65 }, { x: 0.05, y: 0.78 }, { x: 0.1, y: 0.85 },
//         { x: 0.15, y: 0.94 }, { x: 0.2, y: 0.98 }, { x: 0.3, y: 1 }, { x: 1, y: 1 }
//     ],
//     fold4: [
//         { x: 0, y: 0 }, { x: 0.03, y: 0.68 }, { x: 0.08, y: 0.74 }, { x: 0.15, y: 0.82 },
//         { x: 0.2, y: 0.9 }, { x: 0.25, y: 0.95 }, { x: 0.35, y: 0.99 }, { x: 0.4, y: 1 }, { x: 1, y: 1 }
//     ],
//     fold5: [
//         { x: 0, y: 0 }, { x: 0.01, y: 0.7 }, { x: 0.05, y: 0.8 }, { x: 0.12, y: 0.88 },
//         { x: 0.2, y: 0.95 }, { x: 0.35, y: 0.99 }, { x: 0.45, y: 1 }, { x: 1, y: 1 }
//     ],
// };

// // --- Chart Configuration ---
// const config2 = {
//     type: 'line',
//     data: {
//         datasets: [
//             {
//                 label: 'Fold 1 (AUC = 0.95)',
//                 data: rocData.fold1,
//                 borderColor: '#377eb8', // Blue
//                 stepped: true, // Creates the step-like line
//                 fill: false,
//                 pointRadius: 0, // Hides the points
//                 borderWidth: 2
//             },
//             {
//                 label: 'Fold 2 (AUC = 0.94)',
//                 data: rocData.fold2,
//                 borderColor: '#ff7f00', // Orange
//                 stepped: true,
//                 fill: false,
//                 pointRadius: 0,
//                 borderWidth: 2
//             },
//             {
//                 label: 'Fold 3 (AUC = 0.96)',
//                 data: rocData.fold3,
//                 borderColor: '#4daf4a', // Green
//                 stepped: true,
//                 fill: false,
//                 pointRadius: 0,
//                 borderWidth: 2
//             },
//             {
//                 label: 'Fold 4 (AUC = 0.95)',
//                 data: rocData.fold4,
//                 borderColor: '#e41a1c', // Red
//                 stepped: true,
//                 fill: false,
//                 pointRadius: 0,
//                 borderWidth: 2
//             },
//             {
//                 label: 'Fold 5 (AUC = 0.95)',
//                 data: rocData.fold5,
//                 borderColor: '#984ea3', // Purple
//                 stepped: true,
//                 fill: false,
//                 pointRadius: 0,
//                 borderWidth: 2
//             },
//             {
//                 label: 'Random Guess',
//                 data: [{ x: 0, y: 0 }, { x: 1, y: 1 }],
//                 borderColor: '#000000',
//                 borderDash: [5, 5], // Creates the dashed line
//                 fill: false,
//                 pointRadius: 0,
//                 borderWidth: 2
//             }
//         ]
//     },
//     options: {
//         responsive: true,
//         maintainAspectRatio: true,
//         aspectRatio: 1, // Makes the plot area square
//         plugins: {
//             title: {
//                 display: true,
//                 text: 'ROC Curve per Fold',
//                 font: { size: 18, weight: 'bold' },
//                 padding: { bottom: 15 }
//             },
//             legend: {
//                 position: 'bottom',
//                 align: 'center'
//             }
//         },
//         scales: {
//             x: {
//                 type: 'linear',
//                 position: 'bottom',
//                 min: -0.05,
//                 max: 1.05,
//                 title: {
//                     display: true,
//                     text: '1 - Specificity (False Positive Rate)',
//                     font: { size: 14 }
//                 }
//             },
//             y: {
//                 type: 'linear',
//                 min: -0.05,
//                 max: 1.05,
//                 title: {
//                     display: true,
//                     text: 'Sensitivity (True Positive Rate)',
//                     font: { size: 14 }
//                 }
//             }
//         }
//     }
// };

// // --- Render Chart ---
// const ctx2 = document.getElementById('rocCurveChart').getContext('2d');
// new Chart(ctx2, config2);



// ===================================
// FEATURE IMPORTANCE CHART DATA
// ===================================
// This is the data object for the bar chart.
// It contains the labels for the y-axis and a dataset for the x-axis values.
const featureImportanceData = {
    labels: [
        'soil_type',
        'cumulative_rainfall_3hr',
        'rainfall_intensity_3hr',
        'rainfall_intensity_6hr',
        'cumulative_rainfall_6hr',
        'cumulative_rainfall_12hr',
        'rainfall_intensity_12hr',
        'cumulative_rainfall_1d',
        'soil_moisture',
        'rainfall_intensity_1d',
        'rainfall_intensity_5d',
        'cumulative_rainfall_5d',
        'rainfall_intensity_3d',
        'cumulative_rainfall_3d',
        'slope'
    ],
    datasets: [{
        label: 'Importance', // This label is for the legend, which is hidden in this config.
        data: [
            0.01, 0.015, 0.018, 0.02, 0.025, 0.03, 0.035,
            0.06, 0.065, 0.07, 0.075, 0.08, 0.085, 0.11, 0.295
        ],
        backgroundColor: 'rgba(60, 122, 153, 1)',
        borderColor: 'rgba(60, 122, 153, 1)',
        borderWidth: 1
    }]
};


console.log("testing chart");
// ===================================
// FEATURE IMPORTANCE CHART CONFIG
// ===================================
// This is the main configuration object, similar to your `config2`.
const featureImportanceConfig = {
    type: 'bar', // The type of chart
    data: featureImportanceData, // Link to the data object above
    options: {
        // This is the key option for creating a horizontal bar chart
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false, // Allows chart to fill container height
        plugins: {
            title: {
                display: true,
                text: 'Random Forest Feature Importance',
                font: { size: 16 }
            },
            legend: {
                // We hide the legend as the axes are self-explanatory
                display: false
            }
        },
        scales: {
            x: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Importance'
                },
                min: 0,
                max: 0.30,
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

console.log("testing chart 1");
// --- Render Chart ---
// Get the canvas element's context and create the new chart instance.
const ctxfeat = document.getElementById('featureImportanceChart').getContext('2d');
new Chart(ctxfeat, featureImportanceConfig);

console.log("testing chart 2");




// The JSON configuration from above goes here
const classificationConfig = {
    "type": "bar",
    "data": {
        "labels": [
            "Class 0 (Support: 304)",
            "Class 1 (Support: 386)",
            "Macro Avg (Support: 618)",
            "Weighted Avg (Support: 618)"
        ],
        "datasets": [
            {
                "label": "Precision",
                "data": [
                    0.88,
                    0.93,
                    0.91,
                    0.91
                ],
                "backgroundColor": "rgba(54, 162, 235, 0.6)",
                "borderColor": "rgba(54, 162, 235, 1)",
                "borderWidth": 1
            },
            {
                "label": "Recall",
                "data": [
                    0.94,
                    0.88,
                    0.91,
                    0.91
                ],
                "backgroundColor": "rgba(75, 192, 192, 0.6)",
                "borderColor": "rgba(75, 192, 192, 1)",
                "borderWidth": 1
            },
            {
                "label": "F1-Score",
                "data": [
                    0.91,
                    0.90,
                    0.91,
                    0.91
                ],
                "backgroundColor": "rgba(255, 99, 132, 0.6)",
                "borderColor": "rgba(255, 99, 132, 1)",
                "borderWidth": 1
            }
        ]
    },
    "options": {
        "responsive": true,
        "plugins": {
            "title": {
                "display": true,
                "text": "Classification Report",
                "font": {
                    "size": 18
                }
            },
            "subtitle": {
                "display": true,
                "text": "Overall Accuracy: 0.91",
                "padding": {
                    "bottom": 15
                },
                "font": {
                    "size": 14,
                    "style": "italic"
                }
            },
            "legend": {
                "position": "top"
            }
        },
        "scales": {
            "y": {
                "beginAtZero": true,
                "max": 1.0,
                "title": {
                    "display": true,
                    "text": "Score"
                }
            },
            "x": {
                "title": {
                    "display": true,
                    "text": "Metric by Class"
                }
            }
        }
    }
};

// --- Render Chart ---
const ctxReport = document.getElementById('classificationReportChart').getContext('2d');
new Chart(ctxReport, classificationConfig);