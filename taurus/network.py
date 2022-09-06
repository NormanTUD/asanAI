import sys
import os
import numpy as np
from pprint import pprint

def dier (msg):
    pprint(msg)
    sys.exit(1)

json_input = '{"rings" : [[[-8081441.0, 5685214.0], [-8081446.0, 5685216.0], [-8081442.0, 5685219.0], [-8081440.0, 5685211.0], [-8081441.0, 5685214.0]]]}'
numpy_2d_arrays = np.array(dict["rings"])
dier(numpy_2d_arrays)

if not os.path.exists('keras_model'):
    os.system('tensorflowjs_converter --input_format=tfjs_layers_model --output_format=keras_saved_model model.json keras_model')

# Save this file as python-script and run it like this:
# python3 nn.py file_1.jpg file_2.jpg file_3.jpg
import keras
import tensorflow as tf
model = tf.keras.models.load_model(
   'keras_model',
   custom_objects=None,
   compile=True
)

model.summary()


