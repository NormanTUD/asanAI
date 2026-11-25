#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
MNIST-Mannigfaltigkeit: Datenvorbereitung für die HTML/JS-Visualisierung.

Erzeugt:
  mnist_manifold.json   (~2-3 MB)  — alle Koordinaten + Kennzahlen
  mnist_sprites.png     (~1 MB)    — Sprite-Atlas der 28x28-Thumbnails

Benötigt nur: numpy, scikit-learn, Pillow
    pip install numpy scikit-learn pillow
"""

import json
import numpy as np
from sklearn.datasets import fetch_openml
from sklearn.decomposition import PCA
from sklearn.manifold import Isomap
from sklearn.neighbors import NearestNeighbors
from PIL import Image

RNG = np.random.default_rng(42)
N_SUB = 4000          # Anzahl Punkte für die Visualisierung
N_ID = 600            # Punkte pro Ziffer für die Dimensions-Schätzung
OUT_JSON = "mnist_manifold.json"
OUT_PNG = "mnist_sprites.png"


# ----------------------------------------------------------------------
# 1. Daten laden
# ----------------------------------------------------------------------
def load_mnist():
    print("Lade MNIST von OpenML (das dauert beim ersten Mal ~1 Min) ...")
    X, y = fetch_openml("mnist_784", version=1, return_X_y=True, as_frame=False)
    X = X.astype(np.float32) / 255.0
    y = y.astype(np.int32)
    print(f"  geladen: X={X.shape}, y={y.shape}")
    return X, y


# ----------------------------------------------------------------------
# 2. Intrinsische Dimension: Two-NN-Schätzer (Facco et al. 2017)
#    Robuster und schneller als Levina-Bickel-MLE, braucht nur die
#    zwei nächsten Nachbarn.
# ----------------------------------------------------------------------
def two_nn_dimension(X, discard_frac=0.1):
    """
    Two-NN-Schätzer der intrinsischen Dimension.
    mu_i = r2_i / r1_i  (Verhältnis der Abstände zum 2. und 1. Nachbarn)
    Für eine d-dimensionale Mannigfaltigkeit gilt: P(mu) = d * mu^(-d-1)
    -> d wird per linearer Regression auf log(mu) vs -log(1-F) geschätzt.
    """
    n = X.shape[0]
    nn = NearestNeighbors(n_neighbors=3).fit(X)
    dists, _ = nn.kneighbors(X)
    r1 = dists[:, 1]
    r2 = dists[:, 2]

    # Punkte mit entarteten Abständen (Duplikate) rauswerfen
    valid = (r1 > 1e-12) & (r2 > r1)
    mu = r2[valid] / r1[valid]
    mu = np.sort(mu)
    m = len(mu)

    # Empirische Verteilungsfunktion, obere Ausreißer verwerfen
    F = np.arange(1, m + 1) / m
    keep = int(m * (1 - discard_frac))
    x = np.log(mu[:keep])
    yv = -np.log(1.0 - F[:keep])

    # Regression durch den Ursprung: d = sum(x*y) / sum(x*x)
    d = float(np.sum(x * yv) / np.sum(x * x))
    return d


# ----------------------------------------------------------------------
# 3. Hauptberechnung
# ----------------------------------------------------------------------
def main():
    X, y = load_mnist()

    # --- Subsample, stratifiziert über die Ziffern ---------------------
    idx = []
    per_digit = N_SUB // 10
    for d in range(10):
        pool = np.where(y == d)[0]
        idx.append(RNG.choice(pool, per_digit, replace=False))
    idx = np.concatenate(idx)
    RNG.shuffle(idx)
    Xs, ys = X[idx], y[idx]
    print(f"Subsample: {Xs.shape[0]} Punkte, {per_digit} pro Ziffer")

    # --- PCA: volles Spektrum für den Varianz-Beat ---------------------
    print("Berechne PCA-Spektrum (200 Komponenten) ...")
    pca_full = PCA(n_components=200, random_state=0).fit(Xs)
    evr = pca_full.explained_variance_ratio_
    cum = np.cumsum(evr)
    n_90 = int(np.searchsorted(cum, 0.90) + 1)
    n_95 = int(np.searchsorted(cum, 0.95) + 1)
    n_99 = int(np.searchsorted(cum, 0.99) + 1)
    print(f"  90% Varianz in {n_90} Komponenten, 95% in {n_95}, 99% in {n_99}")

    # --- PCA 3D: die Koordinaten für Beat 4 ----------------------------
    pca3 = PCA(n_components=3, random_state=0)
    P3 = pca3.fit_transform(Xs)
    P3 = P3 / np.abs(P3).max() * 1.0   # auf [-1,1] normieren

    # --- Isomap 3D: geodätische Entfaltung für Beat 5 ------------------
    # Isomap auf 4000 Punkten dauert ~1-3 Min. Wir reduzieren vorher
    # auf 50 PCA-Dimensionen, das beschleunigt den Nachbarschaftsgraphen
    # erheblich und ändert die Geodäten kaum.
    print("Berechne Isomap (3D) — das dauert 1-3 Minuten ...")
    X50 = PCA(n_components=50, random_state=0).fit_transform(Xs)
    iso = Isomap(n_neighbors=12, n_components=3)
    I3 = iso.fit_transform(X50)
    I3 = I3 / np.abs(I3).max() * 1.0
    print("  Isomap fertig.")

    # --- Intrinsische Dimension pro Ziffer -----------------------------
    print("Schätze intrinsische Dimension pro Ziffer (Two-NN) ...")
    dims = {}
    for d in range(10):
        pool = np.where(y == d)[0]
        sel = RNG.choice(pool, min(N_ID, len(pool)), replace=False)
        dims[d] = round(two_nn_dimension(X[sel]), 2)
        print(f"  Ziffer {d}: d ≈ {dims[d]}")

    dim_all = round(two_nn_dimension(X[RNG.choice(len(X), 2000, replace=False)]), 2)
    print(f"  Gesamter Datensatz: d ≈ {dim_all}  (eingebettet in 784 Dim.)")

    # --- Zufallsrauschen zum Vergleich (Beat 2) ------------------------
    # Gleiche Pixelstatistik (Mittelwert/Std pro Pixel), aber unabhängig
    # gezogen -> sieht nie wie eine Ziffer aus.
    mu_px = Xs.mean(axis=0)
    sd_px = Xs.std(axis=0) + 1e-6
    noise = np.clip(RNG.normal(mu_px, sd_px, size=(400, 784)), 0, 1).astype(np.float32)
    noise_p3 = pca3.transform(noise)
    noise_p3 = noise_p3 / np.abs(P3).max()  # gleiche Skala wie die echten Punkte

    # Intrinsische Dimension des Rauschens (sollte ~hoch sein)
    dim_noise = round(two_nn_dimension(noise), 2)
    print(f"  Zufallsrauschen: d ≈ {dim_noise}")

    # --- Ein Beispielbild für Beat 1 (784 Pixelbalken) -----------------
    example_idx = int(np.where(ys == 3)[0][0])
    example_img = (Xs[example_idx] * 255).astype(np.uint8).tolist()

    # --- Sprite-Atlas: 4000 Bilder à 28x28 -----------------------------
    print("Schreibe Sprite-Atlas ...")
    cols = 80
    rows = int(np.ceil(N_SUB / cols))
    atlas = np.zeros((rows * 28, cols * 28), dtype=np.uint8)
    for i in range(Xs.shape[0]):
        r, c = divmod(i, cols)
        atlas[r*28:(r+1)*28, c*28:(c+1)*28] = (Xs[i].reshape(28, 28) * 255).astype(np.uint8)
    Image.fromarray(atlas, mode="L").save(OUT_PNG, optimize=True)
    print(f"  {OUT_PNG} geschrieben ({rows}x{cols} Kacheln)")

    # --- Alles als JSON --------------------------------------------------
    def r3(a):
        return np.round(a, 3).tolist()

    data = {
        "meta": {
            "n": int(Xs.shape[0]),
            "ambient_dim": 784,
            "sprite_cols": cols,
            "sprite_rows": rows,
            "sprite_file": OUT_PNG,
        },
        "labels": ys.tolist(),
        "pca3": r3(P3),
        "iso3": r3(I3),
        "noise_pca3": r3(noise_p3),
        "spectrum": {
            "evr": r3(evr),
            "cumulative": r3(cum),
            "n_90": n_90, "n_95": n_95, "n_99": n_99,
        },
        "intrinsic_dim": {
            "per_digit": dims,
            "all": dim_all,
            "noise": dim_noise,
        },
        "example_image": example_img,
    }

    with open(OUT_JSON, "w") as f:
        json.dump(data, f, separators=(",", ":"))
    import os
    print(f"  {OUT_JSON} geschrieben ({os.path.getsize(OUT_JSON)/1e6:.1f} MB)")
    print("\nFertig. Lege beide Dateien neben die HTML-Datei.")


if __name__ == "__main__":
    main()
