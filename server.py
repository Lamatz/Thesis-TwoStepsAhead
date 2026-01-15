import os
import sys
import threading
import webbrowser
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import logging

from config import Config

from backend.services.spatial_service import SpatialService 
from backend.services.weather_service import WeatherService
from backend.services.ml_service import MLService
from backend.services.gemini_service import GeminiService

# Configure Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# 1. SETUP STATIC FOLDER FOR EXE
if getattr(sys, 'frozen', False):
    # If .exe, look in temp folder
    frontend_folder = os.path.join(sys._MEIPASS, 'frontend')
else:
    # If script, look in local folder
    frontend_folder = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'frontend')

app = Flask(__name__, static_folder=frontend_folder)
CORS(app)

# Initialize Services
spatial_service = SpatialService(Config.SOIL_SHAPEFILE, Config.SLOPE_TIF)
weather_service = WeatherService()
ml_service = MLService(Config.MODEL_PATH, Config.SCALER_PATH)
llm_service = GeminiService(Config.GEMINI_API_KEY)


# --- SERVING HTML/CSS/JS ---

@app.route('/')
def serve_index():
    return send_from_directory(app.static_folder, 'index.html')

# This magically serves css/, javascript/, icons/, and other html pages
@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory(app.static_folder, path)

# --- ROUTES TO OTHER FUNCTIONS ---

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

# --- STARTUP LOGIC ---
def open_browser():
    webbrowser.open_new("http://127.0.0.1:5000")

if __name__ == "__main__":
    # Ensure backend folder exists as python package if needed
    if not os.path.exists(os.path.join('backend', '__init__.py')):
        open(os.path.join('backend', '__init__.py'), 'a').close()

    threading.Timer(1, open_browser).start()
    app.run(port=5000, debug=False)