# RANDOM FOREST IN FORECASTING RAIN-INDUCED LANDSLIDES

## Abstract
Recent studies in the Philippines on landslides have primarily focused on susceptibility mapping and generation of hazard maps. Whereas, research on landslide forecasting remains less explored. As artificial intelligence continues to progress, forecasting methods have become more advanced, allowing opportunities to predict landslide occurrences before they happen. 

The study focuses on rainfall, a primary triggering factor of landslides, examining its relationship with environmental variables such as slope, soil type, and soil moisture to predict potential landslide events. The study applies the random forest model to forecast landslides using a minimized yet significant set of predictors. 

One-Way ANOVA was conducted to assess differences in model performance under various combinations of input variables, followed by post hoc tests to determine the most effective predictive variables. The researchers found out that combining rainfall and environmental variables as predictors yielded the highest accuracy at 90%, outperforming models that use only individual variable inputs. These findings demonstrate the effectiveness of the random forest model in forecasting landslides even with limited resources and data.
## Built With

*   **Framework:** Flask
*   **Data Science:** Pandas, NumPy, Scikit-learn
*   **Geospatial:** GeoPandas, Rasterio, Shapely
*   **AI/LLM:** Google GenAI
*   **APIs:** OpenMeteo, OpenStreetMap, MapBox
### Prerequisites

*   **Python 3.8+**
*   **Git**
*   **Git LFS** (Required for downloading large files)
    *   **Windows:** Download from [git-lfs.com](https://git-lfs.com/) (often included with Git for Windows).
    *   **macOS:** `brew install git-lfs`
    *   **Linux (Ubuntu/Debian):** `sudo apt-get install git-lfs`

**1. Install Git LFS & Clone the Repository**
You must initialize LFS before accessing the data files to ensure large assets (models/maps) download correctly.

```bash
git lfs install
git clone https://github.com/Lamatz/Thesis-TwoStepsAhead
cd Thesis-TwoStepsAhead
git lfs pull
```

**2. Create a Virtual Environment**
It is recommended to use a virtual environment to manage dependencies.

*   **Windows:**
    ```bash
    python -m venv venv
    ```
*   **macOS / Linux:**
    ```bash
    python3 -m venv venv
    ```

**3. Activate the Virtual Environment**

*   **Windows (Command Prompt):**
    ```cmd
    venv\Scripts\activate
    ```
*   **Windows (PowerShell):**
    ```powershell
    .\venv\Scripts\Activate.ps1
    ```
*   **macOS / Linux:**
    ```bash
    source venv/bin/activate
    ```

> [!NOTE]
> You will know the environment is active when you see `(venv)` at the start of your command line.

**4. Install Dependencies**
Now that the environment is active, install the required packages:

```bash
pip install -r requirements.txt
```

> [!WARNING]
> **Windows Users:** Installing `geopandas` and `rasterio` via pip on Windows can sometimes fail due to C++ dependency compilation. If `pip install` fails, it is highly recommended to use **Conda** instead, or download the pre-compiled `.whl` files for GDAL and Rasterio from [Christoph Gohlke's libs](https://www.lfd.uci.edu/~gohlke/pythonlibs/).

### Configuration

1.  Create a `.env` file in the root directory.
2.  Add your Google GenAI API key:

```ini
# .env content
GOOGLE_API_KEY=your_api_key_here
```

## Run Locally

Once you have installed the dependencies and configured your `.env` file, follow these steps to start the application.

**1. Activate the Virtual Environment**
(If you closed your terminal, activate it again).

*   **Windows:** `venv\Scripts\activate`
*   **Mac/Linux:** `source venv/bin/activate`

**2. Start the Server**
Run the server file from the root directory:

```bash
# Windows
python backend/server.py

# macOS / Linux
python3 backend/server.py
```

You should see output indicating the Flask server is running.


**3. Open the Application**

you may open the HTML files directly, but ensure the backend server is running first to handle API requests
