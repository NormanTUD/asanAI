import tensorflow as tf

# ── 1. Define inputs as TF Variables (automatically watched) ──
x = tf.Variable(2.0)
y = tf.Variable(3.0)

# ── 2. Forward pass: record operations on the tape ──
with tf.GradientTape() as tape:
    u = x + y            # u = 5.0
    v = tf.sin(x)        # v = sin(2.0) ≈ 0.9093
    f = u * v            # f = 5.0 * 0.9093 ≈ 4.5465

print(f"f(x, y) = (x + y) * sin(x) = {f.numpy():.4f}")

# ── 3. Backward pass: unwind the tape ──
# Computes df/dx and df/dy in a single reverse traversal.
grad_x, grad_y = tape.gradient(f, [x, y])

print(f"df/dx = {grad_x.numpy():.4f}")  # sin(x) + (x+y)*cos(x)
print(f"df/dy = {grad_y.numpy():.4f}")  # sin(x)

# ── 4. Verify analytically ──
import math
analytic_dfdx = math.sin(2.0) + 5.0 * math.cos(2.0)
analytic_dfdy = math.sin(2.0)
print(f"\nAnalytic df/dx = {analytic_dfdx:.4f}")
print(f"Analytic df/dy = {analytic_dfdy:.4f}")

# ── 5. Practical example: one gradient descent step ──
w = tf.Variable([4.0, 3.0])
lr = 0.1

with tf.GradientTape() as tape:
    loss = tf.reduce_sum(w ** 2)   # L(w) = w1² + w2²

grads = tape.gradient(loss, w)      # dL/dw = [2*w1, 2*w2] = [8.0, 6.0]
w.assign_sub(lr * grads)            # w_new = [4 - 0.8, 3 - 0.6] = [3.2, 2.4]

print(f"\nAfter 1 step: w = {w.numpy().tolist()}, loss = {tf.reduce_sum(w**2).numpy():.4f}")
