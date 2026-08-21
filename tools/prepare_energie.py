"""
Data preprocessing for the "Mix électrique français" visualization.
Loads data/raw/prod-national-annuel-filiere.csv (RTE eco2mix, annual national
production by sector) and exports a compact JSON for the browser.
"""

import csv
import json
from pathlib import Path

RAW_CSV = Path('data/raw/prod-national-annuel-filiere.csv')
OUTPUT_JSON = Path('public/data/energie/mix-electrique.json')

# Order fixes the stacking order (bottom to top) and the legend order: the
# large, stable base (nuclear) at the bottom, then the other steady sources,
# with the fast-growing renewables (wind, solar, bioenergy) stacked on top so
# their growth is legible at the top edge of the chart. Colors are hand-picked
# per source and validated for CVD-safe adjacency (dataviz skill) rather than
# drawn from the generic distinct-hue palette.
SERIES = [
    {'id': 'nucleaire', 'label': 'Nucléaire', 'column': 'Production nucléaire (TWh)', 'color': '#4a3aa7'},
    {'id': 'hydraulique', 'label': 'Hydraulique', 'column': 'Production hydraulique (TWh)', 'color': '#1baf7a'},
    {'id': 'thermique', 'label': 'Thermique fossile', 'column': 'Production thermique (TWh)', 'color': '#eb6834'},
    {'id': 'eolien', 'label': 'Éolien', 'column': 'Production éolienne (TWh)', 'color': '#2a78d6'},
    {'id': 'solaire', 'label': 'Solaire', 'column': 'Production solaire (TWh)', 'color': '#eda100'},
    {'id': 'bioenergies', 'label': 'Bioénergies', 'column': 'Production bioénergies (TWh)', 'color': '#008300'},
]


def prepare_data():
    print(f"Loading {RAW_CSV}...")
    with open(RAW_CSV, encoding='utf-8-sig', newline='') as f:
        rows = list(csv.DictReader(f, delimiter=';'))

    rows.sort(key=lambda r: int(r['Année']))
    years = [int(r['Année']) for r in rows]

    series_out = []
    for s in SERIES:
        values = [round(float(r[s['column']]), 1) for r in rows]
        series_out.append({'id': s['id'], 'label': s['label'], 'color': s['color'], 'values': values})
        print(f"  {s['id']}: {years[0]}={values[0]}  {years[-1]}={values[-1]}")

    # Sanity check: the six filières should sum close to "Production totale".
    totals = [round(float(r['Production totale (TWh)']), 1) for r in rows]
    for i, year in enumerate(years):
        summed = sum(s['values'][i] for s in series_out)
        if abs(summed - totals[i]) > 1.0:
            raise SystemExit(f"{year}: filière sum {summed} doesn't match total {totals[i]}")

    data = {'years': years, 'series': series_out}

    OUTPUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_JSON, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, separators=(',', ':'))

    size_kb = OUTPUT_JSON.stat().st_size / 1024
    print(f"Wrote {OUTPUT_JSON} ({size_kb:.1f} KB), {len(years)} years x {len(series_out)} series")
    return data


if __name__ == '__main__':
    prepare_data()
