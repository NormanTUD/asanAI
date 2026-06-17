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

ERRNO=1

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

if [ -z "${DO_NOT_INSTALL_STUFF_AGAIN:-}" ]; then
	run_cmd apt-get update
	run_cmd apt-get autoremove -y
	run_cmd apt-get install -y xterm curl git etckeeper wget apt-utils
fi

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
	apt-get install -y unzip ca-certificates apt-transport-https lsb-release gnupg apache2
}

function install_php {
	# Ermittle Debian-Codename
	local CODENAME
	CODENAME=$(lsb_release -sc 2>/dev/null || echo "")

	# Prüfe ob PHP bereits im Base-Image vorhanden ist (z.B. bei php:apache Docker-Images)
	if php -v &>/dev/null && dpkg -l | grep -q libapache2-mod-php; then
		echo "PHP und libapache2-mod-php sind bereits installiert, überspringe Sury-Repository."
		return 0
	fi

	# Prüfe ob der Codename vom Sury-Repository unterstützt wird.
	# HINWEIS: trixie (Debian 13) wird NICHT mehr über Sury installiert,
	# da Debian 13 bereits nativ PHP 8.4 mitbringt und das Sury-Repo
	# Paketkonflikte mit php8.4-common verursacht.
	local SUPPORTED_CODENAMES="bullseye bookworm forky"
	local USE_SURY=false

	if [ -n "$CODENAME" ]; then
		for supported in $SUPPORTED_CODENAMES; do
			if [ "$CODENAME" = "$supported" ]; then
				USE_SURY=true
				break
			fi
		done
	fi

	if [ "$USE_SURY" = true ]; then
		echo "Installiere PHP aus dem Sury-Repository für '$CODENAME'..."

		# Moderner Weg: GPG-Key in /usr/share/keyrings ablegen (funktioniert ohne apt-key)
		local KEYRING_PATH="/usr/share/keyrings/sury-php.gpg"

		# Lade den GPG-Key herunter und speichere ihn als dearmored keyring
		curl -fsSL https://packages.sury.org/php/apt.gpg | gpg --dearmor -o "$KEYRING_PATH" || {
			# Fallback: Vielleicht ist der Key bereits im binären Format
			curl -fsSL https://packages.sury.org/php/apt.gpg -o "$KEYRING_PATH"
		}
		chmod 644 "$KEYRING_PATH"

		# Source-Datei mit signed-by erstellen (kein apt-key nötig)
		cat > /etc/apt/sources.list.d/php-sury.list <<-EOF
		deb [signed-by=${KEYRING_PATH}] https://packages.sury.org/php/ ${CODENAME} main
		EOF
		# Entferne führende Tabs/Spaces aus heredoc
		sed -i 's/^[[:space:]]*//' /etc/apt/sources.list.d/php-sury.list

		apt-get update
	else
		echo "Codename '$CODENAME' wird nicht über Sury installiert. Verwende Standard-Repos..."
		apt-get update
	fi

	# Installiere PHP - versuche verschiedene Versionen in absteigender Reihenfolge
	local PHP_INSTALLED=false
	for PHP_VERSION in 8.4 8.3 8.2 8.1; do
		if apt-cache show "libapache2-mod-php${PHP_VERSION}" &>/dev/null; then
			echo "Installiere PHP ${PHP_VERSION}..."
			if apt-get install -y --no-install-recommends "libapache2-mod-php${PHP_VERSION}" "php${PHP_VERSION}-common" "php${PHP_VERSION}-cli" "php${PHP_VERSION}-opcache"; then
				PHP_INSTALLED=true
				break
			else
				echo "Installation von PHP ${PHP_VERSION} fehlgeschlagen, versuche nächste Version..."
			fi
		fi
	done

	# Fallback: Versionsloses Metapaket
	if [ "$PHP_INSTALLED" = false ]; then
		echo "Versuche versionsloses libapache2-mod-php Paket..."
		apt-get install -y --no-install-recommends libapache2-mod-php || {
			echo "FEHLER: Konnte keine PHP-Version installieren!"
			exit 10
		}
	fi
}

function install_mariadb {
	apt-get install -y mariadb-server mariadb-client || {
		echo "apt install mariadb-server mariadb-client -y failed"
		exit 10
	}
}

function setup_mariadb {
	# Warte bis MariaDB bereit ist
	local retries=10
	while [ $retries -gt 0 ]; do
		if mysqladmin ping &>/dev/null; then
			break
		fi
		echo "Warte auf MariaDB..."
		sleep 2
		retries=$((retries - 1))
	done

	mysql -u root <<-EOF
	SET PASSWORD FOR 'root'@'localhost' = PASSWORD('$PASSWORD');
	DELETE FROM mysql.user WHERE User='root' AND Host NOT IN ('localhost', '127.0.0.1', '::1');
	DELETE FROM mysql.user WHERE User='';
	DELETE FROM mysql.db WHERE Db='test' OR Db='test_%';
	FLUSH PRIVILEGES;
	EOF
}

echo "$PASSWORD" > /etc/vvzdbpw

if [ -z "${DO_NOT_INSTALL_STUFF_AGAIN:-}" ]; then
	install_apache
	install_php
fi

if [ -z "${DO_NOT_INSTALL_STUFF_AGAIN:-}" ]; then
	install_mariadb
fi
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
