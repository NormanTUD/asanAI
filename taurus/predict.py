import sys
import os
import os.path

import keras
import tensorflow as tf
import json
import numpy as np
from pprint import pprint

def dier (msg):
    pprint(msg)
    sys.exit(1)

def json_file_to_np (filename):
    f = open(filename)
    data = json.load(f)
    f.close()
    return data

j = json_file_to_np("_data.json")

model = tf.keras.models.model_from_json(
    json.dumps(j["model"]),
    custom_objects=None
)

model.summary()

print("Input shape: " + str(model.get_config()["layers"][0]["config"]["batch_input_shape"]))

print("Here, you need to get X in a way that matches the input shape the previous command gives you.")
print("I cannot help you here, since I do not know what kind of data you want to predict.")
print("Look at the source of predict.py to go further")
#model.predict(X)
