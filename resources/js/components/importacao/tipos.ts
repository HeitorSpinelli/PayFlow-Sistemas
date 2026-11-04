// Tipos e utilitários da tela Importar (pages/FunctionsApp/importar.tsx).

// inicial: zona de upload · verificando: prévia sendo calculada ·
// previa: resultado da verificação, aguardando "Importar" ·
// importando: envio/gravação · resultado: importação concluída (ou falhou).
export type Fase =
    'inicial' | 'verificando' | 'previa' | 'importando' | 'resultado';

export interface Mensagem {
    linha: number | null;
    mensagem: string;
}

export interface Contagem {
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
export interface Resumo {
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

// Tamanho legível ("12.3 KB").
export function formatarTamanho(bytes: number) {
    if (bytes < 1024) {
        return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// "1 linha" / "3 linhas", com separador de milhar.
export const plural = (n: number, singular: string, pluralTexto: string) =>
    `${n.toLocaleString('pt-BR')} ${n === 1 ? singular : pluralTexto}`;

// Baixa a lista de problemas/avisos como CSV (abre no Excel), para corrigir
// a planilha linha a linha.
export function baixarMensagens(nomeArquivo: string, mensagens: Mensagem[]) {
    const linhas = [
        'Linha;Mensagem',
        ...mensagens.map(
            (m) => `${m.linha ?? 'Geral'};"${m.mensagem.replace(/"/g, '""')}"`,
        ),
    ];
    // BOM UTF-8 no início: sem ele o Excel abre o CSV com os acentos errados.
    const blob = new Blob([String.fromCharCode(0xfeff) + linhas.join('\r\n')], {
        type: 'text/csv;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = nomeArquivo;
    link.click();
    URL.revokeObjectURL(url);
}
