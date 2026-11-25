FROM php:apache

# Enable the Apache rewrite module
RUN a2enmod rewrite

# Set the port for Apache to listen on
ENV APACHE_PORT 8080
ENV APACHE_DOCUMENT_ROOT /var/www/html

# Copy the PHP files to the container
COPY . /var/www/html/

COPY .env /var/www/html/.env
RUN chmod +x /var/www/html/.env

# Configure Apache
RUN sed -ri -e 's!/var/www/html!/var/www/html/!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/!/var/www/html/!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

RUN bash /var/www/html/install.sh

# Expose the Apache port
EXPOSE $APACHE_PORT

# Start Apache server
CMD ["apache2-foreground"]
