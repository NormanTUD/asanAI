import torch

# ── 1. Define inputs as tensors that track gradients ──
x = torch.tensor(2.0, requires_grad=True)
y = torch.tensor(3.0, requires_grad=True)

# ── 2. Forward pass: build the tape implicitly ──
# Every operation on x and y is recorded automatically.
u = x + y          # u = 5.0
v = torch.sin(x)   # v = sin(2.0) ≈ 0.9093
f = u * v          # f = 5.0 * 0.9093 ≈ 4.5465

print(f"f(x, y) = (x + y) * sin(x) = {f.item():.4f}")

# ── 3. Backward pass: unwind the tape ──
# Computes df/dx and df/dy in a single reverse traversal.
f.backward()

print(f"df/dx = {x.grad.item():.4f}")  # sin(x) + (x+y)*cos(x)
print(f"df/dy = {y.grad.item():.4f}")  # sin(x)

# ── 4. Verify analytically ──
import math
analytic_dfdx = math.sin(2.0) + 5.0 * math.cos(2.0)
analytic_dfdy = math.sin(2.0)
print(f"\nAnalytic df/dx = {analytic_dfdx:.4f}")
print(f"Analytic df/dy = {analytic_dfdy:.4f}")

# ── 5. Practical example: one gradient descent step ──
w = torch.tensor([4.0, 3.0], requires_grad=True)
lr = 0.1

loss = (w ** 2).sum()   # L(w) = w1² + w2²
loss.backward()          # dL/dw = [2*w1, 2*w2] = [8.0, 6.0]

with torch.no_grad():
    w -= lr * w.grad     # w_new = [4 - 0.8, 3 - 0.6] = [3.2, 2.4]

print(f"\nAfter 1 step: w = {w.tolist()}, loss = {(w**2).sum().item():.4f}")
