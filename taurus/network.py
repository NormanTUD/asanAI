import os

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


