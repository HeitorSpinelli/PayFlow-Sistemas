<?php

use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Auth\Access\AuthorizationException;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);

        $middleware->web(append: [
            HandleAppearance::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);

        // Confia no proxy do Render — necessário pra Laravel saber que a
        // requisição original chegou via HTTPS, mesmo o tráfego interno
        // sendo repassado como HTTP puro dentro da infraestrutura do Render.
        $middleware->trustProxies(
            at: '*',
            headers: Request::HEADER_X_FORWARDED_FOR |
                Request::HEADER_X_FORWARDED_HOST |
                Request::HEADER_X_FORWARDED_PORT |
                Request::HEADER_X_FORWARDED_PROTO
        );
    })
    ->withExceptions(function (Exceptions $exceptions): void {

        // Captura o erro 403 e joga de volta para o dashboard sempre
        $exceptions->respond(function ($response, Throwable $exception, Request $request) {
            if ($exception instanceof AccessDeniedHttpException || $exception instanceof AuthorizationException) {

                return redirect()->route('dashboard')->with('error', 'Seu nível de acesso foi alterado. Você não tem permissão para ver mais esta página.');
            }

            return $response;
        });
    })->create();
