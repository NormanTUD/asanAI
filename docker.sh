#!/bin/bash

# Default values
run_tests=0
LOCAL_PORT=""

# Help message
help_message() {
	echo "Usage: docker.sh [OPTIONS]"
	echo "Options:"
	echo "  --local-port       Local port to bind for the GUI"
	echo "  --run_tests        Run tests before starting"
	echo "  --help             Show this help message"
}

_sudo() {
	if command -v sudo >/dev/null 2>&1; then
		sudo "$@"
	else
		"$@"
	fi
}

# Parse command-line arguments
while [[ "$#" -gt 0 ]]; do
	case $1 in
		--run_tests)
			run_tests=1
			shift
			;;
		--local-port)
			LOCAL_PORT="$2"
			shift
			;;
		--help)
			help_message
			exit 0
			;;
		*)
			echo "Error: Unknown option '$1'. Use --help for usage."
			exit 1
			;;
	esac
	shift
done

# Check for required parameters
if [[ -z $LOCAL_PORT ]]; then
	echo "Error: Missing required parameter --local-port. Use --help for usage."
	exit 1
fi


is_package_installed() {
	dpkg-query -W -f='${Status}' "$1" 2>/dev/null | grep -c "ok installed"
}

UPDATED_PACKAGES=0

# Check if Docker is installed
if ! command -v docker &>/dev/null; then
	echo "Docker not found. Installing Docker..."
	# Enable non-free repository
	if [[ -e /etc/apt/sources.list ]]; then
		sed -i 's/main$/main contrib non-free/g' /etc/apt/sources.list
	fi

	# Update package lists
	if [[ $UPDATED_PACKAGES == 0 ]]; then
		_sudo apt update || {
			echo "apt-get update failed. Are you online?"
		}

		UPDATED_PACKAGES=1
	fi


	# Install Docker
	_sudo apt install -y docker.io docker-compose || {
		echo "sudo apt install -y docker.io failed"
	}
fi

if ! command -v wget &>/dev/null; then
	# Update package lists
	if [[ $UPDATED_PACKAGES == 0 ]]; then
		_sudo apt update || {
			echo "apt-get update failed. Are you online?"
		}

		UPDATED_PACKAGES=1
	fi

	_sudo apt-get install -y wget || {
		echo "sudo apt install -y wget failed"
	}
fi

if ! command -v git &>/dev/null; then
	# Update package lists
	if [[ $UPDATED_PACKAGES == 0 ]]; then
		_sudo apt update || {
			echo "apt-get update failed. Are you online?"
		}

		UPDATED_PACKAGES=1
	fi

	_sudo apt-get install -y git || {
		echo "sudo apt install -y git failed"
	}
fi

git rev-parse HEAD > git_hash

export LOCAL_PORT

# Write environment variables to .env file
echo "#!/bin/bash" > .env
echo "LOCAL_PORT=$LOCAL_PORT" >> .env

echo "=== Current git hash before auto-pulling ==="
git rev-parse HEAD
echo "=== Current git hash before auto-pulling ==="

git pull

function die {
	echo $1
	exit 1
}

SYNTAX_ERRORS=0
if command -v php 2>/dev/null >/dev/null; then
	{ for i in $(ls *.php); do if ! php -l $i 2>&1; then SYNTAX_ERRORS=1; fi ; done } | 2>&1 grep -v mongodb
else
	echo "php not installed. Not running php -l tests"
fi

if [[ "$SYNTAX_ERRORS" -ne "0" ]]; then
	echo "Tests failed";
	exit 1
fi


if [[ "$run_tests" -eq "1" ]]; then
	php testing.php && echo "Syntax checks for PHP Ok" || die "Syntax Checks for PHP failed"
fi

function docker_compose {
    # check if user is in docker group
    if [[ -n $USER ]]; then
	    if id -nG "$USER" | grep -qw docker; then
		prefix=""
	    else
		prefix="_sudo"
	    fi
    else
	prefix="sudo"
    fi

    if ! command -v sudo 2>/dev/null >/dev/null; then
	    prefix=""
    fi

    if command -v docker-compose >/dev/null 2>&1; then
        $prefix docker-compose "$@"
    else
        $prefix docker compose "$@"
    fi
}

docker_compose build || {
	rm git_hash
	echo "Failed to build container"
	exit 254
}

docker_compose up -d || {
	rm git_hash
	echo "Failed to build container"
	exit 255
}

rm git_hash
