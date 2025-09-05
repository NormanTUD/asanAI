FROM php:apache

ENV APACHE_PORT=8080
ENV APACHE_DOCUMENT_ROOT=/var/www/html

RUN a2enmod rewrite

# Install all needed tools in one go
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        xterm \
        curl \
        git \
        etckeeper \
        wget \
    && rm -rf /var/lib/apt/lists/*

COPY .env /var/www/html/.env

RUN sed -ri -e 's!/var/www/html!/var/www/html!g' /etc/apache2/sites-available/*.conf && \
    sed -ri -e 's!/var/www/!/var/www/html/!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

EXPOSE ${APACHE_PORT}

COPY . /var/www/html/
RUN chmod 644 /var/www/html/.env

RUN bash /var/www/html/install.sh

CMD ["apache2-foreground"]
