import pickle
import numpy as np
import logging

logger = logging.getLogger(__name__)

class MLService:
    def __init__(self, model_path, scaler_path):
        self.model = None
        self.scaler = None
        try:
            with open(model_path, "rb") as f:
                self.model = pickle.load(f)
            with open(scaler_path, "rb") as f:
                self.scaler = pickle.load(f)
            logger.info("ML Model and Scaler loaded.")
        except Exception as e:
            logger.error(f"Failed to load ML artifacts: {e}")

    def predict(self, data):
        if not self.model or not self.scaler:
            raise Exception("Model not loaded")

        # Ensure order matches training exactly
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
            float(data.get("rain-intensity-5-day", 0)),
        ]

        scaled = self.scaler.transform([features])
        probs = self.model.predict_proba(scaled)[0]
        pred_idx = int(np.argmax(probs))
        
        return {
            "prediction": "Landslide" if pred_idx == 1 else "No Landslide",
            "confidence": f"{max(probs) * 100:.2f}%"
        }