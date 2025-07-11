from flask import Flask, request, jsonify
import pandas as pd
# Keep imports if used elsewhere, but openmeteo_requests, requests_cache, retry are not used in the current fetch_weather_data
import openmeteo_requests
import requests_cache
from retry_requests import retry
from datetime import datetime, timedelta
from flask_cors import CORS
import numpy as np
import pickle
import requests # Used here for fetching weather data
import rasterio # Used for slope
import geopandas as gpd # Used for soil
from shapely.geometry import Point # Used for soil
from pyproj import Transformer # Used for coordinate conversion

app = Flask(__name__)
CORS(app, )  # Enable CORS for frontend requests

# Load spatial files (assuming these paths are correct relative to where the script is run)
try:
    soil_shapefile = "backend/soil map/hays.shp"
    soil_gdf = gpd.read_file(soil_shapefile)
    soil_gdf.sindex # Build spatial index for performance
except Exception as e:
    print(f"Error loading soil shapefile {soil_shapefile}: {e}")
    soil_gdf = None

try:
    slope_tif = "backend/Slope Map/slope.tif"
    # Keep the rasterio file open reference if needed elsewhere, or open/close per call
    # For simplicity here, we'll open/c1lose inside the function
    # slope_raster = rasterio.open(slope_tif)
except Exception as e:
    print(f"Error loading slope GeoTIFF {slope_tif}: {e}")
    # slope_raster = None


# Convert coordinates from WGS84 to raster CRS
def convert_coords(lon, lat, crs):
    # You might need pyproj import here if it's not globally available
    transformer = Transformer.from_crs("EPSG:4326", crs, always_xy=True)
    return transformer.transform(lon, lat)

# Function to extract soil type from shapefile
def get_soil_type(lon, lat):
    if soil_gdf is None:
        return "Error: Shapefile not loaded"
    point = Point(lon, lat)
    # Add error handling/validation for point
    if not point.is_valid:
        return "Error: Invalid coordinates for soil lookup"
    try:
        for _, row in soil_gdf.iterrows():
            # Use .within() or .intersects() with buffering for robustness near boundaries if needed
            if row.geometry and row.geometry.contains(point):
                return row.get("SNUM", "Unknown") # Use .get for safer attribute access
        return "Unknown" # Point not found in any polygon
    except Exception as e:
        print(f"Error in get_soil_type: {e}")
        return "Error during processing"

# Function to extract slope from GeoTIFF
def get_slope(lon, lat):
    # Open the raster inside the function to manage resources
    try:
        with rasterio.open(slope_tif) as src:
            x, y = convert_coords(lon, lat, src.crs)  # Convert coordinates to raster CRS
            # Check if coordinates are within raster bounds before indexing
            if not (src.bounds.left <= x <= src.bounds.right and src.bounds.bottom <= y <= src.bounds.top):
                 print(f"Coords ({lon}, {lat}) converted to ({x}, {y}) are outside raster bounds.")
                 return None # Return None if outside bounds

            row, col = src.index(x, y)  # Get row/col in raster

            # Check if row/col are within raster dimensions
            if 0 <= row < src.height and 0 <= col < src.width:
                # Read only a single pixel
                window = ((row, row + 1), (col, col + 1))
                # Use boundless=True to read even if the calculated row/col is slightly off edge (returns nodata if outside padded area)
                slope_value_array = src.read(1, window=window, boundless=True)

                if slope_value_array.shape == (1, 1):
                     slope_value = slope_value_array[0, 0]
                else:
                     print("Did not read a single pixel as expected.")
                     return None


                # Handle NoData values or NaNs
                if src.nodata is not None and slope_value == src.nodata:
                    return None # Return None for NoData
                if np.isnan(slope_value):
                    return None # Return None for NaN values

                return float(slope_value)
            else:
                 print(f"Coords ({lon}, {lat}) map to invalid row/col ({row}, {col}).")
                 return None # Point maps to invalid row/col index

    except rasterio.errors.RasterioIOError as e:
        print(f"Rasterio IO error reading slope data: {e}")
        return "Error reading raster file"
    except Exception as e:
        print(f"Error during slope extraction: {e}")
        return "Error during processing"


# Get location data (slope & soil type)
@app.route("/get_location_data", methods=["GET"])
def get_location_data():
    latitude = request.args.get("lat", type=float)
    longitude = request.args.get("lon", type=float)

    if latitude is None or longitude is None or abs(latitude) > 90 or abs(longitude) > 180:
        return jsonify({"error": "Invalid or missing coordinates"}), 400

    # Add error handling for spatial file loading issues
    if soil_gdf is None or slope_tif is None: # Check slope_tif path existence might be better
         return jsonify({"error": "Spatial data files not loaded on server"}), 500


    slope = get_slope(longitude, latitude)
    soil_type = get_soil_type(longitude, latitude)

    # Return None slope if extraction failed or point was outside
    return jsonify({
        "slope": slope, # Return None if get_slope returned None or Error string
        "soil_type": str(soil_type) if not isinstance(soil_type, str) or not soil_type.startswith("Error") else soil_type
    })



# =========================================================================
# == MODIFIED: Fetch weather data to accept time and generate chart data ==
# =========================================================================
def fetch_weather_data(latitude, longitude, end_date_str, end_time_str):
    try:
        # Combine date and time for a precise endpoint
        end_datetime = datetime.strptime(f"{end_date_str} {end_time_str}", "%Y-%m-%d %H:%M")
        
        # Fetch data for the last 6 days to ensure all windows are covered
        api_start_date = end_datetime - timedelta(days=6)
        api_end_date = end_datetime

        url = "https://api.open-meteo.com/v1/forecast"
        params = {
            "latitude": latitude, "longitude": longitude,
            "hourly": "precipitation,soil_moisture_27_to_81cm",
            "start_date": api_start_date.strftime("%Y-%m-%d"),
            "end_date": api_end_date.strftime("%Y-%m-%d"),
            "timezone": "auto", "forecast_days": 0, "precipitation_unit": "in"
        }
        
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()

        hourly_data = data.get("hourly", {})
        df = pd.DataFrame({
            "timestamp": pd.to_datetime(hourly_data["time"]),
            "rain_mm": np.array(hourly_data["precipitation"]),
            "soil_moisture": np.array(hourly_data["soil_moisture_27_to_81cm"])
        }).fillna(0.0)

        # Filter to only include data up to the user's selected end_datetime
        df = df[df['timestamp'] <= end_datetime].copy()
        if df.empty: return {"error": "No historical data available for the selected time."}
        
        # --- Calculations for the prediction model ---
        def compute_cumulative(hours):
            start_time = end_datetime - timedelta(hours=hours)
            mask = (df["timestamp"] > start_time) & (df["timestamp"] <= end_datetime)
            return float(df.loc[mask, "rain_mm"].sum())

        def compute_intensity(hours):
            cumulative = compute_cumulative(hours)
            return float(cumulative / hours) if hours > 0 else 0.0

        time_windows = {"3_hr": 3, "6_hr": 6, "12_hr": 12, "1_day": 24, "3_day": 72, "5_day": 120}
        cumulative_rainfall = {label: compute_cumulative(h) for label, h in time_windows.items()}
        rain_intensity = {label: compute_intensity(h) for label, h in time_windows.items()}

        # --- NEW & CORRECTED: Generate clean data specifically for the 4 charts ---
        
        # 1. Hourly Chart Data (for the 12 hours leading up to end_datetime)
        hourly_chart_data = []
        # Get the last 12 data points from our filtered dataframe
        last_12_hours_df = df.tail(12)
        
        running_cumulative = 0
        for index, row in last_12_hours_df.iterrows():
            running_cumulative += row['rain_mm']
            hourly_chart_data.append({
                'hour': row['timestamp'].strftime('%H:00'),
                'cumulative': running_cumulative,  # A true running total over the 12hr window
                'intensity': row['rain_mm']        # The intensity is just the rainfall for that single hour
            })

        # 2. Daily Chart Data (for the 5 days leading up to end_date)
        daily_df = df[df['timestamp'] >= end_datetime.replace(hour=0, minute=0, second=0) - timedelta(days=4)].copy()
        daily_summary = daily_df.groupby(daily_df['timestamp'].dt.date).agg(
            daily_cumulative=('rain_mm', 'sum'),
            # The average intensity for a day is the total rain divided by 24 hours
            daily_avg_intensity=('rain_mm', lambda x: x.sum() / 24)
        ).reset_index()

        daily_chart_data = [
            {'date': row['timestamp'].strftime('%b %d'), 'cumulative': float(row['daily_cumulative']), 'intensity': float(row['daily_avg_intensity'])}
            for _, row in daily_summary.iterrows()
        ]

        return {
            "soil_moisture": float(df["soil_moisture"].iloc[-1]),
            "cumulative_rainfall": cumulative_rainfall,
            "rain_intensity": rain_intensity,
            "hourly_chart_data": hourly_chart_data,
            "daily_chart_data": daily_chart_data
        }

    except Exception as e:
        print(f"Error processing weather data: {e}")
        return {"error": f"Error processing weather data: {e}"}

# ... (rest of your backend routes: search_locations, get_weather endpoint handler, predict endpoint handler, model loading, main execution block) ...

@app.route('/search_locations', methods=['GET'])
def search_locations():
    query = request.args.get('query')
    if not query:
        return jsonify({"error": "Missing query parameter"}), 400

    # Added a minimum query length for efficiency and relevance
    if len(query.strip()) < 3:
        return jsonify({"suggestions": []}) # Return empty list for short queries

    # Add a User-Agent header as recommended by Nominatim
    query = request.args.get("query")  # This line likely exists already
    url = f"https://nominatim.openstreetmap.org/search?q={query}&format=json&limit=1&countrycodes=PH"

    headers = {"User-Agent": "Two-Step-Ahead (eriksonss1535@gmail.com)"}
    response = requests.get(url, headers=headers)


    if response.status_code != 200:
        print(f"Error fetching Nominatim data: Status {response.status_code}")
        return jsonify({"error": "Failed to fetch location data from Nominatim"}), response.status_code

    data = response.json()

    # Debugging output
    print("Nominatim Query:", query)
    print("Nominatim Response (first 5):", data[:1]) # Print only first few for brevity

    if not data:
        print("No results found for Nominatim query:", query)
        return jsonify({"suggestions": []}) # Return empty list if no results

    locations = []
    for item in data:
        # **Crucially: ONLY extract and return basic info from Nominatim**
        # **DO NOT call get_soil_type, get_slope, or fetch_weather_data here**
        locations.append({
            "name": item.get("display_name", "Unnamed Location"),
            "lat": item.get("lat"),
            "lon": item.get("lon"),
             # Add other useful Nominatim fields if needed, but avoid fetching external data
             "category": item.get("category"),
             "type": item.get("type")
        })

    print(f"Returning {len(locations)} search suggestions.")
    return jsonify({"suggestions": locations})


# ==========================================================
# == MODIFIED: /get_weather endpoint to accept time param ==
# ==========================================================
@app.route("/get_weather", methods=["GET"])
def get_weather():
    latitude = request.args.get("latitude", type=float)
    longitude = request.args.get("longitude", type=float)
    date = request.args.get("date", type=str)
    # Get time, with a default of 23:59 if not provided
    time = request.args.get("time", "23:59") 

    if not all([latitude, longitude, date, time]):
        return jsonify({"error": "Missing required parameters"}), 400
    
    data = fetch_weather_data(latitude, longitude, date, time)
    return jsonify(data)


# I WILL CHANGE THIS PATHING

# Load trained model and scaler
with open("backend/model_4.pkl", "rb") as model_file:
    model = pickle.load(model_file)

with open("backend/scaler_4.pkl", "rb") as scaler_file:
    scaler = pickle.load(scaler_file)



@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.json
        features = [
            int(data.get("soil_type", 0)),
            float(data.get("slope", 0)),
            float(data.get("soil_moisture", 0)),
            float(data.get("rainfall-3-hr", 0)),
            float(data.get("rainfall-6-hr", 0)),
            float(data.get("rainfall-12-hr", 0)),
            float(data.get("rain-intensity-3-hr", 0)),
            float(data.get("rain-intensity-6hr", 0)),
            float(data.get("rain-intensity-12-hr", 0)),
            float(data.get("rainfall-1-day", 0)),
            float(data.get("rainfall-3-day", 0)),
            float(data.get("rainfall-5-day", 0)),
            float(data.get("rain-intensity-1-day", 0)),
            float(data.get("rain-intensity-3-day", 0)),
            float(data.get("rain-intensity-5-day", 0))
        ]

        features_scaled = scaler.transform([features])
        probabilities = model.predict_proba(features_scaled)[0]
        prediction = int(np.argmax(probabilities))
        print(features)
        print(features_scaled)
        print(probabilities)
        return jsonify({
            "prediction": "Landslide" if prediction == 1 else "No Landslide",
            "confidence": f"{max(probabilities) * 100:.2f}%"
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 400

if __name__ == "__main__":
    app.run(debug=True)
