"""
Unit tests for py/attention/custom.py -- the from-scratch attention module.

Pure standard library (unittest + importlib). No numpy, no torch, no pytest.
Run directly:

    python3 tests/py/test_attention.py
"""

import importlib.util
import math
import os
import sys
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, "..", ".."))
TARGET = os.path.join(REPO, "py", "attention", "custom.py")

_spec = importlib.util.spec_from_file_location("custom_attention", TARGET)
MOD = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(MOD)

attention = MOD.attention
softmax = MOD.softmax
causal_mask = MOD.causal_mask
dot = MOD.dot
matmul = MOD.matmul


class TestDotMatmul(unittest.TestCase):
    def test_dot(self):
        self.assertAlmostEqual(dot([1, 2, 3], [4, 5, 6]), 32.0, places=12)
        self.assertAlmostEqual(dot([1, 0], [0, 1]), 0.0, places=12)

    def test_matmul(self):
        A = [[1, 2], [3, 4]]
        B = [[5, 6], [7, 8]]
        self.assertEqual(matmul(A, B), [[19, 22], [43, 46]])

    def test_matmul_identity(self):
        A = [[1.0, 2.0, 3.0], [4.0, 5.0, 6.0]]
        I = [[1.0, 0.0, 0.0], [0.0, 1.0, 0.0], [0.0, 0.0, 1.0]]
        self.assertEqual(matmul(A, I), A)


class TestSoftmax(unittest.TestCase):
    def test_rows_sum_to_one(self):
        for z in ([1, 2, 3], [0.1, -0.5, 3.3], [50.0, 50.0, 51.0], [-100, -99, -101]):
            self.assertAlmostEqual(sum(softmax(z)), 1.0, places=9)

    def test_shift_invariant(self):
        z = [0.3, 1.1, -0.7]
        shifted = [s + 1000.0 for s in z]
        self.assertTrue(all(abs(a - b) < 1e-9 for a, b in zip(softmax(z), softmax(shifted))))

    def test_monotonic(self):
        w = softmax([3.0, 1.0, 0.0])
        self.assertGreater(w[0], w[1])
        self.assertGreater(w[1], w[2])

    def test_all_positive(self):
        w = softmax([10.0, -10.0, 0.0])
        self.assertTrue(all(x > 0.0 for x in w))


class TestCausalMask(unittest.TestCase):
    def test_shape_and_values(self):
        m = causal_mask(4)
        self.assertEqual(len(m), 4)
        for i in range(4):
            self.assertEqual(len(m[i]), 4)
            for j in range(4):
                self.assertEqual(m[i][j], 1.0 if j <= i else 0.0)


class TestAttention(unittest.TestCase):
    Q = [[1.0, 0.0], [0.0, 1.0], [1.0, 1.0]]
    K = [[1.0, 0.0], [0.0, 1.0], [0.0, 0.0]]
    V = [[10.0, 0.0], [0.0, 10.0], [1.0, 1.0]]

    def test_weights_are_probabilities(self):
        out, w = attention(self.Q, self.K, self.V, causal_mask(3))
        for row in w:
            self.assertAlmostEqual(sum(row), 1.0, places=9)
            self.assertTrue(all(x >= 0.0 for x in row))

    def test_causal_hides_the_future(self):
        out, w = attention(self.Q, self.K, self.V, causal_mask(3))
        for i in range(3):
            for j in range(3):
                if j > i:
                    self.assertAlmostEqual(w[i][j], 0.0, places=9)
        # token 0 can only attend to itself
        self.assertAlmostEqual(w[0][0], 1.0, places=9)

    def test_output_is_convex_combination(self):
        # Each output is a weighted average of the value vectors, so every
        # coordinate must lie between the min and max of that V coordinate.
        out, _ = attention(self.Q, self.K, self.V, causal_mask(3))
        for i, row in enumerate(out):
            for c in range(len(self.V[0])):
                col = [self.V[j][c] for j in range(len(self.V))]
                self.assertGreaterEqual(row[c], min(col) - 1e-9)
                self.assertLessEqual(row[c], max(col) + 1e-9)

    def test_shapes(self):
        Q = [[1.0, 2.0], [3.0, 4.0]]
        K = [[1.0, 0.0], [0.0, 1.0]]
        V = [[1.0, 2.0, 3.0], [4.0, 5.0, 6.0]]
        out, w = attention(Q, K, V)
        self.assertEqual(len(out), 2)
        self.assertEqual(len(out[0]), 3)
        self.assertEqual(len(w), 2)
        self.assertEqual(len(w[0]), 2)

    def test_matches_hand_computation(self):
        # No mask. d_k = 1 so the scale factor is 1.
        Q = [[1.0], [0.0]]
        K = [[1.0], [0.0]]
        V = [[10.0], [20.0]]
        out, w = attention(Q, K, V)
        e = math.exp(1.0)
        w00 = e / (e + 1.0)
        w01 = 1.0 / (e + 1.0)
        self.assertAlmostEqual(w[0][0], w00, places=9)
        self.assertAlmostEqual(w[0][1], w01, places=9)
        self.assertAlmostEqual(w[1][0], 0.5, places=9)
        self.assertAlmostEqual(w[1][1], 0.5, places=9)
        self.assertAlmostEqual(out[0][0], w00 * 10.0 + w01 * 20.0, places=9)
        self.assertAlmostEqual(out[1][0], 15.0, places=9)

    def test_scaling_factor_is_applied(self):
        # d_k = 4 -> scores are divided by sqrt(4) = 2, so a raw dot of 4
        # becomes 2. (If the scaling were missing, the score would stay 4.)
        Q = [[1.0, 1.0, 1.0, 1.0], [0.0, 0.0, 0.0, 0.0]]
        K = [[1.0, 1.0, 1.0, 1.0], [0.0, 0.0, 0.0, 0.0]]
        V = [[10.0], [0.0]]
        out, w = attention(Q, K, V)
        e2 = math.exp(2.0)
        self.assertAlmostEqual(w[0][0], e2 / (e2 + 1.0), places=9)
        self.assertAlmostEqual(w[0][1], 1.0 / (e2 + 1.0), places=9)


if __name__ == "__main__":
    unittest.main(verbosity=2)
