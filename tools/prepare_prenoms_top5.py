"""
Data preprocessing for the "Top 5 des prénoms" visualization.
Loads data/raw/prenoms-2025-dpt.csv, aggregates department-level counts into
national yearly counts per name, and exports every name that was ever in the
all-time top 5 or in a rolling 5-year-window top 5 (at any point 1900-2025),
per gender, as a columnar JSON for the browser. The frontend picks either
ranking client-side from these raw yearly counts.
"""

import json
from pathlib import Path

import pandas as pd

RAW_CSV = Path('data/raw/prenoms-2025-dpt.csv')
OUTPUT_JSON = Path('public/data/prenoms/prenoms-top5.json')

# INSEE aggregates every rare name under this label; not an actual name.
RARE_BUCKET = '_PRENOMS_RARES'
TOP_N = 5
ROLLING_WINDOW = 5


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

    candidates = {}
    for gender in genders:
        gender_df = national[national['sexe'] == gender]

        # name x year matrix of raw annual counts, 0-filled.
        pivot = gender_df.pivot_table(index='prenoms', columns='année', values='nombre', fill_value=0)
        pivot = pivot.reindex(columns=years, fill_value=0)

        totals = pivot.sum(axis=1).sort_values(ascending=False)

        # Trailing 5-year-window sum per name per year, to find every name
        # that was ever a rolling top 5 - not just the all-time top 5, which
        # would miss recent names too young to have amassed a big lifetime
        # total (e.g. a name only fashionable since 2010).
        rolling = pivot.T.rolling(window=ROLLING_WINDOW, min_periods=1).sum().T

        candidate_names = set(totals.head(TOP_N).index)
        for year in years:
            candidate_names.update(rolling[year].sort_values(ascending=False).head(TOP_N).index)

        ordered_names = [n for n in totals.index if n in candidate_names]
        print(f"gender {gender}: {len(ordered_names)} candidate names")

        entries = [
            {'name': name, 'total': int(totals[name]), 'values': pivot.loc[name, years].astype(int).tolist()}
            for name in ordered_names
        ]
        candidates[str(gender)] = entries

    data = {'years': [year_lo, year_hi], 'candidates': candidates}

    OUTPUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_JSON, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, separators=(',', ':'))

    size_kb = OUTPUT_JSON.stat().st_size / 1024
    print(f"Wrote {OUTPUT_JSON} ({size_kb:.0f} KB)")
    return data


if __name__ == '__main__':
    prepare_data()
