// src/utils/masks.ts

/**
 * Aplica máscara de CEP: 00000-000
 */
export const aplicarMascaraCEP = (valor: string): string => {
    return valor
        .replace(/\D/g, '')
        .substring(0, 8)
        .replace(/(\d{5})(\d)/, '$1-$2');
};

/**
 * Aplica máscara de CPF ou CNPJ dinamicamente conforme o usuário digita.
 * CPF: 000.000.000-00 (11 números)
 * CNPJ: 00.000.000/0000-00 (14 números)
 */
export const formataCpfCnpj = (value: string): string => {
    const rawValue = value.replace(/\D/g, '');

    if (rawValue.length <= 11) {
        return rawValue
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }

    return rawValue
        .slice(0, 14)
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2');
};

/**
 * Remove os pontos, traços e barras para deixar apenas números limpos.
 */
export const removeMask = (value: string): string => {
    return value.replace(/\D/g, '');
};

/**
 * Formata string de data para o padrão brasileiro (DD/MM/AAAA)
 */
export function formatarDataBR(dataString: string): string {
    if (!dataString) return '-';

    const [ano, mes, dia] = dataString.split('T')[0].split('-');
    return `${dia}/${mes}/${ano}`;
}

/**
 * Retorna o valor ou 'Não informado' se nulo/vazio
 */
export function formatarCampo(valor: string | null | undefined): string {
    return valor || 'Não informado';
}

/**
 * Formata cidade e estado, retornando 'Não informado' se algum faltar
 */
export function formatarLocalizacao(
    cidade: string | null,
    estado: string | null,
): string {
    if (!cidade || !estado) return 'Não informado';
    return `${cidade} - ${estado}`;
}

/**
 * Formata input de busca aplicando CPF/CNPJ se forem apenas números
 */
export const formataInputBusca = (valor: string): string => {
    if (!valor) return '';

    const temLetras = /[a-zA-Z]/.test(valor);
    if (temLetras) {
        return valor;
    }

    return formataCpfCnpj(valor);
};

/**
 * Aplica máscara de telefone fixo ou celular dinamicamente
 */
export const formatarTelefone = (valor: string): string => {
    if (!valor) return '';

    let num = valor.replace(/\D/g, '');
    num = num.substring(0, 11);

    if (num.length <= 2) {
        return `(${num}`;
    }
    if (num.length <= 6) {
        return `(${num.substring(0, 2)}) ${num.substring(2)}`;
    }
    if (num.length <= 10) {
        return `(${num.substring(0, 2)}) ${num.substring(2, 6)}-${num.substring(6)}`;
    }
    return `(${num.substring(0, 2)}) ${num.substring(2, 7)}-${num.substring(7)}`;
};
export const formatarMoeda = (valor: number) =>
    new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(valor ?? 0);

{
    /*  USAR ESSES IMPORTS NOS MODAIS OU QUALQUER PAGINA QUE REQUERIR FORMATAÇÃO (CASO ADICIONE NOVA FUNÇÃO ADICIONE A MESMA AQUI)
    
    import { 
    aplicarMascaraCEP, 
    formataCpfCnpj, 
    formatarDataBR, 
    formatarTelefone, 
    formatarLocalizacao 
} from '@/utils/Masks';

    
*/
}
