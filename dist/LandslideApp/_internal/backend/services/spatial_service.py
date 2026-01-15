import rasterio
import geopandas as gpd
import numpy as np
from shapely.geometry import Point
from pyproj import Transformer
import logging

logger = logging.getLogger(__name__)

class SpatialService:
    def __init__(self, soil_path, slope_path):
        self.slope_path = slope_path
        self.soil_gdf = None
        
        # Load Soil Shapefile once on startup
        try:
            self.soil_gdf = gpd.read_file(soil_path)
            self.soil_gdf.sindex  # Create spatial index
            logger.info("Soil shapefile loaded successfully.")
        except Exception as e:
            logger.error(f"Error loading soil shapefile: {e}")

    def _convert_coords(self, lon, lat, crs):
        transformer = Transformer.from_crs("EPSG:4326", crs, always_xy=True)
        return transformer.transform(lon, lat)

    def get_soil_type(self, lon, lat):
        if self.soil_gdf is None:
            return "Error: Shapefile not loaded"
        
        point = Point(lon, lat)
        if not point.is_valid:
            return "Error: Invalid coordinates"

        # Use spatial index for faster lookup
        possible_matches_index = list(self.soil_gdf.sindex.intersection(point.bounds))
        possible_matches = self.soil_gdf.iloc[possible_matches_index]
        
        exact_matches = possible_matches[possible_matches.intersects(point)]
        
        if not exact_matches.empty:
            return exact_matches.iloc[0].get("SNUM", "Unknown")
            
        return "Unknown"

    def get_slope(self, lon, lat):
        try:
            with rasterio.open(self.slope_path) as src:
                x, y = self._convert_coords(lon, lat, src.crs)
                
                # Check bounds
                if not (src.bounds.left <= x <= src.bounds.right and 
                        src.bounds.bottom <= y <= src.bounds.top):
                    return None

                row, col = src.index(x, y)
                
                # Read specific pixel
                window = ((row, row + 1), (col, col + 1))
                data = src.read(1, window=window, boundless=True)
                
                val = data[0, 0]
                
                if src.nodata is not None and val == src.nodata:
                    return None
                if np.isnan(val):
                    return None
                    
                return float(val)
        except Exception as e:
            logger.error(f"Error reading slope TIF: {e}")
            return None