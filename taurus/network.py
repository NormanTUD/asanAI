import sys
import os

import keras
import tensorflow as tf
import json
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
xy = json.loads(d)
x = xy["x"]
y = xy["y"]

#dier(m)

def get_loss_or_metric (name):
    if name == "meanSquaredError":
        return "mse"
    if name == "mape":
        return "meanAbsolutePercentageError",
    if name == "meanAbsolutError":
        return "mae"

    return name

def get_optimizer_name (name):
    if name == "adam":
        return "Adam"
    if name == "adagrad":
        return "Adagrad"
    if name == "adamax":
        return "Adamax"
    if name == "sgd":
        return "SGD"
    if name == "rmsprop":
        return "RMSProp"

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

optimizer_obj = get_optimizer_obj(m)

model.compile(
        optimizer=optimizer_obj,
        loss=json_loss, 
        metrics=[json_metric, "acc"]
)
model.summary()
model.fit(
        x, 
        y, 
        epochs=m["epochs"],
        batch_size=m["batchSize"],
        validation_split=m["validationSplit"]
)
weights_list = np.array(model.get_weights()).tolist()
f = open("weights.json", "a")
f.write(json.dumps(weights_list, cls=NpEncoder))
f.close()
