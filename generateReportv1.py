# pip install -U google-genai


from google import genai
import os

from google.genai import types



# You need to generate an API Key and embedd it into your environment as "GEMINI_API_KEY"
# Use the command: export GOOGLE_API_KEY='your-api-key' 
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))




response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents="How does AI work?",
    config=types.GenerateContentConfig(
        thinking_config=types.ThinkingConfig(thinking_budget=0) # Disables thinking
    ),
)
print(response.text)
