FROM php:8.5-apache AS app

# --- Dependências de sistema (PHP extensions + Node) ---
RUN apt-get update && apt-get install -y \
    libpq-dev \
    libzip-dev \
    libpng-dev \
    libonig-dev \
    unzip \
    git \
    curl \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
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

# --- Dependências PHP primeiro (cache de layer) ---
COPY composer.json composer.lock ./
RUN composer install --no-dev --optimize-autoloader --no-scripts --no-interaction

# --- Dependências Node (cache de layer separado do composer) ---
COPY package.json package-lock.json ./
RUN npm ci

# --- Agora copia o resto do código da aplicação ---
# Isso precisa vir ANTES do npm run build, porque o Wayfinder (plugin do Vite)
# executa comandos "php artisan" que leem as rotas reais do projeto (routes/web.php etc)
# para gerar os arquivos TypeScript correspondentes.
COPY . .

# Gera a APP_KEY temporária só pra permitir os comandos artisan rodarem durante o build
# (o wayfinder precisa do framework "bootável", mesmo sem banco de dados disponível ainda).
# A APP_KEY real de produção continua vindo das env vars do Render em runtime.
RUN php artisan key:generate --force || true

# Build do frontend — agora com PHP disponível pro Wayfinder gerar as rotas TS
RUN npm run build

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