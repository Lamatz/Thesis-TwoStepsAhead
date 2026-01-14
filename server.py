from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import logging

from config import Config
from services.spatial_service import SpatialService
from services.weather_service import WeatherService
from services.ml_service import MLService
from services.gemini_service import GeminiService

# Configure Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Initialize Services
spatial_service = SpatialService(Config.SOIL_SHAPEFILE, Config.SLOPE_TIF)
weather_service = WeatherService()
ml_service = MLService(Config.MODEL_PATH, Config.SCALER_PATH)
llm_service = GeminiService(Config.GEMINI_API_KEY)

# --- ROUTES ---

@app.route("/get_location_data", methods=["GET"])
def get_location_data():
    lat = request.args.get("lat", type=float)
    lon = request.args.get("lon", type=float)

    if lat is None or lon is None:
        return jsonify({"error": "Missing coordinates"}), 400

    slope = spatial_service.get_slope(lon, lat)
    soil_type = spatial_service.get_soil_type(lon, lat)

    return jsonify({"slope": slope, "soil_type": str(soil_type)})

@app.route("/get_weather", methods=["GET"])
def get_weather():
    lat = request.args.get("latitude", type=float)
    lon = request.args.get("longitude", type=float)
    date = request.args.get("date", type=str)
    time = request.args.get("time", "23:59")

    if not all([lat, lon, date]):
        return jsonify({"error": "Missing parameters"}), 400

    try:
        data = weather_service.fetch_data(lat, lon, date, time)
        return jsonify(data)
    except Exception as e:
        logger.error(f"Weather API Error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/search_locations", methods=["GET"])
def search_locations():
    query = request.args.get("query")
    if not query or len(query.strip()) < 3:
        return jsonify({"suggestions": []})

    url = f"https://nominatim.openstreetmap.org/search"
    headers = {"User-Agent": "LandslidePredictor/1.0"}
    params = {"q": query, "format": "json", "limit": 5, "countrycodes": "PH"}

    try:
        resp = requests.get(url, headers=headers, params=params)
        data = resp.json()
        
        locations = [{
            "name": item.get("display_name"),
            "lat": item.get("lat"),
            "lon": item.get("lon"),
            "type": item.get("type")
        } for item in data]
        
        return jsonify({"suggestions": locations})
    except Exception as e:
        logger.error(f"Nominatim Error: {e}")
        return jsonify({"suggestions": []})

@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.json
        result = ml_service.predict(data)
        return jsonify(result)
    except Exception as e:
        logger.error(f"Prediction Error: {e}")
        return jsonify({"error": "Prediction failed"}), 400

@app.route("/generate_report", methods=["POST"])
def generate_report():
    try:
        data = request.get_json()
        return llm_service.generate_report_stream(data)
    except Exception as e:
        logger.error(f"Report Gen Error: {e}")
        return jsonify({"error": "Report generation failed"}), 500

if __name__ == "__main__":
    app.run(debug=True)