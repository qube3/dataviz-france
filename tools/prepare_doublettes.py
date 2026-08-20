"""
Data preprocessing for the "Doublettes de spécialités en Terminale" visualization.
Loads data/raw/fr-en-effectifs-specialites-doublettes-terminale-generale.csv,
aggregates per-lycée headcounts into national yearly counts per (gender,
doublette), and exports a compact JSON for the browser.
"""

import json
import re
from pathlib import Path

import pandas as pd

RAW_CSV = Path('data/raw/fr-en-effectifs-specialites-doublettes-terminale-generale.csv')
OUTPUT_JSON = Path('public/data/doublettes/doublettes.json')

# The 16 doublette pairs (+ the "AUTRES COMBINAISONS" catch-all) live at this
# fixed column range - verified positionally rather than by suffix matching,
# since nearby single-specialty columns inconsistently spell "garcons" with
# or without a cedilla.
DOUBLETTE_COL_START = 57
DOUBLETTE_COL_END = 89  # exclusive

COL_PATTERN = re.compile(r'^(?:(\d{4}) - )?(.+?) - (?:filles|garcons)$')


def prepare_data():
    print(f"Loading {RAW_CSV}...")
    # utf-8-sig: this CSV ships with a BOM, unlike the other raw CSVs in data/raw/.
    df = pd.read_csv(RAW_CSV, sep=';', encoding='utf-8-sig')

    doublette_cols = df.columns[DOUBLETTE_COL_START:DOUBLETTE_COL_END].tolist()
    assert len(doublette_cols) == 32, f"expected 32 doublette columns, got {len(doublette_cols)}"

    df[doublette_cols] = df[doublette_cols].apply(pd.to_numeric, errors='coerce').fillna(0)

    years = sorted(int(y) for y in df['Rentrée scolaire'].unique())
    sums = df.groupby('Rentrée scolaire')[doublette_cols].sum().reindex(years, fill_value=0)

    print(f"years {years}")

    entries = []
    for i in range(0, len(doublette_cols), 2):
        col_filles, col_garcons = doublette_cols[i], doublette_cols[i + 1]
        m = COL_PATTERN.match(col_filles)
        assert m, f"unexpected column header: {col_filles!r}"
        code, label = m.groups()

        filles = sums[col_filles].astype(int).tolist()
        garcons = sums[col_garcons].astype(int).tolist()
        entry = {
            'id': code or 'AUTRES',
            'label': label.replace('/', ' / '),
            'filles': filles,
            'garcons': garcons,
            'total': sum(filles) + sum(garcons),
        }
        if code is None:
            entry['rare'] = True
        entries.append(entry)

    entries.sort(key=lambda e: (e.get('rare', False), -e['total']))
    for e in entries:
        del e['total']

    print(f"{len(entries)} doublette categories: {[e['id'] for e in entries]}")
    for y in years:
        idx = years.index(y)
        tot_f = sum(e['filles'][idx] for e in entries)
        tot_g = sum(e['garcons'][idx] for e in entries)
        print(f"  {y}: filles={tot_f} garcons={tot_g}")

    data = {'years': years, 'doublettes': entries}

    OUTPUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_JSON, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, separators=(',', ':'))

    size_kb = OUTPUT_JSON.stat().st_size / 1024
    print(f"Wrote {OUTPUT_JSON} ({size_kb:.0f} KB)")
    return data


if __name__ == '__main__':
    prepare_data()
