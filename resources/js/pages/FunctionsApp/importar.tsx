import { Head, Link, useForm, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    Building2,
    ChevronDown,
    ChevronRight,
    CircleCheck,
    Download,
    File,
    FileSpreadsheet,
    ListChecks,
    Loader2,
    RotateCcw,
    Sparkles,
    TriangleAlert,
    Upload,
    X,
} from 'lucide-react';
import { useRef, useState } from 'react';
import type { ChangeEvent, DragEvent, KeyboardEvent, ReactNode } from 'react';
import { Button } from '@/components/ui/button';

/* ------------------------------------------------------------------ */
/* Tipos                                                              */
/* ------------------------------------------------------------------ */

// inicial: zona de upload · verificando: prévia sendo calculada ·
// previa: resultado da verificação, aguardando "Importar" ·
// importando: envio/gravação · resultado: importação concluída (ou falhou).
type Fase = 'inicial' | 'verificando' | 'previa' | 'importando' | 'resultado';

interface Mensagem {
    linha: number | null;
    mensagem: string;
}

interface Contagem {
    clientesNovos: number;
    clientesAtualizados: number;
    apolicesNovas: number;
    apolicesAtualizadas: number;
    parcelasNovas: number;
    parcelasAtualizadas: number;
    parcelasSemMudanca: number;
    pagamentosRegistrados: number;
}

// Mesmo formato para a prévia (POST /importar-dados/verificar) e para o
// resultado (flash importResumo) — ImportacaoSeguradosService::resumo().
interface Resumo {
    simulacao?: boolean;
    erroGeral: string | null;
    arquivo?: string;
    total: number;
    validas: number;
    comErro?: number;
    importados: number;
    contagem?: Contagem;
    erros?: Mensagem[];
    totalErros?: number;
    avisos?: Mensagem[];
    totalAvisos?: number;
    seguradorasFaltantes?: string[];
    ramosFaltantes?: { seguradora: string; ramo: string }[];
}

// `type` e não `interface`: o usePage do Inertia exige um tipo compatível
// com índice de string, o que interface não é.
type PageProps = {
    importResumo?: Resumo | null;
    limiteArquivoMb?: number;
    auth?: { user?: { role?: string } | null };
};

/* ------------------------------------------------------------------ */
/* Conteúdo estático                                                  */
/* ------------------------------------------------------------------ */

// Cards da seção "Como funciona" no rodapé da página.
const PASSOS_TUTORIAL = [
    {
        numero: '01',
        titulo: 'Baixe o modelo',
        descricao:
            'O modelo já vem com exemplos usando as seguradoras e ramos cadastrados no sistema.',
        icon: Download,
    },
    {
        numero: '02',
        titulo: 'Preencha os dados',
        descricao:
            'Uma linha por parcela: cliente, apólice e parcela. Pode usar o Excel normalmente.',
        icon: ListChecks,
    },
    {
        numero: '03',
        titulo: 'Envie a planilha',
        descricao:
            'Arraste o arquivo .xlsx ou .csv. O sistema confere tudo antes de gravar qualquer coisa.',
        icon: FileSpreadsheet,
    },
    {
        numero: '04',
        titulo: 'Confira e importe',
        descricao:
            'Veja na prévia o que entra e o que precisa de ajuste. Importar de novo não duplica nada.',
        icon: CircleCheck,
    },
];

// Colunas reconhecidas (ImportacaoSeguradosService::NOMES_COLUNAS). O nome
// pode variar ("CPF", "Nº Apólice", "Vencimento"...), sem diferenciar
// maiúsculas ou acentos.
const COLUNAS = [
    { nome: 'Nome', exemplo: 'Maria da Silva', obrigatoria: true },
    { nome: 'CPF/CNPJ', exemplo: '529.982.247-25', obrigatoria: true },
    { nome: 'Seguradora', exemplo: 'Porto Seguro', obrigatoria: true },
    { nome: 'Ramo', exemplo: 'Carro', obrigatoria: true },
    { nome: 'Número da Apólice', exemplo: 'AP-30291', obrigatoria: true },
    { nome: 'Parcela', exemplo: '1 ou 1/12', obrigatoria: true },
    { nome: 'Valor da Parcela', exemplo: '342,50', obrigatoria: true },
    { nome: 'Vencimento', exemplo: '10/12/2026', obrigatoria: true },
    { nome: 'Status', exemplo: 'Pago / Em aberto', obrigatoria: false },
    { nome: 'Data do Pagamento', exemplo: '08/12/2026', obrigatoria: false },
    {
        nome: 'Forma de Pagamento',
        exemplo: 'Boleto, Pix...',
        obrigatoria: false,
    },
    { nome: 'E-mail', exemplo: 'maria@email.com', obrigatoria: false },
    { nome: 'Celular', exemplo: '(11) 98765-4321', obrigatoria: false },
    { nome: 'Início da Vigência', exemplo: '01/11/2026', obrigatoria: false },
    { nome: 'Fim da Vigência', exemplo: '01/11/2027', obrigatoria: false },
    { nome: 'Prêmio Total', exemplo: '4.110,00', obrigatoria: false },
    { nome: 'Total de Parcelas', exemplo: '12', obrigatoria: false },
    { nome: 'Cobertura', exemplo: '80.000,00', obrigatoria: false },
    { nome: 'Data de Nascimento', exemplo: '15/03/1985', obrigatoria: false },
    {
        nome: 'Telefone Fixo, Endereço, Bairro, Cidade, UF, CEP, Razão Social',
        exemplo: '',
        obrigatoria: false,
    },
];

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

// Tamanho legível ("12.3 KB") mostrado no card do arquivo.
function formatarTamanho(bytes: number) {
    if (bytes < 1024) {
        return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Token CSRF para o fetch da prévia: o Laravel aceita o cookie XSRF-TOKEN
// no cabeçalho X-XSRF-TOKEN (o layout não tem a meta csrf-token).
function tokenXsrf() {
    const cookie = document.cookie
        .split('; ')
        .find((c) => c.startsWith('XSRF-TOKEN='));

    return cookie ? decodeURIComponent(cookie.split('=')[1]) : '';
}

const plural = (n: number, singular: string, pluralTexto: string) =>
    `${n.toLocaleString('pt-BR')} ${n === 1 ? singular : pluralTexto}`;

/* ------------------------------------------------------------------ */
/* Componente principal                                               */
/* ------------------------------------------------------------------ */

/**
 * Tela "Importar Dados" — URL /importar (ImportacaoController::index).
 * Props: `importResumo` (resultado da última importação, via sessão) e
 * `limiteArquivoMb` (limite real de upload do servidor).
 *
 * Fluxo: escolher/arrastar a planilha (.xlsx ou .csv) → a prévia é pedida na
 * hora (POST /importar-dados/verificar, não grava nada) e mostra o que entra,
 * o que tem problema e por quê → "Importar" faz POST /importar-dados → a
 * página volta com o resultado.
 *
 * Seções: cabeçalho; painel principal (upload / verificando / prévia /
 * resultado); coluna lateral com o modelo para baixar, requisitos e colunas
 * aceitas; tutorial "Como funciona".
 */
export default function ImportarDados() {
    const inputRef = useRef<HTMLInputElement>(null);
    const { props } = usePage<PageProps>();
    const isAdmin = props.auth?.user?.role === 'admin';
    const limiteMb = props.limiteArquivoMb ?? 10;

    // A fase inicial é "resultado" quando a página já chega com o resumo de
    // uma importação (redirect do POST /importar-dados).
    const [fase, setFase] = useState<Fase>(
        props.importResumo ? 'resultado' : 'inicial',
    );
    const [arquivo, setArquivo] = useState<File | null>(null);
    const [previa, setPrevia] = useState<Resumo | null>(null);
    const [erroArquivo, setErroArquivo] = useState<string | null>(null);
    const [arrastando, setArrastando] = useState(false);

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

            return;
        }

        if (!['xlsx', 'csv', 'txt'].includes(extensao)) {
            setErroArquivo(
                'Esse arquivo não é uma planilha. Envie um arquivo .xlsx (Excel) ou .csv.',
            );

            return;
        }

        if (file.size > limiteMb * 1024 * 1024) {
            setErroArquivo(
                `A planilha tem ${formatarTamanho(file.size)} e o limite é ${limiteMb} MB. Divida em arquivos menores.`,
            );

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

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setArrastando(false);
        const file = e.dataTransfer.files?.[0];

        if (file) {
            void escolherArquivo(file);
        }
    };

    // Acessibilidade: Enter/Espaço na zona de upload abre o seletor.
    const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            abrirSeletor();
        }
    };

    // Volta para a zona de upload (cancelar, trocar arquivo, nova importação).
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

            {/* Animação suave do pulso atrás do ícone de upload */}
            <style>{`
                @keyframes ping-slow {
                    0% { transform: scale(1); opacity: 0.55; }
                    75%, 100% { transform: scale(1.9); opacity: 0; }
                }
                .animate-ping-slow {
                    animation: ping-slow 2.4s cubic-bezier(0, 0, 0.2, 1) infinite;
                }
            `}</style>

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
                        Traga seus clientes, apólices e parcelas direto de uma
                        planilha do Excel (.xlsx) ou .csv
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.6fr_1fr]">
                    {/* Painel principal */}
                    <div className="relative min-w-0 overflow-hidden rounded-3xl border border-border/70 bg-card p-4 shadow-sm sm:p-8">
                        <div className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-emerald-500/10 blur-3xl" />

                        <input
                            ref={inputRef}
                            type="file"
                            accept=".xlsx,.csv,.txt,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
                            onChange={handleChange}
                            className="hidden"
                        />

                        <div className="relative z-10">
                            {fase === 'inicial' && (
                                <ZonaUpload
                                    arrastando={arrastando}
                                    setArrastando={setArrastando}
                                    onDrop={handleDrop}
                                    onKeyDown={handleKeyDown}
                                    onAbrir={abrirSeletor}
                                    limiteMb={limiteMb}
                                    erro={erroArquivo}
                                />
                            )}

                            {fase === 'verificando' && arquivo && (
                                <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-emerald-500/30 px-4 py-14 text-center">
                                    <Loader2 className="size-10 animate-spin text-emerald-500" />
                                    <div>
                                        <p className="text-base font-bold text-foreground">
                                            Verificando {arquivo.name}…
                                        </p>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            Conferindo CPFs, datas, valores,
                                            seguradoras e ramos. Nada é gravado
                                            nesta etapa.
                                        </p>
                                    </div>
                                </div>
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

                    {/* Coluna lateral: modelo, requisitos e colunas */}
                    <div className="flex min-w-0 flex-col gap-4">
                        <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
                            <div className="mb-3 flex items-center gap-2">
                                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                                    <FileSpreadsheet className="size-4" />
                                </span>
                                <p className="text-sm font-bold text-foreground">
                                    Modelo de planilha
                                </p>
                            </div>
                            <p className="mb-4 text-xs leading-relaxed text-muted-foreground">
                                Abre direto no Excel, já com exemplos usando as
                                seguradoras e ramos cadastrados. Apague os
                                exemplos e preencha com os seus dados.
                            </p>
                            <a href="/importar/modelo" download>
                                <Button
                                    variant="outline"
                                    className="h-10 w-full rounded-xl font-bold"
                                >
                                    <Download className="mr-2 size-4" />
                                    Baixar modelo
                                </Button>
                            </a>
                        </div>

                        <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
                            <div className="mb-3 flex items-center gap-2">
                                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
                                    <ListChecks className="size-4" />
                                </span>
                                <p className="text-sm font-bold text-foreground">
                                    Como a planilha deve ser
                                </p>
                            </div>
                            <ul className="flex flex-col gap-2.5">
                                {[
                                    `Excel (.xlsx) ou .csv, até ${limiteMb} MB e 5.000 linhas`,
                                    'Uma linha por parcela: o cliente e a apólice se repetem nas linhas',
                                    'Datas como 10/12/2026 e valores como 1.234,56 (o formato do Excel em português)',
                                    'A seguradora e o ramo já precisam estar cadastrados em Seguradoras e Ramos',
                                    'Parcela marcada como paga já entra com o pagamento lançado',
                                ].map((r) => (
                                    <li
                                        key={r}
                                        className="flex items-start gap-2 text-xs text-muted-foreground"
                                    >
                                        <span className="mt-1 size-1.5 shrink-0 rounded-full bg-emerald-500" />
                                        {r}
                                    </li>
                                ))}
                            </ul>

                            <details className="group mt-4 rounded-xl border border-border/70">
                                <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2.5 text-xs font-bold text-foreground">
                                    Ver colunas aceitas
                                    <ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180" />
                                </summary>
                                <ul className="divide-y divide-border/60 border-t border-border/70">
                                    {COLUNAS.map((c) => (
                                        <li
                                            key={c.nome}
                                            className="flex items-start justify-between gap-3 px-3 py-2 text-xs"
                                        >
                                            <span className="font-semibold text-foreground">
                                                {c.nome}
                                                {c.obrigatoria && (
                                                    <span className="text-emerald-600">
                                                        {' '}
                                                        *
                                                    </span>
                                                )}
                                            </span>
                                            <span className="shrink-0 text-right text-muted-foreground">
                                                {c.exemplo}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                                <p className="border-t border-border/70 px-3 py-2 text-[11px] text-muted-foreground">
                                    * obrigatória. O nome pode variar (CPF, Nº
                                    Apólice, Vencimento...) e colunas extras são
                                    ignoradas.
                                </p>
                            </details>
                        </div>
                    </div>
                </div>

                {/* Como funciona */}
                <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm sm:p-8">
                    <div className="mb-6 max-sm:mb-4">
                        <p className="text-[10px] font-bold tracking-[0.16em] text-emerald-600 uppercase">
                            Como funciona
                        </p>
                        <h2 className="mt-1 text-lg font-bold tracking-tight text-foreground">
                            Importar sua planilha em 4 passos
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 gap-5 max-sm:gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {PASSOS_TUTORIAL.map((passo, idx) => {
                            const Icon = passo.icon;

                            return (
                                <div
                                    key={passo.numero}
                                    className="relative flex flex-col gap-3 rounded-xl border border-border/60 p-4 max-sm:gap-2 max-sm:p-3"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-2xl font-black text-emerald-500/20">
                                            {passo.numero}
                                        </span>
                                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                                            <Icon className="size-4" />
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-foreground">
                                            {passo.titulo}
                                        </p>
                                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                                            {passo.descricao}
                                        </p>
                                    </div>
                                    {idx < PASSOS_TUTORIAL.length - 1 && (
                                        <ChevronRight className="absolute top-1/2 -right-3 hidden size-5 -translate-y-1/2 text-border lg:block" />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </>
    );
}

/* ------------------------------------------------------------------ */
/* Zona de upload                                                     */
/* ------------------------------------------------------------------ */

function ZonaUpload({
    arrastando,
    setArrastando,
    onDrop,
    onKeyDown,
    onAbrir,
    limiteMb,
    erro,
}: {
    arrastando: boolean;
    setArrastando: (v: boolean) => void;
    onDrop: (e: DragEvent<HTMLDivElement>) => void;
    onKeyDown: (e: KeyboardEvent<HTMLDivElement>) => void;
    onAbrir: () => void;
    limiteMb: number;
    erro: string | null;
}) {
    return (
        <div
            onClick={onAbrir}
            onDragOver={(e) => {
                e.preventDefault();
                setArrastando(true);
            }}
            onDragLeave={() => setArrastando(false)}
            onDrop={onDrop}
            role="button"
            tabIndex={0}
            onKeyDown={onKeyDown}
            className={`flex cursor-pointer flex-col items-center justify-center gap-5 rounded-2xl border-2 border-dashed px-4 py-10 text-center transition-all max-sm:gap-4 max-sm:py-8 sm:px-6 sm:py-16 ${
                arrastando
                    ? 'scale-[1.01] border-emerald-500 bg-emerald-500/5'
                    : 'border-border hover:border-emerald-500/50 hover:bg-emerald-500/[0.03]'
            }`}
        >
            <span className="relative flex h-20 w-20 items-center justify-center max-sm:h-16 max-sm:w-16">
                <span className="animate-ping-slow absolute inset-0 rounded-full bg-emerald-500/40" />
                <span className="relative flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 max-sm:h-16 max-sm:w-16">
                    <Upload className="size-8 max-sm:size-7" />
                </span>
            </span>

            <div>
                <p className="text-lg font-bold text-foreground">
                    Arraste sua planilha aqui
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                    ou clique para escolher um arquivo do Excel (.xlsx) ou .csv
                </p>
            </div>

            <Button
                onClick={(e) => {
                    e.stopPropagation();
                    onAbrir();
                }}
                className="h-12 rounded-xl bg-emerald-500 px-8 text-base font-bold text-white shadow-lg shadow-emerald-500/25 transition-all hover:bg-emerald-600 active:scale-[0.98] max-sm:w-full"
            >
                <Upload className="mr-2 size-4" />
                Escolher planilha
            </Button>

            <p className="text-[11px] text-muted-foreground">
                .xlsx ou .csv · até {limiteMb} MB · nada é gravado antes de você
                confirmar
            </p>

            {erro && (
                <div className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-left text-sm font-semibold text-red-600">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                    {erro}
                </div>
            )}
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Prévia                                                             */
/* ------------------------------------------------------------------ */

function PainelPrevia({
    resumo,
    arquivo,
    importando,
    progresso,
    erro,
    isAdmin,
    onImportar,
    onTrocar,
    onCancelar,
}: {
    resumo: Resumo;
    arquivo: File;
    importando: boolean;
    progresso?: number;
    erro: string | null;
    isAdmin: boolean;
    onImportar: () => void;
    onTrocar: () => void;
    onCancelar: () => void;
}) {
    const comErro = resumo.comErro ?? 0;

    return (
        <div className="flex flex-col gap-5">
            {/* Arquivo escolhido */}
            <div className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-background px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                        <File className="size-5" />
                    </span>
                    <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-foreground">
                            {arquivo.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {formatarTamanho(arquivo.size)}
                            {resumo.total > 0 &&
                                ` · ${plural(resumo.total, 'linha', 'linhas')} de dados`}
                        </p>
                    </div>
                </div>
                {!importando && (
                    <button
                        onClick={onCancelar}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        aria-label="Cancelar e escolher outro arquivo"
                    >
                        <X className="size-4" />
                    </button>
                )}
            </div>

            {resumo.erroGeral ? (
                <div className="flex flex-col items-center gap-4 rounded-2xl border border-red-500/20 bg-red-500/[0.06] px-5 py-8 text-center">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-600">
                        <AlertTriangle className="size-6" />
                    </span>
                    <div>
                        <p className="text-base font-bold text-foreground">
                            Não dá para importar esta planilha
                        </p>
                        <p className="mt-1 text-sm text-red-700 dark:text-red-400">
                            {resumo.erroGeral}
                        </p>
                    </div>
                    <Button
                        onClick={onTrocar}
                        className="h-11 rounded-xl bg-emerald-500 px-6 font-bold text-white hover:bg-emerald-600 max-sm:w-full"
                    >
                        Escolher outro arquivo
                    </Button>
                </div>
            ) : (
                <>
                    {/* Números da prévia */}
                    <div className="grid grid-cols-3 gap-3 max-sm:gap-2">
                        <Numero
                            valor={resumo.validas}
                            rotulo="prontas para importar"
                            cor="emerald"
                        />
                        <Numero
                            valor={comErro}
                            rotulo="com problema"
                            cor={comErro > 0 ? 'red' : 'neutro'}
                        />
                        <Numero
                            valor={resumo.total}
                            rotulo="linhas na planilha"
                            cor="neutro"
                        />
                    </div>

                    {resumo.contagem && resumo.validas > 0 && (
                        <div>
                            <p className="mb-2 text-xs font-bold text-muted-foreground">
                                Ao importar:
                            </p>
                            <ChipsContagem contagem={resumo.contagem} />
                        </div>
                    )}

                    <Faltantes resumo={resumo} isAdmin={isAdmin} />

                    <ListaMensagens
                        titulo="Linhas com problema (não serão importadas)"
                        mensagens={resumo.erros ?? []}
                        total={resumo.totalErros ?? 0}
                        tipo="erro"
                    />
                    <ListaMensagens
                        titulo="Avisos"
                        mensagens={resumo.avisos ?? []}
                        total={resumo.totalAvisos ?? 0}
                        tipo="aviso"
                    />

                    {erro && (
                        <div className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-600">
                            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                            {erro}
                        </div>
                    )}

                    {importando && (
                        <div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                                <div
                                    className="h-full rounded-full bg-emerald-500 transition-all"
                                    style={{ width: `${progresso ?? 100}%` }}
                                />
                            </div>
                            <p className="mt-1.5 text-xs font-semibold text-muted-foreground">
                                {progresso !== undefined && progresso < 100
                                    ? `Enviando… ${progresso}%`
                                    : 'Gravando no sistema…'}
                            </p>
                        </div>
                    )}

                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <Button
                            onClick={onImportar}
                            disabled={importando || resumo.validas === 0}
                            className="h-11 rounded-xl bg-emerald-500 px-6 font-bold text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {importando ? (
                                <Loader2 className="mr-2 size-4 animate-spin" />
                            ) : (
                                <Sparkles className="mr-2 size-4" />
                            )}
                            {importando
                                ? 'Importando…'
                                : resumo.validas === 0
                                  ? 'Nenhuma linha para importar'
                                  : comErro > 0
                                    ? `Importar as ${plural(resumo.validas, 'linha válida', 'linhas válidas')}`
                                    : `Importar ${plural(resumo.validas, 'linha', 'linhas')}`}
                        </Button>
                        <Button
                            onClick={onTrocar}
                            disabled={importando}
                            variant="outline"
                            className="h-11 rounded-xl px-6 font-bold"
                        >
                            Trocar arquivo
                        </Button>
                    </div>

                    {comErro > 0 && resumo.validas > 0 && (
                        <p className="text-xs text-muted-foreground">
                            Dica: você pode importar as linhas válidas agora,
                            corrigir as outras na planilha e importar o mesmo
                            arquivo de novo — o que já entrou não duplica.
                        </p>
                    )}
                </>
            )}
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Resultado                                                          */
/* ------------------------------------------------------------------ */

function PainelResultado({
    resumo,
    isAdmin,
    onNovo,
}: {
    resumo: Resumo;
    isAdmin: boolean;
    onNovo: () => void;
}) {
    if (resumo.erroGeral) {
        return (
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-red-500/20 bg-red-500/[0.06] px-5 py-10 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 text-red-600">
                    <AlertTriangle className="size-7" />
                </span>
                <div>
                    <p className="text-lg font-bold text-foreground">
                        Nada foi importado
                    </p>
                    <p className="mt-1 text-sm text-red-700 dark:text-red-400">
                        {resumo.erroGeral}
                    </p>
                </div>
                <Button
                    onClick={onNovo}
                    className="h-11 rounded-xl bg-emerald-500 px-6 font-bold text-white hover:bg-emerald-600 max-sm:w-full"
                >
                    <RotateCcw className="mr-2 size-4" />
                    Tentar de novo
                </Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-5">
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.05] px-5 py-8 text-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30">
                    <CircleCheck className="size-8" />
                </span>
                <div>
                    <p className="text-lg font-bold text-foreground">
                        Importação concluída
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {plural(
                            resumo.importados,
                            'linha importada',
                            'linhas importadas',
                        )}{' '}
                        de {resumo.total.toLocaleString('pt-BR')}
                        {resumo.arquivo ? ` de "${resumo.arquivo}"` : ''}
                    </p>
                </div>
                {resumo.contagem && (
                    <ChipsContagem contagem={resumo.contagem} />
                )}
            </div>

            <Faltantes resumo={resumo} isAdmin={isAdmin} />

            <ListaMensagens
                titulo="Linhas que ficaram de fora"
                mensagens={resumo.erros ?? []}
                total={resumo.totalErros ?? 0}
                tipo="erro"
            />
            <ListaMensagens
                titulo="Avisos"
                mensagens={resumo.avisos ?? []}
                total={resumo.totalAvisos ?? 0}
                tipo="aviso"
            />

            <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                    onClick={onNovo}
                    className="h-11 rounded-xl bg-emerald-500 px-6 font-bold text-white hover:bg-emerald-600"
                >
                    <Upload className="mr-2 size-4" />
                    Importar outra planilha
                </Button>
                <Link href="/clientes" className="w-full sm:w-auto">
                    <Button
                        variant="outline"
                        className="h-11 w-full rounded-xl px-6 font-bold"
                    >
                        Ver clientes
                    </Button>
                </Link>
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Peças compartilhadas                                               */
/* ------------------------------------------------------------------ */

function Numero({
    valor,
    rotulo,
    cor,
}: {
    valor: number;
    rotulo: string;
    cor: 'emerald' | 'red' | 'neutro';
}) {
    const classes = {
        emerald: 'border-emerald-500/25 bg-emerald-500/[0.06] text-emerald-600',
        red: 'border-red-500/25 bg-red-500/[0.06] text-red-600',
        neutro: 'border-border/70 bg-background text-foreground',
    }[cor];

    return (
        <div className={`rounded-xl border px-3 py-3 max-sm:px-2 ${classes}`}>
            <p className="text-2xl font-bold tracking-tight max-sm:text-xl">
                {valor.toLocaleString('pt-BR')}
            </p>
            <p className="text-[11px] leading-tight font-medium text-muted-foreground">
                {rotulo}
            </p>
        </div>
    );
}

// "3 clientes novos · 5 parcelas novas · 2 pagamentos lançados..."
function ChipsContagem({ contagem }: { contagem: Contagem }) {
    const itens: [number, string, string][] = [
        [contagem.clientesNovos, 'cliente novo', 'clientes novos'],
        [
            contagem.clientesAtualizados,
            'cliente atualizado',
            'clientes atualizados',
        ],
        [contagem.apolicesNovas, 'apólice nova', 'apólices novas'],
        [
            contagem.apolicesAtualizadas,
            'apólice atualizada',
            'apólices atualizadas',
        ],
        [contagem.parcelasNovas, 'parcela nova', 'parcelas novas'],
        [
            contagem.parcelasAtualizadas,
            'parcela atualizada',
            'parcelas atualizadas',
        ],
        [
            contagem.pagamentosRegistrados,
            'pagamento lançado',
            'pagamentos lançados',
        ],
        [
            contagem.parcelasSemMudanca,
            'parcela já estava igual',
            'parcelas já estavam iguais',
        ],
    ];

    return (
        <div className="flex flex-wrap justify-center gap-1.5 sm:justify-start">
            {itens
                .filter(([n]) => n > 0)
                .map(([n, singular, pluralTexto]) => (
                    <span
                        key={singular}
                        className="rounded-lg border border-border/70 bg-background px-2.5 py-1 text-xs font-semibold text-foreground"
                    >
                        {plural(n, singular, pluralTexto)}
                    </span>
                ))}
        </div>
    );
}

// Seguradoras e ramos que a planilha usa mas não estão cadastrados.
function Faltantes({ resumo, isAdmin }: { resumo: Resumo; isAdmin: boolean }) {
    const seguradoras = resumo.seguradorasFaltantes ?? [];
    const ramos = resumo.ramosFaltantes ?? [];

    if (seguradoras.length === 0 && ramos.length === 0) {
        return null;
    }

    return (
        <div className="rounded-2xl border border-amber-500/25 bg-amber-500/[0.06] p-4">
            <p className="mb-2 flex items-center gap-2 text-sm font-bold text-foreground">
                <Building2 className="size-4 text-amber-600" />
                Falta cadastrar no sistema
            </p>
            <ul className="flex flex-col gap-2">
                {seguradoras.map((nome) => (
                    <li
                        key={`s-${nome}`}
                        className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-background px-3 py-2"
                    >
                        <span className="min-w-0 truncate text-sm">
                            Seguradora{' '}
                            <span className="font-semibold">{nome}</span>
                        </span>
                        {isAdmin && (
                            <Link
                                href={`/seguradoras?nova_seguradora=${encodeURIComponent(nome)}`}
                            >
                                <Button
                                    size="sm"
                                    className="h-9 shrink-0 rounded-lg bg-emerald-500 px-3 text-xs font-bold text-white hover:bg-emerald-600"
                                >
                                    Cadastrar
                                </Button>
                            </Link>
                        )}
                    </li>
                ))}
                {ramos.map((r) => (
                    <li
                        key={`r-${r.seguradora}-${r.ramo}`}
                        className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-background px-3 py-2"
                    >
                        <span className="min-w-0 text-sm">
                            Ramo <span className="font-semibold">{r.ramo}</span>{' '}
                            na{' '}
                            <span className="font-semibold">
                                {r.seguradora}
                            </span>
                        </span>
                        {isAdmin && (
                            <Link href="/seguradoras">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-9 shrink-0 rounded-lg px-3 text-xs font-bold"
                                >
                                    Abrir
                                </Button>
                            </Link>
                        )}
                    </li>
                ))}
            </ul>
            <p className="mt-2 text-xs text-muted-foreground">
                {isAdmin
                    ? 'Cadastre e depois envie a mesma planilha de novo.'
                    : 'Peça a um administrador para cadastrar em Seguradoras e Ramos e depois envie a planilha de novo.'}
            </p>
        </div>
    );
}

// Lista de erros ou avisos com o número da linha da planilha.
function ListaMensagens({
    titulo,
    mensagens,
    total,
    tipo,
}: {
    titulo: string;
    mensagens: Mensagem[];
    total: number;
    tipo: 'erro' | 'aviso';
}) {
    if (mensagens.length === 0) {
        return null;
    }

    const cores =
        tipo === 'erro'
            ? {
                  borda: 'border-red-500/20',
                  fundo: 'bg-red-500/[0.04]',
                  titulo: 'text-red-600',
                  selo: 'bg-red-500/10 text-red-700 dark:text-red-400',
              }
            : {
                  borda: 'border-amber-500/25',
                  fundo: 'bg-amber-500/[0.04]',
                  titulo: 'text-amber-700 dark:text-amber-400',
                  selo: 'bg-amber-500/10 text-amber-800 dark:text-amber-300',
              };

    return (
        <details
            open={tipo === 'erro'}
            className={`group rounded-2xl border ${cores.borda} ${cores.fundo}`}
        >
            <summary
                className={`flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-sm font-bold ${cores.titulo}`}
            >
                <span className="flex items-center gap-2">
                    <TriangleAlert className="size-4 shrink-0" />
                    {titulo} ({total.toLocaleString('pt-BR')})
                </span>
                <ChevronDown className="size-4 shrink-0 transition-transform group-open:rotate-180" />
            </summary>
            <ul className="max-h-72 divide-y divide-border/50 overflow-y-auto border-t border-border/50">
                {mensagens.map((m, i) => (
                    <MensagemItem
                        key={i}
                        mensagem={m}
                        classeSelo={cores.selo}
                    />
                ))}
            </ul>
            {total > mensagens.length && (
                <p className="border-t border-border/50 px-4 py-2 text-xs text-muted-foreground">
                    + {(total - mensagens.length).toLocaleString('pt-BR')} não
                    exibidos aqui. Corrija os primeiros e envie de novo.
                </p>
            )}
        </details>
    );
}

function MensagemItem({
    mensagem,
    classeSelo,
}: {
    mensagem: Mensagem;
    classeSelo: string;
}): ReactNode {
    return (
        <li className="flex items-start gap-3 px-4 py-2.5 text-xs text-foreground">
            <span
                className={`mt-px shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-bold whitespace-nowrap ${classeSelo}`}
            >
                {mensagem.linha !== null ? `Linha ${mensagem.linha}` : 'Geral'}
            </span>
            <span className="leading-relaxed">{mensagem.mensagem}</span>
        </li>
    );
}
