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
    {{-- Preheader: texto de prévia mostrado pelo cliente de e-mail ao lado do assunto, invisível no corpo --}}
    <div style="display:none; max-height:0; overflow:hidden; opacity:0;">
        {{ \Illuminate\Support\Str::limit($mensagem, 100) }}
    </div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5; padding:40px 16px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px; background-color:#ffffff; border:1px solid #e4e4e7; border-radius:20px; overflow:hidden; box-shadow:0 4px 24px rgba(5,150,105,0.08);">
                    {{-- Faixa superior de destaque --}}
                    <tr>
                        <td style="height:4px; background-color:#059669; background:linear-gradient(90deg,#10b981,#059669);line-height:4px;font-size:0;">&nbsp;</td>
                    </tr>

                    {{-- Cabeçalho --}}
                    <tr>
                        <td style="padding:32px 32px 24px 32px; background-color:#f0fdf4;">
                            <table role="presentation" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="vertical-align:middle; padding-right:12px;">
                                        <img src="data:image/png;base64,{{ base64_encode(file_get_contents(public_path('logo-email.png'))) }}" alt="PayFlow" width="36" height="36" style="display:block; border-radius:9px;">
                                    </td>
                                    <td style="vertical-align:middle;">
                                        <span style="font-size:15px; font-weight:800; letter-spacing:-0.02em; color:#047857; text-transform:uppercase; font-style:italic;">
                                            PayFlow-Sistemas
                                        </span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    {{-- Corpo --}}
                    <tr>
                        <td style="padding:36px 32px;">
                            <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:18px;">
                                <tr>
                                    <td style="background-color:#d1fae5; border-radius:999px; padding:5px 14px;">
                                        <span style="font-size:11px; font-weight:700; letter-spacing:0.08em; color:#047857; text-transform:uppercase;">
                                            {{ $assunto }}
                                        </span>
                                    </td>
                                </tr>
                            </table>

                            <h1 style="margin:0 0 18px 0; font-size:22px; font-weight:800; letter-spacing:-0.01em; color:#18181b;">
                                Olá, {{ $nomeSegurado }}
                            </h1>

                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fafafa; border-left:3px solid #10b981; border-radius:10px;">
                                <tr>
                                    <td style="padding:18px 20px;">
                                        <p style="margin:0; font-size:15px; line-height:1.65; color:#3f3f46;">
                                            {{ $mensagem }}
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    {{-- Rodapé --}}
                    <tr>
                        <td style="padding:22px 32px; background-color:#fafafa; border-top:1px solid #f0fdf4;">
                            <p style="margin:0 0 4px 0; font-size:12px; font-weight:700; color:#71717a;">
                                PayFlow-Sistemas
                            </p>
                            <p style="margin:0; font-size:12px; line-height:1.5; color:#a1a1aa;">
                                Este é um e-mail automático. Não é necessário responder esta mensagem.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>

</html>
