<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ConfiguracoesSistema extends Model
{
    protected $table = 'configuracoes_sistema';
    
    protected $fillable = [
        'razao_social',
        'nome_fantasia',
        'cnpj',
        'inscricao_estadual',
        'endereco',
        'telefone',
        'email_contato',
        'whastapp_token',
        'smtp_servidor',
        'smtp_user',
        'smtp_pass',
        'smtp_status',
        'gateway_pagamento_ativo'
    ];
}
