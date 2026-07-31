export const mascaraData = (value: string): string => {
    return value
        .replace(/\D/g, '') // 1. Remove tudo que não é número
        .replace(/(\d{2})(\d)/, '$1/$2') // 2. Coloca a primeira barra após 2 dígitos (DD/)
        .replace(/(\d{2})(\d)/, '$1/$2') // 3. Coloca a segunda barra após mais 2 dígitos (DD/MM/)
        .replace(/(\d{4})\d+?$/, '$1'); // 4. Limita o ano a 4 dígitos (DD/MM/AAAA)
};