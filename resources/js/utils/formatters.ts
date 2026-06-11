// Retorna o valor ou 'Não informado' se nulo/vazio
export function formatarCampo(valor: string | null | undefined): string {
    return valor || 'Não informado';
}

// Formata cidade e estado, retornando 'Não informado' se algum faltar
export function formatarLocalizacao(cidade: string | null, estado: string | null): string {
    if (!cidade || !estado) return 'Não informado';
    return `${cidade} - ${estado}`;
}