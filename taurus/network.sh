#!/bin/bash

exec 1>>logfile.txt
exec 2>&1

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
