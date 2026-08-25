export type Canal = 'email' | 'whatsapp';

export interface Segurado {
    id: number;
    nome_completo: string;
    email: string;
    celular_whatsapp: string;
    cpf_cnpj: string;
    devedor: boolean;
}
export interface Automacao {
    id: number;
    tipo_condicao: string;
    dias: number;
    canal: string;
    mensagem: string;
    ativo: boolean;
    tipo_notificacao: { nome_notificacao: string } | null;
}