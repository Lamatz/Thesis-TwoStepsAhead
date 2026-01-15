import os
import sys
from dotenv import load_dotenv

# Logic: If running as EXE, use temp folder (_MEIPASS). If script, use current dir.
if getattr(sys, 'frozen', False):
    BASE_DIR = sys._MEIPASS
else:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Load .env (we will bundle this)
load_dotenv(os.path.join(BASE_DIR, '.env'))

class Config:
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
    
    SOIL_SHAPEFILE = os.path.join(BASE_DIR, "backend", "static_files", "soil_map", "hays.shp")
    SLOPE_TIF = os.path.join(BASE_DIR, "backend", "static_files", "slope_map", "slope.tif")
    MODEL_PATH = os.path.join(BASE_DIR, "backend", "static_files", "model_4.pkl")
    SCALER_PATH = os.path.join(BASE_DIR, "backend", "static_files", "scaler_4.pkl")