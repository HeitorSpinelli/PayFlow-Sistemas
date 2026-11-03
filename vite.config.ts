import inertia from '@inertiajs/vite';
import { wayfinder } from '@laravel/vite-plugin-wayfinder';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { defineConfig } from 'vite';

export default defineConfig({
    server: {
        watch: {
            // Por padrão o Vite observa o projeto inteiro (só ignora
            // node_modules e .git). vendor/ tem dezenas de milhares de
            // arquivos do Composer e storage/ muda a cada log/sessão: no
            // Windows isso deixava o Vite em 200% de CPU e cada arquivo JS
            // demorando ~450ms, com o F5 levando 7s. Nada do front-end vive
            // nessas pastas; o refresh de PHP do laravel() e o wayfinder
            // continuam observando app/, routes/ e resources/views.
            ignored: ['**/vendor/**', '**/storage/**', '**/bootstrap/cache/**'],
        },
    },
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            refresh: true,
        }),
        inertia(),
        react({
            babel: {
                plugins: ['babel-plugin-react-compiler'],
            },
        }),
        tailwindcss(),
        wayfinder({
            formVariants: true,
        }),
    ],
});
