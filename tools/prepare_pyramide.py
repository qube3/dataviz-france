"""
Data preprocessing for the "Pyramide des âges" visualization.
Loads data/raw/donnees_pyramide_act.csv (INSEE, population estimates by sex
and single year of age, 1991-2026) and exports a compact JSON for the browser.
"""

import csv
import json
from collections import defaultdict
from pathlib import Path

RAW_CSV = Path('data/raw/donnees_pyramide_act.csv')
OUTPUT_JSON = Path('public/data/pyramide/pyramide.json')


def prepare_data():
    print(f"Loading {RAW_CSV}...")
    with open(RAW_CSV, encoding='utf-8-sig', newline='') as f:
        rows = list(csv.DictReader(f, delimiter=';'))

    years = sorted({int(r['ANNEE']) for r in rows})
    ages = sorted({int(r['AGE']) for r in rows})

    # The source has a couple of glitched cells (a missing row, a duplicated
    # row with two conflicting values for the same year/sex/age); treat both
    # as "no reliable value" and fill them by interpolating from the same
    # age in the nearest surrounding years, rather than trusting whichever
    # duplicate happens to be read last.
    raw_values = defaultdict(list)
    for r in rows:
        raw_values[(int(r['ANNEE']), r['SEXE'], int(r['AGE']))].append(int(r['POP']))

    pop = {}
    for sex in ('M', 'F'):
        for age in ages:
            for year in years:
                vals = raw_values.get((year, sex, age), [])
                pop[(year, sex, age)] = vals[0] if len(vals) == 1 else None

            known_years = [y for y in years if pop[(y, sex, age)] is not None]
            for year in years:
                if pop[(year, sex, age)] is not None:
                    continue
                before = max((y for y in known_years if y < year), default=None)
                after = min((y for y in known_years if y > year), default=None)
                if before is not None and after is not None:
                    v0, v1 = pop[(before, sex, age)], pop[(after, sex, age)]
                    pop[(year, sex, age)] = round(v0 + (v1 - v0) * (year - before) / (after - before))
                elif before is not None:
                    pop[(year, sex, age)] = pop[(before, sex, age)]
                elif after is not None:
                    pop[(year, sex, age)] = pop[(after, sex, age)]
                else:
                    raise SystemExit(f"No usable data at all for sex={sex} age={age}")
                print(f"  Interpolated sex={sex} age={age} year={year} -> {pop[(year, sex, age)]}")

    men = [[pop[(year, 'M', age)] for age in ages] for year in years]
    women = [[pop[(year, 'F', age)] for age in ages] for year in years]

    data = {'years': years, 'ages': ages, 'men': men, 'women': women}

    OUTPUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_JSON, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, separators=(',', ':'))

    size_kb = OUTPUT_JSON.stat().st_size / 1024
    print(
        f"Wrote {OUTPUT_JSON} ({size_kb:.1f} KB), "
        f"{len(years)} years ({years[0]}-{years[-1]}) x {len(ages)} ages x 2 sexes"
    )
    return data


if __name__ == '__main__':
    prepare_data()
