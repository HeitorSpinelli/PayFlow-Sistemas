# ============================================================
# STAGE 1 — Build dos assets do frontend (Vite + React)
# ============================================================
FROM node:20-alpine AS node-build

WORKDIR /app

# Copia só os arquivos de dependência primeiro (cache de layer do Docker:
# se o package.json não mudar, o Docker reaproveita essa camada e pula o npm install)
COPY package.json package-lock.json ./
RUN npm ci

# Copia o restante do código necessário pro build do Vite
COPY resources/ resources/
COPY public/ public/
COPY vite.config.ts tsconfig.json components.json ./

RUN npm run build

# ============================================================
# STAGE 2 — Imagem final PHP + Apache
# ============================================================
FROM php:8.4-apache AS app

# Dependências de sistema necessárias pras extensões PHP abaixo
RUN apt-get update && apt-get install -y \
    libpq-dev \
    libzip-dev \
    libpng-dev \
    libonig-dev \
    unzip \
    git \
    && rm -rf /var/lib/apt/lists/*

# Extensões PHP que o Laravel + driver do Postgres (Supabase) precisam
RUN docker-php-ext-install \
    pdo \
    pdo_pgsql \
    pgsql \
    mbstring \
    bcmath \
    zip \
    exif \
    pcntl

# Habilita mod_rewrite (obrigatório pro roteamento do Laravel funcionar)
RUN a2enmod rewrite

# Aponta o DocumentRoot do Apache pra pasta /public (padrão Laravel)
ENV APACHE_DOCUMENT_ROOT=/var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

# Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Copia só os arquivos de dependência primeiro (mesmo truque de cache do Stage 1)
COPY composer.json composer.lock ./
RUN composer install --no-dev --optimize-autoloader --no-scripts --no-interaction

# Copia o resto do código da aplicação
COPY . .

# Copia os assets já compilados do Stage 1 (não precisamos do Node na imagem final)
COPY --from=node-build /app/public/build /var/www/html/public/build

# Roda os scripts do composer que dependem do código completo já estar presente
RUN composer dump-autoload --optimize

# Permissões que o Laravel precisa pra escrever logs, cache e sessões
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache \
    && chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

# Script de entrada — roda antes do Apache subir
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 80

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["apache2-foreground"]
