"""
Data preprocessing for the prix-alimentaires visualization.
Loads INSEE's monthly average retail price series and extracts 5 food items
from January 1998 onward.
"""

import csv
import json
from pathlib import Path

RAW_CSV = Path('data/raw/famille_IPC-PM-2015_18082026/valeurs_mensuelles.csv')
OUTPUT_JSON = Path('public/data/prix/prix-alimentaires.json')

START_MONTH = '1998-01'

# Order fixes the legend order. Colors are hand-picked to evoke each item
# rather than drawn from the generic distinct-hue palette.
ITEMS = [
    {
        'id': 'baguette',
        'emoji': '🥖',
        'label': 'Pain baguette (1 kg)',
        'full_label': 'Prix moyens mensuels de vente au détail en métropole - Pain baguette (1 kg)',
        'id_bank': '000442423',
        'color': "#BB7A00",
    },
    {
        'id': 'boeuf-filet',
        'emoji': '🥩',
        'label': 'Bœuf : filet (1 kg)',
        'full_label': 'Prix moyens mensuels de vente au détail en métropole - Boeuf : filet (1 kg)',
        'id_bank': '000442432',
        'color': "#A72424",
    },
    {
        'id': 'pommes-de-terre',
        'emoji': '🥔',
        'label': 'Pommes de terre de conservation (1 kg)',
        'full_label': 'Prix moyens mensuels de vente au détail en métropole - Pommes de terre de conservation (1 kg)',
        'id_bank': '000641360',
        'color': "#C19B1F",
    },
    {
        'id': 'pommes',
        'emoji': '🍏',
        'label': 'Pommes (1 kg)',
        'full_label': 'Prix moyens mensuels de vente au détail en métropole - Pommes (1 kg)',
        'id_bank': '000641367',
        'color': "#2AF00C",
    },
    {
        'id': 'bananes',
        'emoji': '🍌',
        'label': 'Bananes (1 kg)',
        'full_label': 'Prix moyens mensuels de vente au détail en métropole - Bananes (1 kg)',
        'id_bank': '000641432',
        'color': '#F2C230',
    },
]

# Months where INSEE's retail price survey was suspended (COVID lockdowns).
# Every item is expected to be null exactly here and nowhere else - a sanity
# check below fails loudly if a raw-file refresh changes this.
KNOWN_GAP_MONTHS = {'2020-04', '2020-05', '2020-06', '2020-11', '2020-12'}


def prepare_data():
    print(f"Loading {RAW_CSV}...")
    with open(RAW_CSV, encoding='utf-8', newline='') as f:
        reader = csv.reader(f, delimiter=';', quotechar='"')
        header = next(reader)
        all_months = header[4:]
        start_idx = all_months.index(START_MONTH)
        months = all_months[start_idx:]

        rows_by_label = {row[0]: row for row in reader if row and row[0] != 'Codes'}

    items_out = []
    for item in ITEMS:
        row = rows_by_label.get(item['full_label'])
        if row is None:
            raise SystemExit(f"Label not found in raw CSV: {item['full_label']!r}")
        if row[1] != item['id_bank']:
            raise SystemExit(
                f"idBank mismatch for {item['full_label']!r}: expected {item['id_bank']}, got {row[1]}"
            )

        raw_values = row[4 + start_idx:4 + start_idx + len(months)]
        values = [float(v) if v.strip() else None for v in raw_values]

        gap_months = {m for m, v in zip(months, values) if v is None}
        if gap_months != KNOWN_GAP_MONTHS:
            raise SystemExit(
                f"{item['id']}: gap months {sorted(gap_months)} don't match the "
                f"expected COVID-suspension months {sorted(KNOWN_GAP_MONTHS)}. "
                "The raw file may have changed - review before proceeding."
            )

        items_out.append({
            'id': item['id'],
            'emoji': item['emoji'],
            'label': item['label'],
            'color': item['color'],
            'values': values,
        })
        print(f"  {item['id']}: {months[0]}={values[0]}  {months[-1]}={values[-1]}")

    data = {'months': months, 'items': items_out}

    OUTPUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_JSON, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, separators=(',', ':'))

    size_kb = OUTPUT_JSON.stat().st_size / 1024
    print(f"Wrote {OUTPUT_JSON} ({size_kb:.1f} KB), {len(months)} months x {len(items_out)} items")
    return data


if __name__ == '__main__':
    prepare_data()
