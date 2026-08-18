"""
Downloads and caches the French departments GeoJSON to data/raw/.
`npm run data:geo` runs this, then simplifies/converts the result to
TopoJSON with mapshaper.
"""

import json
import os
import urllib.request

GEOJSON_URL = "https://raw.githubusercontent.com/gregoiredavid/france-geojson/master/departements.geojson"
OUTPUT_PATH = "data/raw/departements.geojson"


def main():
    print("Downloading French department GeoJSON...")
    with urllib.request.urlopen(GEOJSON_URL, timeout=10) as response:
        geojson_data = json.loads(response.read())

    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(geojson_data, f)

    print(f"Downloaded {len(geojson_data['features'])} features -> {OUTPUT_PATH}")


if __name__ == '__main__':
    main()
