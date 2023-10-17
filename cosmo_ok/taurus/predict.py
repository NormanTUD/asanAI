import sys
import os
import os.path

import keras
import tensorflow as tf
import numpy as np

import argparse

parser = argparse.ArgumentParser(description='Runs asanAI models with imported data locally or on Taurus.')
parser.add_argument('--taurus', action='store_true', help="Use this when you run this program on Taurus")
parser.add_argument('--train', action='store_true', help="Run training (deletes weights.json if exists)")
parser.add_argument('--predict', action='store_true', help="Is ignored here")

args = parser.parse_args()


model = keras.models.load_model("saved_model")

model.summary()

print("Input shape: " + str(model.get_config()["layers"][0]["config"]["batch_input_shape"]))

print("Here, you need to get X in a way that matches the input shape the previous command gives you.")
print("I cannot help you here, since I do not know what kind of data you want to predict.")
print("Look at the source of predict.py to go further")
#model.predict(X)
