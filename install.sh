#!/bin/bash

if [ "$EUID" -ne 0 ]; then
	echo "Please run as root"
	exit 1
fi

if ! command -v apt 2>&1 > /dev/null; then
	echo "Installer can only be run on Debian based system"
	exit 2
fi

PASSWORD=${RANDOM}_${RANDOM}_${RANDOM}_${RANDOM}_${RANDOM}_${RANDOM}
INSTALL_PATH=/var/www/html

run_cmd() {
	local cmd="$1"
	shift

	echo ">> Running: $cmd $*"
	"$cmd" "$@" || {
		echo "ERROR: $cmd $* failed"
		exit 11
	}
}

if [ -z "${DO_NOT_INSTALL_STUFF_AGAIN:-}" ]; then
	run_cmd apt-get update
	run_cmd apt-get autoremove -y
	run_cmd apt-get install -y xterm curl git wget apt-utils
fi

git config --global credential.helper store

mkdir -p $INSTALL_PATH || {
	echo "mkdir -p $INSTALL_PATH failed"
	exit 7
}

cd $INSTALL_PATH

if [ -d "$INSTALL_PATH/.git" ]; then
	git pull
else
	git clone --depth 1 https://github.com/NormanTUD/asanAI.git .
	git config --global user.name "$(hostname)"
	git config --global user.email "$(hostname)@$(hostname).com"
	git config pull.rebase false
fi

cd -

function install_apache {
	apt-get install -y unzip ca-certificates apt-transport-https gnupg apache2
}

function install_php {
	if php -v &>/dev/null; then
		local PHP_CURRENT
		PHP_CURRENT=$(php -r 'echo PHP_MAJOR_VERSION . "." . PHP_MINOR_VERSION;' 2>/dev/null)
		echo "PHP ${PHP_CURRENT} already installed, skipping php installation."
		return 0
	fi

	apt-get update

	apt-get install -y --no-install-recommends libapache2-mod-php php-common php-cli php-opcache || {
		echo "ERROR: Could not install any php-version!"
		exit 10
	}
}

echo "$PASSWORD" > /etc/vvzdbpw

if [ -z "${DO_NOT_INSTALL_STUFF_AGAIN:-}" ]; then
	install_apache
	install_php
fi

a2enmod rewrite
a2enmod env

service apache2 restart

if [[ -d "/docker/" ]]; then
	echo "Not using visitors log in docker, yet..."
else
	mkdir -p /var/log/
	touch /var/log/asanai_visitors.log /var/log/asanai_referrers.log
	chmod -R 0666 /var/log/asanai_visitors.log /var/log/asanai_referrers.log
fi
