#!/bin/bash

# Corrige permissões do storage
chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache
chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

# Regenera o autoloader
composer dump-autoload --optimize

# Gera a APP_KEY
php artisan key:generate --force

# Roda as migrations
php artisan migrate --force

# Limpa e otimiza o cache
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Inicia o Apache
apache2-foreground