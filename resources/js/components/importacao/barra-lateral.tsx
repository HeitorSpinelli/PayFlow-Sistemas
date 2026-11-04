import {
    Building2,
    CalendarDays,
    ChevronDown,
    Download,
    FileSpreadsheet,
    Rows3,
    Wallet,
} from 'lucide-react';

// Colunas reconhecidas (ImportacaoSeguradosService::NOMES_COLUNAS). O nome
// pode variar ("CPF", "Nº Apólice", "Vencimento"...) sem diferenciar
// maiúsculas ou acentos.
const COLUNAS: { nome: string; exemplo: string; obrigatoria?: boolean }[] = [
    { nome: 'Nome', exemplo: 'Maria da Silva', obrigatoria: true },
    { nome: 'CPF/CNPJ', exemplo: '529.982.247-25', obrigatoria: true },
    { nome: 'Seguradora', exemplo: 'Porto Seguro', obrigatoria: true },
    { nome: 'Ramo', exemplo: 'Carro', obrigatoria: true },
    { nome: 'Número da Apólice', exemplo: 'AP-30291', obrigatoria: true },
    { nome: 'Parcela', exemplo: '1 ou 1/12', obrigatoria: true },
    { nome: 'Valor da Parcela', exemplo: '342,50', obrigatoria: true },
    { nome: 'Vencimento', exemplo: '10/12/2026', obrigatoria: true },
    { nome: 'Status', exemplo: 'Pago / Em aberto' },
    { nome: 'Data do Pagamento', exemplo: '08/12/2026' },
    { nome: 'Forma de Pagamento', exemplo: 'Boleto, Pix…' },
    { nome: 'E-mail', exemplo: 'maria@email.com' },
    { nome: 'Celular', exemplo: '(11) 98765-4321' },
    { nome: 'Início / Fim da Vigência', exemplo: '01/11/2026' },
    { nome: 'Prêmio Total', exemplo: '4.110,00' },
    { nome: 'Total de Parcelas', exemplo: '12' },
    { nome: 'Cobertura', exemplo: '80.000,00' },
    { nome: 'Data de Nascimento', exemplo: '15/03/1985' },
    { nome: 'Endereço, Bairro, Cidade, UF, CEP', exemplo: 'São Paulo · SP' },
];

// Miniatura de planilha no card do modelo (só ilustração).
const MINIATURA = [
    ['Nome', 'Apólice', 'Parcela', 'Valor'],
    ['Maria Silva', 'AP-0001', '1/12', '189,90'],
    ['Maria Silva', 'AP-0001', '2/12', '189,90'],
    ['Comércio Ltda', 'AP-0002', '1', '1.250,00'],
];

/**
 * Coluna lateral da tela Importar: modelo para baixar (GET /importar/modelo),
 * dicas de formato e a lista de colunas aceitas.
 */
export default function BarraLateral({ limiteMb }: { limiteMb: number }) {
    return (
        <div className="flex min-w-0 flex-col gap-4">
            {/* Modelo */}
            <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
                <div className="border-b border-border/70 bg-muted/30 p-4">
                    <div className="overflow-hidden rounded-lg border border-border/70 bg-background text-[10px] shadow-sm">
                        <div className="grid grid-cols-[1.4fr_1fr_0.7fr_0.9fr] border-b border-border/70 bg-emerald-500/10 font-bold text-emerald-700 dark:text-emerald-400">
                            {MINIATURA[0].map((c) => (
                                <span
                                    key={c}
                                    className="truncate border-r border-border/60 px-2 py-1 last:border-r-0"
                                >
                                    {c}
                                </span>
                            ))}
                        </div>
                        {MINIATURA.slice(1).map((linha, i) => (
                            <div
                                key={i}
                                className="grid grid-cols-[1.4fr_1fr_0.7fr_0.9fr] border-b border-border/50 text-muted-foreground last:border-b-0"
                            >
                                {linha.map((c, j) => (
                                    <span
                                        key={j}
                                        className={`truncate border-r border-border/50 px-2 py-1 last:border-r-0 ${j === 3 ? 'text-right tabular-nums' : ''}`}
                                    >
                                        {c}
                                    </span>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
                <div className="p-5">
                    <p className="text-sm font-bold text-foreground">
                        Modelo pronto para preencher
                    </p>
                    <p className="mt-1 mb-4 text-xs leading-relaxed text-muted-foreground">
                        Abre direto no Excel, com exemplos usando as seguradoras
                        e ramos cadastrados no sistema.
                    </p>
                    <a
                        href="/importar/modelo"
                        download
                        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-border/70 bg-background text-sm font-bold text-foreground transition-all hover:border-emerald-500/40 hover:bg-emerald-500/[0.04]"
                    >
                        <Download className="size-4 text-emerald-600" />
                        Baixar modelo
                    </a>
                </div>
            </div>

            {/* Dicas */}
            <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
                <p className="mb-3 text-sm font-bold text-foreground">
                    Antes de enviar
                </p>
                <ul className="flex flex-col gap-3">
                    {[
                        {
                            icone: FileSpreadsheet,
                            texto: `Excel (.xlsx) ou .csv, até ${limiteMb} MB e 5.000 linhas`,
                        },
                        {
                            icone: Rows3,
                            texto: 'Uma linha por parcela — cliente e apólice se repetem',
                        },
                        {
                            icone: CalendarDays,
                            texto: 'Datas como 10/12/2026 e valores como 1.234,56',
                        },
                        {
                            icone: Building2,
                            texto: 'Seguradora e ramo precisam estar cadastrados',
                        },
                        {
                            icone: Wallet,
                            texto: 'Parcela marcada como paga já entra com o pagamento',
                        },
                    ].map(({ icone: Icone, texto }) => (
                        <li
                            key={texto}
                            className="flex items-start gap-3 text-xs leading-relaxed text-muted-foreground"
                        >
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                                <Icone className="size-3.5" />
                            </span>
                            <span className="pt-1">{texto}</span>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Colunas aceitas */}
            <details className="group rounded-2xl border border-border/70 bg-card shadow-sm">
                <summary className="flex cursor-pointer list-none items-center justify-between p-5 text-sm font-bold text-foreground">
                    Colunas aceitas
                    <ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180" />
                </summary>
                <ul className="divide-y divide-border/60 border-t border-border/70">
                    {COLUNAS.map((c) => (
                        <li
                            key={c.nome}
                            className="flex items-center justify-between gap-3 px-5 py-2.5 text-xs"
                        >
                            <span className="flex items-center gap-1.5 font-semibold text-foreground">
                                {c.nome}
                                {c.obrigatoria && (
                                    <span className="rounded bg-emerald-500/10 px-1 py-px text-[9px] font-bold tracking-wide text-emerald-700 uppercase dark:text-emerald-400">
                                        obrigatória
                                    </span>
                                )}
                            </span>
                            <span className="shrink-0 text-right text-muted-foreground">
                                {c.exemplo}
                            </span>
                        </li>
                    ))}
                </ul>
                <p className="border-t border-border/70 px-5 py-3 text-[11px] leading-relaxed text-muted-foreground">
                    O nome da coluna pode variar (CPF, Nº Apólice, Vencimento…)
                    e colunas extras são ignoradas.
                </p>
            </details>
        </div>
    );
}
