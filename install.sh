#!/bin/bash

if [ "$EUID" -ne 0 ]; then
	echo "Please run as root"
	exit 1
fi

if ! command -v apt 2>&1 > /dev/null; then
	echo "Installer can only be run on Debian based system"
	exit 2
fi

PASSWORD=${RANDOM}_${RANDOM}
INSTALL_PATH=/var/www/html

run_cmd() {
	local cmd="$1"
	shift

	echo ">> Running: $cmd $*"
	"$cmd" "$@" || {
		echo "ERROR: $cmd $* failed"
			exit "$ERRNO"
		}

	ERRNO=$((ERRNO+1))
}

run_cmd apt-get update
run_cmd apt-get autoremove -y
run_cmd apt-get install -y xterm curl git etckeeper wget apt-utils

git config --global credential.helper store

mkdir -p $INSTALL_PATH || {
	echo "mkdir -p $INSTALL_PATH failed"
	exit 7
}

cd $INSTALL_PATH

if [ -d "$INSTALL_PATH/../.git" ]; then
	git pull
else
	git clone --depth 1 https://github.com/NormanTUD/TensorFlowJS-GUI.git .
	git config --global user.name "$(hostname)"
	git config --global user.email "kochnorman@rocketmail.com"
	git config pull.rebase false
fi

cd -

function install_apache {
	apt-get install unzip ca-certificates apt-transport-https lsb-release gnupg apache2 -y
}

function install_php {
	wget -q https://packages.sury.org/php/apt.gpg -O- | apt-key add -
	echo "deb https://packages.sury.org/php/ $(lsb_release -sc) main" | tee /etc/apt/sources.list.d/php.list
	apt-get update

	apt-get install	libapache2-mod-php -y
}

function install_mariadb {
	apt install mariadb-server mariadb-client -y || {
		echo "apt install mariadb-server mariadb-client -y failed"
		exit 10
	}
}

function setup_mariadb {
		mysql -u root <<-EOF
SET PASSWORD FOR 'root'@'localhost' = PASSWORD('$PASSWORD');
DELETE FROM mysql.user WHERE User='root' AND Host NOT IN ('localhost', '127.0.0.1', '::1');
DELETE FROM mysql.user WHERE User='';
DELETE FROM mysql.db WHERE Db='test' OR Db='test_%';
FLUSH PRIVILEGES;
EOF
}

echo "$PASSWORD" > /etc/vvzdbpw

install_apache
install_php
install_mariadb
setup_mariadb

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

cp debuglogs/.htpasswd /etc/apache2/.htpasswd
