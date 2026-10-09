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
 * Aplica máscara de CPF: 000.000.000-00
 * Use quando o tipo de pessoa já é conhecido (pessoa física). Diferente do
 * formataCpfCnpj, não "adivinha" pelo tamanho, então nunca troca de máscara
 * no meio da digitação.
 */
export const formataCpf = (value: string): string => {
    const d = value.replace(/\D/g, '').slice(0, 11);

    if (d.length <= 3) return d;
    if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
    if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
};

/**
 * Aplica máscara de CNPJ: 00.000.000/0000-00
 * Use quando o tipo de pessoa já é conhecido (pessoa jurídica).
 */
export const formataCnpj = (value: string): string => {
    const d = value.replace(/\D/g, '').slice(0, 14);

    if (d.length <= 2) return d;
    if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
    if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
    if (d.length <= 12)
        return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
    return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
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

    // Sem nenhum número sobrando (ex: sobrou só o "(" depois de apagar),
    // devolve vazio — senão o campo nunca conseguia ser limpo.
    if (!num) return '';

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

/**
 * Aplica máscara de telefone fixo: (00) 0000-0000 (máximo 10 números)
 */
export const formatarTelefoneFixo = (valor: string): string => {
    const d = valor.replace(/\D/g, '').slice(0, 10);

    if (!d) return '';
    if (d.length <= 2) return `(${d}`;
    if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
};

export const formatarMoeda = (valor: number) =>
    new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(valor ?? 0);

/**
 * Converte o texto bruto digitado num campo de dinheiro (máscara de
 * centavos: os dígitos entram da direita pra esquerda, como em apps
 * de banco) pro valor numérico decimal que o backend espera.
 * Ex: digitar "2", "20", "200"... até "200000" produz 2000.
 */
export const valorDigitadoParaNumero = (valor: string): number => {
    const digitos = valor.replace(/\D/g, '');
    return digitos ? Number(digitos) / 100 : 0;
};

{
    /*  USAR ESSES IMPORTS NOS MODAIS OU QUALQUER PAGINA QUE REQUERIR FORMATAÇÃO (CASO ADICIONE NOVA FUNÇÃO ADICIONE A MESMA AQUI)
    
    import { 
    aplicarMascaraCEP, 
    formataCpfCnpj,
    formataCpf,
    formataCnpj,
    formatarDataBR, 
    formatarTelefone,
    formatarTelefoneFixo,
    formatarLocalizacao 
} from '@/utils/Masks';

    
*/
}