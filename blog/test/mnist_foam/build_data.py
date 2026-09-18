"""
build_data.py — build 28x28x64 occupancy voxel volumes for MNIST
(with optional rotations 0-360° and shifts), plus sample images per digit.

Output: JSON files in ./data/ ready to be consumed by viewer.html.
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

# -------- helpers --------
def brightness_bin(img_u8):
    """map 0..255 -> 0..N_BINS-1"""
    return np.clip((img_u8.astype(np.int32) * N_BINS) // 256, 0, N_BINS-1)

def accumulate(volume, img_u8):
    b = brightness_bin(img_u8)                    # (28,28)
    xs, ys = np.meshgrid(np.arange(28), np.arange(28), indexing='ij')
    np.add.at(volume, (xs, ys, b), 1)

def augmentations(img_u8, use_rot, use_shift):
    """yield augmented copies of a single image."""
    yield img_u8
    if use_rot:
        for a in ROT_ANGLES:
            if a == 0: continue
            r = rotate(img_u8, a, reshape=False, order=1, mode='constant', cval=0)
            yield np.clip(r, 0, 255).astype(np.uint8)
    if use_shift:
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
def main(use_rot=True, use_shift=True):
    print(f"Loading MNIST…")
    mnist = datasets.MNIST(root='./mnist_data', train=True, download=True,
                           transform=transforms.ToTensor())

    volumes = {d: np.zeros((28, 28, N_BINS), dtype=np.uint32) for d in range(10)}
    total   = np.zeros((28, 28, N_BINS), dtype=np.uint32)
    samples = {d: [] for d in range(10)}

    n = len(mnist) if MAX_IMAGES is None else min(MAX_IMAGES, len(mnist))
    print(f"Processing {n} images, rot={use_rot} ({len(ROT_ANGLES)} angles), "
          f"shift={use_shift} ({len(SHIFTS)} shifts)")

    for i in range(n):
        img_t, label = mnist[i]
        img_u8 = (img_t.numpy()[0] * 255).astype(np.uint8)

        # keep first N_SAMPLES per digit as raw samples
        if len(samples[label]) < N_SAMPLES:
            samples[label].append(image_to_base64_png(img_u8))

        for aug in augmentations(img_u8, use_rot, use_shift):
            accumulate(volumes[label], aug)
            accumulate(total, aug)

        if i % 2000 == 0:
            print(f"  {i}/{n}")

    # -------- write out --------
    print("Writing JSON…")
    meta = {
        "grid": [28, 28, N_BINS],
        "n_bins": N_BINS,
        "brightness_scale": 256 // N_BINS,
        "rot_angles": ROT_ANGLES if use_rot else [0],
        "shifts": SHIFTS if use_shift else [(0,0)],
        "n_images": n,
        "digits": list(range(10)),
    }

    with open(os.path.join(OUT_DIR, "meta.json"), "w") as f:
        json.dump(meta, f)

    with open(os.path.join(OUT_DIR, "foam_total.json"), "w") as f:
        json.dump(volume_to_dense_json(total), f)

    for d in range(10):
        with open(os.path.join(OUT_DIR, f"foam_digit_{d}.json"), "w") as f:
            json.dump(volume_to_dense_json(volumes[d]), f)

    with open(os.path.join(OUT_DIR, "samples.json"), "w") as f:
        json.dump(samples, f)

    print(f"Done. Wrote {len(os.listdir(OUT_DIR))} files to {OUT_DIR}/")
    print(f"  total volume: {total.sum():,} voxel-hits, "
          f"{np.count_nonzero(total):,} nonzero cells "
          f"({100*np.count_nonzero(total)/total.size:.1f}% occupancy)")

if __name__ == "__main__":
    # variants — comment/uncomment to build the version you want
    main(use_rot=True,  use_shift=True)   # full: 360° rotations + shifts
    # main(use_rot=False, use_shift=False)  # raw, no augmentation
    # main(use_rot=True,  use_shift=False)  # rotations only

