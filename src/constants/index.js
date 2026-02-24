export const poppinsStyle = `
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap');
  * { font-family: 'Poppins', sans-serif !important; }
  .scrollbar-thin::-webkit-scrollbar { width: 6px; height: 6px; }
  .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
  .scrollbar-thin::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
  .scrollbar-thin::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
  @keyframes slideIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-slide { animation: slideIn 0.3s ease-out forwards; }
  input, textarea, select {
    user-select: text !important;
    -webkit-user-select: text !important;
    -moz-user-select: text !important;
    -ms-user-select: text !important;
    cursor: text !important;
  }
`;

export const COLORS = ['#1F2A8A', '#3B82F6', '#F59E0B', '#10B981', '#EF4444', '#8B5CF6'];

export const FIELD_TYPES = [
  { id: 'text', label: 'Texto Simples' },
  { id: 'long_text', label: 'Texto Longo' },
  { id: 'number', label: 'Numérico' },
  { id: 'currency', label: 'Moeda (R$)' },
  { id: 'select', label: 'Seleção (Dropdown)' },
  { id: 'phone', label: 'Telefone' },
  { id: 'isbn', label: 'ISBN' },
  { id: 'doi', label: 'DOI' },
  { id: 'file', label: 'Upload de Arquivos' },
  { id: 'authors', label: 'Autores/Organizadores' },
  { id: 'negotiator', label: 'Negociadores' },
  { id: 'payment_status', label: 'Status de Pagamento (Avançado)' },
  { id: 'workflow', label: 'Fluxo (Linha do Tempo)' },
  { id: 'cover', label: 'Capa da Obra (Frente/Fundo)' }
];

export const TEXT_OPERATORS = [
  { id: 'contains', label: 'Contém' },
  { id: 'not_contains', label: 'Não contém' },
  { id: 'equals', label: 'Igual a' },
  { id: 'not_equals', label: 'Diferente de' },
  { id: 'starts', label: 'Começa com' },
  { id: 'ends', label: 'Termina com' },
  { id: 'is_empty', label: 'Está vazio' },
  { id: 'is_not_empty', label: 'Não está vazio' }
];

export const NUMERIC_OPERATORS = [
  { id: 'equals', label: 'Igual a' },
  { id: 'not_equals', label: 'Diferente de' },
  { id: 'greater_than', label: 'Maior que' },
  { id: 'greater_equal', label: 'Maior ou igual a' },
  { id: 'less_than', label: 'Menor que' },
  { id: 'less_equal', label: 'Menor ou igual a' },
  { id: 'between', label: 'Está entre' },
  { id: 'is_empty', label: 'Está vazio' },
  { id: 'is_not_empty', label: 'Não está vazio' }
];
