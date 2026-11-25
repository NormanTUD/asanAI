"""
The minimal network, in PyTorch.

A two-layer network that learns XOR. A single neuron cannot learn XOR (its
decision boundary is a straight line), but two layers with a nonlinearity in
between can -- which is exactly why the "From Scratch" tab's single neuron
fits a straight line while this one needs a hidden layer.

Run it (needs torch installed):
    python3 pytorch.py
"""

import torch
import torch.nn as nn

# --- THE DATA: the four corners of the XOR rule ---
X = torch.tensor([[0, 0], [0, 1], [1, 0], [1, 1]], dtype=torch.float32)
Y = torch.tensor([[0], [1], [1], [0]], dtype=torch.float32)

model = nn.Sequential(
    nn.Linear(2, 4),
    nn.ReLU(),
    nn.Linear(4, 1),
    nn.Sigmoid(),
)
loss_fn = nn.BCELoss()
opt = torch.optim.Adam(model.parameters(), lr=0.05)

for epoch in range(500):
    loss = loss_fn(model(X), Y)
    opt.zero_grad()
    loss.backward()
    opt.step()
    if (epoch + 1) % 100 == 0:
        print(f"  epoch {epoch + 1:4d}:  loss = {loss.item():.4f}")

model.eval()
with torch.no_grad():
    preds = model(X).squeeze(1)
print("\nXOR predictions:")
for x, target, pred in zip(X.tolist(), Y.squeeze(1).tolist(), preds.tolist()):
    print(f"  {x} -> {pred:.4f}   (target {int(target)})")
