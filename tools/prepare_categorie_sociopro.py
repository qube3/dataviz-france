"""
Data preprocessing for the "Catégories socioprofessionnelles" visualization.
Loads data/raw/categorie-sociopro.csv (INSEE, share of each socio-professional
category among the employed population, by year) and exports a compact JSON
for the browser.
"""

import csv
import json
from pathlib import Path

RAW_CSV = Path('data/raw/categorie-sociopro.csv')
OUTPUT_JSON = Path('public/data/economie/categorie-sociopro.json')

# Order fixes the stacking order (bottom to top) and the legend order: the
# official INSEE PCS category order (1-6), which the raw CSV columns already
# follow. Colors are hand-picked and validated for CVD-safe adjacency
# (dataviz skill, Okabe-Ito qualitative palette) rather than drawn from the
# generic distinct-hue palette, since these are always the same six fixed
# categories rather than a ranked, open-ended list.
SERIES = [
    {'id': 'agriculteurs', 'label': 'Agriculteurs', 'column': 'Agriculteurs', 'color': '#0072B2'},
    {
        'id': 'artisans-commercants',
        'label': "Artisans, commerçants et chefs d'entreprise",
        'column': "Artisans.\ncommerçants\net chefs d'entreprise",
        'color': '#D55E00',
    },
    {'id': 'cadres', 'label': 'Cadres', 'column': 'Cadres', 'color': '#009E73'},
    {
        'id': 'professions-intermediaires',
        'label': 'Professions intermédiaires',
        'column': 'Professions intermédiaires',
        'color': '#CC79A7',
    },
    {'id': 'employes', 'label': 'Employés', 'column': 'Employés', 'color': '#E69F00'},
    {'id': 'ouvriers', 'label': 'Ouvriers', 'column': 'Ouvriers', 'color': '#56B4E9'},
]


def prepare_data():
    print(f"Loading {RAW_CSV}...")
    with open(RAW_CSV, encoding='utf-8-sig', newline='') as f:
        rows = list(csv.DictReader(f))

    rows.sort(key=lambda r: int(r['Année']))
    years = [int(r['Année']) for r in rows]

    series_out = []
    for s in SERIES:
        values = [round(float(r[s['column']]), 1) for r in rows]
        series_out.append({'id': s['id'], 'label': s['label'], 'color': s['color'], 'values': values})
        print(f"  {s['id']}: {years[0]}={values[0]}  {years[-1]}={values[-1]}")

    # Sanity check: the six categories should sum close to 100%. INSEE's source
    # leaves a small residual (~0.2-1.7 pt, shrinking over time) for people
    # outside these six PCS groups (military, unclassified); the stacked chart
    # implicitly renormalizes over the six known categories, so a residual up
    # to a few points is expected and not a data error.
    for i, year in enumerate(years):
        summed = sum(s['values'][i] for s in series_out)
        if abs(summed - 100.0) > 3.0:
            raise SystemExit(f"{year}: category sum {summed} doesn't match 100")

    data = {'years': years, 'series': series_out}

    OUTPUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_JSON, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, separators=(',', ':'))

    size_kb = OUTPUT_JSON.stat().st_size / 1024
    print(f"Wrote {OUTPUT_JSON} ({size_kb:.1f} KB), {len(years)} years x {len(series_out)} series")
    return data


if __name__ == '__main__':
    prepare_data()
