"""
Unit tests for py/minimalneuron/custom.py -- the from-scratch minimal neuron.

Pure standard library (unittest + importlib). No numpy, no torch, no pytest.
Run directly:

    python3 tests/py/test_minimalneuron.py
"""

import importlib.util
import os
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, "..", ".."))
TARGET = os.path.join(REPO, "py", "minimalneuron", "custom.py")

_spec = importlib.util.spec_from_file_location("custom_minimalneuron", TARGET)
MOD = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(MOD)

forward = MOD.forward
mse = MOD.mse
grad_mse = MOD.grad_mse
numeric_grad = MOD.numeric_grad
train = MOD.train
DATA = MOD.DATA


class TestForward(unittest.TestCase):
    def test_rule(self):
        self.assertAlmostEqual(forward(2.0, 0.0, 3.0), 6.0, places=12)
        self.assertAlmostEqual(forward(0.5, 1.0, 2.0), 2.0, places=12)
        self.assertAlmostEqual(forward(-1.0, 1.0, 4.0), -3.0, places=12)


class TestMSE(unittest.TestCase):
    def test_zero_when_perfect(self):
        # a = 2, b = 0 fits the data exactly, so the MSE must be 0.
        self.assertAlmostEqual(mse(2.0, 0.0, DATA), 0.0, places=12)

    def test_nonzero_when_wrong(self):
        self.assertGreater(mse(0.0, 0.0, DATA), 0.0)


class TestGradient(unittest.TestCase):
    def test_analytic_matches_numeric(self):
        # The analytic gradient and an independent finite-difference gradient
        # must agree -- this is the standard way to prove a gradient is right.
        for (a, b) in [(0.0, 0.0), (0.5, -1.0), (-0.3, 2.5), (1.7, 0.2)]:
            da_a, db_a = grad_mse(a, b, DATA)
            da_n, db_n = numeric_grad(a, b, DATA)
            self.assertAlmostEqual(da_a, da_n, delta=1e-4)
            self.assertAlmostEqual(db_a, db_n, delta=1e-4)

    def test_known_value(self):
        # Hand-derived: at (a=0.5, b=-1), dL/da = -18 and dL/db = -8.
        da, db = grad_mse(0.5, -1.0, DATA)
        self.assertAlmostEqual(da, -18.0, places=9)
        self.assertAlmostEqual(db, -8.0, places=9)


class TestTraining(unittest.TestCase):
    def test_converges_to_target_line(self):
        a, b, loss = train()
        self.assertAlmostEqual(a, 2.0, delta=0.02)
        self.assertAlmostEqual(b, 0.0, delta=0.02)
        self.assertLess(loss, 1e-3)

    def test_predictions_match_targets(self):
        a, b, _ = train()
        for x, y in DATA:
            self.assertAlmostEqual(forward(a, b, x), y, delta=0.02)

    def test_loss_decreases_over_training(self):
        before = mse(0.0, 0.0, DATA)
        a, b, after = train(0.0, 0.0, lr=0.05, epochs=100)
        self.assertLess(after, before)
        self.assertLess(mse(a, b, DATA), before)

    def test_stable_repeated_training(self):
        # Gradient descent is deterministic: two runs give the same result.
        a1, b1, _ = train()
        a2, b2, _ = train()
        self.assertAlmostEqual(a1, a2, places=6)
        self.assertAlmostEqual(b1, b2, places=6)


if __name__ == "__main__":
    unittest.main(verbosity=2)
