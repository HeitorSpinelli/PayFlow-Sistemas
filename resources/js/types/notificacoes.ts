export type Canal = 'email' | 'whatsapp';

// Situação real da parcela de referência, calculada no backend a partir da
// data de vencimento (NotificacaoService::resumoParcelaCobranca) — é o que
// decide se a mensagem gerada é um aviso de vencimento ou de atraso.
export type SituacaoParcela = 'atrasada' | 'a_vencer';

export interface ParcelaCobranca {
    apolice_numero: string;
    numero_parcela: number | null;
    quantidade_parcelas: number | null;
    valor_parcela: number;
    valor_atualizado: number;
    data_vencimento: string;
    situacao: SituacaoParcela;
    dias: number;
}

export interface Segurado {
    id: number;
    nome_completo: string;
    email: string;
    celular_whatsapp: string;
    cpf_cnpj: string;
    devedor: boolean;
    // Parcela em aberto mais relevante do cliente (atrasada, ou a próxima a
    // vencer); null quando não há nenhuma parcela pendente.
    parcela_cobranca: ParcelaCobranca | null;
}
export interface Automacao {
    id: number;
    tipo_condicao: string;
    dias: number;
    intervalo_dias: number | null;
    canal: string;
    mensagem: string;
    ativo: boolean;
    tipo_notificacao: { nome_notificacao: string } | null;
}
