import { formataCpfCnpj } from './cpfMask';

export const formataInputBusca = (valor: string): string => {
    if (!valor) return '';

    // Se o texto contiver qualquer letra, é uma busca por Nome -> não aplica máscara
    const temLetras = /[a-zA-Z]/.test(valor);
    if (temLetras) {
        return valor;
    }

    // Se forem apenas números ou caracteres de máscara, aplica o CPF/CNPJ
    return formataCpfCnpj(valor);
};
