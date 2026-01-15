import requests
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

class WeatherService:
    BASE_URL = "https://api.open-meteo.com/v1/forecast"

    def fetch_data(self, lat, lon, end_date_str, end_time_str):
        end_datetime = datetime.strptime(f"{end_date_str} {end_time_str}", "%Y-%m-%d %H:%M")
        start_date = end_datetime - timedelta(days=6)

        params = {
            "latitude": lat,
            "longitude": lon,
            "hourly": "precipitation,soil_moisture_27_to_81cm",
            "start_date": start_date.strftime("%Y-%m-%d"),
            "end_date": end_datetime.strftime("%Y-%m-%d"),
            "timezone": "auto",
            "forecast_days": 0,
            "precipitation_unit": "inch",
        }

        resp = requests.get(self.BASE_URL, params=params, timeout=10)
        resp.raise_for_status()
        data = resp.json()

        # Process DataFrame
        hourly = data.get("hourly", {})
        df = pd.DataFrame({
            "timestamp": pd.to_datetime(hourly["time"]),
            "rain_mm": np.array(hourly["precipitation"]),
            "soil_moisture": np.array(hourly["soil_moisture_27_to_81cm"]),
        }).fillna(0.0)

        # Filter strictly by user time
        df = df[df["timestamp"] <= end_datetime]
        
        return self._calculate_metrics(df, end_datetime)

    def _calculate_metrics(self, df, end_datetime):
        if df.empty:
            return {"error": "No data available"}

        def get_stats(hours):
            start = end_datetime - timedelta(hours=hours)
            mask = (df["timestamp"] > start) & (df["timestamp"] <= end_datetime)
            total = float(df.loc[mask, "rain_mm"].sum())
            intensity = total / hours if hours > 0 else 0.0
            return total, intensity

        windows = {"3_hr": 3, "6_hr": 6, "12_hr": 12, "1_day": 24, "3_day": 72, "5_day": 120}
        
        cumulative = {}
        intensity = {}
        
        for k, h in windows.items():
            tot, inten = get_stats(h)
            cumulative[k] = tot
            intensity[k] = inten

        # Chart Data Generation
        hourly_chart = []
        last_12 = df.tail(12)
        running_cum = 0
        for _, row in last_12.iterrows():
            running_cum += row["rain_mm"]
            hourly_chart.append({
                "hour": row["timestamp"].strftime("%H:00"),
                "cumulative": running_cum,
                "intensity": row["rain_mm"]
            })

        daily_chart = []
        daily_grp = df.groupby(df['timestamp'].dt.date).agg(
            total=('rain_mm', 'sum'),
            avg_intensity=('rain_mm', lambda x: x.sum()/24)
        ).reset_index()
        
        # Take last 5 days
        for _, row in daily_grp.tail(5).iterrows():
            daily_chart.append({
                "date": row["timestamp"].strftime("%b %d"),
                "cumulative": float(row["total"]),
                "intensity": float(row["avg_intensity"])
            })

        return {
            "soil_moisture": float(df["soil_moisture"].iloc[-1]),
            "cumulative_rainfall": cumulative,
            "rain_intensity": intensity,
            "hourly_chart_data": hourly_chart,
            "daily_chart_data": daily_chart,
        }