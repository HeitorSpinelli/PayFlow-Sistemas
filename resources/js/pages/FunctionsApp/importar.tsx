import { Head, useForm, usePage } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';
import { useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import BarraLateral from '@/components/importacao/barra-lateral';
import EtapasImportacao from '@/components/importacao/etapas';
import PainelPrevia from '@/components/importacao/painel-previa';
import PainelResultado from '@/components/importacao/painel-resultado';
import type { Fase, Resumo } from '@/components/importacao/tipos';
import { formatarTamanho } from '@/components/importacao/tipos';
import Verificando from '@/components/importacao/verificando';
import ZonaUpload from '@/components/importacao/zona-upload';

// `type` e não `interface`: o usePage do Inertia exige um tipo compatível
// com índice de string, o que interface não é.
type PageProps = {
    importResumo?: Resumo | null;
    limiteArquivoMb?: number;
    auth?: { user?: { role?: string } | null };
};

// Token CSRF para o fetch da prévia: o Laravel aceita o cookie XSRF-TOKEN
// no cabeçalho X-XSRF-TOKEN (o layout não tem a meta csrf-token).
function tokenXsrf() {
    const cookie = document.cookie
        .split('; ')
        .find((c) => c.startsWith('XSRF-TOKEN='));

    return cookie ? decodeURIComponent(cookie.split('=')[1]) : '';
}

/**
 * Tela "Importar Dados" — URL /importar (ImportacaoController::index).
 * Props: `importResumo` (resultado da última importação, via sessão) e
 * `limiteArquivoMb` (limite real de upload do servidor).
 *
 * Fluxo em três etapas (components/importacao/etapas.tsx):
 *  1. escolher/arrastar a planilha (.xlsx ou .csv) — ZonaUpload;
 *  2. prévia calculada na hora (POST /importar-dados/verificar, não grava
 *     nada) — Verificando e depois PainelPrevia;
 *  3. "Importar" faz POST /importar-dados e a página volta com o resultado
 *     (flash importResumo) — PainelResultado.
 *
 * Ao lado, a BarraLateral: modelo para baixar, dicas e colunas aceitas.
 */
export default function ImportarDados() {
    const inputRef = useRef<HTMLInputElement>(null);
    const { props } = usePage<PageProps>();
    const isAdmin = props.auth?.user?.role === 'admin';
    const limiteMb = props.limiteArquivoMb ?? 10;

    // Começa em "resultado" quando a página já chega com o resumo de uma
    // importação (redirect do POST /importar-dados).
    const [fase, setFase] = useState<Fase>(
        props.importResumo ? 'resultado' : 'inicial',
    );
    const [arquivo, setArquivo] = useState<File | null>(null);
    const [previa, setPrevia] = useState<Resumo | null>(null);
    const [erroArquivo, setErroArquivo] = useState<string | null>(null);

    // Envio do POST /importar-dados; `progress` alimenta a barra de envio.
    const { post, progress, transform } = useForm<{ arquivo: File | null }>({
        arquivo: null,
    });

    // Resumo novo (vindo do redirect após importar) → mostra o resultado.
    // Ajustado durante a renderização, no padrão do React para reagir a uma
    // prop que mudou, sem um primeiro render na fase errada.
    const [ultimoResumo, setUltimoResumo] = useState(props.importResumo);

    if (props.importResumo !== ultimoResumo) {
        setUltimoResumo(props.importResumo);

        if (props.importResumo) {
            setFase('resultado');
        }
    }

    const abrirSeletor = () => inputRef.current?.click();

    // Confere extensão/tamanho no navegador e pede a prévia ao servidor.
    const escolherArquivo = async (file: File) => {
        const extensao = file.name.split('.').pop()?.toLowerCase() ?? '';
        setErroArquivo(null);

        if (extensao === 'xls') {
            setErroArquivo(
                'Arquivos .xls (Excel 97-2003) não são aceitos. No Excel, use "Salvar como" e escolha .xlsx ou .csv.',
            );
            setFase('inicial');

            return;
        }

        if (!['xlsx', 'csv', 'txt'].includes(extensao)) {
            setErroArquivo(
                'Esse arquivo não é uma planilha. Envie um arquivo .xlsx (Excel) ou .csv.',
            );
            setFase('inicial');

            return;
        }

        if (file.size > limiteMb * 1024 * 1024) {
            setErroArquivo(
                `A planilha tem ${formatarTamanho(file.size)} e o limite é ${limiteMb} MB. Divida em arquivos menores.`,
            );
            setFase('inicial');

            return;
        }

        setArquivo(file);
        setPrevia(null);
        setFase('verificando');

        const corpo = new FormData();
        corpo.append('arquivo', file);

        try {
            const resposta = await fetch('/importar-dados/verificar', {
                method: 'POST',
                body: corpo,
                credentials: 'same-origin',
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': tokenXsrf(),
                },
            });
            const json = await resposta.json().catch(() => null);

            if (resposta.status === 422) {
                throw new Error(
                    json?.errors?.arquivo?.[0] ??
                        json?.message ??
                        'Arquivo inválido.',
                );
            }

            if (resposta.status === 419) {
                throw new Error(
                    'Sua sessão expirou. Recarregue a página e tente de novo.',
                );
            }

            if (resposta.status === 429) {
                throw new Error(
                    'Muitas tentativas seguidas. Aguarde um minuto e tente de novo.',
                );
            }

            if (!resposta.ok || !json) {
                throw new Error(
                    json?.message ??
                        'Não foi possível analisar a planilha. Tente de novo.',
                );
            }

            setPrevia(json as Resumo);
            setFase('previa');
        } catch (e) {
            setErroArquivo(
                e instanceof Error
                    ? e.message
                    : 'Não foi possível analisar a planilha.',
            );
            setArquivo(null);
            setFase('inicial');
        }
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = ''; // permite escolher o mesmo arquivo de novo

        if (file) {
            void escolherArquivo(file);
        }
    };

    // Volta para a zona de upload (cancelar, nova importação).
    const recomecar = () => {
        setArquivo(null);
        setPrevia(null);
        setErroArquivo(null);
        setFase('inicial');
    };

    // Botão "Importar": POST /importar-dados. O resultado chega pela
    // sessão (props.importResumo) e troca a fase para "resultado".
    const importar = () => {
        if (!arquivo) {
            return;
        }

        transform(() => ({ arquivo }));
        setFase('importando');
        post('/importar-dados', {
            forceFormData: true,
            preserveScroll: true,
            onError: (erros) => {
                setErroArquivo(
                    erros.arquivo ??
                        'Não foi possível importar. Tente de novo.',
                );
                setFase('previa');
            },
        });
    };

    return (
        <>
            <Head title="Importar Dados" />

            <div className="flex flex-col gap-6 p-6 max-sm:gap-5 max-sm:p-4 sm:p-8">
                {/* Cabeçalho */}
                <div>
                    <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold tracking-[0.16em] text-emerald-600 uppercase">
                        <span>Gestão</span>
                        <ChevronRight className="h-3 w-3" />
                        <span>Importar Dados</span>
                    </div>
                    <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                        Importar Dados
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Traga clientes, apólices e parcelas de uma planilha do
                        Excel — o sistema confere tudo antes de gravar.
                    </p>
                </div>

                <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
                    {/* Painel principal. overflow-clip (e não hidden) para a
                        barra de ação da prévia conseguir ficar "sticky". */}
                    <div className="relative min-w-0 overflow-clip rounded-3xl border border-border/70 bg-card p-4 shadow-sm sm:p-8">
                        <div className="pointer-events-none absolute -top-28 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-emerald-500/10 blur-3xl" />

                        <input
                            ref={inputRef}
                            type="file"
                            accept=".xlsx,.csv,.txt,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
                            onChange={handleChange}
                            className="hidden"
                        />

                        <div className="relative flex flex-col gap-7">
                            <EtapasImportacao
                                fase={fase}
                                falhou={
                                    fase === 'resultado' &&
                                    !!props.importResumo?.erroGeral
                                }
                            />

                            {fase === 'inicial' && (
                                <ZonaUpload
                                    onArquivo={(f) => void escolherArquivo(f)}
                                    onAbrir={abrirSeletor}
                                    limiteMb={limiteMb}
                                    erro={erroArquivo}
                                />
                            )}

                            {fase === 'verificando' && arquivo && (
                                <Verificando arquivo={arquivo} />
                            )}

                            {(fase === 'previa' || fase === 'importando') &&
                                previa &&
                                arquivo && (
                                    <PainelPrevia
                                        resumo={previa}
                                        arquivo={arquivo}
                                        importando={fase === 'importando'}
                                        progresso={progress?.percentage}
                                        erro={erroArquivo}
                                        isAdmin={isAdmin}
                                        onImportar={importar}
                                        onTrocar={abrirSeletor}
                                        onCancelar={recomecar}
                                    />
                                )}

                            {fase === 'resultado' && props.importResumo && (
                                <PainelResultado
                                    resumo={props.importResumo}
                                    isAdmin={isAdmin}
                                    onNovo={recomecar}
                                />
                            )}
                        </div>
                    </div>

                    <BarraLateral limiteMb={limiteMb} />
                </div>
            </div>
        </>
    );
}
