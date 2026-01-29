<?php include_once("functions.php"); ?>
<div class="md">
## Convolutions, or how a computer can see

The idea of convolutions was introduced first by \citeauthor{neocognitron} in \citeyear{neocognitron} in his hallmark paper "\citetitle{neocognitron}", but later popularized and developed so far that it could be practically used by Yann LeCun et al. in \citeyear{lecun1989backpropagation}, where he applied to it to recognizing handwritten digits for ZIP codes for the U.S. Postal System.

This module demonstrates the fundamental operation behind **Convolutional Neural Networks (CNNs)**, the technology that powers facial recognition, self-driving cars, and medical imaging.

In traditional computer vision, engineers manually designed kernels (like the ones in the buttons above) to find edges or blur noise. In **Deep Learning**, we don't pick these numbers ourselves.

* **Kernels are Learnable Parameters:** Just as a standard "Dense" neural layer has weights it adjusts during training, a CNN treats every number in the Filter Kernel as a **weight**.
* **Feature Extraction:** Through backpropagation, the AI learns which numbers to put in the kernel to detect useful features. It might start by learning simple edges (Sobel filters) in early layers and progress to complex shapes (eyes, wheels) in deeper layers.
* **The Convolution Operation:** The math you see when hovering, multiplying a window of pixels by a matrix of weights, is exactly what happens billions of times inside a GPU when an AI processes an image.

* **Sharpen/Edge Detection:** These are "Feature Extractors" that highlight high-frequency information.
* **Blur:** This acts as a "Low-pass filter," removing noise but also removing detail.
* **Manual Edit:** Try changing the numbers in the grid. You are manually "training" the network to respond to different patterns.

**Note:** Hover your mouse over the source image to see the matrix multiplication in real-time. Notice how a single pixel in the output is a weighted sum of its neighbors.
</div>
    
    <div style="margin-bottom: 15px; display: flex; gap: 8px; flex-wrap: wrap;">
        <button class="btn" onclick="setKernel([[0,-1,0],[-1,5,-1],[0,-1,0]])">Sharpen</button>
        <button class="btn" onclick="setKernel([[1/9,1/9,1/9],[1/9,1/9,1/9],[1/9,1/9,1/9]])">Blur</button>
        <button class="btn" onclick="setKernel([[-1,-1,-1],[-1,8,-1],[-1,-1,-1]])">Edge</button>
        <button class="btn" onclick="setKernel([[0,0,0],[0,1,0],[0,0,0]])">Identity</button>
        <button class="btn" onclick="setKernel([[-1,-2,-1],[0,0,0],[1,2,1]])">Sobel Horizontal</button>
        <button class="btn" onclick="setKernel([[-1,0,1],[-2,0,2],[-1,0,1]])">Sobel Vertical</button>
        <button class="btn" onclick="setKernel([[-2,-1,0],[-1,1,1],[0,1,2]])">Emboss</button>
        <button class="btn" onclick="setKernel([[1/16,2/16,1/16],[2/16,4/16,2/16],[1/16,2/16,1/16]])">Gaussian</button>
    </div>

    <div style="display: flex; gap: 20px; flex-wrap: wrap; align-items: flex-start;">
        <div style="position: relative; line-height: 0; display: inline-block;">
            <b style="line-height: 1.5; display: block;">Original (Hover me!)</b>
            <canvas id="conv-src-display" class="vision-canvas" width="50" height="50" style="cursor: none; border: 1px solid #ccc;"></canvas>
            <div id="conv-focus" style="position: absolute; border: 2px solid red; pointer-events: none; display: none; box-sizing: border-box; z-index: 10;"></div>
        </div>

        <div>
            <b>Filter Kernel</b><br>
            Size: <input type="number" id="k-size" value="3" min="1" max="5" step="2" onchange="initVisionLab()">
            <table id="kernel-table" style="margin-top: 10px; border-collapse: collapse;"></table>
        </div>

        <div id="conv-res-container" style="position: relative; line-height: 0; display: inline-block;">
            <b style="line-height: 1.5; display: block;">Filtered Result</b>
            <canvas id="conv-res" class="vision-canvas" width="50" height="50" style="border: 1px solid #ccc;"></canvas>
            <div id="conv-crosshair" style="position: absolute; pointer-events: none; display: none; z-index: 10;">
                <div style="position: absolute; width: 10px; height: 2px; background: red; left: -5px; top: -1px;"></div>
                <div style="position: absolute; width: 2px; height: 10px; background: red; left: -1px; top: -5px;"></div>
            </div>
        </div>
    </div>

    <div id="conv-math-step" style="margin-top: 20px; padding: 15px; background: #f8fafc; border: 1px solid #cbd5e0; border-radius: 8px; font-size: 0.85rem; overflow-x: auto; min-height: 100px;">
        Move mouse over the image to see the math...
    </div>

    <img id="conv-src-hidden" src="example.jpg" crossorigin="anonymous" style="display:none">
    <div id="visionlab-console" style="display: none" class="status-console"></div>

<div class="lab-dashboard" style="display: flex; flex-direction: column; gap: 20px; padding: 20px">
<div class="md">
### The Power of Hierarchy: Building Complexity
In deep learning, an AI doesn't identify a "stop sign" in a single leap. Instead, it builds an understanding of the image through a **layered hierarchy**, where each successive layer looks at the one before it to find increasingly complex patterns.

#### Layer 1: Simple Edges
The first layer acts like a microscopic scanner. It only looks at a tiny window of pixels, the $3 \times 3$ kernel, to find basic "primitive" features like lines, angles, or color gradients. At this stage, the AI has no concept of a "sign"; it only knows that there is a vertical line or a diagonal edge at a specific coordinate.


#### Layer 2: Pattern Composition
The second layer in a CNN doesn't look at the raw pixels of the original image; it looks at the **Feature Maps** produced by Layer 1.
* **Searching for Patterns in Patterns:** Layer 2 searches for specific combinations of edges. For example, if it detects a "45° Diagonal" activation right next to a "90° Vertical" activation, it interprets this combination as a **corner**.
* **Expanding the "Receptive Field":** As layers get deeper, each "pixel" in the resulting map represents a much larger area of the original image. This is why the Heatmap highlights the general octagonal shape rather than just thin, disconnected lines.

#### Even more layers

In a full-scale network, this process repeats across dozens or even hundreds of layers:
* **Middle Layers:** Combine corners and curves to detect "parts" like a bolt, a letter, or the specific red octagonal boundary of a sign.
* **Final Layers:** Combine those parts to realize the **Global Concept**, concluding with high mathematical certainty that the cluster of detected shapes is a **Stop Sign**.

The more layers, the more complex the structures it can detect can be. But there's also a risk of overfitting.

**The Mathematical Heartbeat:** Every step of this intelligence, from finding a tiny line to identifying a vehicle, is powered by the same **Convolution Operation** you see in the math box. By stacking these simple multiplications, the AI transforms raw numbers into visual logic.

</div>
    <div style="display: grid; grid-template-columns: 280px 1fr; gap: 20px;">
        <div class="panel" style="background: white; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; height: fit-content;">
            <div style="text-align:center;">
                <canvas id="feat-src" width="100" height="100" style="border:2px solid #cbd5e1; width:200px; image-rendering:pixelated; border-radius: 4px;"></canvas>
                <p class="md">Source Image (by \citeauthor{stopsignimage})</p>
            </div>
            <div style="margin-top: 20px; padding: 10px; background: #f8fafc; border-radius: 6px; font-size: 0.8rem; color: #475569;">
                <strong>Info:</strong> Each matrix (kernel) acts as a specialized "eye" that searches for specific patterns in the image.
            </div>
        </div>

        <div id="filter-grid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;">
            </div>
    </div>
</div>

<div class="md">

## From Visuals to Code: Building a Neural Network

In the interactive lab above, you manually adjusted a single kernel to see how it affects an image. In a real-world **Convolutional Neural Network (CNN)**, the computer doesn't just use one kernel; it learns many different kernels at once to find various features.

To go from a complex image (a 3D tensor) to a final decision, like "Stop Sign" or "Not a Stop Sign", we need to bridge the gap between the 2D grid and a final numerical probability. This is where **Flattening** comes in.

### The Flatten Layer: Unrolling the Grid

A Convolutional layer preserves the "grid" shape of an image to find spatial patterns like edges and corners. However, the final decision-making layer (the **Dense** layer) expects a simple, flat list of numbers.

* **What it does:** It "unrolls" the grid. For example, if your feature map is a $3 \times 3$ grid, Flattening turns those 9 pixels into a single vertical list (Vector) of 9 numbers.
* **Why we do it:** It allows the AI to take every feature it found across the entire image and combine them into a final mathematical score using a weighted sum.

$$
\underbrace{\begin{pmatrix}
1 & 2 & 3 \\
4 & 5 & 6 \\
7 & 8 & 9
\end{pmatrix}}_{\text{3x3 Grid (Matrix)}}
\xrightarrow{\text{Flatten}}
\underbrace{\begin{pmatrix}
1 & 2 & 3 & 4 & 5 & 6 & 7 & 8 & 9
\end{pmatrix}}_{\text{1x9 Vector}}
$$

This layer was first described systematically by Yann LeCun in his \citeyear{lecun1998gradientbased} paper \citetitle{lecun1998gradientbased}.

### Implementation: TensorFlow vs. PyTorch

The two most popular libraries for AI are **TensorFlow** (which powers the interactive demos on this site) and **PyTorch**. Here is how you define a simple network that uses a Convolutional layer, Flattens the result, and uses a Dense layer for the final output.

#### TensorFlow (Keras)
TensorFlow uses a "Sequential" style where you stack layers like LEGO blocks.

</div>
<pre><code class="language-python">import sys
import os
import json
import argparse
import numpy as np
import tensorflow as tf
from tensorflow.keras import layers, models

def build_model():
    """
    Think of 'Sequential' as a pipe-and-filter architecture.
    Data flows linearly through these transformations.
    """
    model = models.Sequential([
        # LAYER 1: Normalization. Neural nets are sensitive to input variance.
        # Maps [0, 255] byte values to [0.0, 1.0] floats to prevent gradient explosion.
        layers.Rescaling(1./255, input_shape=(100, 100, 3)),
        
        # LAYER 2: Feature Extraction (Spatial Correlation).
        # 32 kernels (filters) perform a sliding-window dot product (convolution).
        # 'relu' is an activation function: f(x) = max(0, x), adding non-linearity.
        layers.Conv2D(32, (3, 3), activation='relu'),
        
        # LAYER 3: Dimensionality Reduction.
        # Reduces the resolution by 50% by taking the max value in a 2x2 window.
        # This provides 'translation invariance' (moving the object slightly doesn't break the logic).
        layers.MaxPooling2D((2, 2)),
        
        # LAYER 4: Serialization.
        # Flattens the multi-dimensional tensor into a 1D vector (array).
        layers.Flatten(),
        
        # LAYER 5: The "Heuristic" Layer.
        # A fully connected layer that learns high-level combinations of the extracted features.
        layers.Dense(64, activation='relu'),
        
        # LAYER 6: Output / Classifier.
        # Sigmoid squashes the output to a [0, 1] range, effectively a Bernoulli distribution.
        layers.Dense(1, activation='sigmoid')
    ])

    # Compile = Defining the objective function and the optimization algorithm.
    # 'adam' is a stochastic gradient descent variant with adaptive learning rates.
    model.compile(
        optimizer='adam', 
        loss='binary_crossentropy', # Log-loss for binary classification
        metrics=['accuracy']
    )
    return model

def train_mode(data_path, save_path):
    """
    Handles data ingestion with an automatic check for dataset size.
    """
    # 1. Count total files to decide if a split is viable
    all_files = tf.io.gfile.glob(os.path.join(data_path, "*/*"))
    num_files = len(all_files)
    
    # We need at least 5 images to make a 20% split meaningful (1 validation image)
    use_split = num_files >= 5

    try:
        if use_split:
            train_ds = tf.keras.utils.image_dataset_from_directory(
                data_path,
                validation_split=0.2,
                subset="training",
                seed=123,
                image_size=(100, 100),
                batch_size=32
            )
            val_ds = tf.keras.utils.image_dataset_from_directory(
                data_path,
                validation_split=0.2,
                subset="validation",
                seed=123,
                image_size=(100, 100),
                batch_size=32
            )
        else:
            print(f"⚠️ Only {num_files} images found. Skipping validation split.")
            train_ds = tf.keras.utils.image_dataset_from_directory(
                data_path,
                image_size=(100, 100),
                batch_size=32
            )
            val_ds = None

            class_names = train_ds.class_names
            print(f"Detected classes: {class_names}")

            with open("classes.json", "w") as f:
                json.dump(class_names, f)

    except Exception as e:
        print(f"Error loading dataset: {e}")
        sys.exit(1)

    model = build_model()
    
    # Pass val_ds only if it exists
    model.fit(train_ds, validation_data=val_ds, epochs=10)
    
    model.save(save_path)
    print(f"Artifact saved: {save_path}")

def predict_mode(model_path, image_path, classes_json="classes.json"):
    model = tf.keras.models.load_model(model_path)
    with open(classes_json, "r") as f:
        class_names = json.load(f)

    img = tf.keras.utils.load_img(image_path, target_size=(100, 100))
    img_array = tf.keras.utils.img_to_array(img)
    img_array = tf.expand_dims(img_array, 0)

    prediction = model.predict(img_array)
    
    # If binary (sigmoid), the result is a single float
    if len(class_names) == 2:
        index = 1 if prediction[0][0] > 0.5 else 0
        confidence = prediction[0][0] if index == 1 else 1 - prediction[0][0]
    else:
        # If multi-class (softmax), the result is a vector of probabilities
        index = np.argmax(prediction[0])
        confidence = prediction[0][index]

    print(f"Result: {class_names[index]} ({confidence:.2%})")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--mode", choices=["train", "predict"], required=True)
    parser.add_argument("--path", required=True, help="Input directory for training or file for prediction")
    parser.add_argument("--model_out", default="classifier.keras")

    args = parser.parse_args()

    if args.mode == "train":
        train_mode(args.path, args.model_out)
    else:
        predict_mode(args.model_out, args.path)</code></pre>

<div class="md">
It can be trained with `python3 tf.py --mode train --path dataset`, where `dataset` is a folder containing one folder with images for each category it should learn. It will save the trained model as `classifier.keras`. The trained model can then be used to classify images with `python3 tf.py --mode predict --path dataset/cat/1.jpg`.

#### PyTorch
PyTorch is more explicit, requiring you to define the "Forward Pass" where data flows through the model.

You can call this script with the same parameters as you can call the TensorFlow one.
</div>

<pre><code class="language-python">import os
import json
import argparse
import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import datasets, transforms, models
from torch.utils.data import DataLoader, random_split
from PIL import Image

# --- MODEL ARCHITECTURE ---
class SimpleCNN(nn.Module):
    def __init__(self, num_classes=1):
        super(SimpleCNN, self).__init__()
        # PyTorch doesn't have a built-in 'Rescaling' layer in the model; 
        # normalization is usually handled in the data Transform pipeline.
        
        self.features = nn.Sequential(
            # LAYER 2: Conv2D. (In_channels=3 for RGB, Out_channels=32, Kernel=3)
            nn.Conv2d(3, 32, kernel_size=3),
            nn.ReLU(),
            
            # LAYER 3: MaxPooling
            nn.MaxPool2d(kernel_size=2),
            
            # Additional layer to refine features (Keras' Flatten is quite aggressive)
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

    # The Training Loop (PyTorch's version of model.fit)
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

    img = Image.open(image_path).convert('RGB')
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
        predict_mode(args.model_out, args.path)</code></pre>

<div class="md">
### Summary of the Flow
1. **Input:** A Tensor (the image).
2. **Conv Layer:** Learns kernels to extract features.
3. **Flatten:** Converts the 2D grid into a 1D list.
4. **Dense Layer:** Weighs those features to give a final answer.
</div>
