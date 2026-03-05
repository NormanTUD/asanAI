import sys
import os
import json
import argparse
import numpy as np
import tensorflow as tf
from tensorflow.keras import layers, models

def build_model():
    """
    Think of "Sequential" as a pipe-and-filter architecture.
    Data flows linearly through these transformations.
    """
    model = models.Sequential([
        # LAYER 1: Normalization. Neural nets are sensitive to input variance.
        # Maps [0, 255] byte values to [0.0, 1.0] floats to prevent gradient explosion.
        layers.Rescaling(1./255, input_shape=(100, 100, 3)),
        
        # LAYER 2: Feature Extraction (Spatial Correlation).
        # 32 kernels (filters) perform a sliding-window dot product (convolution).
        # relu is an activation function: f(x) = max(0, x), adding non-linearity.
        layers.Conv2D(32, (3, 3), activation="relu"),
        
        # LAYER 3: Dimensionality Reduction.
        # Reduces the resolution by 50% by taking the max value in a 2x2 window.
        # This provides "translation invariance" (moving the object slightly doesn"t break the logic).
        layers.MaxPooling2D((2, 2)),
        
        # LAYER 4: Serialization.
        # Flattens the multi-dimensional tensor into a 1D vector (array).
        layers.Flatten(),
        
        # LAYER 5: The "Heuristic" Layer.
        # A fully connected layer that learns high-level combinations of the extracted features.
        layers.Dense(64, activation="relu"),
        
        # LAYER 6: Output / Classifier.
        # Sigmoid squashes the output to a [0, 1] range, effectively a Bernoulli distribution.
        layers.Dense(1, activation="sigmoid")
    ])

    # Compile = Defining the objective function and the optimization algorithm.
    # "adam" is a stochastic gradient descent variant with adaptive learning rates.
    model.compile(
        optimizer="adam", 
        loss="binary_crossentropy", # Log-loss for binary classification
        metrics=["accuracy"]
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
        predict_mode(args.model_out, args.path)
