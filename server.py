import os
import sys
import threading
import webbrowser
from flask import Flask, send_from_directory, request, jsonify
from flask_cors import CORS
import logging

# --- SMART PATH FINDER ---
def find_internal_path(target_name):
    """Recursively searches for a folder/file inside the _internal directory"""
    base = sys._MEIPASS if getattr(sys, 'frozen', False) else os.path.dirname(os.path.abspath(__file__))
    for root, dirs, files in os.walk(base):
        if target_name in dirs or target_name in files:
            return os.path.join(root, target_name)
    return None

# --- ENVIRONMENT FIXES FOR MAPS ---
if getattr(sys, 'frozen', False):
    # 1. Setup Backend Path
    backend_path = os.path.join(sys._MEIPASS, 'backend')
    sys.path.append(backend_path)
    
    # 2. Hunt for PROJ and GDAL data
    # PyInstaller usually dumps them in share/proj or pyproj/proj_dir/share/proj
    proj_lib = find_internal_path('proj.db')
    if proj_lib:
        os.environ['PROJ_LIB'] = os.path.dirname(proj_lib)
    
    # Try to find gdal data
    gdal_data = find_internal_path('gdal') # Looking for a folder named gdal
    if gdal_data:
        os.environ['GDAL_DATA'] = gdal_data

from config import Config
# Import services safely
try:
    from backend.services.spatial_service import SpatialService 
    from backend.services.weather_service import WeatherService
    from backend.services.ml_service import MLService
    from backend.services.gemini_service import GeminiService
except Exception as e:
    print(f"IMPORT ERROR: {e}")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- FRONTEND SETUP ---
if getattr(sys, 'frozen', False):
    frontend_folder = os.path.join(sys._MEIPASS, 'frontend')
else:
    frontend_folder = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'frontend')

app = Flask(__name__, static_folder=frontend_folder)
CORS(app)

# --- SERVICES ---
try:
    spatial_service = SpatialService(Config.SOIL_SHAPEFILE, Config.SLOPE_TIF)
    weather_service = WeatherService()
    ml_service = MLService(Config.MODEL_PATH, Config.SCALER_PATH)
    llm_service = GeminiService(Config.GEMINI_API_KEY)
except Exception as e:
    logger.error(f"Service Init Failed: {e}")

# --- ROUTES ---
@app.route('/')
def serve_index():
    # Explicitly look for index.html in the static folder
    return send_from_directory(app.static_folder, 'WebPages/index.html')

@app.route('/<path:path>')
def serve_static(path):
    # 1. Try finding the file in the root of frontend (e.g. css/style.css)
    full_path = os.path.join(app.static_folder, path)
    if os.path.exists(full_path):
        return send_from_directory(app.static_folder, path)
    
    # 2. If not found, try looking inside 'WebPages' (e.g. dashboard.html)
    return send_from_directory(os.path.join(app.static_folder, 'WebPages'), path)




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
    threading.Timer(1, open_browser).start()
    app.run(port=5000, debug=False)