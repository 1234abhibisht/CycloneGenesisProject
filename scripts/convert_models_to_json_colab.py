"""
Optional: convert the trained XGBoost storm models (outputs/models/y_*.joblib) to portable JSON files.
export_artifacts_colab.py already does this for you; run this only to refresh the JSON files on their own.

    Colab cell:
        from google.colab import drive; drive.mount('/content/drive')
        !python /content/drive/MyDrive/CycloneProject/convert_models_to_json_colab.py

Writes <target>.json next to each <target>.joblib in outputs/models. The backend loads the JSON file when it
exists (pickled XGBoost models can fail to load on another machine; JSON always loads).
"""
import os
from pathlib import Path

import joblib

PROJECT = Path(os.environ.get("CYCLONE_PROJECT", "/content/drive/MyDrive/CycloneProject"))
MODELS = PROJECT / "outputs" / "models"

done = 0
for src in sorted(MODELS.glob("y_*.joblib")):
    m = joblib.load(src)
    if not hasattr(m, "get_booster"):
        print("skip (not XGBoost):", src.name)
        continue
    m.save_model(str(src.with_suffix(".json")))
    done += 1
    print("ok:", src.with_suffix(".json").name)
print(f"{done} models converted in {MODELS}")
