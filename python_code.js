"use strict";

function python_boilerplate (input_shape_is_image_val, _expert_mode=0) {
	var python_code = "";

	python_code += "#!/usr/bin/env python3\n";

	python_code += "# This generated code is licensed under CC-BY.\n";
	python_code += "\n";
	python_code += "# First, click 'Download model data' (or 'Modelldaten downloaden') and place the file you get in the same folder as this script.\n";
	python_code += "# Then, run this script like this:\n";
	python_code += "# python3 scriptname.py\n";
	if (input_shape_is_image_val) {
		python_code += "# - or -\n";
		python_code += "# python3 scriptname.py 1.jpg 2.jpg 3.jpg\n";
	} else {
		python_code += "# You can either have the data you want to predict in x.txt, or, if it doesn't exist, you'll be asked for the data.\n";
	}

	python_code += "\n";

	python_code += "import sys\n";
	python_code += "import re\n";
	python_code += "import platform\n";
	python_code += "import shutil\n";
	python_code += "import os\n";
	python_code += "import subprocess\n";

	python_code += `
try:
    import venv
except ModuleNotFoundError:
    print("venv not found. Is python3-venv installed?")
    sys.exit(1)

from pathlib import Path

VENV_PATH = Path.home() / ".asanai_venv"
PYTHON_BIN = VENV_PATH / ("Scripts" if platform.system() == "Windows" else "bin") / ("python.exe" if platform.system() == "Windows" else "python")

def create_and_setup_venv():
    print(f"Creating virtualenv at {VENV_PATH}")
    venv.create(VENV_PATH, with_pip=True)
    subprocess.check_call([PYTHON_BIN, "-m", "pip", "install", "--upgrade", "pip"])
    subprocess.check_call([PYTHON_BIN, "-m", "pip", "install", "--upgrade", "asanai"])

def restart_with_venv():
    try:
        result = subprocess.run(
            [str(PYTHON_BIN)] + sys.argv,
            text=True,
            check=True,
            env=dict(**os.environ)
        )
        sys.exit(result.returncode)
    except subprocess.CalledProcessError as e:
        sys.exit(e.returncode)
    except Exception as e:
        print(f"Unexpected error while restarting python: {e}")
        sys.exit(1)

try:
    import asanai
except ModuleNotFoundError:
    if not VENV_PATH.exists():
        create_and_setup_venv()
    else:
        try:
            subprocess.check_call([PYTHON_BIN, "-m", "pip", "install", "-q", "--upgrade", "asanai"])
        except subprocess.CalledProcessError:
            shutil.rmtree(VENV_PATH)
            create_and_setup_venv()
            restart_with_venv()
    try:
        restart_with_venv()
    except KeyboardInterrupt:
        print("You cancelled installation")
        sys.exit(0)

`;

	python_code += "tf = asanai.install_tensorflow(sys.argv)\n";

	python_code += "\n";

	python_code += `# This code converts the tensorflow.js image from the browser to the tensorflow image for usage with python
if not os.path.exists('model.h5'):
    asanai.convert_to_keras_if_needed()

if not os.path.exists('model.h5'):
    print('model.h5 cannot be found')
    sys.exit(1)
`;

	python_code += "\n";

	return python_code;
}

function create_python_code (input_shape_is_image_val) {
	var python_code = python_boilerplate(input_shape_is_image_val, 1);

	python_code += "model = tf.keras.models.load_model('model.h5')\n";
	python_code += "\n";
	python_code += "model.summary()\n";
	python_code += "\n";

	if (input_shape_is_image_val) {
		python_code += "from tensorflow.keras.preprocessing.image import ImageDataGenerator\n";
		python_code += "import numpy as np\n";

		python_code += "\n";

		python_code += "labels = ['" + labels.join("', '") + "']\n";
		python_code += "height = " + height + "\n";
		python_code += "width = " + width + "\n";
		python_code += "divide_by = " + $("#divide_by").val() + "\n";

		python_code += "\n";

		python_code += `import rich
from rich.table import Table

if asanai.output_is_simple_image(model) or asanai.output_is_complex_image(model):
    if len(sys.argv) == 1:
        asanai.visualize_webcam(model, height, width, divide_by)
    else:
        for a in range(1, len(sys.argv)):
            filename = sys.argv[a]
            asanai.visualize(model, filename)
elif asanai.model_is_simple_classification(model):
    for a in range(1, len(sys.argv)):
        filename = sys.argv[a]
        image = asanai.load(filename, height, width, divide_by)

        if image is None:
            asanai.console.print(f"[bold red]Error:[/] Could not load image: [italic]{filename}[/]")
            continue

        prediction = model.predict(image, verbose=0)

        for prediction_idx in range(len(prediction)):
            nr_labels = len(prediction[prediction_idx])
            if len(labels) < nr_labels:
                asanai.console.print(
                    rich.Panel.fit(
                        f"[bold red]Aborted:[/] Model returned [bold]{nr_labels}[/] labels,\\n"
                        f"but only [bold]{len(labels)}[/] labels are defined.",
                        title="Error",
                        border_style="red"
                    )
                )
                sys.exit(1)

            table = Table(show_lines=True)

            table.add_column("Label", style="cyan", justify="right")
            table.add_column("Probability/Output", style="magenta", justify="left")

            for nr_idx in range(nr_labels):
                table.add_row(labels[nr_idx], f"{prediction[prediction_idx][nr_idx]:.4f}")

            asanai.console.print(table)

    # If no command line arguments were given, try to predict the current webcam:
    if len(sys.argv) == 1:
        try:
            import cv2

            cap = cv2.VideoCapture(0)

            while True:
                # Capture frame-by-frame
                ret, frame = cap.read()

                if not ret:
                    import sys
                    print("Could not load frame from webcam. Is the webcam currently in use?")
                    sys.exit(1)

                image = asanai.load_frame(frame, height, width, divide_by)

                if image is not None:
                    predictions = model.predict(image, verbose=0)

                    frame = asanai.annotate_frame(frame, predictions, labels)

                    asanai.print_predictions_line(predictions, labels)

                    if frame is not None:
                        try:
                            cv2.imshow('frame', frame)
                            if cv2.waitKey(1) & 0xFF == ord('q'):
                                break

                            if cv2.getWindowProperty("frame", cv2.WND_PROP_VISIBLE) < 1:
                                print("\\nWindow was closed.")
                                break
                        except cv2.error:
                            print("")
                            sys.exit(1)

            # When everything done, release the capture
            cap.release()
            cv2.destroyAllWindows()
        except KeyboardInterrupt:
            print("You pressed CTRL-c. Program will end.")
            sys.exit(0)
else:
    output = model.predict(dummy_input, verbose=0)

    print("Raw Output:")
    print(output)
`;
	} else {
		python_code += `try:
    while True:
        x = asanai.load_or_input_model_data(model, 'x.txt')
        asanai.show_result(model.predict(x))
except (EOFError, KeyboardInterrupt):
    print("You pressed CTRL-c or CTRL-d. Script will exit.")
    sys.exit(0)
`;
	}

	return python_code;
}

async function update_python_code(dont_reget_labels, get_python_codes=0, hide_labels=0, auto_determine_last_layer_inputs=0) {
	var redo_graph = 0;

	var input_shape = [height, width, number_channels];

	var loss = get_loss();
	var metric_type = get_metric();
	var optimizer_type = get_optimizer();
	var batchSize = get_batch_size();
	var data_origin = get_data_origin();

	var epochs = get_epochs();

	show_python_container();

	var input_shape_is_image_val = input_shape_is_image();

	var x_shape = "";

	if(input_shape_is_image_val) {
		x_shape = "[height, width, 3]";
	}

	if (!dont_reget_labels) {
		await get_label_data();
	}

	var layer_types = $(".layer_type");
	var layer_settings = $(".layer_setting");

	var expert_code = "";

	var is_last_layer = false;

	for (var layer_idx = 0; layer_idx < get_number_of_layers(); layer_idx++) {
		if(layer_idx == (get_number_of_layers() - 1) && auto_determine_last_layer_inputs) {
			is_last_layer = true;
		}

		var type = $(layer_types[layer_idx]).val();

		var [data, this_redo_graph] = await get_data_from_layer_options(data, layer_options, type, layer_idx, redo_graph, input_shape_is_image_val, x_shape);

		redo_graph += this_redo_graph;

		valid_initializer_types.forEach((type) => {
			["regularizer", "initializer"].forEach((func) => {
				var item_name = type + "_" + func;
				if (Object.keys(data).includes(item_name)) {
					if (data[item_name] == "none") {
						delete data[item_name];
					}
				}
			});
		});

		var params = [];
		for (var [key, value] of Object.entries(data)) {
			if (key == "dtype" && layer_idx == 0 || key != "dtype") {
				if (typeof(value) != "undefined" && typeof(key) != "boolean") {
					params.push(get_python_name(key) + "=" + quote_python(get_python_name(value)));
				}
			}
		}

		delete data["visualize"];

		expert_code = create_expert_code_from_layer(expert_code, data, layer_idx, is_last_layer);
	}

	expert_code = finalize_expert_code(expert_code, input_shape_is_image_val, hide_labels);

	var python_code = create_python_code(input_shape_is_image_val);

	set_code("#python", python_code);
	set_code("#python_expert", expert_code);

	await highlight_if_needed("#python");
	await highlight_if_needed("#python_expert");

	if(get_python_codes) {
		return [python_code, expert_code];
	} else {
		return redo_graph;
	}
}

function finalize_expert_code(expert_code, input_shape_is_image_val, hide_labels) {
	if(expert_code) {
		var labels_str = "";
		if(labels.length && !hide_labels) {
			labels_str = "labels = ['" + labels.join("', '") + "']\n";
		}

		var wh = "";

		var is = get_input_shape_with_batch_size();

		is[0] = "None";

		expert_code =
			python_boilerplate(input_shape_is_image_val, 0) +
			labels_str +
			"model = tf.keras.Sequential()\n\n" +
			"from keras import layers\n" +
			expert_code +
			`model.build(input_shape=[${is.join(", ")}])` +
			"\n\nmodel.summary()\n";
	}

	return expert_code;
}

function create_expert_code_from_layer(expert_code, data, layer_idx, is_last_layer) {
	if(model && Object.keys(model).includes("layers")) {
		try {
			var classname = "";

			if(Object.keys(model).includes("layers") && Object.keys(model?.layers).includes("" + layer_idx)) {
				classname = get_layer_classname_by_nr(layer_idx);
			}

			if(Object.keys(data).includes("dilation_rate")) {
				if(!(data.dilation_rate[0].length > 0)) {
					err("Dilation rate must have at least 1 parameter if it exists");

					return "# Error: Dilation rate must have at least one integer parameter, comma seperated\n";
				}
			}

			if(classname) {
				expert_code += model_add_python_structure(classname, data, is_last_layer);
			} else {
				expert_code += "# Problem getting the code for this layer";
			}
		} catch (e) {
			if(("" + e).includes("model?.layers[i] is undefined")) {
				wrn("[update_python_code] model?.layers was undefined. This MAY be harmless.");
			} else {
				expert_code += "# ERROR while creating code: " + e;
				log("[update_python_code] ERROR in python expert code: " + e);
				console.log("[update_python_code] data:", data);
			}
		}
	}

	return expert_code;
}

function or_none (str, prepend = "\"", append = "\"") {
	if(str) {
		if(("" + str).match(/^[+-]?\d+(?:\.\d+)$/)) {
			return parse_float(str);
		} else if(("" + str).match(/^[+-]?\d+$/)) {
			return parse_int(str);
		}
		return prepend + get_python_name(str) + append;
	}
	return "None";
}

function model_add_python_structure(layer_type, data, is_last_layer) {
	assert(layer_type, "layer_type is not defined");
	assert(data, "data is not defined");

	if ("dropout_rate" in data) {
		data["rate"] = data["dropout_rate"];
		delete data["dropout_rate"];
	}

	const special_layers = {
		"Flatten": () => "model.add(layers.Flatten())\n",
		"DebugLayer": () => "# Debug layer are custom to asanAI and are not available in TensorFlow\n",
		"MultiActivation": () => "# Debug layer are custom to asanAI and are not available in TensorFlow\n",
		"Snake": () => "# Snake layer are custom to asanAI and are not available in TensorFlow\n",
		"Reshape": () => `model.add(layers.Reshape(\n\ttarget_shape=[${data.target_shape}]\n))\n`,
		"Conv2D": () => `model.add(layers.Conv2D(\n\t${data.filters},\n\t(${data.kernel_size}),\n${python_data_to_string(data, ["filters","kernel_size"])}\n))\n`,
		"Conv2DTranspose": () => `model.add(layers.Conv2DTranspose(\n\t${data.filters},\n\t(${data.kernel_size}),\n${python_data_to_string(data, ["kernel_size","filters"])}\n))\n`,
		"Dense": () => {
			if (is_last_layer) {
				data["units"] = "len([name for name in os.listdir('data') if os.path.isdir(os.path.join('data', name))])";
			}
			return `model.add(layers.Dense(\n${python_data_to_string(data)}\n))\n`;
		},
		"GaussianNoise": () => `model.add(layers.GaussianNoise(stddev=${data.stddev}, seed=${or_none(data.seed)}))\n`,
		"MaxPooling3D": () => `model.add(layers.MaxPooling3D(\n\t(${data.pool_size.join(", ")}),\n${python_data_to_string(data, ["pool_size"])}\n))\n`,
		"MaxPooling1D": () => `model.add(layers.MaxPooling1D(\n\t(${data.pool_size[0]}),\n${python_data_to_string(data, ["pool_size"])}\n))\n`
	};

	if (layer_type in special_layers) {
		return special_layers[layer_type]();
	}

	return `model.add(layers.${layer_type}(\n${python_data_to_string(data)}\n))\n`;
}

function python_data_to_string (_data, _except=[]) {
	assert(typeof(_data) == "object", "_data is not an object for python_data_to_string");
	assert(typeof(_except) == "object", "_except is not an object for python_data_to_string");

	var strings = [];
	var _string = "";

	var keys = Object.keys(_data);

	_except.push("input_shape");

	for (var key_idx = 0; key_idx < keys.length; key_idx++) {
		var key = keys[key_idx];

		if(!_except.includes(key)) {
			if(key == "strides" || key == "dilation_rate" || key == "pool_size") {
				assert(typeof(_data[key]) == "object", "_data[key] for " + key + " is not an object!");
				strings.push(`\t${key}=(${_data[key].join(", ")})`);
			} else if(key == "use_bias" || key == "trainable") {
				var true_or_false = 0;
				if(_data[key] == "True" || _data[key] == "true" || _data[key] == "1" || _data[key] == 1) {
					true_or_false = 1;
				}
				strings.push(`\t${key}=${true_or_false ? "True" : "False"}`);
			} else if(key == "size") {
				strings.push(`\tsize=${or_none(_data.size, "(", ")")}`);
			} else {
				if(typeof(_data[key]) == "string") {
					if (_data[key].startsWith("len")) {
						strings.push(`\t${key}=${_data[key]}`);
					} else {
						strings.push(`\t${key}=${or_none(_data[key])}`);
					}
				} else {
					strings.push(`\t${key}=${or_none(_data[key])}`);
				}
			}
		}
	}

	_string = strings.join(",\n");

	return _string;
}

function convert_to_python_string(obj) {
	var pythonCode = "{";
	var i = 0;
	for (var key in obj) {
		if(i == 0) {
			pythonCode += "\n";
		}
		let value = obj[key];
		if(!("" + value).startsWith("[")) {
			if (typeof value == "boolean") {
				value = value ? "True" : "False";
			} else if (!isNaN(value)) {
				if (Number.isInteger(parse_float(value))) {
					value = parse_int(value);
				} else {
					value = parse_float(value);
				}
			} else {
				value = "\"" + value + "\"";
			}
		}
		pythonCode += `    ${key}: ${value},\n`;
		i++;
	}
	pythonCode += "}";
	return pythonCode;
}

function quote_python(item, nobrackets=0) {
	if (item === undefined) {
		return "";
	}

	if (typeof(item) == "object") {
		return JSON.stringify(item);
	} else {
		if (is_numeric(item)) {
			return item;
		} else if (!nobrackets && /^\d+(,\d+)*$/.test(item)) {
			return "[" + item + "]";
		} else if (item == "True" || item == "False") {
			return item;
		} else if (!nobrackets && item.includes("get_shape")) {
			return item;
		} else if (!nobrackets && item.startsWith("[")) {
			return item;
		} else {
			return "\"" + item + "\"";
		}
	}
}

function get_python_name(_name) {
	if(typeof(_name) == "boolean") {
		if(_name) {
			return "True";
		}
		return "False";
	}

	if(Array.isArray(_name)) {
		return _name;
	}

	if (_name in js_names_to_python_names) {
		return js_names_to_python_names[_name];
	}
	return _name;
}

function get_js_name(_name) {
	if(typeof(_name) == "boolean") {
		if(_name) {
			return "true";
		}
		return "false";
	}

	if(Array.isArray(_name)) {
		return _name;
	}

	if (_name in python_names_to_js_names) {
		return python_names_to_js_names[_name];
	}
	return _name;
}

function _get_tensorflow_data_loader_code () {
	var _batch_size = $("#batchSize").val();
	var _validation_split = parse_float($("#validationSplit").val()) / 100;

	return `
from tensorflow.keras.preprocessing.image import ImageDataGenerator

# Define size of images
target_size = (${height}, ${width})

# Create ImageDataGenerator to read images and resize them
datagen = ImageDataGenerator(rescale=1./divide_by, # Normalize (from 0-255 to 0-1)
                             validation_split=${_validation_split}, # Split into validation and training datasets
                             preprocessing_function=lambda x: tf.image.resize(x, target_size)) # Resize images

# Read images and split them into training and validation dataset automatically
train_generator = datagen.flow_from_directory(
    'data',
    target_size=target_size,
    batch_size=${_batch_size},
    class_mode='categorical',
    subset='training')

validation_generator = datagen.flow_from_directory(
    'data',
    target_size=target_size,
    batch_size=32,
    class_mode='categorical',
    subset='validation')

import json

labels = (train_generator.class_indices)
labels = dict((v,k) for k,v in labels.items())
labels_array = [labels[value] for value in labels]

try:
    with open('labels.json', 'w') as json_file:
        json.dump(labels_array, json_file)
except Exception as e:
    print("Error writing the JSON file:", e)

`;
}

function _get_run_sh_file_for_custom_training () {
	return `#!/bin/bash

function echoerr() {
        echo "$@" 1>&2
}

function green_text {
        echo -e "\\033[0;32m$1\\e[0m"
}

function red_text {
        echoerr -e "\\e[31m$1\\e[0m"
}

set -e
set -o pipefail

function calltracer () {
        red_text 'Last file/last line:'
        caller
}
trap 'calltracer' ERR

function help () {
        echo "Possible options:"
        echo "  --train"
        echo "  --predict"
        echo "  --learning_rate=FLOAT"
        echo "  --epochs=INT"
        echo "  --validation_split=FLOAT"
        echo "  --width=(INT)=INT"
        echo "  --height=(INT)=INT"
        echo "  --help                                             this help"
        echo "  --debug                                            Enables debug mode (set -x)"
        exit $1
}

train=0
predict=0

if [[ -d "saved_model" ]]; then
        green_text "saved_model file was found, that means: the model has already been trained and can be used to predict."
        predict=1
        train=0
else
        green_text "saved_model file was not found. Model has not yet been trained and, by default, will be trained"
        predict=0
        train=1
fi

for i in $@; do
        case $i in
                --train)
                        train=1
                        predict=0
                        shift
                        ;;
                --predict)
                        train=0
                        predict=1
                        shift
                        ;;
                --learning_rate=*)
                        learning_rate="\${i#*=}"
                        re='^[+-]?[0-9]+([.][0-9]+)?$'
                        if ! [[ $learning_rate =~ $re ]] ; then
                                red_text "error: Not a FLOAT: $i" >&2
                                help 1
                        fi
                        shift
                        ;;
                --epochs=*)
                        epochs="\${i#*=}"
                        re='^[+-]?[0-9]+$'
                        if ! [[ $epochs =~ $re ]] ; then
                                red_text "error: Not a INT: $i" >&2
                                help 1
                        fi
                        shift
                        ;;
                --validation_split=*)
                        validation_split="\${i#*=}"
                        re='^[+-]?[0-9]+([.][0-9]+)?$'
                        if ! [[ $validation_split =~ $re ]] ; then
                                red_text "error: Not a FLOAT: $i" >&2
                                help 1
                        fi
                        shift
                        ;;
                --width=*)
                        width="\${i#*=}"
                        re='^[+-]?[0-9]+$'
                        if ! [[ $width =~ $re ]] ; then
                                red_text "error: Not a INT: $i" >&2
                                help 1
                        fi
                        shift
                        ;;
                --height=*)
                        height="\${i#*=}"
                        re='^[+-]?[0-9]+$'
                        if ! [[ $height =~ $re ]] ; then
                                red_text "error: Not a INT: $i" >&2
                                help 1
                        fi
                        shift
                        ;;

                -h|--help)
                        help 0
                        ;;
                --debug)
                        set -x
                        ;;
        esac
done

ENV_DIR=$HOME/.asanaienv
if [[ ! -d "$ENV_DIR" ]]; then
        green_text "$ENV_DIR not found. Creating virtual environment."
        python3 -m venv $ENV_DIR
        source $ENV_DIR/bin/activate

        pip install tensorflow tensorflowjs protobuf scikit-image opencv-python keras termcolor pyyaml h5py
fi

source $ENV_DIR/bin/activate

if [[ "$train" == 1 ]]; then
        python3 train.py $*
elif [[ "$predict" == 1 ]]; then
        python3 predict.py $*
else
        red_text "Neither predict nor train was set."
fi
`;
}

function _get_predict_py_for_local_training () {
	var old_divide_by_value = $("#divide_by").val();

	return `#!/usr/bin/env python3
# This generated code is licensed under CC-BY.

import sys
import os
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Conv2D, Flatten, Dense
from tensorflow.keras.preprocessing import image
from termcolor import colored

def predict_single_file(file_path, model, labels):
    img = image.load_img(file_path, target_size=(${height}, ${width}))
    img_array = image.img_to_array(img)
    img_array = np.expand_dims(img_array, axis=0) / ${old_divide_by_value}

    prediction = model.predict(img_array)
    max_label_idx = np.argmax(prediction)
    predicted_label = labels[max_label_idx]
    print(f"Predicted label for {file_path}: {predicted_label}")

    for prediction_idx in range(0, len(prediction[0])):
        if prediction_idx == max_label_idx:
            print(colored(f"{labels[prediction_idx]}: {prediction[0][prediction_idx]}", "green"))
        else:
            print(f"{labels[prediction_idx]}: {prediction[0][prediction_idx]}")

def main():
    if not os.path.exists('saved_model'):
        print("Error: 'saved_model' does not exist. Please train the model first.")
        sys.exit(1)

    labels = []
    import json

    try:
        with open('labels.json', 'r') as json_file:
            labels = json.load(json_file)
    except Exception as e:
        print("Error loading labels.json:", e)

    model = None

    try:
        model = tf.keras.models.load_model('saved_model')
    except OSError as e:
        print(colored(str(e), "red"))
        sys.exit(1)

    model.summary()

    if len(sys.argv) < 2:
        print("Usage: predict.py <file1> <file2> ...")
        sys.exit(2)

    for file_path in sys.argv[1:]:
        if not os.path.exists(file_path):
            print(f"Error: File '{file_path}' does not exist.")
            continue
        predict_single_file(file_path, model, labels)

if __name__ == "__main__":
    main()
`;
}

function _get_readme_md_for_local_training () {
	return `# What is this?

This is a package there is everything to run the neural network you created in asanAI on your local hardware.

# Quickstart:

In the \`data\` directory, there are subdirectories, one for each category.

Put your images into these folders, and run \`bash run.sh --train\` to train the model. It will automatically get saved as \`saved_model\`, and then you can predict new images with \`bash run.sh --predict filename1.jpg\`.

# Files:

## run.sh

This is the run-script for the network. It installs all dependencies like TensorFlow, Keras and so on that you need to train the neural network and predict it.

## train.py

This file is for training the neural network. Run it with:

\`\`\`
bash run.sh --train
\`\`\`

## predict.py

This file is for predicting files with the neural network. Run it with:

\`\`\`
bash run.sh --predict imagefile1.jpg imagefile2.jpg ...
\`\`\`

# Problems?

Contact <norman.koch@tu-dresden.de>.
`;
}

function _get_tensorflow_save_model_code () {
	var _epochs = $("#epochs").val();

	var _optimizer = get_optimizer();

	var _optimizer_python_name = "";

	var possible_options = {
		beta1: "beta_1",
		beta2: "beta_2",
		decay: "weight_decay",
		epsilon: "epsilon",
		initialAccumulatorValue: "initial_accumulator_value",
		learningRate: "learning_rate",
		momentum: "momentum",
		rho: "rho"
	};

	var optimizer_values = {};

	var optimizer_option_keys = Object.keys(possible_options);

	for (var optimizer_option_idx = 0; optimizer_option_idx < optimizer_option_keys.length; optimizer_option_idx++) {
		var element_name = `#${optimizer_option_keys[optimizer_option_idx]}_${_optimizer}`;

		var $option_element = $(element_name);

		if ($option_element.length) {
			optimizer_values[possible_options[optimizer_option_keys[optimizer_option_idx]]] = $option_element.val();
		}
	}

	var optimizer_params_python_array = [];

	var given_params_names = Object.keys(optimizer_values);

	for (var given_param_name_idx = 0; given_param_name_idx < given_params_names.length; given_param_name_idx++) {
		optimizer_params_python_array.push(given_params_names[given_param_name_idx] + "=" + optimizer_values[given_params_names[given_param_name_idx]]);
	}

	var optimizer_params_python = optimizer_params_python_array.join(", ");

	switch (_optimizer) {
	case "adam":
		_optimizer_python_name = "Adam";
		break;

	case "adadelta":
		_optimizer_python_name = "Adadelta";
		break;

	case "adagrad":
		_optimizer_python_name = "Adagrad";
		break;

	case "adamax":
		_optimizer_python_name = "Adamax";
		break;

	case "rmsprop":
		_optimizer_python_name = "RMSprop";
		break;

	case "sgd":
		_optimizer_python_name = "SGD";
		break;

	default:
		err("Unknown optimizer name: " + _optimizer);
		return;
	}

	return `

parser = argparse.ArgumentParser(description='Description of your program')
parser.add_argument('--train', action='store_true', help='Train the model')
parser.add_argument('--predict', action='store_true', help='Use the trained model for prediction')
parser.add_argument('--learning_rate', type=float, help='Learning rate as a floating point number')
parser.add_argument('--epochs', type=int, help='Number of epochs as an integer')
parser.add_argument('--validation_split', type=float, help='Validation split as a floating point number')
parser.add_argument('--width', type=int, help='Width as an integer')
parser.add_argument('--height', type=int, help='Height as an integer')
parser.add_argument('--debug', action='store_true', help='Enables debug mode (set -x)')

args = parser.parse_args()

from tensorflow.keras.optimizers import ${_optimizer_python_name}
optimizer = ${_optimizer_python_name}(${optimizer_params_python})

model.compile(optimizer=optimizer, loss='categorical_crossentropy', metrics=['accuracy'])
model.fit(train_generator, validation_data=validation_generator, epochs=${_epochs})

# Save the model to saved_model for future usage.
model.save('saved_model')
`;
}

async function _download_model_for_training () {
	var old_divide_by_value = $("#divide_by").val();

	$("#divide_by").val(1);

	var data = JSON.parse(await get_x_y_as_array());

	if(!Object.keys(data).includes("x")) {
		err(language[lang]["could_not_retrieve_x_data"]);
		return;
	}

	if(!Object.keys(data).includes("y")) {
		err(language[lang]["could_not_retrieve_y_data"]);
		return;
	}

	var x_keys = Object.keys(data["x"]);
	var y_keys = Object.keys(data["y"]);

	if(x_keys.length != y_keys.length) {
		err(sprintf(language[lang]["x_and_y_keys_must_have_same_nr_of_values_but_has_m_and_y"], x_keys.length, y_keys.length));
		return;
	}

	$("#divide_by").val(old_divide_by_value);

	var python_codes = await update_python_code(1, 1, 1, 1);

	var expert_code = python_codes[1];

	expert_code += "\nfrom termcolor import colored\n";

	expert_code += "\ndivide_by = " + old_divide_by_value + "\n";

	expert_code += "\n" + _get_tensorflow_data_loader_code();
	expert_code += "\n" + _get_tensorflow_save_model_code();

	var zipWriter = new zip.ZipWriter(new zip.BlobWriter("application/zip"));

	var expert_code_reader = new zip.TextReader(expert_code);
	await zipWriter.add("train.py", expert_code_reader);

	var run_sh_reader = new zip.TextReader(_get_run_sh_file_for_custom_training());
	await zipWriter.add("run.sh", run_sh_reader);

	var predict_py_reader = new zip.TextReader(_get_predict_py_for_local_training());
	await zipWriter.add("predict.py", predict_py_reader);

	var readme_sh_reader = new zip.TextReader(_get_readme_md_for_local_training());
	await zipWriter.add("README.md", readme_sh_reader);

	var k = 0;

	for (var x_keys_idx = 0; x_keys_idx < x_keys.length; x_keys_idx++) {
		var x_value = data["x"][x_keys_idx];
		var y_value = data["y"][x_keys_idx];

		var label_nr = y_value.indexOf(1);
		var label = labels[label_nr];

		var filename = `data/${label}/${k}.jpg`;

		const canvas = document.createElement("canvas");
		const ctx = canvas.getContext("2d");

		canvas.width = x_value[0].length;
		canvas.height = x_value.length;

		x_value.forEach((row, y) => {
			row.forEach((pixel, x) => {
				ctx.fillStyle = `rgb(${pixel.join(",")})`;
				ctx.fillRect(x, y, 1, 1);
			});
		});

		var data_url = canvas.toDataURL("image/png");

		var blob = dataURLToBlob(data_url);

		zipWriter.add(filename, new zip.BlobReader(blob));

		k++;
	}

	var res = await zipWriter.close();

	return res;
}

async function get_data_from_layer_options(data, layer_options, type, layer_idx, redo_graph, input_shape_is_image_val, x_shape) {
	data = get_data_with_input_shape_for_python_code(layer_idx, input_shape_is_image_val, data, x_shape);

	if (type in layer_options) {
		for (var j = 0; j < layer_options[type]["options"].length; j++) {
			var option_name = layer_options[type]["options"][j];

			if(data === null || data === undefined) {
				return null;
			}

			if (option_name == "pool_size") {
				data = add_pool_size_to_data(data, option_name, layer_idx);
			} else if (option_name == "strides") {
				data = add_strides_to_data(data, option_name, layer_idx);
			} else if (option_name == "kernel_size") {
				data = await add_kernel_size_to_data(data, option_name, layer_idx);
			} else if (option_name == "size") {
				data = add_size_to_data(data, option_name, layer_idx);
			} else if (option_name == "dilation_rate") {
				data = add_dilation_rate_to_data(data, option_name, layer_idx);
			} else if (option_name == "target_shape") {
				data = add_target_shape_to_data(data, option_name, layer_idx);
			} else if (option_name == "activation") {
				data = add_activation_to_data(data, option_name, layer_idx);
			} else {
				data = add_other_data_to_data(data, option_name, layer_idx);
			}
		}

		redo_graph++;
	}

	return [data, redo_graph];
}

async function download_model_for_training () {
	var blob = await _download_model_for_training();
	downloadNetworkZip(blob);
}

function add_dilation_rate_to_data(data, option_name, layer_idx) {
	var dil_rate = get_item_value(layer_idx, option_name);

	if(dil_rate == "") {
		dil_rate = generateOnesString(get_layer_type_array()[layer_idx]);
	}

	dil_rate = dil_rate.replace(/[^0-9,]/g, "");

	dil_rate.replace(/\s*,\s*/g, ", ");

	var code_str = "[" + dil_rate + "]";

	data[get_python_name(option_name)] = eval("[" + code_str + "]");

	return data;
}

function add_size_to_data(data, option_name, layer_idx) {
	const val = get_item_value(layer_idx, "size");
	if(isCommaSeparatedIntegers(val)) {
		data[get_python_name(option_name)] = eval("[" + val + "]");
	} else {
		err(`Layer ${layer_idx} has a wrong value for 'size'. Should be comma-seperated list of integers, is: "${val}"`);
	}

	return data;
}

async function add_kernel_size_to_data (data, option_name, layer_idx) {
	var kernel_size_x = get_item_value(layer_idx, "kernel_size_x");
	var kernel_size_y = get_item_value(layer_idx, "kernel_size_y");
	var kernel_size_z = get_item_value(layer_idx, "kernel_size_z");

	if(kernel_size_x && kernel_size_y && kernel_size_z) {
		data[get_python_name(option_name)] = [
			parse_int(kernel_size_x),
			parse_int(kernel_size_y),
			parse_int(kernel_size_z)
		];
	} else if (kernel_size_x && kernel_size_y) {
		data[get_python_name(option_name)] = [
			parse_int(kernel_size_x),
			parse_int(kernel_size_y)
		];
	} else if (kernel_size_x) {
		data[get_python_name(option_name)] = [
			parse_int(kernel_size_x)
		];
	} else {
		err(`Neither (kernel_size_x && kernel_size_y && kernel_size_z) nor (kernel_size_x && kernel_size_z) nor (kernel_size_x). Kernel-Data: ${JSON.stringify({kernel_size_x: kernel_size_x, kernel_size_y: kernel_size_y, kernel_size_z: kernel_size_z, })}`);
		return;
	}

	return data;
}

function add_strides_to_data (data, option_name, layer_idx) {
	var _strides_x = get_item_value(layer_idx, "strides_x");
	var _strides_y = get_item_value(layer_idx, "strides_y");

	if(looks_like_number(_strides_x) && looks_like_number(_strides_y)) {
		data[get_python_name(option_name)] = [parse_int(_strides_x), parse_int(_strides_y)];
	}

	return data;
}

function add_pool_size_to_data(data, option_name, layer_idx) {
	var _pool_size_x = get_item_value(layer_idx, "pool_size_x");
	var _pool_size_y = get_item_value(layer_idx, "pool_size_y");

	if(looks_like_number(_pool_size_x) && looks_like_number(_pool_size_y)) {
		data[get_python_name(option_name)] = [parse_int(_pool_size_x), parse_int(_pool_size_y)];
	}

	return data;
}

function add_activation_to_data (data, option_name, layer_idx) {
	if(option_name) {
		data[get_python_name(option_name)] = get_python_name(get_item_value(layer_idx, option_name));
	}

	return data;
}

function add_target_shape_to_data (data, option_name, layer_idx) {
	const target_shape = get_item_value(layer_idx, "target_shape");

	const elem_name = get_python_name(option_name);

	if(target_shape.match(/^\d+(,\d+)*$/)) {
		data[elem_name] = eval("[" + target_shape + "]");
	} else {
		const default_target_shape = calculate_default_target_shape(layer_idx);
		err(`Invalid target shape: ${target_shape}, must be comma-seperated list of integers. Using default target-shape: [${default_target_shape.join(",")}]`);
		data[elem_name] = default_target_shape;
	}

	return data;
}

function add_other_data_to_data (data, option_name, layer_idx) {
	data[get_python_name(option_name)] = get_item_value(layer_idx, option_name);

	return data;
}

function get_data_with_input_shape_for_python_code(layer_idx, input_shape_is_image_val, data, x_shape) {
	data = {};

	if (layer_idx == 0) {
		if (input_shape_is_image_val) {
			data["input_shape"] = x_shape;
		} else {
			data["input_shape"] = "get_shape('x.txt')";
		}
	}

	return data;
}
