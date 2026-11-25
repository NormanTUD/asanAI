# syntax=docker/dockerfile:1

FROM php:8.3-apache

# The blog is self-contained: this build context (the blog/ folder) becomes the
# entire Apache document root. Every lesson's includes use __DIR__, so nothing
# outside this directory is required at runtime.
ENV APACHE_DOCUMENT_ROOT=/var/www/html

# PHP extensions required by the blog:
#   gd       -> image.php  (server-side crop / aspect-ratio fit, ETag-cached)
#   mbstring -> search_lib.php, knowledge_map.php, headings.php (UTF-8 search)
#   curl     -> asanai_blog_proxy.php
# The curl binary is also installed for the container healthcheck below.
# image.php only needs JPEG + WebP, so FreeType (imagettftext) is omitted.
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        libpng-dev \
        libjpeg-dev \
        libwebp-dev \
        libonig-dev \
        libcurl4-openssl-dev \
        curl \
    && rm -rf /var/lib/apt/lists/*

# GD's auto-detection misses JPEG/WebP on the Debian base image even with the
# dev packages installed, so enable them explicitly at compile time via
# docker-php-ext-configure (which writes the Makefile the install step uses).
# image.php only needs JPEG + WebP, so FreeType (imagettftext) is omitted.
RUN set -eux; \
    docker-php-ext-configure gd --with-jpeg --with-webp; \
    docker-php-ext-install gd mbstring curl

# Apache modules required by blog/.htaccess:
#   rewrite -> pretty URLs (/slug -> slug.php)
#   headers -> Cache-Control: no-cache on pages
#   env     -> env passthrough (parity with the main-site installer)
RUN a2enmod rewrite headers env

# Let .htaccess (mod_rewrite + php_value) and .user.ini (auto_prepend_file)
# take effect inside the document root.
RUN sed -ri 's/AllowOverride None/AllowOverride All/' \
        /etc/apache2/apache2.conf /etc/apache2/sites-available/*.conf

# Point the default vhost at the document root (already /var/www/html by default).
RUN sed -ri 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' \
        /etc/apache2/sites-available/*.conf

WORKDIR ${APACHE_DOCUMENT_ROOT}
COPY . ${APACHE_DOCUMENT_ROOT}/

# The runtime search index (.search_cache.json) is written by PHP, so the
# document root must be writable by the Apache user.
RUN chown -R www-data:www-data ${APACHE_DOCUMENT_ROOT}

# Anonymous analytics lives outside the webroot in the www-data home.
RUN install -d -o www-data -g www-data -m 775 /var/www/.asanai-blog

EXPOSE 80

CMD ["apache2-foreground"]
