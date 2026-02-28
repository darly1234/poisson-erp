export const phoneBrazilMask = (value) => {
  if (!value) return "";
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length === 0) return "";
  // Não aplica máscara enquanto for incompleto (menos de 10 dígitos)
  // Isso evita o "pulo" do cursor e dos parênteses ao tentar apagar ou editar o DDD.
  if (d.length < 10) return d; 
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};

export const isValidEmail = (email) => {
  if (!email) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const applyMask = (value, type) => {
  if (!value) return "";
  const numeric = value.replace(/\D/g, "");
  switch (type) {
    case 'phone':
      return numeric.replace(/^(\d{2})(\d{5})(\d{4}).*/, "($1) $2-$3").substring(0, 15);
    case 'isbn':
      return numeric.replace(/^(\d{3})(\d{2})(\d{3})(\d{4})(\d{1}).*/, "$1-$2-$3-$4-$5").substring(0, 17);
    case 'doi':
      return !value.startsWith("10.") ? "10." + value : value;
    case 'currency': {
      const val = numeric.replace(/^0+/, "");
      if (val.length === 0) return "R$ 0,00";
      if (val.length === 1) return "R$ 0,0" + val;
      if (val.length === 2) return "R$ 0," + val;
      const integerPart = val.slice(0, -2).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
      const decimalPart = val.slice(-2);
      return `R$ ${integerPart},${decimalPart}`;
    }
    default:
      return value;
  }
};
