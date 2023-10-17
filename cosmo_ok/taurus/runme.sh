#!/bin/bash -l

#SBATCH --partition=alpha
#SBATCH --mem=10000MB
#SBATCH --time=02:00:00

exec &> >(tee -a stdout.txt)

function echoerr() {
	echo "$@" 1>&2
}

function red_text {
	echoerr -e "\e[31m$1\e[0m"
}

set -e
set -o pipefail
set -u

function calltracer () {
	echo 'Last file/last line:'
	caller
}
trap 'calltracer' ERR

function help () {
	echo "Possible options:"
	echo "  --taurus						This loads modules via ml instead of virtualenv. Use it only when you are on Taurus."
	echo "  --train							If you want to train (current weights.json gets deleted it if exists)"
	echo "  --predict						If you want to use this call to predict (weights.json file must exist)"
	echo "  --help							this help"
	echo "  --debug							Enables debug mode (set -x)"
	exit $1
}
export taurus=0
export train=0
export predict=0

PARAMS="$@"

for i in $@; do
	case $i in
		--taurus)
			taurus=1
			;;
		--train)
			train=1
			;;
		--predict)
			predict=1
			;;
		-h|--help)
			help 0
			;;
		--debug)
			shift
			set -x
			;;
		*)
			red_text "Unknown parameter $i" >&2
			help 1
			;;
	esac
done


if [[ "$taurus" == 1 ]]; then
	ml modenv/hiera 2>&1>/dev/null
	ml GCC/10.3.0 2>&1>/dev/null
	ml OpenMPI/4.1.1 2>&1>/dev/null
	ml TensorFlow/2.6.0-CUDA-11.3.1 2>&1>/dev/null
else
	asanaienv="$HOME/asanaienv"
	cd
	if [ -d $asanaienv ]; then
		source asanaienv/bin/activate
	else
		python3 -m venv asanaienv
		source asanaienv/bin/activate
		pip install --ignore-installed tensorflow tensorflowjs scikit-image keras
	fi
	cd - >/dev/null
fi

if [[ -e model_data.json ]]; then
	if [[ "$train" == 1 ]]; then
		python3 network.py $PARAMS 2>&1
	fi

	if [[ "$predict" == 1 ]]; then
		python3 predict.py $PARAMS 2>&1
	fi

	if [[ "$train" == 0 ]]; then
		if [[ "$predict" == 0 ]]; then
			red_text "Please use either --train or --predict";
		fi
	fi
else
	red_text "Sorry, you need the model_data.json file to be present in the same directory. It doesn't seem to be there."
	red_text "Maybe you want to copy the .example_data.json to model_data.json to test how this script works?"
fi
