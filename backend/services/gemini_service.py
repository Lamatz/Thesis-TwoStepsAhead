import os
from google import genai
from flask import Response

class GeminiService:
    def __init__(self, api_key):
        self.client = genai.Client(api_key=api_key)

    def generate_report_stream(self, data):
        prompt = self._build_prompt(data)
        
        response = self.client.models.generate_content_stream(
            model="gemini-2.5-flash",
            contents=prompt
        )

        def stream_generator():
            for stream in response:
                if stream.text:
                    yield stream.text
        
        return Response(stream_generator(), mimetype="text/plain")

    def _build_prompt(self, data):
        # (Paste your long string prompt here to keep code clean)
        return f"""
       Generate a comprehensive risk assessment report for a potential landslide.
            The report should be structured, professional, and easy for a non-expert to understand.
            Your analysis should consider all the environmental data provided below.
            Conclude with a clear risk level (e.g., Low, Moderate, High, Critical) and a list of actionable recommendations for Local Government Units (LGUs) and residents.
            
            ---
            **DISCLAIMER:**
            This report is based on the available data and predictive models. Ground conditions can change rapidly. Furthermore, this report was made using the gemini model. This assessment should be used as a guide for disaster preparedness and mitigation and not as a substitute for on-site engineering and geological assessments.

            ---
            **INCIDENT AND ASSESSMENT OVERVIEW:**
            - **Report Generation Date:** {data.get('date_today', 'N/A')}
            - **Prediction for Date:** {data.get('prediction_date', 'N/A')}
            - **Location:** {data.get('location_name', 'N/A')} 
            - **Coordinates:** (for latitude: {data.get('location_lat', 'N/A')} ) (for longituded {data.get('location_lng', 'N/A')})

            ---
            **INITIAL PREDICTION CONTEXT:**
            - **Initial Model Prediction:** {data.get('original_model_prediction', 'N/A')}
            - **Initial Model Confidence:** {data.get('original_model_confidence', 'N/A')}

            ---
            **GEOLOGICAL AND SITE CHARACTERISTICS:**

            - **Geological Assessment:** [Provide a brief description of the area's geology, e.g., "The area is underlain by [rock formation], which is known for its susceptibility to weathering and erosion."]
            - **Soil Type:** {data.get('soil_type', 'N/A')} 
            - **Slope Angle (degrees):** {data.get('slope', 'N/A')} 
 

            ---
            **HYDRO-METEOROLOGICAL DATA:**

            **CUMULATIVE RAINFALL (mm):**
            - **Last 3 hours:** {data.get('rainfall-3_hr', 'N/A')}
            - **Last 6 hours:** {data.get('rainfall-6_hr', 'N/A')}
            - **Last 12 hours:** {data.get('rainfall-12_hr', 'N/A')}
            - **Last 1 day:** {data.get('rainfall-1-day', 'N/A')}
            - **Last 3 days:** {data.get('rainfall-3-day', 'N/A')}
            - **Last 5 days:** {data.get('rainfall-5-day', 'N/A')}

            **RAINFALL INTENSITY (mm/hr):**
            - **Average over last 3 hours:** {data.get('rain-intensity-3_hr', 'N/A')}
            - **Average over last 6 hours:** {data.get('rain-intensity-6_hr', 'N/A')}
            - **Average over last 12 hours:** {data.get('rain-intensity-12_hr', 'N/A')}
            - **Average over last 1 day:** {data.get('rain-intensity-1-day', 'N/A')}
            - **Average over last 3 days:** {data.get('rain-intensity-3-day', 'N/A')}
            - **Average over last 5 days:** {data.get('rain-intensity-5-day', 'N/A')}

            **SOIL MOISTURE:**
            - **Current Soil Moisture (percentage):** {data.get('soil_moisture', 'N/A')}%

            ---
            **VULNERABILITY AND RISK ASSESSMENT:**

            **Analysis of Landslide Contributing Factors:**
            [This section should synthesize the data above. For example: "The steep slope of {data.get('slope', 'N/A')}, combined with the soil type ({data.get('soil_type', 'N/A')}), makes the area inherently susceptible to landslides. The recent heavy rainfall over the past 3 days ({data.get('rainfall-3-day', 'N/A')} mm) has likely increased soil saturation and pore water pressure, further elevating the risk."]

            **Agreement with Initial Prediction:**
            [Comment on the initial model's prediction. For example: "The initial model's prediction of a {data.get('original_model_prediction', 'N/A')} risk level is consistent with this detailed analysis. The high confidence of {data.get('original_model_confidence', 'N/A')}% is supported by the combination of geological and meteorological factors."]

            ---
            **LANDSLIDE REPORT SUMMARY:**
            **Summary/Conclusion:**
            [Provide a clear and concise summary of the report so far]
            
            ---

            **RECOMMENDATIONS:**

            **For the Local Government Unit (LGU) / Disaster Risk Reduction and Management Office (DRRMO):**
            1.  **Information Dissemination:** Immediately disseminate this warning to the affected barangays and communities.
            2.  **Monitoring:** Continuously monitor rainfall and be alert for signs of impending landslides (e.g., tension cracks, bulging ground, unusual sounds). Observe for rapid increases or decreases in creek/river water levels, which may be accompanied by increased turbidity.
            3.  **Pre-emptive Evacuation:** For areas rated as Highly or Critically susceptible, consider and, if necessary, implement pre-emptive evacuation, especially for residents in the most dangerous areas.
            4.  **Evacuation Centers:** Ensure that designated evacuation centers are ready, accessible, and equipped with necessary supplies.
            5.  **Road Safety:** Monitor road conditions and advise the public of any potential road closures.

            **For Residents and the Community:**
            1.  **Be Vigilant:** Be aware of your surroundings and watch for any signs of land movement.
            2.  **Stay Informed:** Monitor official news and advisories from PAGASA and your local DRRMO.
            3.  **Evacuate if Necessary:** If you are in a high-risk area, be prepared to evacuate immediately when instructed by local authorities.
            4.  **Community-Based Monitoring:** Report any unusual observations to your barangay officials.


            **--- END OF REPORT ---**
        """