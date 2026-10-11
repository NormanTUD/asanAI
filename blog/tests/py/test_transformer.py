"""
Unit tests for py/transformer/custom.py -- the from-scratch transformer.

Pure standard library (unittest + importlib). No numpy, no torch, no pytest.
Run directly:

    python3 tests/py/test_transformer.py
"""

import importlib.util
import os
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, "..", ".."))
TARGET = os.path.join(REPO, "py", "transformer", "custom.py")

_spec = importlib.util.spec_from_file_location("custom_transformer", TARGET)
MOD = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(MOD)

GPT = MOD.GPT
LayerNorm = MOD.LayerNorm
gelu = MOD.gelu
causal_mask = MOD.causal_mask


def make_model(**kw):
    kwargs = dict(vocab_size=5, n_embd=8, n_head=2, n_layer=2, block_size=16, seed=3)
    kwargs.update(kw)
    return GPT(**kwargs)


class TestLayerNorm(unittest.TestCase):
    def test_normalizes_to_unit_scale(self):
        ln = LayerNorm(4)
        y = ln([1.0, 2.0, 3.0, 4.0])
        mean = sum(y) / len(y)
        var = sum((v - mean) ** 2 for v in y) / len(y)
        self.assertAlmostEqual(mean, 0.0, places=9)
        self.assertAlmostEqual(var, 1.0, places=4)

    def test_translation_invariant(self):
        ln = LayerNorm(3)
        # Shifting every input by a constant should not change the output.
        self.assertTrue(all(abs(a - b) < 1e-9
                            for a, b in zip(ln([1.0, 2.0, 3.0]), ln([11.0, 12.0, 13.0]))))


class TestGelu(unittest.TestCase):
    def test_zero(self):
        self.assertAlmostEqual(gelu(0.0), 0.0, places=12)

    def test_negative_is_suppressed(self):
        self.assertLess(abs(gelu(-10.0)), 1e-3)

    def test_positive_is_almost_identity(self):
        self.assertGreater(gelu(10.0), 9.9)

    def test_is_monotone(self):
        xs = [-3.0, -1.0, 0.0, 1.0, 3.0]
        ys = [gelu(x) for x in xs]
        self.assertTrue(all(a <= b + 1e-12 for a, b in zip(ys, ys[1:])))


class TestCausalMask(unittest.TestCase):
    def test_lower_triangular(self):
        m = causal_mask(3)
        self.assertEqual(m, [[1.0, 0.0, 0.0],
                             [1.0, 1.0, 0.0],
                             [1.0, 1.0, 1.0]])


class TestForward(unittest.TestCase):
    def test_logit_shape(self):
        m = make_model()
        logits = m.forward([1, 2, 3])
        self.assertEqual(len(logits), 3)
        for row in logits:
            self.assertEqual(len(row), 5)

    def test_argmax_is_a_valid_token(self):
        m = make_model()
        logits = m.forward([0, 1, 2, 3, 4])
        next_id = max(range(len(logits[-1])), key=lambda i: logits[-1][i])
        self.assertTrue(0 <= next_id < 5)

    def test_deterministic_with_fixed_seed(self):
        a = make_model(seed=42).forward([0, 1, 2])
        b = make_model(seed=42).forward([0, 1, 2])
        self.assertEqual(a, b)

    def test_different_prompts_differ(self):
        m = make_model()
        self.assertNotEqual(m.forward([0, 1]), m.forward([1, 0]))

    def test_weights_are_returned_per_layer(self):
        m = make_model(n_layer=3)
        _, weights = m.forward([4, 0], return_weights=True)
        self.assertEqual(len(weights), 3)
        for layer_w in weights:
            self.assertEqual(len(layer_w), 2)          # T rows
            for row in layer_w:
                self.assertEqual(len(row), 2)          # T columns
                self.assertAlmostEqual(sum(row), 1.0, places=9)

    def test_causal_structure(self):
        # The first position can only attend to itself: its weight row is
        # [1, 0, 0, ...].
        m = make_model()
        _, weights = m.forward([4, 0, 1, 2], return_weights=True)
        first_row = weights[0][0]
        self.assertAlmostEqual(first_row[0], 1.0, places=9)
        for j in range(1, len(first_row)):
            self.assertAlmostEqual(first_row[j], 0.0, places=9)
        # And no row ever attends to a future position.
        for layer_w in weights:
            for i, row in enumerate(layer_w):
                for j in range(len(row)):
                    if j > i:
                        self.assertAlmostEqual(row[j], 0.0, places=9)


if __name__ == "__main__":
    unittest.main(verbosity=2)
