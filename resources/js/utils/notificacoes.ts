// Monta o texto padrão da notificação de cobrança/lembrete a partir dos
// dados reais da parcela mais relevante do cliente (ver
// NotificacaoService::resumoParcelaCobranca no backend) — nunca texto
// solto. O tipo de mensagem (aviso de vencimento x aviso de atraso) sai
// direto da situação real da parcela, não de uma escolha manual.
import type { ParcelaCobranca } from '@/types/notificacoes';
import { formatarDataBR, formatarMoeda } from '@/utils/Masks';

const NOME_EMPRESA = 'PayFlow-Sistemas';

function primeiroNome(nomeCompleto: string): string {
    return nomeCompleto?.trim().split(/\s+/)[0] ?? '';
}

function prazoEmPalavras(dias: number): string {
    if (dias <= 0) {
        return 'hoje';
    }

    if (dias === 1) {
        return 'amanhã';
    }

    return `em ${dias} dias`;
}

function labelParcela(parcela: ParcelaCobranca): string {
    return parcela.quantidade_parcelas
        ? `${parcela.numero_parcela}/${parcela.quantidade_parcelas}`
        : `${parcela.numero_parcela ?? ''}`;
}

/**
 * Mensagem de aviso de ATRASO: inclui o valor já atualizado (multa + juros,
 * calculados pelo backend) sempre que ele for maior que o valor original —
 * é o mesmo cálculo usado na tela de Pagamentos, então o valor cobrado aqui
 * bate com o que o cliente realmente pagaria se regularizasse hoje.
 */
function mensagemAtraso(nome: string, parcela: ParcelaCobranca): string {
    const valor = formatarMoeda(parcela.valor_parcela);
    const vencimento = formatarDataBR(parcela.data_vencimento);
    const temAcrescimo = parcela.valor_atualizado > parcela.valor_parcela;

    return (
        `Olá, ${nome}! Aqui é da ${NOME_EMPRESA}.\n\n` +
        `Identificamos que a parcela ${labelParcela(parcela)} da apólice ${parcela.apolice_numero}, no valor de R$ ${valor}, venceu em ${vencimento} e está com ${parcela.dias} dia(s) de atraso.` +
        (temAcrescimo
            ? ` Com multa e juros, o valor atualizado para pagamento hoje é de R$ ${formatarMoeda(parcela.valor_atualizado)}.`
            : '') +
        `\n\nPara evitar a suspensão da sua apólice, regularize o pagamento o quanto antes. Qualquer dúvida, estamos à disposição!`
    );
}

/**
 * Mensagem de aviso de VENCIMENTO PRÓXIMO (parcela ainda não atrasada).
 */
function mensagemAVencer(nome: string, parcela: ParcelaCobranca): string {
    const valor = formatarMoeda(parcela.valor_parcela);
    const vencimento = formatarDataBR(parcela.data_vencimento);

    return (
        `Olá, ${nome}! Aqui é da ${NOME_EMPRESA}.\n\n` +
        `Passando para lembrar que a parcela ${labelParcela(parcela)} da apólice ${parcela.apolice_numero}, no valor de R$ ${valor}, vence ${prazoEmPalavras(parcela.dias)} (${vencimento}).` +
        `\n\nQualquer dúvida, estamos à disposição!`
    );
}

/**
 * Texto completo sugerido para a notificação (WhatsApp ou e-mail) de um
 * cliente — o operador pode editar livremente antes de enviar.
 */
export function montarMensagemNotificacao(
    nomeCompleto: string,
    parcela: ParcelaCobranca | null,
): string {
    const nome = primeiroNome(nomeCompleto);

    if (!parcela) {
        return `Olá, ${nome}! Aqui é da ${NOME_EMPRESA}. Passando para falar sobre sua apólice. Qualquer dúvida, estamos à disposição!`;
    }

    return parcela.situacao === 'atrasada'
        ? mensagemAtraso(nome, parcela)
        : mensagemAVencer(nome, parcela);
}

/**
 * Rótulo curto para o selo de situação da parcela (ex: "Atrasada · 5d").
 */
export function rotuloSituacaoParcela(parcela: ParcelaCobranca | null): string {
    if (!parcela) {
        return 'Sem parcela em aberto';
    }

    if (parcela.situacao === 'atrasada') {
        return `Atrasada · ${parcela.dias}d`;
    }

    if (parcela.dias === 0) {
        return 'Vence hoje';
    }

    if (parcela.dias === 1) {
        return 'Vence amanhã';
    }

    return `Vence em ${parcela.dias}d`;
}
