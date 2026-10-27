@php
    $moeda = fn ($v) => 'R$ ' . number_format((float) $v, 2, ',', '.');
    $data = fn ($d) => $d ? \Carbon\Carbon::parse($d)->format('d/m/Y') : '—';
    $corStatus = fn ($s) => match ($s) {
        'Paga' => 'paga',
        'Atrasada' => 'atrasada',
        default => 'avencer',
    };
@endphp
<!DOCTYPE html>
<html lang="pt-br">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cupom - {{ $cliente->nome_completo ?? 'Parcela' }} - {{ $pagamento->parcela }}ª parcela</title>
    <style>
        /* Largura de bobina térmica (80mm) — também imprime bem em A4,
           centralizado, sem ocupar a folha toda. */
        @page { size: 80mm auto; margin: 4mm; }

        * { box-sizing: border-box; }

        body {
            margin: 0;
            padding: 16px;
            background: #f4f4f5;
            color: #18181b;
            font-family: 'Courier New', Courier, monospace;
            font-size: 12px;
        }

        .cupom {
            width: 80mm;
            max-width: 100%;
            margin: 0 auto;
            padding: 14px 12px;
            background: #fff;
            border: 1px solid #e4e4e7;
        }

        .centro { text-align: center; }
        .logo { display: block; margin: 0 auto 6px; width: 56px; height: 56px; object-fit: contain; }
        .marca { font-weight: 800; font-size: 14px; letter-spacing: 0.04em; text-transform: uppercase; }
        .sub { font-size: 10px; color: #52525b; }
        .sep { border: 0; border-top: 1px dashed #71717a; margin: 10px 0; }
        .titulo { font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 0.06em; }

        .linha { display: flex; justify-content: space-between; gap: 8px; margin: 2px 0; }
        .linha span:first-child { color: #52525b; }
        .linha span:last-child { text-align: right; font-weight: 600; }

        .destaque {
            margin: 8px 0;
            padding: 8px;
            border: 2px solid #18181b;
            border-radius: 4px;
        }
        .destaque .numero { font-size: 18px; font-weight: 800; }

        .status {
            display: inline-block;
            padding: 2px 8px;
            border: 1px solid currentColor;
            border-radius: 999px;
            font-weight: 700;
            font-size: 11px;
            text-transform: uppercase;
        }
        .status.paga { color: #047857; }
        .status.atrasada { color: #b91c1c; }
        .status.avencer { color: #a16207; }
        .destaque .status { font-size: 13px; padding: 3px 12px; }

        table { width: 100%; border-collapse: collapse; font-size: 11px; }
        th { text-align: left; font-size: 10px; text-transform: uppercase; border-bottom: 1px solid #18181b; padding: 3px 2px; }
        td { padding: 3px 2px; border-bottom: 1px dotted #d4d4d8; }
        td.num, th.num { text-align: right; }
        tr.atual td { font-weight: 800; background: #e4e4e7; }

        .acoes { width: 80mm; max-width: 100%; margin: 12px auto 0; display: flex; gap: 8px; }
        .acoes button {
            flex: 1; padding: 10px; border: 0; border-radius: 10px; cursor: pointer;
            font: 600 13px 'Segoe UI', Helvetica, Arial, sans-serif;
        }
        .btn-imprimir { background: #10b981; color: #fff; }
        .btn-fechar { background: #e4e4e7; color: #18181b; }

        @media print {
            body { background: #fff; padding: 0; }
            .cupom { border: 0; padding: 0; width: auto; }
            .acoes { display: none; }
            /* Sem isso o navegador descarta fundos e o destaque da linha some. */
            * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
    </style>
</head>

<body>
    <div class="cupom">
        <div class="centro">
            <img class="logo" src="{{ asset('logo.png') }}" alt="PayFlow">
            <div class="marca">PayFlow-Sistemas</div>
            <div class="sub">Comprovante de status de parcela</div>
        </div>

        <hr class="sep">

        <div class="titulo">Segurado</div>
        <div style="font-weight:700; margin:2px 0 4px;">{{ $cliente->nome_completo ?? '—' }}</div>
        @if (! empty($cliente?->cpf_cnpj))
            <div class="linha"><span>CPF/CNPJ</span><span>{{ $cliente->cpf_cnpj }}</span></div>
        @endif

        <hr class="sep">

        <div class="titulo">Apólice</div>
        <div class="linha"><span>Número</span><span>{{ $apolice->numero_apolice }}</span></div>
        @if ($apolice->seguradora)
            <div class="linha"><span>Seguradora</span><span>{{ $apolice->seguradora->nome_fantasia }}</span></div>
        @endif
        <div class="linha"><span>Parcelas</span><span>{{ $totalParcelas }}x</span></div>
        <div class="linha"><span>Pagas</span><span>{{ $pagas }} de {{ $totalParcelas }}</span></div>
        @if ($apolice->valor_premio_total)
            <div class="linha"><span>Prêmio total</span><span>{{ $moeda($apolice->valor_premio_total) }}</span></div>
        @endif

        <div class="destaque centro">
            <div class="sub">PARCELA</div>
            <div class="numero">{{ $pagamento->parcela }}ª de {{ $totalParcelas }}</div>
            <div style="margin:6px 0;">
                <span class="status {{ $corStatus($parcelaDestaque['status'] ?? 'Paga') }}">
                    {{ $parcelaDestaque['status'] ?? 'Paga' }}
                </span>
            </div>
            <div class="linha"><span>Valor pago</span><span>{{ $moeda($pagamento->valor) }}</span></div>
            @if ($parcelaDestaque)
                <div class="linha"><span>Vencimento</span><span>{{ $data($parcelaDestaque['vencimento']) }}</span></div>
            @endif
            <div class="linha"><span>Pagamento</span><span>{{ $data($pagamento->data_pagamento) }}</span></div>
            <div class="linha"><span>Forma</span><span style="text-transform:capitalize;">{{ $pagamento->forma_pagamento }}</span></div>
        </div>

        @if ($parcelas->isNotEmpty())
            <hr class="sep">
            <div class="titulo" style="margin-bottom:4px;">Todas as parcelas</div>
            <table>
                <thead>
                    <tr>
                        <th>Nº</th>
                        <th>Venc.</th>
                        <th class="num">Valor</th>
                        <th class="num">Status</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach ($parcelas as $p)
                        <tr class="{{ $p['numero'] == $pagamento->parcela ? 'atual' : '' }}">
                            <td>{{ $p['numero'] == $pagamento->parcela ? '►' : '' }}{{ $p['numero'] }}ª</td>
                            <td>{{ $data($p['vencimento']) }}</td>
                            <td class="num">{{ $moeda($p['valor']) }}</td>
                            <td class="num">{{ $p['status'] }}</td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        @endif

        <hr class="sep">

        <div class="centro sub">
            Emitido em {{ now()->format('d/m/Y H:i') }}<br>
            Pagamento #{{ str_pad($pagamento->id, 4, '0', STR_PAD_LEFT) }}
        </div>
    </div>

    <div class="acoes">
        <button class="btn-imprimir" onclick="window.print()">Imprimir</button>
        <button class="btn-fechar" onclick="window.close()">Fechar</button>
    </div>

    <script>
        // Espera a logo carregar antes de abrir o diálogo, senão ela sai em
        // branco na primeira impressão.
        window.addEventListener('load', function () { window.print(); });
    </script>
</body>

</html>
