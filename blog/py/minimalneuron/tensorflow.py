import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
import numpy as np

# --- THE DATA ---
# PyTorch uses Tensors. We convert NumPy arrays to torch.float32 tensors.
X = torch.tensor([[0, 0], [0, 1], [1, 0], [1, 1]], dtype=torch.float32)
Y = torch.tensor([[0], [1], [1], [0]], dtype=torch.float32) # XOR Logic

class NeuralNet(nn.Module):
    def __init__(self, layers=1):
        super(NeuralNet, self).__init__()
        if layers == 1:
            # Simple Linear Model / Perceptron
            self.model = nn.Sequential(
                nn.Linear(2, 1),
                nn.Sigmoid()
            )
        else:
            # 2-Layered Neural Network
            self.model = nn.Sequential(
                nn.Linear(2, 4), # Layer 1: 2 inputs -> 4 hidden units
                nn.ReLU(),       # Activation
                nn.Linear(4, 1), # Layer 2: 4 hidden units -> 1 output
                nn.Sigmoid()     # Output Activation
            )

    def forward(self, x):
        return self.model(x)

# --- TRAINING SETUP ---
# Choose layers=1 or layers=2
model = NeuralNet(layers=2)

# Loss and Optimizer (Binary Cross Entropy and Adam)
criterion = nn.BCELoss()
optimizer = optim.Adam(model.parameters(), lr=0.01)

# --- THE TRAINING LOOP ---
# This replaces tf_model.fit()
epochs = 500
for epoch in range(epochs):
    # 1. Forward pass
    outputs = model(X)
    loss = criterion(outputs, Y)

    # 2. Backward pass and optimization
    optimizer.zero_grad() # Clear existing gradients
    loss.backward()       # Compute gradients (backpropagation)
    optimizer.step()      # Update weights

    if (epoch + 1) % 100 == 0:
        print(f"Epoch [{epoch+1}/{epochs}], Loss: {loss.item():.4f}")

# --- PREDICTION ---
# model.eval() sets the model to evaluation mode
model.eval()
with torch.no_grad(): # Disable gradient calculation for inference
    test_inputs = [
        [0, 0], [0, 1], [1, 0], [1, 1]
    ]
    for inp in test_inputs:
        input_tensor = torch.tensor([inp], dtype=torch.float32)
        prediction = model(input_tensor)
        print(f"PT Prediction for {inp}: {prediction.item():.4f}")
