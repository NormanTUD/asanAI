import sys
import os
import os.path

import keras
import tensorflow as tf
import json
import numpy as np
from pprint import pprint

import argparse

parser = argparse.ArgumentParser(description='Runs asanAI models with imported data locally or on Taurus.')
parser.add_argument('--taurus', action='store_true', help="Use this when you run this program on Taurus")
parser.add_argument('--train', action='store_true', help="Run training (deletes weights.json if exists)")
parser.add_argument('--predict', action='store_true', help="Is ignored here")

args = parser.parse_args()

def dier (msg):
    pprint(msg)
    sys.exit(1)

def json_file_to_np (filename):
    f = open(filename)
    data = json.load(f)
    f.close()
    return data

j = json_file_to_np("model_data.json")
d = j["data"]
m = j["model_data"]
xy = json.loads(d)
x = tf.convert_to_tensor(xy["x"])
y = tf.convert_to_tensor(xy["y"])

#dier(m)

def get_loss_or_metric (name):
    if name == "meanSquaredError":
        return "mse"
    if name == "mape" or name == "meanAbsolutePercentageError":
        return "mean_absolute_percentage_error",
    if name == "meanAbsoluteError":
        return "mae"
    if name == "sparseCategoricalCrossentropy":
        return "sparse_categorical_crossentropy"
    if name == "categoricalCrossentropy":
        return "categorical_crossentropy"
    if name == "binaryCrossentropy":
        return "binary_crossentropy"
    if name == "categoricalHinge":
        return "categorical_hinge"
    if name == "squaredHinge":
        return "squared_hinge"
    if name == "meanSquaredLogarithmicError":
        return "mean_squared_logarithmic_error"
    if name == "kullbackLeiblerDivergence":
        return "kullback_leibler_divergence"

    return name

def get_optimizer_name (name):
    if name == "adam":
        return "Adam"
    elif name == "adagrad":
        return "Adagrad"
    elif name == "adamax":
        return "Adamax"
    elif name == "sgd":
        return "SGD"
    elif name == "rmsprop":
        return "RMSProp"
    elif name == "adadelta":
        return "Adadelta"

    return name

def get_optimizer_obj (x):
    opt_name = get_optimizer_name(x["optimizer_name"])

    obj = {}

    if opt_name == "Adam":
        obj["learning_rate"] = m["learningRate"]
        obj["beta_1"] = m["beta1"]
        obj["beta_2"] = m["beta2"]
        obj["epsilon"] = m["epsilon"]

        obj = tf.keras.optimizers.Adam(**obj)

        return obj
    elif opt_name == "SGD":
        obj["learning_rate"] = m["learningRate"]

        obj = tf.keras.optimizers.SGD(**obj)

        return obj
    elif opt_name == "RMSProp":
        obj["learning_rate"] = m["learningRate"]
        obj["rho"] = m["rho"]
        obj["momentum"] = m["momentum"]
        obj["epsilon"] = m["epsilon"]

        obj = tf.keras.optimizers.RMSprop(**obj)

        return obj
    elif opt_name == "Adamax":
        obj["learning_rate"] = m["learningRate"]
        obj["beta_1"] = m["beta1"]
        obj["beta_2"] = m["beta2"]
        obj["epsilon"] = m["epsilon"]

        obj = tf.keras.optimizers.Adamax(**obj)

        return obj
    elif opt_name == "Adadelta":
        obj["learning_rate"] = m["learningRate"]
        obj["beta_1"] = m["beta1"]
        obj["beta_2"] = m["beta2"]
        obj["initial_accumulator_value"] = m["initialAccumulatorValue"]

        obj = tf.keras.optimizers.Adagrad(**obj);

        return obj
    elif opt_name == "Adagrad":
        obj["learning_rate"] = m["learningRate"]
        obj["initial_accumulator_value"] = m["initialAccumulatorValue"]
        obj["epsilon"] = m["epsilon"]

        obj = tf.keras.optimizers.Adagrad(**obj);

        return obj

    dier("Unsupported optimizer. Sorry");

class NpEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.integer):
            return int(obj)
        if isinstance(obj, np.floating):
            return float(obj)
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        return json.JSONEncoder.default(self, obj)

json_loss = get_loss_or_metric(m["loss"])
json_metric = get_loss_or_metric(m["metric"])

model = tf.keras.models.model_from_json(
    json.dumps(j["model"]),
    custom_objects=None
)

#dier(model.get_config()["layers"][0]["config"]["batch_input_shape"])

optimizer_obj = get_optimizer_obj(m)

model.compile(
        optimizer=optimizer_obj,
        loss=json_loss, 
        metrics=[json_metric, "acc"],
        run_eagerly=True
)

model.summary()
model.fit(
        x, 
        y, 
        verbose=2,
        epochs=m["epochs"],
        batch_size=m["batchSize"],
        shuffle=True,
        validation_split=(m["validationSplit"] / 100)
)
weights_list = np.array(model.get_weights()).tolist()

wf = "weights.json"
if os.path.isfile(wf):
    os.remove(wf)

f = open(wf, "a")
f.write(json.dumps(weights_list, cls=NpEncoder))
f.close()

model.save(
        'saved_model',
        overwrite=True,
        include_optimizer=True,
        save_format=None,
        signatures=None,
        options=None,
        save_traces=True,
)
