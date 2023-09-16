#!/bin/bash

if ! command -v python3 2>/dev/null >/dev/null; then
	echo "python3 could not be found"
	exit 0
fi

if [[ ! -d ~/.asanai_test_env ]]; then
	python3 -mvenv ~/.asanai_test_env
	source ~/.asanai_test_env/bin/activate
	pip3 install pyppeteer
fi

source ~/.asanai_test_env/bin/activate

python3 _run_tests.py
