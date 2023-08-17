#!/bin/bash

# Default values
run_tests=0
LOCAL_PORT=""

# Help message
help_message() {
    echo "Usage: display_mongodb_gui.sh [OPTIONS]"
    echo "Options:"
    echo "  --local-port       Local port to bind for the GUI"
    echo "  --run_tests        Run tests before starting"
    echo "  --help             Show this help message"
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

# Check if Docker is installed
if ! command -v docker &>/dev/null; then
  echo "Docker not found. Installing Docker..."
  # Enable non-free repository
  sed -i 's/main$/main contrib non-free/g' /etc/apt/sources.list

  # Update package lists
  sudo apt update

  # Install Docker
  sudo apt install -y docker.io
fi

sudo apt-get install wget

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
{ for i in $(ls *.php); do if ! php -l $i 2>&1; then SYNTAX_ERRORS=1; fi ; done } | 2>&1 grep -v mongodb

if [[ "$SYNTAX_ERRORS" -ne "0" ]]; then
	echo "Tests failed";
	exit 1
fi


if [[ "$run_tests" -eq "1" ]]; then
	php testing.php && echo "Syntax checks for PHP Ok" || die "Syntax Checks for PHP failed"
fi

sudo docker-compose build && sudo docker-compose up -d || echo "Failed to build container"
