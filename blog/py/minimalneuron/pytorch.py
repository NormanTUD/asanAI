import numpy as np
import tensorflow as tf

# --- THE DATA ---
# Inputs: [X1, X2], Outputs: [Y]
X = np.array([[0, 0], [0, 1], [1, 0], [1, 1]], dtype=np.float32)
Y = np.array([[0], [1], [1], [0]], dtype=np.float32) # XOR Logic

def build_tf_nn(layers=1):
    if layers == 1:
        # Simple Linear Model / Perceptron
        model = tf.keras.Sequential([
            tf.keras.layers.Dense(units=1, input_shape=(2,), activation="sigmoid")
        ])
    else:
        # 2-Layered Neural Network
        model = tf.keras.Sequential([
            tf.keras.layers.Dense(units=4, input_shape=(2,), activation="relu"), # Hidden
            tf.keras.layers.Dense(units=1, activation="sigmoid")                # Output
        ])
    
    model.compile(optimizer="adam", loss="binary_crossentropy", metrics=["accuracy"])
    return model

# Train and Test
tf_model = build_tf_nn(layers=2)
tf_model.fit(X, Y, epochs=500)
print(f"TF Prediction for [0,0]: {tf_model.predict(np.array([[0,0]]))}")
print(f"TF Prediction for [0,1]: {tf_model.predict(np.array([[0,1]]))}")
print(f"TF Prediction for [1,0]: {tf_model.predict(np.array([[1,0]]))}")
print(f"TF Prediction for [1,1]: {tf_model.predict(np.array([[1,0]]))}")
