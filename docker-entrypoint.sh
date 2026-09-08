#!/bin/sh
set -e

# Gera cache de config, rotas e views — melhora performance em produção.
# Se algo estiver errado no .env, isso falha aqui (early failure), não silenciosamente depois.
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Migrations NÃO rodam automaticamente aqui de propósito — combinado no chat:
# rodar manualmente via Render Shell com `php artisan migrate --force`
# até você ganhar confiança no pipeline. Depois, se quiser automatizar,
# descomente a linha abaixo:
# php artisan migrate --force

exec "$@"
