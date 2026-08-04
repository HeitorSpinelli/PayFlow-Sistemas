export function formatarDataBR(dataString: string): string {
    if (!dataString) return '-';
    
    // Divide a string no 'T' para pegar apenas a parte da data (AAAA-MM-DD)
    const [ano, mes, dia] = dataString.split('T')[0].split('-');
    
    return `${dia}/${mes}/${ano}`;
}