/**
 * Aplica máscara de CPF ou CNPJ dinamicamente conforme o usuário digita.
 * CPF: 000.000.000-00 (11 números)
 * CNPJ: 00.000.000/0000-00 (14 números)
 */
export const formataCpfCnpj = (value: string): string => {
  // Remove tudo o que não for número
  const rawValue = value.replace(/\D/g, "");

  // Se for menor ou igual a 11 dígitos, aplica a máscara de CPF
  if (rawValue.length <= 11) {
    return rawValue
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }

  // Se passar de 11 dígitos, muda dinamicamente para a máscara de CNPJ
  return rawValue
    .slice(0, 14) // Garante o limite máximo de 14 números do CNPJ
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
};

/**
 * Remove os pontos, traços e barras para deixar apenas números limpos.
 * Útil para limpar os dados antes de submeter formulários.
 */
export const removeMask = (value: string): string => {
  return value.replace(/\D/g, "");
};