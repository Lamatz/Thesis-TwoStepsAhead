import pandas as pd
from geopy.geocoders import Nominatim
import time
from tqdm import tqdm # A handy progress bar

# Initialize the geolocator (it's good practice to provide a unique user_agent)
geolocator = Nominatim(user_agent="ph_region_finder_app_v1")

def get_region_from_coords(row):
    """
    Function to find the region for a given latitude and longitude.
    """
    # This function will now work correctly because the column names will match.
    try:
        # We need to sleep to respect the API's usage policy (max 1 request/sec)
        time.sleep(1.1) 
        
        # Geopy expects a "latitude, longitude" string
        location = geolocator.reverse(f"{row['latitude']}, {row['longitude']}", language='en')
        
        if location and 'state' in location.raw['address']:
            return location.raw['address']['state']
        else:
            # Check for other possible keys if 'state' isn't found
            address = location.raw.get('address', {})
            region = address.get('region', address.get('province', 'Region Not Found'))
            return region
            
    except Exception as e:
        print(f"Error for coords ({row['latitude']}, {row['longitude']}): {e}")
        return 'Error'

# --- THE FIX IS HERE ---
# We tell pandas to skip the first row (your header) and then assign our desired names.
df = pd.read_csv('datas.csv', header=None, skiprows=1, names=['latitude', 'longitude', 'region_placeholder'])

# Use tqdm to show a progress bar because this will be SLOW
tqdm.pandas(desc="Finding Regions")

# Apply the function to each row of the DataFrame
df['region'] = df.progress_apply(get_region_from_coords, axis=1)

# Create the final DataFrame in the desired format
final_df = df[['latitude', 'longitude', 'region']]

# Save the result
final_df.to_csv('datas_completed_api.csv', index=False, header=False)

print("\nProcessing complete!")
print("Output saved to datas_completed_api.csv")