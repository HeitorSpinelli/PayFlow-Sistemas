<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Automações financeiras (cancelamento/suspensão de apólice, e-mail real)
    |--------------------------------------------------------------------------
    |
    | Trava de segurança pro período de desenvolvimento: enquanto o banco de
    | dev e produção for o mesmo (sem separação de ambiente), dado de teste
    | esquecido com parcela vencida seria processado de verdade pelos
    | comandos agendados (cancelamento de apólice, envio de e-mail). Com
    | essa flag em false, os comandos continuam existindo e podem ser
    | rodados manualmente a qualquer momento — só o efeito real fica
    | suspenso até alguém decidir ligar de novo (AUTOMACOES_FINANCEIRAS_ATIVAS
    | no .env), sem precisar mexer em routes/console.php pra isso.
    |
    */

    'financeiras_ativas' => env('AUTOMACOES_FINANCEIRAS_ATIVAS', true),

];
