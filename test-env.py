import os
from dotenv import load_dotenv

# Load the .env file
load_dotenv()

# Get the key from the environment
api_key = os.getenv("GEMINI_API_KEY")

# Print what was found
print("--- Testing .env file ---")
if api_key:
    print("SUCCESS: API Key was found!")
    # Optional: uncomment the line below to see the first 5 characters of your key
    # print(f"Key starts with: {api_key[:5]}")
else:
    print("FAILURE: API Key was NOT found (returned None).")
print("-------------------------")