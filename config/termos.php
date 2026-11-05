<?php

/*
|--------------------------------------------------------------------------
| Termos de Uso, Política de Privacidade e Termo de Confidencialidade
|--------------------------------------------------------------------------
|
| O texto dos documentos fica em resources/js/components/termos/conteudo.ts.
| Ao mudar o texto de forma relevante, suba a 'versao' (e 'vigente_desde'):
| todo usuário que aceitou uma versão anterior vê a janela de aceite de novo
| no próximo acesso (ver ExigirAceiteDosTermos e HandleInertiaRequests).
|
*/

return [

    'versao' => '1.0',

    'vigente_desde' => '2026-11-04',

    // Quem aparece nos documentos como responsável pelo sistema.
    'responsavel' => env('TERMOS_RESPONSAVEL', env('APP_NAME', 'PayFlow-Sistemas')),

    // Canal para dúvidas e pedidos sobre dados pessoais (encarregado/DPO).
    // Sem ele, os documentos orientam a procurar o administrador do sistema.
    'email_contato' => env('TERMOS_EMAIL_CONTATO'),

];
