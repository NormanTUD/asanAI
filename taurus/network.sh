#!/bin/bash

#SBATCH --partition=alpha
#SBATCH --mem=10000MB
#SBATCH --time=02:00:00

exec &> >(tee -a stdout.txt)

asanaienv="$HOME/asanaienv"

cd
if [ -d $asanaienv ]; then
	echo "$asanaienv exists"
else
	python3 -m venv asanaienv
	pip3 install tensorflow tensorflowjs scikit-image
fi
source asanaienv/bin/activate
cd -

python3 network.py
