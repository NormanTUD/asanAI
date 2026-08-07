#!/usr/bin/env python3
"""
Pixel-perfect PNG comparison using Pillow.

Compares two PNG files by decoding them to raw RGB pixels and checking that
every single pixel is identical. Reports the number of differing pixels and
the coordinates of the first mismatch so the caller can localize the diff.

Usage:
    compare.py REFERENCE CURRENT

Exit codes:
    0  - pixel-perfect match
    1  - pixel difference (or size mismatch)
    2  - invalid arguments / I/O error
"""

from __future__ import annotations

import os
import sys

from PIL import Image, UnidentifiedImageError


def load_rgb(path: str) -> Image.Image:
	try:
		img = Image.open(path)
		img.load()
	except (FileNotFoundError, UnidentifiedImageError, OSError) as exc:
		raise SystemExit(f"Could not open image '{path}': {exc}")
	return img.convert("RGB")


def compare(reference_path: str, current_path: str) -> int:
	if not os.path.isfile(reference_path):
		print(f"Reference image not found: {reference_path}", file=sys.stderr)
		return 2
	if not os.path.isfile(current_path):
		print(f"Current image not found: {current_path}", file=sys.stderr)
		return 2

	ref = load_rgb(reference_path)
	cur = load_rgb(current_path)

	if ref.size != cur.size:
		print(
			f"Size mismatch: reference={ref.size[0]}x{ref.size[1]}, "
			f"current={cur.size[0]}x{cur.size[1]}",
			file=sys.stderr,
		)
		return 1

	ref_bytes = ref.tobytes()
	cur_bytes = cur.tobytes()

	if ref_bytes == cur_bytes:
		print("Pixel-perfect match")
		return 0

	width, height = ref.size
	total = width * height
	diff = 0
	first_x = -1
	first_y = -1
	for i in range(0, len(ref_bytes), 3):
		if ref_bytes[i:i + 3] != cur_bytes[i:i + 3]:
			if first_x == -1:
				pixel_index = i // 3
				first_x = pixel_index % width
				first_y = pixel_index // width
			diff += 1

	pct = (diff * 100.0) / total if total else 0.0
	print(
		f"{diff}/{total} pixels differ ({pct:.2f}%); first diff at "
		f"({first_x}, {first_y})",
		file=sys.stderr,
	)
	return 1


def main(argv: list[str]) -> int:
	if len(argv) != 3:
		print(
			f"Usage: {os.path.basename(argv[0])} REFERENCE CURRENT",
			file=sys.stderr,
		)
		return 2
	return compare(argv[1], argv[2])


if __name__ == "__main__":
	sys.exit(main(sys.argv))
