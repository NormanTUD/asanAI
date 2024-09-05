#!/bin/bash

if ! command -v python3 2>/dev/null >/dev/null; then
	echo "python3 could not be found"
	exit 1
fi

echo "====== Starting docker container ======"
bash docker.sh --local-port 1122
exit_code=$?
echo "====== Started docker container ======"

if [[ "$exit_code" -ne 0 ]]; then
	echo "Could not start docker"
	exit 255
fi

echo "====== Checking virtualenv ======"
if [[ ! -d ~/.asanai_test_env ]]; then
	python3 -mvenv ~/.asanai_test_env
	source ~/.asanai_test_env/bin/activate
	pip3 install selenium || {
		echo "pip3 install selenium failed. Are you online?"
		rm -rf ~/.asanai_test_env
		exit 1
	}
fi

source ~/.asanai_test_env/bin/activate
echo "====== Checked virtualenv ======"

echo "====== Run tests ======"
python3 _run_tests.py
echo "====== Ran tests ======"

exit_code=$?

exit $exit_code
