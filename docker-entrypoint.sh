#!/bin/bash

# Gera a APP_KEY se não existir
php artisan key:generate --force

# Roda as migrations
php artisan migrate --force

# Limpa e otimiza o cache
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Inicia o Apache
apache2-foreground