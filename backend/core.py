"""
Loads the training code (`cyclone_core`, identical to the Colab project's `src/`)
so the backend computes features exactly like training did.

The package is also registered as `src`, because pickled objects saved in Colab
(e.g. the occurrence calibrator) refer to classes as `src.occurrence....`.
"""
import importlib
import os
import sys

import config as CFG

os.environ.setdefault("CYCLONE_PROJECT", str(CFG.ARTIFACTS_DIR))

import cyclone_core  # noqa: E402

sys.modules.setdefault("src", cyclone_core)
_SUBMODULES = ["config", "common", "tracks", "labels", "features_grid", "features_storm",
               "occurrence", "strike", "baselines", "models", "metrics"]
for _name in _SUBMODULES:
    _mod = importlib.import_module(f"cyclone_core.{_name}")
    sys.modules.setdefault(f"src.{_name}", _mod)

from cyclone_core import config as C  # noqa: E402,F401
from cyclone_core import common, tracks, labels, features_grid, features_storm, occurrence, strike  # noqa: E402,F401
