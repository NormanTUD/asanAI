import json
import argparse
import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import datasets, transforms
from torch.utils.data import DataLoader, random_split
from PIL import Image

# --- MODEL ARCHITECTURE ---
class SimpleCNN(nn.Module):
    def __init__(self, num_classes=1):
        super(SimpleCNN, self).__init__()
        # PyTorch doesn\'t have a built-in "Rescaling" layer in the model; 
        # normalization is usually handled in the data Transform pipeline.
        
        self.features = nn.Sequential(
            # LAYER 2: Conv2D. (In_channels=3 for RGB, Out_channels=32, Kernel=3)
            nn.Conv2d(3, 32, kernel_size=3),
            nn.ReLU(),
            
            # LAYER 3: MaxPooling
            nn.MaxPool2d(kernel_size=2),
            
            # Additional layer to refine features (Keras\' Flatten is quite aggressive)
            nn.Flatten()
        )
        
        # We need to calculate the input size for the Dense layer.
        # After 100x100 -> Conv(3x3) = 98x98 -> MaxPool(2x2) = 49x49. 
        # 32 channels * 49 * 49 = 76832
        self.classifier = nn.Sequential(
            nn.Linear(32 * 49 * 49, 64),
            nn.ReLU(),
            nn.Linear(64, num_classes),
            nn.Sigmoid() # Squashes to [0, 1] for binary
        )

    def forward(self, x):
        x = self.features(x)
        x = self.classifier(x)
        return x

# --- TRAINING LOGIC ---
def train_mode(data_path, save_path):
    # Data transformations (Equivalent to Rescaling layer in Keras)
    transform = transforms.Compose([
        transforms.Resize((100, 100)),
        transforms.ToTensor(), # Converts [0, 255] to [0.0, 1.0]
    ])

    full_dataset = datasets.ImageFolder(root=data_path, transform=transform)
    num_files = len(full_dataset)
    
    # Save class names
    class_names = full_dataset.classes
    with open("classes.json", "w") as f:
        json.dump(class_names, f)

    # Split logic
    if num_files >= 5:
        train_size = int(0.8 * num_files)
        val_size = num_files - train_size
        train_ds, val_ds = random_split(full_dataset, [train_size, val_size])
        val_loader = DataLoader(val_ds, batch_size=32, shuffle=False)
    else:
        print(f"⚠️ Only {num_files} images found. Skipping split.")
        train_ds = full_dataset
        val_loader = None

    train_loader = DataLoader(train_ds, batch_size=32, shuffle=True)

    # Initialize model, loss, and optimizer
    model = SimpleCNN(num_classes=1)
    criterion = nn.BCELoss() # Binary Cross Entropy
    optimizer = optim.Adam(model.parameters(), lr=0.001)

    # The Training Loop (PyTorch\'s version of model.fit)
    model.train()
    for epoch in range(10):
        running_loss = 0.0
        for inputs, labels in train_loader:
            labels = labels.float().unsqueeze(1) # Match output shape
            
            optimizer.zero_grad()
            outputs = model(inputs)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()
            running_loss += loss.item()
        
        print(f"Epoch {epoch+1}/10 - Loss: {running_loss/len(train_loader):.4f}")

    torch.save(model.state_dict(), save_path)
    print(f"Artifact saved: {save_path}")

# --- PREDICTION LOGIC ---
def predict_mode(model_path, image_path, classes_json="classes.json"):
    with open(classes_json, "r") as f:
        class_names = json.load(f)

    model = SimpleCNN(num_classes=1)
    model.load_state_dict(torch.load(model_path))
    model.eval()

    transform = transforms.Compose([
        transforms.Resize((100, 100)),
        transforms.ToTensor(),
    ])

    img = Image.open(image_path).convert("RGB")
    img_tensor = transform(img).unsqueeze(0) # Add batch dimension

    with torch.no_grad():
        prediction = model(img_tensor).item()

    index = 1 if prediction > 0.5 else 0
    confidence = prediction if index == 1 else 1 - prediction
    print(f"Result: {class_names[index]} ({confidence:.2%})")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--mode", choices=["train", "predict"], required=True)
    parser.add_argument("--path", required=True)
    parser.add_argument("--model_out", default="classifier.pth")

    args = parser.parse_args()

    if args.mode == "train":
        train_mode(args.path, args.model_out)
    else:
        predict_mode(args.model_out, args.path)
