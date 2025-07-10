
      // Data for all regions
      const allDataa = { // Renamed to allDataa to avoid conflict with the CSV data variable 'allData'
        labels: [
            'Region I - Ilocos Region', 'Region II - Cagayan Valley', 'Region III - Central Luzon',
            'Region IV-A - CALABARZON', 'Region IV-B - MIMAROPA', 'Region V - Bicol Region',
            'Region VI - Western Visayas', 'Region VII - Central Visayas', 'Region VIII - Eastern Visayas',
            'Region IX - Zamboanga Peninsula', 'Region X - Northern Mindanao', 'Region XI - Davao Region',
            'Region XII - SOCCSKSARGEN', 'Region XIII - Caraga', 'NCR - National Capital Region',
            'CAR - Cordillera Administrative Region', 'BARMM - Bangsamoro Autonomous Region in Muslim Mindanao'
        ],
        datasets: [
            {
                label: 'Alerts Issued',
                // Sample data - replace with actual data if available
                data: [10, 15, 12, 8, 13, 7, 9, 14, 6, 11, 10, 13, 15, 12, 14, 9, 16],
                backgroundColor: '#007BFF'
            },
            {
                label: 'Actual Landslides',
                 // Sample data - replace with actual data if available
                data: [8, 16, 10, 12, 9, 10, 8, 13, 7, 15, 14, 11, 9, 10, 13, 8, 12],
                backgroundColor: '#FF4136'
            }
        ]
      };

      // Create chart for Structures Exposed to Landslides (Renamed/Repurposed to Alerts vs Actual for the tutorial)
      const ctxAlerts = document.getElementById('structureChart').getContext('2d'); // Changed ctx name
      const alertsChart = new Chart(ctxAlerts, { // Changed chart variable name
        type: 'bar',
        data: {
            labels: [],  // Empty initially, will show selected region
            datasets: [
                {
                    label: 'Alerts Issued',
                    data: [0], // Initial empty data
                    backgroundColor: '#007BFF'
                },
                {
                    label: 'Actual Landslides',
                    data: [0], // Initial empty data
                    backgroundColor: '#FF4136'
                }
            ]
        },
        options: {
            plugins: { legend: { position: 'top' } },
            scales: { y: { beginAtZero: true } }
        }
      });


      // Sample monthly landslide data for each region
      const regionMonthlyData = {
        'Region I - Ilocos Region': [3, 5, 12, 20, 35, 42, 50, 45, 30, 15, 8, 4],
        'Region II - Cagayan Valley': [2, 4, 8, 15, 25, 30, 38, 35, 25, 12, 6, 3],
        'Region III - Central Luzon': [1, 3, 6, 10, 18, 25, 30, 28, 20, 10, 5, 2],
        'Region IV-A - CALABARZON': [4, 6, 10, 18, 28, 35, 40, 38, 25, 14, 7, 3],
        'Region IV-B - MIMAROPA': [2, 3, 7, 12, 22, 30, 34, 32, 20, 9, 4, 2],
        'Region V - Bicol Region': [3, 5, 9, 16, 26, 33, 37, 35, 22, 11, 6, 3],
        'Region VI - Western Visayas': [2, 4, 6, 14, 24, 28, 32, 31, 19, 10, 5, 2],
        'Region VII - Central Visayas': [3, 5, 8, 13, 21, 27, 29, 28, 18, 9, 4, 2],
        'Region VIII - Eastern Visayas': [2, 4, 7, 11, 20, 26, 30, 29, 17, 8, 4, 1],
        'Region IX - Zamboanga Peninsula': [1, 3, 5, 10, 18, 24, 28, 27, 16, 7, 3, 1],
        'Region X - Northern Mindanao': [2, 4, 6, 12, 20, 25, 27, 26, 15, 7, 3, 1],
        'Region XI - Davao Region': [2, 5, 7, 13, 22, 28, 30, 29, 18, 8, 4, 2],
        'Region XII - SOCCSKSARGEN': [1, 3, 5, 11, 19, 24, 26, 25, 14, 6, 2, 1],
        'Region XIII - Caraga': [2, 4, 6, 12, 21, 27, 29, 28, 17, 8, 3, 1],
        'NCR - National Capital Region': [1, 2, 4, 8, 15, 20, 22, 21, 12, 6, 3, 1],
        'CAR - Cordillera Administrative Region': [3, 6, 9, 14, 23, 29, 33, 31, 19, 10, 5, 2],
        'BARMM - Bangsamoro Autonomous Region in Muslim Mindanao': [2, 4, 6, 10, 18, 22, 25, 24, 14, 6, 3, 1]
      };


    // History of Landslides Occurence (Monthly) Chart
    const ctxHistory = document.getElementById('roadsChart').getContext('2d'); // Changed ctx name
    const historyChart = new Chart(ctxHistory, { // Changed chart variable name
      type: 'bar',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun','Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        datasets: [{
          label: 'Landslides',
          data: [], // Initially empty or regionMonthlyData['Region I']
          backgroundColor: '#E67300'
        }]
      },
      options: {
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } }
      }
    });


    // Soil Vulnerability Pie Chart (Static Data)
    const ctxSoil = document.getElementById('soilPieChart').getContext('2d'); // Changed ctx name
    const soilChart = new Chart(ctxSoil, { // Changed chart variable name
      type: 'pie',
      data: {
        labels: ['1 - Sandy Loam', '2 - Loam', '3 - Clay Loam', '4 - Sandy Clay Loam', '5 - Clay'],
        datasets: [{
          data: [10, 15, 35, 20, 40], // Static data
          backgroundColor: ['#2ecc71', '#f1c40f', '#e67e22', '#e74c3c', '#9b59b6']
        }]
      },
       options: {
          plugins: { legend: { display: true, position: 'right' } }, // Show legend
       }
    });


    // Slope Type Vulnerabilities Bar Chart (Static Data)
    const ctxSlope = document.getElementById('rainChart').getContext('2d'); // Changed ctx name
    const slopeChart = new Chart(ctxSlope, { // Changed chart variable name
      type: 'bar',
      data: {
        labels: [
          '1 - <10° Flat',
          '2 - 10°-20° Gentle Slope',
          '3 - 20°-30° Moderate Slope',
          '4 - 30°-40° Substantial Slope',
          '5 - 40°-50° Steep Slope',
          '6 - >50° Very Steep Slope'
        ],
        datasets: [{
          label: 'Slope Vulnerability Level',
          data: [5, 10, 15, 20, 25 , 30], // Static data
          backgroundColor: '#2980b9'
        }]
      },
      options: {
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } }
      }
    });






      // --- --- --- MODIFIED PAPAPARSE CALL --- --- ---
      Papa.parse("datas.csv", {
        download: true,
        header: true, // <--- KEEPING true
        complete: function(results) {
          allData = results.data; // Store parsed CSV data (now array of objects)

          // Filter out potentially empty rows at the end of the CSV if any
          allData = allData.filter(row => row && row.lat && row.long && row.region);

          console.log("CSV data loaded and filtered:", allData); // Check the structure now


          const regionSelect = document.getElementById('regionSelect');

          // Handle Region Select change for heatmap update and linked charts
          if (regionSelect) { // Check if the element exists
               regionSelect.addEventListener('change', function() {
                  console.log("Region selected:", this.value);
                  updateHeatmap(this.value); // Update heatmap based on selection

                   // Update the Alerts vs Actual chart (still uses static data 'allDataa')
                  const selectedRegion = this.value;
                  const regionIndexInStatic = allDataa.labels.indexOf(selectedRegion); // Index in static labels

                  if (regionIndexInStatic !== -1) {
                      alertsChart.data.labels = [allDataa.labels[regionIndexInStatic]];
                      alertsChart.data.datasets[0].data = [allDataa.datasets[0].data[regionIndexInStatic]];
                      alertsChart.data.datasets[1].data = [allDataa.datasets[1].data[regionIndexInStatic]];
                  } else {
                       // If "Choose Region" or not found, clear this chart
                      alertsChart.data.labels = [];
                      alertsChart.data.datasets[0].data = [];
                      alertsChart.data.datasets[1].data = [];
                  }
                  alertsChart.update();


                  // Update the Monthly History chart (still uses static data 'regionMonthlyData')
                  if (regionMonthlyData[selectedRegion]) {
                      historyChart.data.datasets[0].data = regionMonthlyData[selectedRegion];
                  } else {
                      // If "Choose Region" or not found, clear this chart
                      historyChart.data.datasets[0].data = [];
                  }
                  historyChart.update();

            });

             // Manually trigger the change event to load initial data for charts linked to dropdown
             // and the heatmap for the default empty selected value
             regionSelect.dispatchEvent(new Event('change'));
          } else {
               console.error("Region select element with ID 'regionSelect' not found!");
          }


          // --- --- --- MODIFIED AGRI CHART LOGIC --- --- ---
          // Update agriChart (Top 3 regions with highest landslide counts) based on CSV data
          const regionCounts = {};

          // Count how many points per region from the loaded CSV data
          allData.forEach(function(row) { // No index needed
            // Use the correct lowercase header name 'region'
            const region = row.region;

            // Ensure region is a non-empty string
            if (typeof region === 'string' && region.trim() !== '') {
               // Use region.trim() to remove leading/trailing whitespace
              const cleanedRegion = region.trim();
              regionCounts[cleanedRegion] = (regionCounts[cleanedRegion] || 0) + 1;
            } else {
                 // console.warn(`Skipping row for counting due to missing region:`, row); // Debugging
            }
          });

          // Convert object into an array of [region, count]
          const sortedRegions = Object.entries(regionCounts)
            .sort((a, b) => b[1] - a[1]) // Sort descending by count
            .slice(0, 3); // Get top 3

          const topRegions = sortedRegions.map(entry => entry[0]);
          const topCounts = sortedRegions.map(entry => entry[1]);

           console.log("Top 3 Regions Data:", sortedRegions); // Debug: check the data for the chart


          // Find the agriChart instance and update its data
          const ctxAgri = document.getElementById('agriChart').getContext('2d');
          // Check if the chart instance already exists before creating a new one (important if CSV loads multiple times)
          // However, PapaParse 'complete' should only run once per parse.
          // Let's assume it's the first time and create it.
          const agriChart = new Chart(ctxAgri, { // Storing chart instance
              type: 'bar',
              data: {
                labels: topRegions, // Use calculated top regions
                datasets: [{
                  label: 'Landslide Points', // Label
                  data: topCounts, // Use calculated counts
                  backgroundColor: ['#3498db', '#1abc9c', '#9b59b6'] // Example colors
                }]
              },
              options: {
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true } }
              }
          });

           // This chart is populated based on ALL data from the CSV, not the selected region,
           // so it doesn't need to be inside the regionSelect change listener.


        }, // End PapaParse complete
        error: function(err, file, inputElem, reason) {
          console.error("Error parsing CSV:", reason);
        }
      });
      // --- --- --- END MODIFIED PAPAPARSE CALL --- --- ---
