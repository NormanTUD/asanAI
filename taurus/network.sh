#!/bin/bash

#SBATCH --partition=ml
#SBATCH --mem=10000MB
#SBATCH --time=002:00:00
#SBATCH --gres=gpus:1 

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
