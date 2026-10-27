@php
    $moeda = fn ($v) => 'R$ ' . number_format((float) $v, 2, ',', '.');
    $data = fn ($d) => $d ? \Carbon\Carbon::parse($d)->format('d/m/Y') : '—';

    // O banco pode guardar CPF/CNPJ e telefone só com dígitos ou já
    // mascarados — formata só quando vier cru, senão mostra como está.
    $documento = function ($v) {
        $d = preg_replace('/\D/', '', (string) $v);

        return match (strlen($d)) {
            11 => preg_replace('/(\d{3})(\d{3})(\d{3})(\d{2})/', '$1.$2.$3-$4', $d),
            14 => preg_replace('/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/', '$1.$2.$3/$4-$5', $d),
            default => $v ?: '—',
        };
    };
    $telefone = function ($v) {
        $d = preg_replace('/\D/', '', (string) $v);

        return match (strlen($d)) {
            11 => preg_replace('/(\d{2})(\d{5})(\d{4})/', '($1) $2-$3', $d),
            10 => preg_replace('/(\d{2})(\d{4})(\d{4})/', '($1) $2-$3', $d),
            default => $v ?: '—',
        };
    };
    $cep = function ($v) {
        $d = preg_replace('/\D/', '', (string) $v);

        return strlen($d) === 8 ? substr($d, 0, 5) . '-' . substr($d, 5) : ($v ?: '—');
    };

    $pj = $segurado->tipo_pessoa === 'pj';
    $classeStatus = fn ($s) => match ($s) {
        'Vigente' => 'ok',
        'Para Renovar' => 'alerta',
        default => 'neutro',
    };
@endphp
<!DOCTYPE html>
<html lang="pt-br">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ficha - {{ $segurado->nome_completo }}</title>
    <style>
        @page { size: A4; margin: 14mm; }

        * { box-sizing: border-box; }

        body {
            margin: 0;
            padding: 24px 16px;
            background: #f4f4f5;
            color: #18181b;
            font-family: 'Segoe UI', Helvetica, Arial, sans-serif;
            font-size: 12px;
        }

        .folha {
            max-width: 210mm;
            margin: 0 auto;
            padding: 28px 32px;
            background: #fff;
            border: 1px solid #e4e4e7;
            border-radius: 12px;
        }

        .topo { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding-bottom: 14px; border-bottom: 3px solid #10b981; }
        .marca { display: flex; align-items: center; gap: 10px; }
        .marca img { width: 44px; height: 44px; object-fit: contain; }
        .marca strong { font-size: 15px; font-weight: 800; color: #047857; text-transform: uppercase; font-style: italic; }
        .marca span { display: block; font-size: 11px; color: #71717a; }
        .topo .doc { text-align: right; font-size: 11px; color: #71717a; }
        .topo .doc b { display: block; font-size: 14px; color: #18181b; }

        h1 { margin: 18px 0 2px; font-size: 20px; }
        .sub { color: #71717a; font-size: 11px; }

        .resumo { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 16px 0 4px; }
        .resumo div { border: 1px solid #e4e4e7; border-radius: 8px; padding: 8px 12px; }
        .resumo span { display: block; font-size: 10px; color: #71717a; text-transform: uppercase; letter-spacing: 0.06em; }
        .resumo b { font-size: 18px; }
        .resumo .ruim b { color: #b91c1c; }

        h2 {
            margin: 22px 0 8px;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            color: #047857;
            border-bottom: 1px solid #e4e4e7;
            padding-bottom: 4px;
        }

        .campos { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px 16px; }
        .campos .largo { grid-column: span 2; }
        .campos .inteiro { grid-column: 1 / -1; }
        .campos span { display: block; font-size: 10px; color: #71717a; text-transform: uppercase; letter-spacing: 0.04em; }
        .campos b { font-weight: 600; }

        table { width: 100%; border-collapse: collapse; font-size: 11px; }
        th { text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.04em; color: #52525b; background: #f4f4f5; padding: 6px; }
        td { padding: 6px; border-bottom: 1px solid #e4e4e7; vertical-align: top; }
        .num { text-align: right; }

        .selo { display: inline-block; padding: 1px 8px; border-radius: 999px; font-size: 10px; font-weight: 700; border: 1px solid currentColor; white-space: nowrap; }
        .selo.ok { color: #047857; }
        .selo.alerta { color: #b45309; }
        .selo.neutro { color: #52525b; }
        .atraso { color: #b91c1c; font-weight: 700; }

        .obs { white-space: pre-line; border: 1px solid #e4e4e7; border-radius: 8px; padding: 8px 12px; min-height: 36px; }

        .rodape { margin-top: 28px; display: flex; justify-content: space-between; gap: 24px; font-size: 10px; color: #71717a; }
        .assinatura { flex: 1; max-width: 260px; text-align: center; border-top: 1px solid #18181b; padding-top: 4px; color: #18181b; }

        .acoes { max-width: 210mm; margin: 14px auto 0; display: flex; justify-content: flex-end; gap: 8px; }
        .acoes button { padding: 10px 18px; border: 0; border-radius: 10px; cursor: pointer; font: 600 13px 'Segoe UI', Helvetica, Arial, sans-serif; }
        .btn-imprimir { background: #10b981; color: #fff; }
        .btn-fechar { background: #e4e4e7; color: #18181b; }

        @media print {
            body { background: #fff; padding: 0; }
            .folha { border: 0; border-radius: 0; padding: 0; max-width: none; }
            .acoes { display: none; }
            tr { break-inside: avoid; }
            * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
    </style>
</head>

<body>
    <div class="folha">
        <div class="topo">
            <div class="marca">
                <img src="{{ asset('logo.png') }}" alt="PayFlow">
                <div>
                    <strong>PayFlow-Sistemas</strong>
                    <span>Ficha cadastral do segurado</span>
                </div>
            </div>
            <div class="doc">
                Cliente
                <b>#{{ str_pad($segurado->id, 4, '0', STR_PAD_LEFT) }}</b>
            </div>
        </div>

        <h1>{{ $segurado->nome_completo }}</h1>
        <div class="sub">
            {{ $pj ? 'Pessoa Jurídica' : 'Pessoa Física' }} · {{ $documento($segurado->cpf_cnpj) }} · Situação: <b>{{ $segurado->status }}</b>
        </div>

        <div class="resumo">
            <div><span>Apólices</span><b>{{ $apolices->count() }}</b></div>
            <div><span>Vigentes</span><b>{{ $vigentes }}</b></div>
            <div class="{{ $atrasadas > 0 ? 'ruim' : '' }}"><span>Parcelas atrasadas</span><b>{{ $atrasadas }}</b></div>
        </div>

        <h2>Dados cadastrais</h2>
        <div class="campos">
            @if ($pj && $segurado->razao_social)
                <div class="largo"><span>Razão social</span><b>{{ $segurado->razao_social }}</b></div>
            @endif
            <div><span>{{ $pj ? 'CNPJ' : 'CPF' }}</span><b>{{ $documento($segurado->cpf_cnpj) }}</b></div>
            <div><span>{{ $pj ? 'Fundação' : 'Nascimento' }}</span><b>{{ $data($segurado->data_nascimento_fundacao) }}</b></div>
            <div><span>Cliente desde</span><b>{{ $data($segurado->created_at) }}</b></div>
        </div>

        <h2>Contato</h2>
        <div class="campos">
            <div><span>Celular / WhatsApp</span><b>{{ $telefone($segurado->celular_whatsapp) }}</b></div>
            <div><span>Telefone fixo</span><b>{{ $telefone($segurado->telefone_fixo) }}</b></div>
            <div><span>E-mail</span><b>{{ $segurado->email ?: '—' }}</b></div>
        </div>

        <h2>Endereço</h2>
        <div class="campos">
            <div class="largo"><span>Logradouro</span><b>{{ $segurado->endereco ?: '—' }}</b></div>
            <div><span>Bairro</span><b>{{ $segurado->bairro ?: '—' }}</b></div>
            <div><span>Cidade / UF</span><b>{{ $segurado->cidade ?: '—' }}{{ $segurado->estado ? ' - ' . $segurado->estado : '' }}</b></div>
            <div><span>CEP</span><b>{{ $cep($segurado->cep) }}</b></div>
        </div>

        <h2>Apólices</h2>
        @if ($apolices->isEmpty())
            <div class="sub">Nenhuma apólice cadastrada para este segurado.</div>
        @else
            <table>
                <thead>
                    <tr>
                        <th>Apólice</th>
                        <th>Seguradora / Ramo</th>
                        <th>Vigência</th>
                        <th>Status</th>
                        <th class="num">Prêmio</th>
                        <th class="num">Parcelas</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach ($apolices as $a)
                        <tr>
                            <td><b>{{ $a['numero'] }}</b></td>
                            <td>{{ $a['seguradora'] }}<br><span class="sub">{{ $a['ramo'] }}</span></td>
                            <td>{{ $data($a['inicio']) }} a<br>{{ $data($a['fim']) }}</td>
                            <td><span class="selo {{ $classeStatus($a['status']) }}">{{ $a['status'] }}</span></td>
                            <td class="num">{{ $moeda($a['premio']) }}</td>
                            <td class="num">
                                {{ $a['pagas'] }}/{{ $a['total_parcelas'] }} pagas
                                @if ($a['atrasadas'] > 0)
                                    <br><span class="atraso">{{ $a['atrasadas'] }} atrasada(s)</span>
                                @endif
                            </td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        @endif

        <h2>Observações</h2>
        <div class="obs">{{ $segurado->observacoes ?: '—' }}</div>

        <div class="rodape">
            <div>
                Emitido em {{ now()->format('d/m/Y H:i') }}
                @auth por {{ auth()->user()->name }} @endauth
            </div>
            <div class="assinatura">Assinatura do segurado</div>
        </div>
    </div>

    <div class="acoes">
        <button class="btn-fechar" onclick="window.close()">Fechar</button>
        <button class="btn-imprimir" onclick="window.print()">Imprimir</button>
    </div>

    <script>
        // Espera a logo carregar antes de abrir o diálogo, senão ela sai em
        // branco na primeira impressão.
        window.addEventListener('load', function () { window.print(); });
    </script>
</body>

</html>
