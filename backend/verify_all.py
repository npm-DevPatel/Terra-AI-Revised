"""Final verification of all backend modules"""
import ast, os, sys

files = [
    'spatial/soil.py',
    'spatial/zones.py',
    'spatial/elevation.py',
    'spatial/shapely_engine.py',
    'spatial/routes.py',
    'spatial/gemini_synth.py',
]

all_ok = True
for fname in files:
    ok = False
    for enc in ['utf-8-sig', 'utf-8', 'utf-16']:
        try:
            with open(fname, 'r', encoding=enc) as f:
                src = f.read()
            ast.parse(src)
            print(f'  OK  {fname}')
            ok = True
            break
        except SyntaxError as e:
            print(f'FAIL  {fname} -> {e}')
            all_ok = False
            ok = True
            break
        except UnicodeDecodeError:
            continue
    if not ok:
        print(f'READ_ERR  {fname}')
        all_ok = False

print()

# Verify routes.py has all required payload fields
import re
with open('spatial/routes.py', 'r', encoding='utf-8') as f:
    routes_src = f.read()

checks = [
    (r'"zones".*lambda.*compute_zone_risks', 'zones task in dict'),
    (r'"soil".*lambda.*fetch_soil_data', 'soil task in dict'),
    (r'compute_zone_risks', 'zones imported+called'),
    (r'demolition_risk', 'demolition_risk in payload'),
    (r'aviation_height_restriction', 'aviation_height_restriction'),
    (r'is_topographical_sinkhole', 'is_topographical_sinkhole'),
    (r'chirps_max_rainfall_mm', 'chirps_max_rainfall_mm'),
    (r'riparian_data_source', 'riparian_data_source'),
    (r'gee_data\.get\(.slope_percent.\)', 'slope from GEE'),
    (r'zones_data\.get\(.demolition_risk', 'zones_data mapped to payload'),
]

print("routes.py payload checks:")
for pattern, label in checks:
    found = bool(re.search(pattern, routes_src))
    status = '  OK' if found else 'MISS'
    if not found:
        all_ok = False
    print(f'  {status}  {label}')

print()
print('ALL CHECKS PASSED' if all_ok else 'SOME CHECKS FAILED')
sys.exit(0 if all_ok else 1)
