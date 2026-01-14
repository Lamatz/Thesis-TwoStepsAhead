import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
    
    # Paths
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    SOIL_SHAPEFILE = os.path.join(BASE_DIR, "static_files/soil_map/hays.shp")
    SLOPE_TIF = os.path.join(BASE_DIR, "static_files/slope_map/slope.tif")
    MODEL_PATH = os.path.join(BASE_DIR, "static_files/model_4.pkl")
    SCALER_PATH = os.path.join(BASE_DIR, "static_files/scaler_4.pkl")