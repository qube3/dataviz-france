"""
Data preprocessing for the "Top 5 des prénoms" visualization.
Loads data/raw/prenoms-2025-dpt.csv, aggregates department-level counts into
national yearly counts per name, and exports the all-time top 5 names per
gender (by total births 1900-2025) as a columnar JSON for the browser.
"""

import json
from pathlib import Path

import pandas as pd

RAW_CSV = Path('data/raw/prenoms-2025-dpt.csv')
OUTPUT_JSON = Path('public/data/prenoms/prenoms-top5.json')

# INSEE aggregates every rare name under this label; not an actual name.
RARE_BUCKET = '_PRENOMS_RARES'
TOP_N = 5


def prepare_data():
    print(f"Loading {RAW_CSV}...")
    df = pd.read_csv(RAW_CSV, sep=';', dtype={'dpt': str})
    df = df.rename(columns={'prenom': 'prenoms', 'periode': 'année', 'valeur': 'nombre'})
    df['dpt'] = df['dpt'].str.strip()

    # Metropolitan-France-only, matching the map viz's dataset.
    df = df[~df['dpt'].str.startswith('97')].copy()
    df = df[df['prenoms'] != RARE_BUCKET].copy()

    # National yearly count per (sexe, prenom): sum across departments.
    national = df.groupby(['sexe', 'prenoms', 'année'])['nombre'].sum().reset_index()

    year_lo, year_hi = int(df['année'].min()), int(df['année'].max())
    years = list(range(year_lo, year_hi + 1))
    genders = sorted(int(g) for g in national['sexe'].unique())

    print(f"years {year_lo}-{year_hi}, genders {genders}")

    top5 = {}
    for gender in genders:
        gender_df = national[national['sexe'] == gender]
        totals = gender_df.groupby('prenoms')['nombre'].sum().sort_values(ascending=False)
        top_names = totals.head(TOP_N).index.tolist()
        print(f"gender {gender} top {TOP_N}: {top_names}")

        entries = []
        for name in top_names:
            by_year = gender_df[gender_df['prenoms'] == name].set_index('année')['nombre']
            values = [int(by_year.get(y, 0)) for y in years]
            entries.append({'name': name, 'total': int(totals[name]), 'values': values})

        top5[str(gender)] = entries

    data = {'years': [year_lo, year_hi], 'top5': top5}

    OUTPUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_JSON, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, separators=(',', ':'))

    size_kb = OUTPUT_JSON.stat().st_size / 1024
    print(f"Wrote {OUTPUT_JSON} ({size_kb:.0f} KB)")
    return data


if __name__ == '__main__':
    prepare_data()
