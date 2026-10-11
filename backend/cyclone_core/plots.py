"""Figures for results and the PPT (all saved as PNG at 200 dpi)."""
import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

from . import config as C

HIGHLIGHT = {"XGBoost": "#D9822B", "Stacked ensemble": "#1F8A8A", "Persistence": "#888888",
             "CLIPER": "#555555", "SHIFOR": "#555555"}


def _save(fig, path):
    path.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(path, dpi=200, bbox_inches="tight")
    plt.close(fig)
    return path


def lead_lines(comp, metric, ylabel, title, path):
    """comp: DataFrame with columns model, lead_h, <metric>."""
    fig, ax = plt.subplots(figsize=(8, 5))
    for model, g in comp.groupby("model"):
        g = g.sort_values("lead_h")
        hl = model in HIGHLIGHT
        ax.plot(g["lead_h"], g[metric], marker="o", lw=2.6 if hl else 1.2,
                color=HIGHLIGHT.get(model), alpha=1 if hl else 0.7, label=model,
                ls="--" if model in ("Persistence", "CLIPER", "SHIFOR") else "-")
    ax.set_xlabel("Lead time (h)")
    ax.set_ylabel(ylabel)
    ax.set_xticks(list(C.LEADS_H))
    ax.set_title(title)
    ax.grid(alpha=0.3)
    ax.legend(fontsize=8, ncol=2, frameon=False)
    return _save(fig, path)


def reliability_plot(tables, title, path):
    """tables: dict name -> reliability DataFrame."""
    fig, ax = plt.subplots(figsize=(5.5, 5.5))
    ax.plot([0, 1], [0, 1], color="#999", ls="--", lw=1)
    for name, t in tables.items():
        ax.plot(t["mean_forecast"], t["observed"], marker="o", label=name)
    ax.set_xlabel("Forecast probability")
    ax.set_ylabel("Observed frequency")
    ax.set_title(title)
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.grid(alpha=0.3)
    ax.legend(frameon=False)
    return _save(fig, path)


def threshold_curve(ev, chosen, path):
    fig, ax = plt.subplots(figsize=(6.5, 5))
    ev = ev.sort_values("false_zones_per_forecast")
    ax.plot(ev["false_zones_per_forecast"], ev["hit_rate"], marker="o", color="#12324F")
    for _, r in ev.iterrows():
        ax.annotate(f"{r.threshold:.2f}", (r.false_zones_per_forecast, r.hit_rate), fontsize=7,
                    xytext=(3, 3), textcoords="offset points")
    c = ev[ev.threshold == chosen]
    ax.scatter(c["false_zones_per_forecast"], c["hit_rate"], s=140, color="#D9822B", zorder=5,
               label=f"chosen threshold {chosen:.2f}")
    ax.set_xlabel("False-alarm zones per forecast")
    ax.set_ylabel("Event hit rate (CS or stronger)")
    ax.set_title("Occurrence: hit rate vs false alarms")
    ax.grid(alpha=0.3)
    ax.legend(frameon=False)
    return _save(fig, path)


def importance_bar(imp, title, path, top=20):
    imp = imp.sort_values(ascending=True).tail(top)
    fig, ax = plt.subplots(figsize=(7, 0.3 * len(imp) + 1.2))
    ax.barh(imp.index, imp.values, color="#1F8A8A")
    ax.set_xlabel("Mean |contribution| (SHAP)")
    ax.set_title(title)
    ax.grid(axis="x", alpha=0.3)
    return _save(fig, path)


def surrogate_tree(tree, feature_names, title, path):
    from sklearn.tree import plot_tree
    fig, ax = plt.subplots(figsize=(16, 7))
    plot_tree(tree, feature_names=feature_names, filled=True, rounded=True, fontsize=8, ax=ax, precision=1)
    ax.set_title(title)
    return _save(fig, path)


def comparison_table_image(df, title, path):
    fig, ax = plt.subplots(figsize=(min(2 + 1.4 * len(df.columns), 16), 0.45 * len(df) + 1.2))
    ax.axis("off")
    tb = ax.table(cellText=df.values, colLabels=df.columns, loc="center", cellLoc="center")
    tb.auto_set_font_size(False)
    tb.set_fontsize(9)
    tb.scale(1, 1.4)
    for (r, c), cell in tb.get_celld().items():
        if r == 0:
            cell.set_facecolor("#12324F")
            cell.set_text_props(color="white", weight="bold")
    ax.set_title(title, fontweight="bold")
    return _save(fig, path)


def case_study_map(lsm, lat, lon, truth, forecasts, title, path, strike=None):
    """
    truth: DataFrame(lat, lon, wind) hourly; forecasts: list of (t0, lat0, lon0, [lat_L], [lon_L]).
    strike: optional DataFrame(district, lat, lon, p) to colour coastal points.
    """
    fig, ax = plt.subplots(figsize=(9, 7))
    ax.contourf(lon, lat, lsm, levels=[0.5, 1.5], colors=["#E3E0D8"])
    ax.contour(lon, lat, lsm, levels=[0.5], colors=["#8a8a8a"], linewidths=0.6)
    ax.plot(truth["lon"], truth["lat"], color="black", lw=2, label="Observed track (IBTrACS)")
    for i, (t0, la0, lo0, las, los) in enumerate(forecasts):
        ax.plot([lo0] + list(los), [la0] + list(las), color="#D9822B", lw=1.4, marker="o", ms=3,
                label="Forecast (+6 to +24 h)" if i == 0 else None)
    if strike is not None and len(strike):
        colors = {"red": "#E5484D", "orange": "#F2994A", "yellow": "#E8C547", "green": "#3DB57A"}
        from .strike import band
        for _, r in strike.iterrows():
            ax.scatter(r["lon"], r["lat"], s=60, marker="s", color=colors[band(100 * r["p"])],
                       edgecolor="k", lw=0.4, zorder=6)
    pad = 4
    ax.set_xlim(truth["lon"].min() - pad, truth["lon"].max() + pad)
    ax.set_ylim(truth["lat"].min() - pad, truth["lat"].max() + pad)
    ax.set_aspect("equal")
    ax.set_title(title)
    ax.legend(loc="lower left", frameon=False)
    return _save(fig, path)
