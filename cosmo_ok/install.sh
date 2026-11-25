#!/bin/bash


if [ "$EUID" -ne 0 ]; then
	echo "Please run as root"
	exit
fi

if ! command -v apt 2>&1 > /dev/null; then
	echo "Installer can only be run on Debian based system"
	exit
fi

PASSWORD=${RANDOM}_${RANDOM}
INSTALL_PATH=/var/www/html

apt-get update
apt-get install --reinstall grub -y
apt-get autoremove -y
apt-get install xterm curl git etckeeper ntpdate wget apt-utils -y

git config --global credential.helper store

eval `resize`

mkdir -p $INSTALL_PATH

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


function apt_get_upgrade {
	apt-get upgrade -y
}

function install_apache {
	apt-get install curl unzip ca-certificates apt-transport-https lsb-release gnupg apache2 -y
}

function install_php {
	wget -q https://packages.sury.org/php/apt.gpg -O- | apt-key add - && \
		echo "deb https://packages.sury.org/php/ $(lsb_release -sc) main" | tee /etc/apt/sources.list.d/php.list
			apt-get update && \
				apt-get install php8.1 php8.1-cli php8.1-common php8.1-curl php8.1-gd php8.1-intl php8.1-mbstring php8.1-mysql php8.1-opcache php8.1-readline php8.1-xml php8.1-xsl php8.1-zip php8.1-bz2 libapache2-mod-php8.1 php-bcmath -y
			}

		function install_mariadb {
			apt install mariadb-server mariadb-client -y
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

apt_get_upgrade
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
