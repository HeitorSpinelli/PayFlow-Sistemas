export type Canal = 'email' | 'whatsapp';

export interface Segurado {
    id: number;
    nome_completo: string;
    email: string;
    celular_whatsapp: string;
    cpf_cnpj: string;
    devedor: boolean;
}