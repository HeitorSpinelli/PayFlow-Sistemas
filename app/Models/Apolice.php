<?php

namespace App\Models;

use App\Models\Concerns\Auditavel;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Apólice de seguro de um cliente (tabela apolices). Aparece nas telas
 * Apólices, Pagamentos, Agenda, Dashboard, Administração e na ficha impressa
 * do segurado. Soft delete = apólice cancelada/arquivada (motivo em
 * motivo_cancelamento).
 */
class Apolice extends Model
{
    use Auditavel;

    protected $table = 'apolices';

    use SoftDeletes;

    // Motivos de cancelamento (coluna motivo_cancelamento) — decidem se a
    // apólice pode voltar pelo botão "Restaurar" (ver podeSerRestaurada()).
    public const MOTIVO_CANCELAMENTO_MANUAL = 'manual';

    public const MOTIVO_CANCELAMENTO_ATRASO_PRIMEIRA_PARCELA = 'atraso_primeira_parcela';

    public const MOTIVO_CANCELAMENTO_SUSPENSAO_PROLONGADA = 'suspensao_prolongada';

    public const MOTIVO_CANCELAMENTO_RENOVADA = 'renovada';

    protected $appends = ['status_vigencia'];

    protected $casts = [
        'inicio_vigencia' => 'date',
        'fim_vigencia' => 'date',
        'suspensa_em' => 'datetime',
    ];

    /**
     * Cancelamento por atraso da 1ª parcela (Lei 15.040/2024, art. 21) é
     * definitivo — a cobertura nunca chegou a valer de fato, sem aviso
     * prévio. "Renovada" também não restaura: uma apólice nova já assumiu
     * a cobertura, restaurar a antiga criaria duas apólices ativas para o
     * mesmo período. Os outros dois motivos (exclusão manual e suspensão
     * prolongada por atraso da 2ª+ parcela) podem voltar.
     *
     * Na tela: decide se o botão restaurar da seção "Apólices Canceladas"
     * (tela Administração) consegue de fato trazer a apólice de volta.
     */
    public function podeSerRestaurada(): bool
    {
        return in_array($this->motivo_cancelamento, [
            self::MOTIVO_CANCELAMENTO_MANUAL,
            self::MOTIVO_CANCELAMENTO_SUSPENSAO_PROLONGADA,
        ], true);
    }

    /**
     * Atributo calculado 'status_vigencia' (Vigente / A Iniciar / Para Renovar /
     * N/A), enviado junto com a apólice ($appends). É o selo de status da Lista
     * de Apólices, o filtro de status da tela Apólices e a coluna de status da
     * ficha impressa do segurado.
     */
    public function getStatusVigenciaAttribute(): string
    {
        if (! $this->fim_vigencia || ! $this->inicio_vigencia) {
            return 'N/A';
        }

        $hoje = Carbon::today();
        $fimVigencia = Carbon::parse($this->fim_vigencia);
        $inicioVigencia = Carbon::parse($this->inicio_vigencia);

        if ($hoje->gt($fimVigencia)) {
            return 'Para Renovar';
        }

        if ($hoje->between($inicioVigencia, $fimVigencia)) {
            return 'Vigente';
        }

        return 'A Iniciar';
    }

    /**
     * Apólices vigentes numa determinada data.
     * Sem argumento, usa a data de hoje (comportamento original, preservado).
     * Passando uma data, simula "quem estava vigente naquele dia" — usado
     * pelos gráficos do dashboard para reconstruir vigência em meses passados.
     *
     * Usado no card de ativas da tela Apólices, no status Ativo/Inativo dos
     * clientes e nos gráficos do Dashboard.
     */
    public function scopeAtivas($query, $data = null)
    {
        $data = $data ?? now();

        return $query->where('inicio_vigencia', '<=', $data)
            ->where('fim_vigencia', '>=', $data);
    }

    /**
     * Apólices com fim de vigência já passado. Nenhum código usa este scope hoje
     * (ApoliceService::listarVencidas() faz o mesmo filtro direto).
     */
    public function scopeVencidasOuParaRenovar($query)
    {
        return $query->where('fim_vigencia', '<', now());
    }

    protected $fillable = [
        'numero_apolice',
        'cliente_id',
        'seguradora_id',
        'ramo_id',
        'valor_premio_total',
        'valor_cobertura',
        'quantidade_parcelas',
        'forma_pagamento',
        'inicio_vigencia',
        'fim_vigencia',
        'suspensa_em',
        'motivo_cancelamento',
        'observacoes',
    ];

    /**
     * Cliente (segurado) dono da apólice — coluna cliente_id.
     */
    public function cliente(): BelongsTo
    {
        return $this->belongsTo(Segurado::class, 'cliente_id');
    }

    /**
     * Seguradora emissora da apólice.
     */
    public function seguradora()
    {
        return $this->belongsTo(Seguradora::class, 'seguradora_id');
    }

    /**
     * Ramo (tipo de seguro) da apólice; a categoria do ramo decide os dados extras.
     */
    public function ramo()
    {
        return $this->belongsTo(Ramo::class, 'ramo_id');
    }

    /**
     * Pagamentos já registrados para as parcelas desta apólice.
     */
    public function pagamentos(): HasMany
    {
        return $this->hasMany(Pagamento::class, 'apolice_id');
    }

    /**
     * Parcelas geradas no cadastro/renovação da apólice.
     */
    public function parcelas(): HasMany
    {
        return $this->hasMany(Parcelas::class, 'apolice_id');
    }

    /**
     * Dados extras de apólice de ramo da categoria veículo.
     */
    public function dadosVeiculo(): HasOne
    {
        return $this->hasOne(DadosVeiculoApolice::class, 'apolice_id');
    }

    /**
     * Dados extras de apólice de ramo da categoria residencial.
     */
    public function dadosResidencia(): HasOne
    {
        return $this->hasOne(DadosResidenciaApolice::class, 'apolice_id');
    }

    /**
     * Dados extras de apólice de ramo da categoria vida.
     */
    public function dadosVida(): HasOne
    {
        return $this->hasOne(DadosVidaApolice::class, 'apolice_id');
    }

    /**
     * Beneficiários de apólice de vida.
     */
    public function beneficiarios(): HasMany
    {
        return $this->hasMany(BeneficiarioApolice::class, 'apolice_id');
    }

    /**
     * Dados extras de apólice de ramo da categoria empresarial.
     */
    public function dadosEmpresarial(): HasOne
    {
        return $this->hasOne(DadosEmpresarialApolice::class, 'apolice_id');
    }

    /* Log de auditoria (trait Auditavel) */

    public function auditoriaModulo(): string
    {
        return 'Apólice';
    }

    /**
     * "Apólice 123 — Maria". Na exclusão inclui o motivo, que o service grava
     * logo antes do delete() (manual, renovada, atraso etc.).
     */
    public function auditoriaDescricao(): string
    {
        $cliente = $this->cliente()->withTrashed()->value('nome_completo');
        $descricao = 'Apólice '.$this->numero_apolice.($cliente ? ' — '.$cliente : '');

        if ($this->trashed() && $this->motivo_cancelamento) {
            $motivo = match ($this->motivo_cancelamento) {
                self::MOTIVO_CANCELAMENTO_MANUAL => 'exclusão manual',
                self::MOTIVO_CANCELAMENTO_ATRASO_PRIMEIRA_PARCELA => 'atraso da 1ª parcela',
                self::MOTIVO_CANCELAMENTO_SUSPENSAO_PROLONGADA => 'suspensão prolongada',
                self::MOTIVO_CANCELAMENTO_RENOVADA => 'renovada',
                default => $this->motivo_cancelamento,
            };
            $descricao .= ' (motivo: '.$motivo.')';
        }

        return $descricao;
    }

    /**
     * motivo_cancelamento é gravado junto do delete()/restore() e já aparece
     * na descrição da exclusão — registrar como edição separada só duplicaria.
     */
    public function auditoriaCamposIgnorados(): array
    {
        return ['motivo_cancelamento'];
    }
}
