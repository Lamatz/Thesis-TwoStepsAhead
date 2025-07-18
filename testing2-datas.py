import pandas as pd

# This is our master lookup map. It connects every province to its official region.
PROVINCE_TO_REGION_MAP = {
    # REGION I - Ilocos Region
    'Ilocos Norte': 'Region I - Ilocos Region', 'Ilocos Sur': 'Region I - Ilocos Region', 'La Union': 'Region I - Ilocos Region', 'Pangasinan': 'Region I - Ilocos Region',
    # REGION II - Cagayan Valley
    'Batanes': 'Region II - Cagayan Valley', 'Cagayan': 'Region II - Cagayan Valley', 'Isabela': 'Region II - Cagayan Valley', 'Nueva Vizcaya': 'Region II - Cagayan Valley', 'Quirino': 'Region II - Cagayan Valley',
    # REGION III - Central Luzon
    'Aurora': 'Region III - Central Luzon', 'Bataan': 'Region III - Central Luzon', 'Bulacan': 'Region III - Central Luzon', 'Nueva Ecija': 'Region III - Central Luzon', 'Pampanga': 'Region III - Central Luzon', 'Tarlac': 'Region III - Central Luzon', 'Zambales': 'Region III - Central Luzon',
    # REGION IV-A - CALABARZON
    'Batangas': 'Region IV-A - CALABARZON', 'Cavite': 'Region IV-A - CALABARZON', 'Laguna': 'Region IV-A - CALABARZON', 'Quezon': 'Region IV-A - CALABARZON', 'Rizal': 'Region IV-A - CALABARZON',
    # REGION IV-B - MIMAROPA
    'Marinduque': 'Region IV-B - MIMAROPA', 'Occidental Mindoro': 'Region IV-B - MIMAROPA', 'Oriental Mindoro': 'Region IV-B - MIMAROPA', 'Palawan': 'Region IV-B - MIMAROPA', 'Romblon': 'Region IV-B - MIMAROPA',
    # REGION V - Bicol Region
    'Albay': 'Region V - Bicol Region', 'Camarines Norte': 'Region V - Bicol Region', 'Camarines Sur': 'Region V - Bicol Region', 'Catanduanes': 'Region V - Bicol Region', 'Masbate': 'Region V - Bicol Region', 'Sorsogon': 'Region V - Bicol Region',
    # REGION VI - Western Visayas
    'Aklan': 'Region VI - Western Visayas', 'Antique': 'Region VI - Western Visayas', 'Capiz': 'Region VI - Western Visayas', 'Guimaras': 'Region VI - Western Visayas', 'Iloilo': 'Region VI - Western Visayas', 'Negros Occidental': 'Region VI - Western Visayas',
    # REGION VII - Central Visayas
    'Bohol': 'Region VII - Central Visayas', 'Cebu': 'Region VII - Central Visayas', 'Negros Oriental': 'Region VII - Central Visayas', 'Siquijor': 'Region VII - Central Visayas',
    # REGION VIII - Eastern Visayas
    'Biliran': 'Region VIII - Eastern Visayas', 'Eastern Samar': 'Region VIII - Eastern Visayas', 'Leyte': 'Region VIII - Eastern Visayas', 'Northern Samar': 'Region VIII - Eastern Visayas', 'Samar': 'Region VIII - Eastern Visayas', 'Southern Leyte': 'Region VIII - Eastern Visayas',
    # REGION IX - Zamboanga Peninsula
    'Zamboanga del Norte': 'Region IX - Zamboanga Peninsula', 'Zamboanga del Sur': 'Region IX - Zamboanga Peninsula', 'Zamboanga Sibugay': 'Region IX - Zamboanga Peninsula',
    # REGION X - Northern Mindanao
    'Bukidnon': 'Region X - Northern Mindanao', 'Camiguin': 'Region X - Northern Mindanao', 'Lanao del Norte': 'Region X - Northern Mindanao', 'Misamis Occidental': 'Region X - Northern Mindanao', 'Misamis Oriental': 'Region X - Northern Mindanao',
    # REGION XI - Davao Region
    'Davao de Oro': 'Region XI - Davao Region', 'Davao del Norte': 'Region XI - Davao Region', 'Davao del Sur': 'Region XI - Davao Region', 'Davao Occidental': 'Region XI - Davao Region', 'Davao Oriental': 'Region XI - Davao Region',
    # REGION XII - SOCCSKSARGEN
    'Cotabato': 'Region XII - SOCCSKSARGEN', 'North Cotabato': 'Region XII - SOCCSKSARGEN', 'Sarangani': 'Region XII - SOCCSKSARGEN', 'South Cotabato': 'Region XII - SOCCSKSARGEN', 'Sultan Kudarat': 'Region XII - SOCCSKSARGEN',
    # REGION XIII - Caraga
    'Agusan del Norte': 'Region XIII - Caraga', 'Agusan del Sur': 'Region XIII - Caraga', 'Dinagat Islands': 'Region XIII - Caraga', 'Surigao del Norte': 'Region XIII - Caraga', 'Surigao del Sur': 'Region XIII - Caraga',
    # NCR - National Capital Region
    'Metro Manila': 'NCR - National Capital Region',
    # BARMM
    'Basilan': 'BARMM', 'Lanao del Sur': 'BARMM', 'Maguindanao del Norte': 'BARMM', 'Maguindanao del Sur': 'BARMM', 'Sulu': 'BARMM', 'Tawi-Tawi': 'BARMM',
    # CAR - Cordillera Administrative Region
    'Abra': 'CAR - Cordillera Administrative Region', 'Apayao': 'CAR - Cordillera Administrative Region', 'Benguet': 'CAR - Cordillera Administrative Region', 'Ifugao': 'CAR - Cordillera Administrative Region', 'Kalinga': 'CAR - Cordillera Administrative Region', 'Mountain Province': 'CAR - Cordillera Administrative Region',
}

OFFICIAL_REGIONS = set(PROVINCE_TO_REGION_MAP.values())

def standardize_region(name):
    if not isinstance(name, str): # Handle non-string data
        return "Region Not Found"
    
    name = name.strip() # Remove leading/trailing whitespace

    if name in PROVINCE_TO_REGION_MAP:
        return PROVINCE_TO_REGION_MAP[name]
    
    region_aliases = {
        'Calabarzon': 'Region IV-A - CALABARZON', 'Mimaropa': 'Region IV-B - MIMAROPA', 'Bicol Region': 'Region V - Bicol Region', 'Western Visayas': 'Region VI - Western Visayas',
        'Central Visayas': 'Region VII - Central Visayas', 'Eastern Visayas': 'Region VIII - Eastern Visayas', 'Zamboanga Peninsula': 'Region IX - Zamboanga Peninsula', 'Northern Mindanao': 'Region X - Northern Mindanao',
        'Davao Region': 'Region XI - Davao Region', 'Soccsksargen': 'Region XII - SOCCSKSARGEN', 'Caraga': 'Region XIII - Caraga', 'Bangsamoro': 'BARMM',
        'Cordillera Administrative Region': 'CAR - Cordillera Administrative Region', 'Central Luzon': 'Region III - Central Luzon',
    }
    if name in region_aliases:
        return region_aliases[name]

    if name in OFFICIAL_REGIONS:
        return name
        
    return "Region Not Found"

# --- Main Script ---

input_csv = 'datas_completed_api.csv' 
output_csv = 'datas_final_standardized.csv'

print(f"Reading data from '{input_csv}'...")
df = pd.read_csv(input_csv, header=None, names=['latitude', 'longitude', 'mixed_name'])

print("Standardizing region names...")
df['final_region'] = df['mixed_name'].apply(standardize_region)

# Create the final DataFrame with only the columns you need.
final_df = df[['latitude', 'longitude', 'final_region']]

# Save the clean data to a new CSV file.
final_df.to_csv(output_csv, index=False, header=False)

# --- THESE PRINT STATEMENTS ARE CRITICAL FOR FEEDBACK ---
print("\nProcessing complete!")
print(f"Standardized data saved to: {output_csv}")
print("\n--- Sample of Final Data ---")
print(final_df.head())
print("\n--- Summary of Standardized Regions ---")
print(final_df['final_region'].value_counts())
# --------------------------------------------------------