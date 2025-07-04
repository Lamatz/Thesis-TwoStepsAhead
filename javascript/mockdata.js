// Mock data for Philippines Landslide Prediction System

function getMockPrediction(location, period) {
    // Generate realistic mock data based on location and period
    const baseProbability = Math.random() * 100;
    
    // Adjust probability based on period (longer periods = higher risk)
    const periodMultipliers = {
        '3hrs': 0.3,
        '6hrs': 0.5,
        '12hrs': 0.7,
        '1day': 1.0,
        '3days': 1.3,
        '5days': 1.5
    };
    
    const adjustedProbability = Math.min(95, baseProbability * periodMultipliers[period]);
    
    // Determine risk level based on probability
    let riskLevel;
    if (adjustedProbability < 25) riskLevel = 'low';
    else if (adjustedProbability < 50) riskLevel = 'moderate';
    else if (adjustedProbability < 75) riskLevel = 'high';
    else riskLevel = 'extreme';
    
    // Generate rainfall data based on period
    const rainfallData = generateRainfallData(period);
    
    return {
        probability: Math.round(adjustedProbability),
        riskLevel: riskLevel,
        factors: {
            rainfall: rainfallData,
            soilMoisture: Math.round(20 + Math.random() * 60), // 20-80%
            slope: Math.round(10 + Math.random() * 35), // 10-45 degrees
            soilType: getRandomSoilType()
        },
        location: {
            lat: location.lat,
            lng: location.lng,
            address: location.address
        },
        period: period,
        timestamp: new Date().toISOString()
    };
}

function generateRainfallData(period) {
    const baseRainfall = Math.random() * 100;
    
    const periodMultipliers = {
        '3hrs': { cumulative: 0.3, intensity: 2.5 },
        '6hrs': { cumulative: 0.5, intensity: 2.0 },
        '12hrs': { cumulative: 0.8, intensity: 1.5 },
        '1day': { cumulative: 1.0, intensity: 1.0 },
        '3days': { cumulative: 2.5, intensity: 0.8 },
        '5days': { cumulative: 4.0, intensity: 0.6 }
    };
    
    const multiplier = periodMultipliers[period];
    
    return {
        cumulative: Math.round(baseRainfall * multiplier.cumulative),
        intensity: Math.round((baseRainfall * multiplier.intensity) / 10 * 10) / 10 // Round to 1 decimal
    };
}

function getRandomSoilType() {
    const soilTypes = [
        'Clay loam',
        'Sandy clay',
        'Silty clay',
        'Loam',
        'Sandy loam',
        'Silty loam',
        'Clay',
        'Sand',
        'Silt',
        'Volcanic soil',
        'Laterite',
        'Alluvial soil'
    ];
    
    return soilTypes[Math.floor(Math.random() * soilTypes.length)];
}

// Mock DEM data for slope analysis
function getMockSlopeData(lat, lng) {
    // Generate realistic slope data based on coordinates
    // Higher elevations and mountainous areas typically have steeper slopes
    const elevation = 100 + Math.random() * 1500; // 100-1600m elevation
    const slope = Math.random() * 45; // 0-45 degree slope
    
    return {
        elevation: Math.round(elevation),
        slope: Math.round(slope * 10) / 10,
        aspect: Math.round(Math.random() * 360), // 0-360 degrees
        terrain: getTerrainType(slope)
    };
}

function getTerrainType(slope) {
    if (slope < 5) return 'Flat';
    if (slope < 15) return 'Gentle slope';
    if (slope < 30) return 'Moderate slope';
    if (slope < 45) return 'Steep slope';
    return 'Very steep slope';
}

// Mock historical landslide data
function getMockHistoricalData(lat, lng) {
    const events = [];
    const numEvents = Math.floor(Math.random() * 5); // 0-4 historical events
    
    for (let i = 0; i < numEvents; i++) {
        const daysAgo = Math.floor(Math.random() * 3650); // Within last 10 years
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);
        
        events.push({
            date: date.toISOString().split('T')[0],
            magnitude: Math.random() > 0.7 ? 'Major' : 'Minor',
            casualties: Math.floor(Math.random() * 10),
            damageArea: Math.round(Math.random() * 100 * 10) / 10 // hectares
        });
    }
    
    return events.sort((a, b) => new Date(b.date) - new Date(a.date));
}

// Mock weather forecast data from Open-Meteo
function getMockWeatherForecast(lat, lng, days = 5) {
    const forecast = [];
    
    for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);
        
        forecast.push({
            date: date.toISOString().split('T')[0],
            temperature: {
                max: Math.round(25 + Math.random() * 10),
                min: Math.round(18 + Math.random() * 7)
            },
            rainfall: Math.round(Math.random() * 50 * 10) / 10,
            humidity: Math.round(60 + Math.random() * 30),
            windSpeed: Math.round(Math.random() * 20 * 10) / 10,
            soilMoisture: {
                depth100cm: Math.round(20 + Math.random() * 60),
                depth200cm: Math.round(15 + Math.random() * 55)
            }
        });
    }
    
    return forecast;
}

// Mock Philippine cities data for search
const philippineCities = {
    'manila': { lat: 14.5995, lng: 120.9842, address: 'Manila, Philippines' },
    'cebu': { lat: 10.3157, lng: 123.8854, address: 'Cebu City, Philippines' },
    'davao': { lat: 7.1907, lng: 125.4553, address: 'Davao City, Philippines' },
    'baguio': { lat: 16.4023, lng: 120.5960, address: 'Baguio City, Philippines' },
    'iloilo': { lat: 10.7202, lng: 122.5621, address: 'Iloilo City, Philippines' },
    'zamboanga': { lat: 6.9214, lng: 122.0790, address: 'Zamboanga City, Philippines' },
    'cagayan de oro': { lat: 8.4542, lng: 124.6319, address: 'Cagayan de Oro, Philippines' },
    'bacolod': { lat: 10.6770, lng: 122.9500, address: 'Bacolod City, Philippines' },
    'tacloban': { lat: 11.2447, lng: 125.0048, address: 'Tacloban City, Philippines' },
    'butuan': { lat: 8.9472, lng: 125.5461, address: 'Butuan City, Philippines' },
    'puerto princesa': { lat: 9.7392, lng: 118.7353, address: 'Puerto Princesa, Philippines' },
    'olongapo': { lat: 14.8294, lng: 120.2824, address: 'Olongapo City, Philippines' },
    'angeles': { lat: 15.1455, lng: 120.5876, address: 'Angeles City, Philippines' },
    'antipolo': { lat: 14.5878, lng: 121.1759, address: 'Antipolo City, Philippines' },
    'taguig': { lat: 14.5176, lng: 121.0509, address: 'Taguig City, Philippines' }
};