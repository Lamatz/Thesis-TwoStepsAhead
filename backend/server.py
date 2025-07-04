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



# Fetch weather data from Open-Meteo
def fetch_weather_data(latitude, longitude, end_date_str):
    try:
        end_date = datetime.strptime(end_date_str, "%Y-%m-%d")
        start_date = end_date - timedelta(days=5) # Fetch 5 days *before* the end_date

        start_date_str = start_date.strftime("%Y-%m-%d")

        url = "https://api.open-meteo.com/v1/forecast"
        params = {
            "latitude": latitude,
            "longitude": longitude,
            "hourly": "precipitation,soil_moisture_27_to_81cm",
            "start_date": start_date_str,
            "end_date": end_date_str,
            "timezone": "auto",
             "forecast_days": 0 # Ensure it fetches historical data up to end_date if it's in the past
        }

        # Use requests library directly as openmeteo_requests/cache/retry not strictly necessary for basic fetch
        response = requests.get(url, params=params, timeout=10) # Add timeout
        response.raise_for_status() # Raise HTTPError for bad responses (4xx or 5xx)
        data = response.json()

        # --- Process hourly data ---
        hourly_data = data.get("hourly")
        if not hourly_data or not hourly_data.get("time") or not hourly_data.get("precipitation") or not hourly_data.get("soil_moisture_27_to_81cm"):
            return {"error": "Incomplete hourly data from weather API"}

        timestamps = pd.to_datetime(hourly_data["time"])
        rain = np.array(hourly_data["precipitation"])
        soil_moisture = np.array(hourly_data["soil_moisture_27_to_81cm"])

        df = pd.DataFrame({"timestamp": timestamps, "rain_mm": rain, "soil_moisture": soil_moisture})
        df.fillna(0.0, inplace=True) # Fill NaNs

        # Ensure DataFrame is not empty
        if df.empty:
             return {"error": "No hourly data received from weather API"}

        # --- Calculate cumulative and intensity for 1, 3, 5 days ---
        # The end_date requested corresponds to the *end* of the time series data provided by the API.
        # We calculate cumulative/intensity *up to* this end timestamp.
        last_timestamp = df["timestamp"].iloc[-1]

        def compute_cumulative_rainfall(hours):
             if len(df) == 0: return 0.0
             start_time = last_timestamp - timedelta(hours=hours)
             # Filter includes the start_time exactly, and up to (and including) last_timestamp
             filtered_df = df[(df["timestamp"] >= start_time) & (df["timestamp"] <= last_timestamp)]
             return float(filtered_df["rain_mm"].sum()) if not filtered_df.empty else 0.0

        def compute_rain_intensity(hours):
            if len(df) == 0: return 0.0
            start_time = last_timestamp - timedelta(hours=hours)
            period_df = df[(df["timestamp"] >= start_time) & (df["timestamp"] <= last_timestamp)]
            # Intensity is total rainfall divided by the duration in hours.
            # Number of intervals is len(period_df). Duration is (count - 1) hours if intervals are hourly.
            # A safer duration is the time difference between the first and last timestamp + 1 hour (for the last interval)
            # Or simply the number of intervals (len) if assuming perfect 1hr intervals and you want sum/count.
            # Let's use sum / count as it's common for average intensity.
            num_intervals = len(period_df)
            return float(period_df["rain_mm"].sum() / num_intervals) if num_intervals > 0 else 0.0


        # --- Calculate Daily Cumulative and Intensity for the Report (ADDITION) ---
        # Group hourly data by date
        daily_summary = df.groupby(df['timestamp'].dt.date).agg(
            daily_cumulative=('rain_mm', 'sum'), # Total rainfall for the day
            daily_avg_intensity=('rain_mm', 'mean') # Average hourly intensity for the day
        ).reset_index() # Keep the date as a column

        # Convert date objects and numpy floats to serializable types (strings, floats)
        daily_data_list = []
        for index, row in daily_summary.iterrows():
             daily_data_list.append({
                 'date': row['timestamp'].strftime('%Y-%m-%d'), # Format date as string
                 'cumulative': float(row['daily_cumulative']), # Ensure float type
                 'intensity': float(row['daily_avg_intensity']) # Ensure float type
             })

        # --- Return the data including the daily summary list ---
        return {
            "soil_moisture": float(df["soil_moisture"].iloc[-1]) if not df.empty else 0.0,
            "cumulative_rainfall": {
                "1_day": compute_cumulative_rainfall(24),
                "3_day": compute_cumulative_rainfall(72),
                "5_day": compute_cumulative_rainfall(120) # Calculate for 1, 3, 5 days as originally in HTML inputs
            },
            "rain_intensity": {
                "1_day": compute_rain_intensity(24),
                "3_day": compute_rain_intensity(72),
                "5_day": compute_rain_intensity(120) # Calculate for 1, 3, 5 days as originally in HTML inputs
            },
            "daily_data": daily_data_list # ADD THIS LIST for the detailed report table
        }

    except requests.exceptions.RequestException as e:
         print(f"Network or API request error fetching weather data: {e}")
         return {"error": f"Network or API request error fetching weather data: {e}"}
    except Exception as e:
        print(f"Error processing weather data response: {e}")
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
    url = f"https://nominatim.openstreetmap.org/search?q={query_string}&format=json&limit=10&countrycodes=PH"
    headers = {"User-Agent": "Two-Step-Ahead (eriksonss1535@gmail.com)"}
    response = requests.get(url, headers=headers)


    if response.status_code != 200:
        print(f"Error fetching Nominatim data: Status {response.status_code}")
        return jsonify({"error": "Failed to fetch location data from Nominatim"}), response.status_code

    data = response.json()

    # Debugging output
    print("Nominatim Query:", query)
    print("Nominatim Response (first 5):", data[:5]) # Print only first few for brevity

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


    

@app.route("/get_weather", methods=["GET"])
def get_weather():
    latitude = request.args.get("latitude", type=float)
    longitude = request.args.get("longitude", type=float)
    date = request.args.get("date", type=str)

    if not latitude or not longitude or not date:
        return jsonify({"error": "Missing parameters"}), 400

    try:
        data = fetch_weather_data(latitude, longitude, date)
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# I WILL CHANGE THIS PATHING

# Load trained model and scaler
with open("backend/model.pkl", "rb") as model_file:
    model = pickle.load(model_file)

with open("backend/scaler.pkl", "rb") as scaler_file:
    scaler = pickle.load(scaler_file)

@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.json
        features = [
            int(data.get("soil_type", 0)),
            float(data.get("slope", 0)),
            float(data.get("soil_moisture", 0)),
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
