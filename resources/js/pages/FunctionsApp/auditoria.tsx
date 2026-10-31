import { Head, Link, router } from '@inertiajs/react';
import {
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Megaphone,
    Search,
    X,
} from 'lucide-react';
import { Fragment, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';

type Alteracao = { de: unknown; para: unknown };

interface Registro {
    id: number;
    data: string;
    usuario: string | null;
    acao: string;
    modulo: string;
    descricao: string;
    alteracoes: Record<string, Alteracao> | null;
    ip: string | null;
}

interface PaginatedRegistros {
    data: Registro[];
    from: number | null;
    to: number | null;
    total: number;
    prev_page_url: string | null;
    next_page_url: string | null;
}

type Filtros = {
    usuario?: string;
    modulo?: string;
    acao?: string;
    de?: string;
    ate?: string;
    busca?: string;
};

interface PageProps {
    registros: PaginatedRegistros;
    filtros: Filtros;
    usuarios: { id: number; name: string }[];
    modulos: string[];
}

// Rótulo e cor do selo de cada ação — os valores batem com as constantes
// ACAO_* de App\Models\Auditoria.
const ACOES: Record<string, { rotulo: string; classe: string }> = {
    criou: {
        rotulo: 'Criou',
        classe: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600',
    },
    editou: {
        rotulo: 'Editou',
        classe: 'border-sky-500/20 bg-sky-500/10 text-sky-600',
    },
    excluiu: {
        rotulo: 'Excluiu',
        classe: 'border-red-500/20 bg-red-500/10 text-red-600',
    },
    estornou: {
        rotulo: 'Estornou',
        classe: 'border-amber-500/20 bg-amber-500/10 text-amber-600',
    },
    restaurou: {
        rotulo: 'Restaurou',
        classe: 'border-violet-500/20 bg-violet-500/10 text-violet-600',
    },
};

// Nome amigável das colunas do banco no detalhe das alterações. O que não
// estiver aqui vira "Nome da coluna" automaticamente (ver rotuloCampo).
const CAMPOS: Record<string, string> = {
    nome_completo: 'Nome',
    cpf_cnpj: 'CPF/CNPJ',
    tipo_pessoa: 'Tipo de pessoa',
    data_nascimento_fundacao: 'Nascimento/Fundação',
    celular_whatsapp: 'Celular/WhatsApp',
    telefone_fixo: 'Telefone fixo',
    cep: 'CEP',
    email: 'E-mail',
    email_suporte: 'E-mail de suporte',
    numero_apolice: 'Nº da apólice',
    cliente_id: 'Cliente (ID)',
    seguradora_id: 'Seguradora (ID)',
    ramo_id: 'Ramo (ID)',
    apolice_id: 'Apólice (ID)',
    tipo_notificacao_id: 'Tipo de notificação (ID)',
    valor_premio_total: 'Prêmio total',
    valor_cobertura: 'Cobertura',
    quantidade_parcelas: 'Qtd. de parcelas',
    inicio_vigencia: 'Início da vigência',
    fim_vigencia: 'Fim da vigência',
    suspensa_em: 'Suspensa em',
    data_pagamento: 'Data do pagamento',
    forma_pagamento: 'Forma de pagamento',
    nome_fantasia: 'Nome fantasia',
    razao_social: 'Razão social',
    cnpj: 'CNPJ',
    contato_nome: 'Contato',
    nome_ramo: 'Ramo',
    nome_notificacao: 'Nome',
    name: 'Nome',
    password: 'Senha',
    role: 'Perfil',
    intervalo_dias: 'Intervalo (dias)',
    tipo_condicao: 'Condição',
    user_id: 'Usuário (ID)',
};

const rotuloCampo = (campo: string) =>
    CAMPOS[campo] ??
    campo.charAt(0).toUpperCase() + campo.slice(1).replace(/_/g, ' ');

// Valor cru do banco → texto legível: vazio vira "—", booleano vira Sim/Não
// e datas ISO viram dd/mm/aaaa (com hora quando houver).
const formatarValor = (valor: unknown): string => {
    if (valor === null || valor === undefined || valor === '') {
        return '—';
    }

    if (typeof valor === 'boolean') {
        return valor ? 'Sim' : 'Não';
    }

    const texto = String(valor);
    const data = texto.match(
        /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?/,
    );

    if (data) {
        const [, a, m, d, h, min] = data;

        return h ? `${d}/${m}/${a} ${h}:${min}` : `${d}/${m}/${a}`;
    }

    return texto;
};

const formatarDataHora = (iso: string) =>
    new Date(iso).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

const classeSelect =
    'h-10 w-full appearance-none rounded-xl border border-border/70 bg-background pr-8 pl-3 text-sm font-medium shadow-sm transition-all hover:border-emerald-500/40 focus:ring-4 focus:ring-emerald-500/10 focus:outline-none max-sm:pr-7 max-sm:pl-2.5 max-sm:text-[13px] sm:w-auto';

/**
 * Tela Auditoria (/auditoria, só admin) — AuditoriaController::index.
 * Aberta pelo item "Auditoria" (megafone) do menu do usuário, entre
 * Configurações e Ajuda.
 *
 * Seções: cabeçalho; filtros (busca, usuário, módulo, ação, período); tabela
 * do log com o detalhe "de → para" de cada edição; paginação.
 */
export default function Auditoria({
    registros,
    filtros,
    usuarios,
    modulos,
}: PageProps) {
    // Linha com o detalhe das alterações aberto.
    const [expandido, setExpandido] = useState<number | null>(null);
    const [busca, setBusca] = useState(filtros.busca ?? '');
    const buscaTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Recarrega a tela com os filtros na query string (GET /auditoria),
    // voltando para a página 1. Valor vazio remove o filtro.
    const aplicarFiltros = (novos: Filtros) => {
        const params = Object.fromEntries(
            Object.entries({ ...filtros, ...novos }).filter(
                ([, valor]) => valor !== undefined && valor !== '',
            ),
        );

        router.get('/auditoria', params, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    // Busca no texto do registro com debounce, igual às outras telas.
    const handleBusca = (e: React.ChangeEvent<HTMLInputElement>) => {
        const valor = e.target.value;
        setBusca(valor);

        if (buscaTimeoutRef.current) {
            clearTimeout(buscaTimeoutRef.current);
        }

        buscaTimeoutRef.current = setTimeout(
            () => aplicarFiltros({ busca: valor.trim() }),
            500,
        );
    };

    const temFiltro = Object.values(filtros).some((v) => v);

    // Botão "Limpar filtros".
    const limparFiltros = () => {
        setBusca('');
        router.get('/auditoria', {}, { preserveScroll: true, replace: true });
    };

    return (
        <>
            <Head title="Auditoria" />

            <div className="flex flex-col gap-5 px-4 py-5 sm:p-8 lg:gap-6">
                {/* Cabeçalho */}
                <div>
                    <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold tracking-[0.16em] text-emerald-600 uppercase">
                        <span>Administração</span>
                        <ChevronRight className="h-3 w-3" />
                        <span>Auditoria</span>
                    </div>
                    <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight sm:text-2xl">
                        <Megaphone className="size-6 text-emerald-500" />
                        Auditoria
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Quem criou, editou, excluiu, estornou ou restaurou o quê
                        — e quando
                    </p>
                </div>

                <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
                    {/* Filtros */}
                    <div className="flex flex-col gap-3 border-b border-border/70 p-4 sm:p-5">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <h3 className="text-sm font-bold">
                                    Registro de atividades
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                    {registros.total} registro(s)
                                </p>
                            </div>
                            {temFiltro && (
                                <button
                                    onClick={limparFiltros}
                                    className="inline-flex h-10 shrink-0 items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground sm:h-auto"
                                >
                                    <X className="size-3.5" />
                                    Limpar filtros
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-2.5 sm:flex sm:flex-wrap sm:items-center">
                            <div className="relative col-span-2">
                                <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground/60" />
                                <Input
                                    placeholder="Buscar registro..."
                                    value={busca}
                                    onChange={handleBusca}
                                    className="h-10 w-full rounded-xl border border-border/70 bg-background pr-3 pl-9 text-sm shadow-sm sm:w-56"
                                />
                            </div>

                            <div className="relative">
                                <select
                                    value={filtros.usuario ?? ''}
                                    onChange={(e) =>
                                        aplicarFiltros({
                                            usuario: e.target.value,
                                        })
                                    }
                                    className={classeSelect}
                                >
                                    <option value="">Todos os usuários</option>
                                    <option value="sistema">Sistema</option>
                                    {usuarios.map((u) => (
                                        <option key={u.id} value={u.id}>
                                            {u.name}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                            </div>

                            <div className="relative">
                                <select
                                    value={filtros.modulo ?? ''}
                                    onChange={(e) =>
                                        aplicarFiltros({
                                            modulo: e.target.value,
                                        })
                                    }
                                    className={classeSelect}
                                >
                                    <option value="">Todos os módulos</option>
                                    {modulos.map((m) => (
                                        <option key={m} value={m}>
                                            {m}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                            </div>

                            <div className="relative col-span-2">
                                <select
                                    value={filtros.acao ?? ''}
                                    onChange={(e) =>
                                        aplicarFiltros({ acao: e.target.value })
                                    }
                                    className={classeSelect}
                                >
                                    <option value="">Todas as ações</option>
                                    {Object.entries(ACOES).map(
                                        ([valor, { rotulo }]) => (
                                            <option key={valor} value={valor}>
                                                {rotulo}
                                            </option>
                                        ),
                                    )}
                                </select>
                                <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                            </div>

                            <div className="col-span-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                                <input
                                    type="date"
                                    value={filtros.de ?? ''}
                                    onChange={(e) =>
                                        aplicarFiltros({ de: e.target.value })
                                    }
                                    className="h-10 min-w-0 flex-1 rounded-xl border border-border/70 bg-background px-3 text-sm text-foreground shadow-sm sm:flex-initial"
                                />
                                até
                                <input
                                    type="date"
                                    value={filtros.ate ?? ''}
                                    onChange={(e) =>
                                        aplicarFiltros({ ate: e.target.value })
                                    }
                                    className="h-10 min-w-0 flex-1 rounded-xl border border-border/70 bg-background px-3 text-sm text-foreground shadow-sm sm:flex-initial"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Mobile/tablet: lista de cards no lugar da tabela
                        (que só aparece em lg+). Mesmo estado `expandido`. */}
                    <div className="divide-y divide-border/70 lg:hidden">
                        {registros.data.length === 0 ? (
                            <p className="px-4 py-10 text-center text-sm text-muted-foreground">
                                Nenhuma atividade encontrada.
                            </p>
                        ) : (
                            registros.data.map((r) => {
                                const acao = ACOES[r.acao] ?? {
                                    rotulo: r.acao,
                                    classe: 'border-border bg-muted text-muted-foreground',
                                };
                                const campos = Object.entries(
                                    r.alteracoes ?? {},
                                );
                                const aberto = expandido === r.id;

                                return (
                                    <div
                                        key={r.id}
                                        className={`flex flex-col gap-2 px-4 py-3.5 ${aberto ? 'bg-emerald-500/5' : ''}`}
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex min-w-0 items-center gap-2">
                                                <span
                                                    className={`inline-flex shrink-0 rounded-lg border px-2 py-0.5 text-[11px] font-semibold ${acao.classe}`}
                                                >
                                                    {acao.rotulo}
                                                </span>
                                                <span className="truncate text-xs text-muted-foreground">
                                                    {r.modulo}
                                                </span>
                                            </div>
                                            <span className="shrink-0 text-[11px] text-muted-foreground">
                                                {formatarDataHora(r.data)}
                                            </span>
                                        </div>
                                        <p className="text-sm font-semibold break-words text-foreground">
                                            {r.descricao}
                                        </p>
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-xs text-muted-foreground">
                                                por{' '}
                                                {r.usuario ? (
                                                    <span className="font-medium text-foreground">
                                                        {r.usuario}
                                                    </span>
                                                ) : (
                                                    <span className="italic">
                                                        Sistema
                                                    </span>
                                                )}
                                            </span>
                                            {campos.length > 0 && (
                                                <button
                                                    onClick={() =>
                                                        setExpandido(
                                                            aberto
                                                                ? null
                                                                : r.id,
                                                        )
                                                    }
                                                    className="-my-2 inline-flex h-10 items-center gap-1 text-xs font-semibold text-emerald-600"
                                                >
                                                    {campos.length} campo(s)
                                                    <ChevronDown
                                                        className={`size-4 transition-transform ${aberto ? 'rotate-180' : ''}`}
                                                    />
                                                </button>
                                            )}
                                        </div>

                                        {aberto && (
                                            <div className="flex flex-col divide-y divide-border/50 rounded-xl border border-border/70 bg-background">
                                                {campos.map(
                                                    ([campo, { de, para }]) => (
                                                        <div
                                                            key={campo}
                                                            className="flex flex-col gap-0.5 px-3 py-2 text-xs"
                                                        >
                                                            <span className="font-semibold text-foreground">
                                                                {rotuloCampo(
                                                                    campo,
                                                                )}
                                                            </span>
                                                            <span className="break-words">
                                                                {r.acao !==
                                                                    'criou' && (
                                                                    <>
                                                                        <span className="text-red-600/90 line-through decoration-red-500/40">
                                                                            {formatarValor(
                                                                                de,
                                                                            )}
                                                                        </span>
                                                                        <span className="px-1.5 text-muted-foreground">
                                                                            →
                                                                        </span>
                                                                    </>
                                                                )}
                                                                <span className="text-emerald-700 dark:text-emerald-400">
                                                                    {formatarValor(
                                                                        para,
                                                                    )}
                                                                </span>
                                                            </span>
                                                        </div>
                                                    ),
                                                )}
                                                {r.ip && (
                                                    <p className="px-3 py-2 text-[11px] text-muted-foreground">
                                                        IP: {r.ip}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Tabela do log */}
                    <div className="hidden overflow-x-auto lg:block">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border/70 bg-muted/[0.18] text-muted-foreground">
                                    {[
                                        'Data / hora',
                                        'Usuário',
                                        'Ação',
                                        'Módulo',
                                        'Registro',
                                        '',
                                    ].map((titulo, i) => (
                                        <th
                                            key={i}
                                            className="h-11 px-4 text-left text-xs font-bold tracking-wider uppercase"
                                        >
                                            {titulo}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {registros.data.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="h-24 px-4 text-center text-muted-foreground"
                                        >
                                            Nenhuma atividade encontrada.
                                        </td>
                                    </tr>
                                ) : (
                                    registros.data.map((r) => {
                                        const acao = ACOES[r.acao] ?? {
                                            rotulo: r.acao,
                                            classe: 'border-border bg-muted text-muted-foreground',
                                        };
                                        const campos = Object.entries(
                                            r.alteracoes ?? {},
                                        );
                                        const aberto = expandido === r.id;

                                        return (
                                            <Fragment key={r.id}>
                                                <tr
                                                    onClick={() =>
                                                        campos.length > 0 &&
                                                        setExpandido(
                                                            aberto
                                                                ? null
                                                                : r.id,
                                                        )
                                                    }
                                                    className={`border-b border-border/70 transition-colors ${
                                                        campos.length > 0
                                                            ? 'cursor-pointer hover:bg-muted/[0.12]'
                                                            : ''
                                                    } ${aberto ? 'bg-emerald-500/5' : ''}`}
                                                >
                                                    <td className="px-4 py-3.5 whitespace-nowrap text-muted-foreground">
                                                        {formatarDataHora(
                                                            r.data,
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3.5 font-medium">
                                                        {r.usuario ?? (
                                                            <span className="text-muted-foreground/70 italic">
                                                                Sistema
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3.5">
                                                        <span
                                                            className={`inline-flex rounded-lg border px-2.5 py-1 text-xs font-semibold ${acao.classe}`}
                                                        >
                                                            {acao.rotulo}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3.5 text-muted-foreground">
                                                        {r.modulo}
                                                    </td>
                                                    <td className="px-4 py-3.5">
                                                        {r.descricao}
                                                    </td>
                                                    <td className="px-4 py-3.5 text-right">
                                                        {campos.length > 0 && (
                                                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                                                {campos.length}{' '}
                                                                campo(s)
                                                                <ChevronDown
                                                                    className={`size-4 transition-transform ${aberto ? 'rotate-180' : ''}`}
                                                                />
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>

                                                {/* Detalhe "de → para" da linha aberta */}
                                                {aberto && (
                                                    <tr className="border-b border-border/70 bg-muted/[0.08]">
                                                        <td
                                                            colSpan={6}
                                                            className="px-4 py-4"
                                                        >
                                                            <div className="overflow-hidden rounded-xl border border-border/70 bg-background">
                                                                <table className="w-full text-xs">
                                                                    <thead>
                                                                        <tr className="bg-muted/30 text-muted-foreground">
                                                                            <th className="px-3 py-2 text-left font-bold uppercase">
                                                                                Campo
                                                                            </th>
                                                                            {r.acao !==
                                                                                'criou' && (
                                                                                <th className="px-3 py-2 text-left font-bold uppercase">
                                                                                    Antes
                                                                                </th>
                                                                            )}
                                                                            <th className="px-3 py-2 text-left font-bold uppercase">
                                                                                {r.acao ===
                                                                                'criou'
                                                                                    ? 'Valor'
                                                                                    : 'Depois'}
                                                                            </th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {campos.map(
                                                                            ([
                                                                                campo,
                                                                                {
                                                                                    de,
                                                                                    para,
                                                                                },
                                                                            ]) => (
                                                                                <tr
                                                                                    key={
                                                                                        campo
                                                                                    }
                                                                                    className="border-t border-border/50"
                                                                                >
                                                                                    <td className="px-3 py-2 font-semibold">
                                                                                        {rotuloCampo(
                                                                                            campo,
                                                                                        )}
                                                                                    </td>
                                                                                    {r.acao !==
                                                                                        'criou' && (
                                                                                        <td className="px-3 py-2 text-red-600/90 line-through decoration-red-500/40">
                                                                                            {formatarValor(
                                                                                                de,
                                                                                            )}
                                                                                        </td>
                                                                                    )}
                                                                                    <td className="px-3 py-2 text-emerald-700 dark:text-emerald-400">
                                                                                        {formatarValor(
                                                                                            para,
                                                                                        )}
                                                                                    </td>
                                                                                </tr>
                                                                            ),
                                                                        )}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                            {r.ip && (
                                                                <p className="mt-2 text-[11px] text-muted-foreground">
                                                                    IP: {r.ip}
                                                                </p>
                                                            )}
                                                        </td>
                                                    </tr>
                                                )}
                                            </Fragment>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Paginação */}
                    <div className="flex flex-col gap-4 border-t border-border/70 bg-muted/[0.08] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                        <div className="text-xs text-muted-foreground">
                            Mostrando{' '}
                            <span className="font-semibold text-foreground">
                                {registros.from ?? 0}
                            </span>{' '}
                            até{' '}
                            <span className="font-semibold text-foreground">
                                {registros.to ?? 0}
                            </span>{' '}
                            de{' '}
                            <span className="font-semibold text-foreground">
                                {registros.total}
                            </span>{' '}
                            registros
                        </div>
                        <div className="flex items-center gap-2">
                            {[
                                {
                                    url: registros.prev_page_url,
                                    rotulo: 'Anterior',
                                    icone: ChevronLeft,
                                },
                                {
                                    url: registros.next_page_url,
                                    rotulo: 'Próxima',
                                    icone: ChevronRight,
                                },
                            ].map(({ url, rotulo, icone: Icone }) =>
                                url ? (
                                    <Link
                                        key={rotulo}
                                        href={url}
                                        preserveScroll
                                        className="inline-flex h-9 items-center justify-center gap-1 rounded-xl border border-border/70 bg-background px-3.5 text-xs font-medium shadow-sm transition-all hover:border-emerald-500/40 hover:bg-muted/50"
                                    >
                                        {rotulo === 'Anterior' && (
                                            <Icone className="size-3.5" />
                                        )}
                                        {rotulo}
                                        {rotulo === 'Próxima' && (
                                            <Icone className="size-3.5" />
                                        )}
                                    </Link>
                                ) : (
                                    <button
                                        key={rotulo}
                                        disabled
                                        className="inline-flex h-9 items-center justify-center gap-1 rounded-xl border border-border/70 bg-background px-3.5 text-xs font-medium shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        {rotulo === 'Anterior' && (
                                            <Icone className="size-3.5" />
                                        )}
                                        {rotulo}
                                        {rotulo === 'Próxima' && (
                                            <Icone className="size-3.5" />
                                        )}
                                    </button>
                                ),
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
