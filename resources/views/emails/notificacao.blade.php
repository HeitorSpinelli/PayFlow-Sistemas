<!DOCTYPE html>
<html lang="pt-br">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="light">
    <meta name="supported-color-schemes" content="light">
    <title>{{ $assunto }}</title>
</head>

<body style="margin:0; padding:0; background-color:#f4f4f5; font-family:'Segoe UI', Helvetica, Arial, sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5; padding:32px 16px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px; background-color:#ffffff; border:1px solid #e4e4e7; border-radius:16px; overflow:hidden;">
                    {{-- Cabeçalho --}}
                    <tr>
                        <td style="padding:28px 32px 24px 32px; border-bottom:1px solid #f0fdf4;">
                            <table role="presentation" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="vertical-align:middle; padding-right:10px;">
                                        <img src="{{ asset('logo.png') }}" alt="PayFlow" width="32" height="32" style="display:block; border-radius:8px;">
                                    </td>
                                    <td style="vertical-align:middle;">
                                        <span style="font-size:14px; font-weight:800; letter-spacing:-0.02em; color:#059669; text-transform:uppercase; font-style:italic;">
                                            PayFlow-Sistemas
                                        </span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    {{-- Corpo --}}
                    <tr>
                        <td style="padding:32px;">
                            <p style="margin:0 0 6px 0; font-size:11px; font-weight:700; letter-spacing:0.08em; color:#059669; text-transform:uppercase;">
                                {{ $assunto }}
                            </p>
                            <h1 style="margin:0 0 16px 0; font-size:20px; font-weight:700; color:#18181b;">
                                Olá, {{ $nomeSegurado }}
                            </h1>
                            <p style="margin:0; font-size:15px; line-height:1.6; color:#3f3f46;">
                                {{ $mensagem }}
                            </p>

                            <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:28px;">
                                <tr>
                                    <td style="border-radius:10px; background-color:#059669;">
                                        <a href="{{ route('login') }}" style="display:inline-block; padding:11px 22px; font-size:14px; font-weight:700; color:#ffffff; text-decoration:none;">
                                            Acessar minha conta
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    {{-- Rodapé --}}
                    <tr>
                        <td style="padding:20px 32px; background-color:#fafafa; border-top:1px solid #f0fdf4;">
                            <p style="margin:0; font-size:12px; line-height:1.5; color:#a1a1aa;">
                                Este é um e-mail automático enviado pelo PayFlow-Sistemas. Não é necessário responder esta mensagem.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>

</html>
