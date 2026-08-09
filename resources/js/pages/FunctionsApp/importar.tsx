import { useCallback, useRef, useState } from 'react';
import type { ChangeEvent, DragEvent, KeyboardEvent } from 'react';
import { Head } from '@inertiajs/react';
import {
    AlertTriangle,
    ChevronRight,
    CircleCheck,
    Download,
    File,
    FileSpreadsheet,
    ListChecks,
    Sparkles,
    Upload,
    X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

/* ------------------------------------------------------------------ */
/* Tipos                                                              */
/* ------------------------------------------------------------------ */

type EstadoArquivo = 'vazio' | 'selecionado' | 'erro';

interface ArquivoInfo {
    nome: string;
    tamanho: string;
    linhas: number | null;
}

/* ------------------------------------------------------------------ */
/* Conteúdo estático                                                  */
/* ------------------------------------------------------------------ */

const PASSOS_TUTORIAL = [
    {
        numero: '01',
        titulo: 'Baixe o modelo',
        descricao:
            'Use nosso modelo de planilha pra garantir que as colunas fiquem no formato certo.',
        icon: Download,
    },
    {
        numero: '02',
        titulo: 'Preencha os dados',
        descricao:
            'Adicione clientes, apólices e vencimentos sem mudar o nome das colunas do modelo.',
        icon: ListChecks,
    },
    {
        numero: '03',
        titulo: 'Selecione o arquivo',
        descricao:
            'Clique em "Importar planilha" e escolha o arquivo .csv salvo no seu computador.',
        icon: FileSpreadsheet,
    },
    {
        numero: '04',
        titulo: 'Confirme a importação',
        descricao:
            'Revise o resumo e confirme. Os dados entram direto na base, sem duplicar cadastros.',
        icon: CircleCheck,
    },
];

const REQUISITOS = [
    'Arquivo no formato .csv (separado por vírgula)',
    'Primeira linha com os nomes das colunas',
    'Datas no formato AAAA-MM-DD',
    'Tamanho máximo de 10 MB por arquivo',
];

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatarTamanho(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* ------------------------------------------------------------------ */
/* Componente principal                                               */
/* ------------------------------------------------------------------ */

export default function ImportarDados() {
    const inputRef = useRef<HTMLInputElement>(null);

    const [estado, setEstado] = useState<EstadoArquivo>('vazio');
    const [arquivo, setArquivo] = useState<ArquivoInfo | null>(null);
    const [arrastando, setArrastando] = useState(false);
    const [erro, setErro] = useState<string | null>(null);

    const abrirSeletorDeArquivo = () => {
        inputRef.current?.click();
    };

    const processarArquivo = useCallback((file: File) => {
        const nomeValido = file.name.toLowerCase().endsWith('.csv');
        if (!nomeValido) {
            setErro('Esse arquivo não é uma planilha .csv. Selecione um arquivo válido.');
            setEstado('erro');
            setArquivo(null);
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const texto = String(e.target?.result ?? '');
            const totalLinhas = texto
                .split(/\r\n|\n/)
                .filter((linha) => linha.trim().length > 0).length;

            setArquivo({
                nome: file.name,
                tamanho: formatarTamanho(file.size),
                linhas: Math.max(totalLinhas - 1, 0),
            });
            setEstado('selecionado');
            setErro(null);
        };
        reader.onerror = () => {
            setErro('Não foi possível ler o arquivo. Tente novamente.');
            setEstado('erro');
        };
        reader.readAsText(file);
    }, []);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processarArquivo(file);
        e.target.value = '';
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setArrastando(false);
        const file = e.dataTransfer.files?.[0];
        if (file) processarArquivo(file);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            abrirSeletorDeArquivo();
        }
    };

    const limparArquivo = () => {
        setArquivo(null);
        setEstado('vazio');
        setErro(null);
    };

    const confirmarImportacao = () => {
        // TODO: integrar com o backend (Inertia useForm / router.post) para
        // enviar o arquivo selecionado e processar a importação no servidor.
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

            <div className="flex flex-col gap-6 p-6 sm:p-8">
                {/* Header da página */}
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
                        Traga sua base de clientes e apólices direto de uma planilha .csv
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.6fr_1fr]">
                    {/* Zona de importação central */}
                    <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-card p-8 shadow-sm sm:p-12">
                        {/* glow decorativo de fundo */}
                        <div className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-emerald-500/10 blur-3xl" />

                        <input
                            ref={inputRef}
                            type="file"
                            accept=".csv"
                            onChange={handleChange}
                            className="hidden"
                        />

                        {estado !== 'selecionado' ? (
                            <div
                                onClick={abrirSeletorDeArquivo}
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    setArrastando(true);
                                }}
                                onDragLeave={() => setArrastando(false)}
                                onDrop={handleDrop}
                                role="button"
                                tabIndex={0}
                                onKeyDown={handleKeyDown}
                                className={`relative z-10 flex cursor-pointer flex-col items-center justify-center gap-5 rounded-2xl border-2 border-dashed px-6 py-16 text-center transition-all ${
                                    arrastando
                                        ? 'scale-[1.01] border-emerald-500 bg-emerald-500/5'
                                        : 'border-border hover:border-emerald-500/50 hover:bg-emerald-500/[0.03]'
                                }`}
                            >
                                <span className="relative flex h-20 w-20 items-center justify-center">
                                    <span className="animate-ping-slow absolute inset-0 rounded-full bg-emerald-500/40" />
                                    <span className="relative flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30">
                                        <Upload className="size-8" />
                                    </span>
                                </span>

                                <div>
                                    <p className="text-lg font-bold text-foreground">
                                        Arraste sua planilha aqui
                                    </p>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        ou clique no botão abaixo para escolher um arquivo .csv
                                    </p>
                                </div>

                                <Button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        abrirSeletorDeArquivo();
                                    }}
                                    className="h-12 rounded-xl bg-emerald-500 px-8 text-base font-bold text-white shadow-lg shadow-emerald-500/25 transition-all hover:bg-emerald-600 active:scale-[0.98]"
                                >
                                    <Upload className="mr-2 size-4" />
                                    Importar planilha
                                </Button>

                                <p className="text-[11px] text-muted-foreground">
                                    Formato aceito: .csv · Tamanho máximo: 10 MB
                                </p>

                                {erro && (
                                    <div className="mt-1 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-600">
                                        <AlertTriangle className="size-4 shrink-0" />
                                        {erro}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="relative z-10 flex flex-col items-center gap-5 rounded-2xl border-2 border-emerald-500/30 bg-emerald-500/[0.04] px-6 py-14 text-center">
                                <span className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30">
                                    <CircleCheck className="size-9" />
                                </span>

                                <div>
                                    <p className="text-lg font-bold text-foreground">
                                        Arquivo pronto para importar
                                    </p>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Confira as informações abaixo antes de confirmar
                                    </p>
                                </div>

                                <div className="flex w-full max-w-sm items-center justify-between gap-3 rounded-xl border border-border/70 bg-card px-4 py-3 text-left">
                                    <div className="flex min-w-0 items-center gap-3">
                                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                                            <File className="size-5" />
                                        </span>
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-bold text-foreground">
                                                {arquivo?.nome}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {arquivo?.tamanho}
                                                {arquivo?.linhas !== null &&
                                                    ` · ${arquivo?.linhas} linha(s) de dados`}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={limparArquivo}
                                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                        aria-label="Remover arquivo"
                                    >
                                        <X className="size-4" />
                                    </button>
                                </div>

                                <div className="flex flex-col gap-2 sm:flex-row">
                                    <Button
                                        onClick={confirmarImportacao}
                                        className="h-11 rounded-xl bg-emerald-500 px-8 font-bold text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-600 active:scale-[0.98]"
                                    >
                                        <Sparkles className="mr-2 size-4" />
                                        Confirmar importação
                                    </Button>
                                    <Button
                                        onClick={abrirSeletorDeArquivo}
                                        variant="outline"
                                        className="h-11 rounded-xl px-6 font-bold"
                                    >
                                        Trocar arquivo
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar: modelo + requisitos */}
                    <div className="flex flex-col gap-4">
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
                                Baixe o modelo oficial com as colunas já formatadas para evitar
                                erros na importação.
                            </p>
                            <Button variant="outline" className="h-10 w-full rounded-xl font-bold">
                                <Download className="mr-2 size-4" />
                                Baixar modelo .csv
                            </Button>
                        </div>

                        <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
                            <div className="mb-3 flex items-center gap-2">
                                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
                                    <ListChecks className="size-4" />
                                </span>
                                <p className="text-sm font-bold text-foreground">
                                    Requisitos do arquivo
                                </p>
                            </div>
                            <ul className="flex flex-col gap-2.5">
                                {REQUISITOS.map((r) => (
                                    <li
                                        key={r}
                                        className="flex items-start gap-2 text-xs text-muted-foreground"
                                    >
                                        <span className="mt-1 size-1.5 shrink-0 rounded-full bg-emerald-500" />
                                        {r}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Tutorial passo a passo */}
                <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm sm:p-8">
                    <div className="mb-6">
                        <p className="text-[10px] font-bold tracking-[0.16em] text-emerald-600 uppercase">
                            Como funciona
                        </p>
                        <h2 className="mt-1 text-lg font-bold tracking-tight text-foreground">
                            Importar sua planilha em 4 passos
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                        {PASSOS_TUTORIAL.map((passo, idx) => {
                            const Icon = passo.icon;
                            return (
                                <div
                                    key={passo.numero}
                                    className="relative flex flex-col gap-3 rounded-xl border border-border/60 p-4"
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
