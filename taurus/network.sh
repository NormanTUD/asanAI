#!/bin/bash -l

#SBATCH --partition=alpha
#SBATCH --mem=10000MB
#SBATCH --time=02:00:00

exec &> >(tee -a stdout.txt)

#asanaienv="$HOME/asanaienv"
#cd
#if [ -d $asanaienv ]; then
#	echo "$asanaienv exists"
#else
#	python3 -m venv asanaienv
#	pip install tensorflow tensorflowjs scikit-image keras
#fi
#source asanaienv/bin/activate
#cd -

ml modenv/hiera
ml GCC/10.3.0
ml OpenMPI/4.1.1
ml TensorFlow/2.6.0-CUDA-11.3.1

python3 network.py
