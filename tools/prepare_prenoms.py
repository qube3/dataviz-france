"""
Data preprocessing for the prenoms visualization.
Loads data/raw/prenoms-2025-dpt.csv, finds the winning (most popular) name per
department/year/gender, and exports a columnar JSON for the browser.
"""

import json
from pathlib import Path

import pandas as pd

RAW_CSV = Path('data/raw/prenoms-2025-dpt.csv')
OUTPUT_JSON = Path('public/data/prenoms/prenoms.json')

# INSEE aggregates every rare name under this label; it isn't an actual
# most-popular name and would otherwise outrank real names in
# low-population departments.
RARE_BUCKET = '_PRENOMS_RARES'


def prepare_data():
    print(f"Loading {RAW_CSV}...")
    # dpt must be read as string: Corsica is split into "2A"/"2B" and other
    # codes are zero-padded ("01", ...) to match the GeoJSON department codes.
    df = pd.read_csv(RAW_CSV, sep=';', dtype={'dpt': str})

    df = df.rename(columns={
        'prenom': 'prenoms',
        'periode': 'année',
        'valeur': 'nombre',
    })
    df['dpt'] = df['dpt'].str.strip()

    # Drop the DOM (Guadeloupe 971, Martinique 972, Guyane 973, Réunion 974,
    # Mayotte 976): metropolitan-France-only decision, and none of them has a
    # polygon in the 96-feature departments GeoJSON anyway.
    df = df[~df['dpt'].str.startswith('97')].copy()

    print(f"Before excluding {RARE_BUCKET}: {len(df)} rows")
    df = df[df['prenoms'] != RARE_BUCKET].copy()
    print(f"After excluding {RARE_BUCKET}: {len(df)} rows")

    # One winning name per (sexe, année, dpt): highest nombre wins.
    grouped = df.sort_values('nombre', ascending=False).drop_duplicates(
        subset=['sexe', 'année', 'dpt'], keep='first'
    ).reset_index(drop=True)
    print(f"Aggregated to {len(grouped)} rows (one per dept/year/gender)")

    departments = sorted(grouped['dpt'].unique().tolist())
    year_lo, year_hi = int(grouped['année'].min()), int(grouped['année'].max())
    years = list(range(year_lo, year_hi + 1))
    genders = sorted(int(g) for g in grouped['sexe'].unique())

    print(f"{len(departments)} departments, years {year_lo}-{year_hi}, genders {genders}")

    # Names ordered by total popularity across the whole winning-name
    # dataset, most popular first. The array index becomes the stable
    # palette index used client-side (viz-kit/color/palette.ts), so this
    # ordering is computed once here instead of scanned on every page load.
    total_counts = grouped.groupby('prenoms')['nombre'].sum().sort_values(ascending=False)
    names = total_counts.index.tolist()
    name_to_idx = {name: idx for idx, name in enumerate(names)}

    dept_index = {code: i for i, code in enumerate(departments)}

    series = {}
    counts = {}
    for gender in genders:
        gender_df = grouped[grouped['sexe'] == gender]
        # cell[year_idx][dept_idx] = (name_idx, nombre), default (-1, 0)
        cells = [[(-1, 0)] * len(departments) for _ in years]
        for row in gender_df.itertuples(index=False):
            year_idx = row.année - year_lo
            dept_idx = dept_index[row.dpt]
            cells[year_idx][dept_idx] = (name_to_idx[row.prenoms], int(row.nombre))

        series[str(gender)] = [[c[0] for c in row] for row in cells]
        counts[str(gender)] = [[c[1] for c in row] for row in cells]

    data = {
        'years': [year_lo, year_hi],
        'departments': departments,
        'names': names,
        'series': series,
        'counts': counts,
    }

    OUTPUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_JSON, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, separators=(',', ':'))

    size_kb = OUTPUT_JSON.stat().st_size / 1024
    print(f"Wrote {OUTPUT_JSON} ({size_kb:.0f} KB)")
    return data


if __name__ == '__main__':
    prepare_data()
