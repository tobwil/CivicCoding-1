"""Read ALBA's workbook without modifying it. Emit a reproducible JSON catalog."""
import json
import re
import sys
import unicodedata
import openpyxl

sheet = openpyxl.load_workbook(sys.argv[1], data_only=True)["Contenttabelle"]
keys = ["name", "title", "teaser", "tip", "description", "stepsText", "adaptation", "quote", "coach", "materials", "homework", "preparation", "ageNew", "ageGuided", "ageIndependent", "minChildren", "maxChildren", "attractiveness", "rules", "form", "themes", "kitaContext", "schoolContext", "sportswear", "intensity", "coreGame", "category", "social", "basketball", "technique", "tactics", "conditioning", "notes"]
games = []
for row_number, row in enumerate(sheet.iter_rows(min_row=2, values_only=True), 2):
    if not row[0]:
        continue
    game = {key: value.strip() if isinstance(value, str) else value for key, value in zip(keys, row)}
    name = unicodedata.normalize("NFKD", game["name"]).encode("ascii", "ignore").decode().lower()
    game["id"] = "alba-" + re.sub(r"[^a-z0-9]+", "-", name).strip("-")
    game["steps"] = [s.strip() for s in re.split(r"(?:^|\s)\d+\.\s*", game.pop("stepsText") or "") if s.strip()]
    game["sourceRow"] = row_number
    games.append(game)
print(json.dumps(games, ensure_ascii=False, indent=2))
