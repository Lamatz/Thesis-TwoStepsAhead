import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask import Response
from dotenv import load_dotenv

# import google.generativeai as genai

# pip install -U google-genai
from google import genai
from google.genai import types


# Initialize the Flask app
app = Flask(__name__)
# Enable CORS for all routes, allowing your frontend to communicate with this backend
CORS(app)

# load_dotenv()

# Configure the Gemini API client
# try:
#     api_key = os.getenv("GEMINI_API_KEY")
#     if not api_key:
#         raise ValueError("GEMINI_API_KEY not found. Please set it in your .env file.")
#     genai.configure(api_key=api_key)
#     # Using a fast and capable model for report generation
#     model = genai.GenerativeModel("gemini-1.5-flash")
# except Exception as e:
#     print(f"Error configuring Gemini: {e}")
#     # You might want to exit or handle this more gracefully
#     exit()


# You need to generate an API Key and embedd it into your environment as "GEMINI_API_KEY"
# Use the command: export GOOGLE_API_KEY='your-api-key'
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))


# === ENDPOINT 2: NEW GEMINI REPORT GENERATOR ===
@app.route("/generate_report", methods=["POST"])  # <-- NEW, SEPARATE URL
def generate_report():
    """
    Receives data and uses Gemini to generate a detailed text report.
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON data received"}), 400
        print("Received data for GEMINI report:", data)

        # prompt = f"""
        # Generate a concise risk assessment report for a potential landslide based on the following data.
        # The report should be easy to understand for a non-expert.
        # Conclude with a clear risk level (e.g., Low, Moderate, High, Critical) and brief recommendations.

        # DATA:
        # - Soil Type (s-num): {data.get('soil_type', 'N/A')}
        # - Slope Angle (degrees): {data.get('slope', 'N/A')}
        # - Soil Moisture (percentage): {data.get('soil_moisture', 'N/A')}%
        # - Rainfall last 3 hours (mm): {data.get('rainfall-3_hr', 'N/A')}
        # - Rainfall last 1 day (mm): {data.get('rainfall-1-day', 'N/A')}
        # - Rainfall last 5 days (mm): {data.get('rainfall-5-day', 'N/A')}

        # REPORT:
        # """

        # response = gemini_model.generate_content(prompt)

        response = client.models.generate_content_stream(
            model="gemini-2.5-flash",
            contents=f"""
            Generate a comprehensive risk assessment report for a potential landslide.
            The report should be structured, professional, and easy for a non-expert to understand.
            Your analysis should consider all the environmental data provided below.
            Crucially, you should also consider the output from our initial, simpler prediction model and comment on whether your detailed analysis agrees with it.
            Conclude with a clear risk level (e.g., Low, Moderate, High, Critical) and a list of actionable recommendations.

            ---
            **PREDICTION CONTEXT:**
            - Prediction for Date: {data.get('prediction_date', 'N/A')}
            - Initial Model Prediction: {data.get('original_model_prediction', 'N/A')}
            - Initial Model Confidence: {data.get('original_model_confidence', 'N/A')}

            ---
            **SITE DATA:**
            - Soil Type: {data.get('soil_type', 'N/A')}
            - Slope Angle (degrees): {data.get('slope', 'N/A')}
            - Soil Moisture (percentage): {data.get('soil_moisture', 'N/A')}%

            ---
            **CUMULATIVE RAINFALL (mm):**
            - Last 3 hours: {data.get('rainfall-3_hr', 'N/A')}
            - Last 6 hours: {data.get('rainfall-6_hr', 'N/A')}
            - Last 12 hours: {data.get('rainfall-12_hr', 'N/A')}
            - Last 1 day: {data.get('rainfall-1-day', 'N/A')}
            - Last 3 days: {data.get('rainfall-3-day', 'N/A')}
            - Last 5 days: {data.get('rainfall-5-day', 'N/A')}

            ---
            **RAINFALL INTENSITY (mm/hr):**
            - Average over last 3 hours: {data.get('rain-intensity-3_hr', 'N/A')}
            - Average over last 6 hours: {data.get('rain-intensity-6_hr', 'N/A')}
            - Average over last 12 hours: {data.get('rain-intensity-12_hr', 'N/A')}
            - Average over last 1 day: {data.get('rain-intensity-1-day', 'N/A')}
            - Average over last 3 days: {data.get('rain-intensity-3-day', 'N/A')}
            - Average over last 5 days: {data.get('rain-intensity-5-day', 'N/A')}

            ---
            **BEGIN COMPREHENSIVE REPORT:**
            """,
        )

        def stream_generator():
            for stream in response:
                if stream.text:
                    yield stream.text

        return Response(stream_generator(), mimetype="text/plain")
        # return jsonify({"report": response.text})

    except Exception as e:
        print(f"An error occurred in report generation: {e}")
        return (
            jsonify(
                {"error": "An internal error occurred while generating the report."}
            ),
            500,
        )


# --- 3. RUN THE SERVER ---

if __name__ == "__main__":
    # This line starts the server.
    # It will run forever (until you press Ctrl+C)
    # Using port 5001 to avoid conflicts with your other server.
    app.run(host="127.0.0.1", port=5001, debug=True)
