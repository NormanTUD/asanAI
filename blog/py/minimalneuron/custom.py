"""
The smallest possible neural network, from scratch.

Pure Python -- the only import is the standard library ``math``. This is the
"from nothing" version of the neuron in the lesson: one weight ``a``, one bias
``b``, the rule ``y = a x + b``, the mean-squared-error loss, and plain
full-batch gradient descent.

Because there is no framework, every piece -- the forward pass, the analytic
gradient, and a finite-difference check of that gradient -- is visible. At the
bottom the model trains on the lesson's data points and converges to the line
that fits them.

Run it directly:
    python3 custom.py
"""

import math


# --- the data: points (x, y) the line should pass through ---
# The "true" rule behind these is y = 2x + 0.
DATA = [(1.0, 2.0), (2.0, 4.0), (3.0, 6.0)]


def forward(a, b, x):
    """One neuron, one input: y = a x + b."""
    return a * x + b


def mse(a, b, data):
    """Mean squared error of the predictions over the dataset."""
    total = 0.0
    for x, y in data:
        err = forward(a, b, x) - y
        total += err * err
    return total / len(data)


def grad_mse(a, b, data):
    """
    Analytic gradients of the MSE loss with respect to a and b.

    With L = (1/N) * sum_i (a x_i + b - y_i)^2, the chain rule gives
        dL/da = (2/N) * sum_i (a x_i + b - y_i) * x_i
        dL/db = (2/N) * sum_i (a x_i + b - y_i)
    """
    n = len(data)
    da = 0.0
    db = 0.0
    for x, y in data:
        err = a * x + b - y
        da += 2.0 * err * x / n
        db += 2.0 * err / n
    return da, db


def numeric_grad(a, b, data, h=1e-5):
    """
    Finite-difference gradient -- an independent way to check grad_mse.
    It approximates the slope by evaluating the loss a tiny step to the left
    and to the right of the current point.
    """
    da = (mse(a + h, b, data) - mse(a - h, b, data)) / (2.0 * h)
    db = (mse(a, b + h, data) - mse(a, b - h, data)) / (2.0 * h)
    return da, db


def train(a=0.0, b=0.0, lr=0.05, epochs=2000, data=DATA, verbose=False):
    """Plain (full-batch) gradient descent on the MSE loss."""
    losses = []
    for step in range(epochs):
        da, db = grad_mse(a, b, data)
        a -= lr * da
        b -= lr * db
        if verbose and (step % max(1, epochs // 5) == 0):
            losses.append(mse(a, b, data))
            print("  step %5d:  a=%.4f  b=%.4f  mse=%.6f" % (step, a, b, mse(a, b, data)))
    return a, b, mse(a, b, data)


if __name__ == "__main__":
    print("Data points:", DATA, "  ->  the target line is y = 2x + 0")
    print("\nTraining (full-batch gradient descent, lr=0.05):\n")
    a, b, loss = train(verbose=True)

    print("\nFinal:  a = %.4f   b = %.4f   mse = %.6f" % (a, b, loss))
    print("Predictions:")
    for x, y in DATA:
        print("  x=%g  ->  y=%.4f   (target %g)" % (x, forward(a, b, x), y))

    # Independent gradient check at an arbitrary (untrained) point:
    # the analytic gradient and the numerical gradient must agree.
    a0, b0 = 0.5, -1.0
    da_a, db_a = grad_mse(a0, b0, DATA)
    da_n, db_n = numeric_grad(a0, b0, DATA)
    print("\nGradient check at (a=%g, b=%g):" % (a0, b0))
    print("  analytic:  dL/da=%.6f   dL/db=%.6f" % (da_a, db_a))
    print("  numeric:   dL/da=%.6f   dL/db=%.6f" % (da_n, db_n))
