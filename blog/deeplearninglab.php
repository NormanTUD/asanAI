<?php include_once("functions.php"); ?>
    <h2>Deep Learning Lab</h2>
    <div style="margin-bottom: 15px; display: flex; gap: 10px;">
        <button class="btn" onclick="DeepLab.loadPreset('AND')">AND</button>
        <button class="btn" onclick="DeepLab.loadPreset('XOR')">XOR</button>
        LR: <input type="number" id="deep-lr" value="0.05" step="0.01">
        Epochs: <input type="number" id="deep-epochs" value="100">
    </div>
    <div class="grid-layout">
        <div id="deep-gui" class="layers-vertical"></div>
        <div>
            <div id="fcnn_wrapper">
                <canvas id="fcnn_canvas"></canvas>
            </div>
            <div style="display: flex; gap: 15px; flex-wrap: wrap;">
                <div id="deep-loss-chart" class="plot-container"></div>
                <div id="deep-data-chart" class="plot-container"></div>
            </div>
            <div style="margin-top: 10px;">
                <b>Weights (Live):</b>
                <div id="deep-tensor-viz" style="display:flex; gap:5px; flex-wrap: wrap;"></div>
            </div>
            <div id="deep-math-monitor" style="padding:15px; margin-top:10px;"></div>
            <table id="deep-train-table">
                <thead><tr id="deep-thr"></tr></thead>
                <tbody></tbody>
            </table>
            <button class="btn" style="background:#10b981; color:white; width:100%" onclick="DeepLab.addRow('deep')">+ Add New Data Row</button>
            <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin-top:10px;">
                <div id="manual-input-area" style="display:inline-block; margin: 0 10px;"></div>
                <span>→ <strong id="manual-result" style="color:#b45309">0.00</strong></span>
            </div>
            <button id="btn-deep-train" class="btn btn-train" onclick="DeepLab.toggleTraining('deep')">🚀 Start Training</button>
            <button class="btn" style="background:#64748b; color:white; width:100%" onclick="DeepLab.init('deep')">🔄 Reset Model</button>
            <div id="deep-console" class="status-console"></div>
        </div>
    </div>

<div class="md">
## Output Layer: The Mirror of the Target

The final layer of a neural network is not arbitrary; it is a mathematical mirror of the data you want to predict. Its shape, the number of neurons it contains, must match the dimensionality of your "Labels" (the ground truth).

### Categorical Data and One-Hot Encoding
If you are classifying objects (e.g., Cat, Dog, Bird), the computer cannot easily work with text. However, we also cannot simply assign them numbers like $1, 2,$ and $3$, because the math would assume a Dog ($2$) is "twice as much" as a Cat ($1$).

To solve this, we use **One-Hot Encoding**. Each category becomes its own dimension in a vector:
* **Cat**: $[1, 0, 0]$
* **Dog**: $[0, 1, 0]$
* **Bird**: $[0, 0, 1]$

In this case, your output layer **must have exactly 3 neurons**. To turn the raw numbers from these neurons into something we can understand, we use the **Softmax** activation function. Think of Softmax as a "percentage generator": it squashes the outputs so they all sum up to $1.0$ ($100\%$), allowing the network to say "I am 90% sure this is a Dog". Details are more complicated, but we will come back to them later.

### Spatial and Complex Outputs
The rule of "matching the data" extends to every domain:
* **Binary Classification**: If the answer is just Yes/No (0 or 1), a single neuron with a Sigmoid activation is enough.
* **Image Generation**: If the model is supposed to output a grayscale image of $28 \times 28$ pixels and is a single channel only (black and white), the output layer must contain $784$ neurons (one for every pixel) or be reshaped to match that specific width and height.
* **Coordinates**: If you are predicting the $(x, y)$ location of an object, you need exactly $2$ output neurons.

If the output layer's dimensions do not match the target data's dimensions, the **Loss Function** will be unable to compare the prediction to the reality, and the "loop" of learning will break.
</div>
