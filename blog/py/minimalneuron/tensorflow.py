"""
The minimal network, in TensorFlow.

A two-layer network that learns XOR. A single neuron cannot learn XOR (its
decision boundary is a straight line), but two layers with a nonlinearity in
between can -- which is exactly why the "From Scratch" tab's single neuron
fits a straight line while this one needs a hidden layer.

Run it (needs tensorflow installed). Because this file is named tensorflow.py,
copy it to a different name first (e.g. nn_tf.py) so that ``import tensorflow``
picks up the real package rather than this file:
    python3 nn_tf.py
"""

import numpy as np
import tensorflow as tf

# --- THE DATA: the four corners of the XOR rule ---
X = np.array([[0, 0], [0, 1], [1, 0], [1, 1]], dtype=np.float32)
Y = np.array([[0], [1], [1], [0]], dtype=np.float32)

model = tf.keras.Sequential([
    tf.keras.layers.Dense(4, activation="relu", input_shape=(2,)),
    tf.keras.layers.Dense(1, activation="sigmoid"),
])
model.compile(optimizer="adam", loss="binary_crossentropy")
model.fit(X, Y, epochs=500, verbose=0)

print("XOR predictions:")
preds = model.predict(X, verbose=0).squeeze(1)
for x, target, pred in zip(X.tolist(), Y.squeeze(1).tolist(), preds.tolist()):
    print(f"  {x} -> {pred:.4f}   (target {int(target)})")
