"""
build_data.py — build 28x28x64 occupancy voxel volumes for MNIST.

Produces TWO variants of every volume in a single pass so the viewer can
toggle between them with a dropdown:
  - raw : only the original (un-augmented) images
  - aug : original + rotations (0-360°) + shifts  (data augmentation)

Output: JSON files in ./data/ ready to be consumed by viewer.html:
  foam_raw_total.json,  foam_raw_digit_{0..9}.json
  foam_aug_total.json,  foam_aug_digit_{0..9}.json
  meta.json, samples.json
"""
import json, os, base64, io
import numpy as np
from PIL import Image
from torchvision import datasets, transforms
from scipy.ndimage import rotate, shift

# -------- config --------
OUT_DIR       = "data"
N_BINS        = 64                    # brightness bins: 256 -> 64
ROT_STEP_DEG  = 15                    # full 360° in steps of 15° -> 24 rotations
ROT_ANGLES    = list(range(0, 360, ROT_STEP_DEG))
SHIFTS        = [(0,0), (-2,0),(2,0),(0,-2),(0,2)]
N_SAMPLES     = 30                    # sample images to store per digit
MAX_IMAGES    = None                  # None = all 60k, or e.g. 5000 for a fast dry-run

os.makedirs(OUT_DIR, exist_ok=True)

# constant index grids for accumulate()
XS, YS = np.meshgrid(np.arange(28), np.arange(28), indexing='ij')

# -------- helpers --------
def brightness_bin(img_u8):
    """map 0..255 -> 0..N_BINS-1"""
    return np.clip((img_u8.astype(np.int32) * N_BINS) // 256, 0, N_BINS-1)

def accumulate(volume, img_u8):
    b = brightness_bin(img_u8)                    # (28,28)
    np.add.at(volume, (XS, YS, b), 1)

def augmentation_copies(img_u8):
    """yield the rotated/shifted copies of an image (original excluded)."""
    for a in ROT_ANGLES:
        if a == 0: continue
        r = rotate(img_u8, a, reshape=False, order=1, mode='constant', cval=0)
        yield np.clip(r, 0, 255).astype(np.uint8)
    for dx, dy in SHIFTS:
        if (dx, dy) == (0,0): continue
        s = shift(img_u8, (dx, dy), order=1, mode='constant', cval=0)
        yield np.clip(s, 0, 255).astype(np.uint8)

def image_to_base64_png(img_u8):
    buf = io.BytesIO()
    Image.fromarray(img_u8, mode='L').save(buf, format='PNG')
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()

def volume_to_dense_json(vol):
    return {
        "shape": list(vol.shape),
        "data":  vol.flatten().astype(np.uint32).tolist(),  # length 28*28*64 = 50176
        "max":   int(vol.max()),
        "total": int(vol.sum()),
    }

# -------- main --------
def main():
    print("Loading MNIST…")
    mnist = datasets.MNIST(root='./mnist_data', train=True, download=True,
                           transform=transforms.ToTensor())

    # two variants, per digit + one total
    raw = {d: np.zeros((28, 28, N_BINS), dtype=np.uint32) for d in range(10)}
    aug = {d: np.zeros((28, 28, N_BINS), dtype=np.uint32) for d in range(10)}
    raw_total = np.zeros((28, 28, N_BINS), dtype=np.uint32)
    aug_total = np.zeros((28, 28, N_BINS), dtype=np.uint32)
    samples   = {d: [] for d in range(10)}

    n = len(mnist) if MAX_IMAGES is None else min(MAX_IMAGES, len(mnist))
    n_aug_copies = (len(ROT_ANGLES) - 1) + (len(SHIFTS) - 1)
    print(f"Processing {n} images, "
          f"aug = {len(ROT_ANGLES)-1} rotations + {len(SHIFTS)-1} shifts "
          f"= {n_aug_copies} extra copies per image")

    for i in range(n):
        img_t, label = mnist[i]
        img_u8 = (img_t.numpy()[0] * 255).astype(np.uint8)

        # keep first N_SAMPLES per digit as raw samples
        if len(samples[label]) < N_SAMPLES:
            samples[label].append(image_to_base64_png(img_u8))

        # raw: original image only
        accumulate(raw[label], img_u8)
        accumulate(raw_total, img_u8)

        # aug: original + every rotation/shift
        accumulate(aug[label], img_u8)
        accumulate(aug_total, img_u8)
        for c in augmentation_copies(img_u8):
            accumulate(aug[label], c)
            accumulate(aug_total, c)

        if i % 2000 == 0:
            print(f"  {i}/{n}")

    # -------- write out --------
    print("Writing JSON…")
    meta = {
        "grid": [28, 28, N_BINS],
        "n_bins": N_BINS,
        "brightness_scale": 256 // N_BINS,
        "variants": ["raw", "aug"],
        "rot_angles": ROT_ANGLES,
        "shifts": SHIFTS,
        "n_images": n,
        "digits": list(range(10)),
    }

    with open(os.path.join(OUT_DIR, "meta.json"), "w") as f:
        json.dump(meta, f)

    for d in range(10):
        with open(os.path.join(OUT_DIR, f"foam_raw_digit_{d}.json"), "w") as f:
            json.dump(volume_to_dense_json(raw[d]), f)
        with open(os.path.join(OUT_DIR, f"foam_aug_digit_{d}.json"), "w") as f:
            json.dump(volume_to_dense_json(aug[d]), f)

    with open(os.path.join(OUT_DIR, "foam_raw_total.json"), "w") as f:
        json.dump(volume_to_dense_json(raw_total), f)
    with open(os.path.join(OUT_DIR, "foam_aug_total.json"), "w") as f:
        json.dump(volume_to_dense_json(aug_total), f)

    with open(os.path.join(OUT_DIR, "samples.json"), "w") as f:
        json.dump(samples, f)

    print(f"Done. Wrote {len(os.listdir(OUT_DIR))} files to {OUT_DIR}/")
    for label, vol in (("raw", raw_total), ("aug", aug_total)):
        print(f"  {label:3} total: {vol.sum():,} voxel-hits, "
              f"{np.count_nonzero(vol):,} nonzero cells "
              f"({100*np.count_nonzero(vol)/vol.size:.1f}% occupancy)")

if __name__ == "__main__":
    main()
