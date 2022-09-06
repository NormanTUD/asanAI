import json
import sys
import os
import numpy as np
from pprint import pprint

def dier (msg):
    pprint(msg)
    sys.exit(1)

def json_to_np (o, path):
    dict = json.loads(o)
    numpy_2d_arrays = np.array(dict[path])
    return numpy_2d_arrays

def json_file_to_np (filename):
    f = open(filename)
    data = json.load(f)
    f.close()
    return data

j = json_file_to_np("data.json")
d = j["data"]
m = j["model_data"]

def get_x_np(d):
    return np.squeeze(np.array([json.loads(d)["x"]]), 0)

def get_y_np(d):
    return np.squeeze(np.array([json.loads(d)["y"]]), 0)

#dier(get_x_np(d).shape)
#dier(json_file_to_np("data.json"))

#if not os.path.exists('keras_model'):
#    os.system('tensorflowjs_converter --input_format=tfjs_layers_model --output_format=keras_saved_model model.json keras_model')

# Save this file as python-script and run it like this:
# python3 nn.py file_1.jpg file_2.jpg file_3.jpg
import keras
import tensorflow as tf
#model = tf.keras.models.load_model(
#   'keras_model',
#   custom_objects=None,
#   compile=True
#)

model = tf.keras.models.model_from_json(
    json.dumps(j["model"]),
    custom_objects=None
)

model.compile(optimizer="Adam", loss="mse", metrics=["mae", "acc"])

model.summary()

model.fit(get_x_np(d), get_y_np(d), epochs=m["epochs"])

import json
weights_list = model.get_weights()
print json.dumps(weights_list.tolist())
