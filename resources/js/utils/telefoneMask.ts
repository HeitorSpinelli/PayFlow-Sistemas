const formatarTelefone = (valor: string) => {
  if (!valor) return "";
  
  // Remove tudo o que não for número
  let num = valor.replace(/\D/g, "");

  // Limita o máximo de caracteres para 11 (DDD + 9 dígitos)
  num = num.substring(0, 11);

  // Aplica a máscara dependendo da quantidade de números
  if (num.length <= 2) {
    return `(${num}`;
  }
  if (num.length <= 6) {
    return `(${num.substring(0, 2)}) ${num.substring(2)}`;
  }
  if (num.length <= 10) {
    // Formato Fixo: (11) 3333-4444
    return `(${num.substring(0, 2)}) ${num.substring(2, 6)}-${num.substring(6)}`;
  }
  // Formato Celular: (11) 99999-5555
  return `(${num.substring(0, 2)}) ${num.substring(2, 7)}-${num.substring(7)}`;
};