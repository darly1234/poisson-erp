const COL_SPAN_OPTIONS = [
  { value: 3, label: '25%' },
  { value: 4, label: '33%' },
  { value: 6, label: '50%' },
  { value: 8, label: '67%' },
  { value: 9, label: '75%' },
  { value: 12, label: '100%' }
];

export { COL_SPAN_OPTIONS };

export const isLegacyMetadata = (meta) => {
  if (!meta?.tabs?.length) return false;
  if (meta.fieldBank) return false;
  const first = meta.tabs[0];
  return Array.isArray(first.fields) && !Array.isArray(first.rows);
};

export const migrateToLayoutFormat = (meta) => {
  if (!meta?.tabs?.length) {
    return {
      fieldBank: [],
      tabs: [{ id: 't1', label: 'Principal', icon: 'Info', rows: [[]] }]
    };
  }
  if (!isLegacyMetadata(meta)) return meta;

  const fieldBank = [];
  const seen = new Set();

  meta.tabs.forEach((tab) => {
    (tab.fields || []).forEach((f) => {
      if (!seen.has(f.id)) {
        seen.add(f.id);
        fieldBank.push({
          id: f.id,
          label: f.label || 'Campo',
          type: f.type || 'text',
          isVisible: f.isVisible !== false,
          isBI: !!f.isBI,
          options: f.options || []
        });
      }
    });
  });

  const genCellId = () => `cell-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const tabs = meta.tabs.map((tab) => ({
    id: tab.id,
    label: tab.label || 'Nova Aba',
    icon: tab.icon?.displayName || tab.icon || 'Info',
    rows: (tab.fields || []).length > 0
      ? [(tab.fields || []).map((f) => ({ cellId: genCellId(), fieldId: f.id, colSpan: 12 }))]
      : [[]]
  }));

  return { fieldBank, tabs };
};

export const DEFAULT_MANDATORY_FIELDS = [
  { id: 'f_title', label: 'Título da Obra', type: 'text', isVisible: true, isBI: true },
  { id: 'f_doi', label: 'DOI', type: 'doi', isVisible: true, isBI: false },
  { id: 'f_isbn', label: 'ISBN', type: 'isbn', isVisible: true, isBI: true },
  { id: 'f_authors', label: 'Autores/Organizadores', type: 'authors', isVisible: true, isBI: false },
  { id: 'f_flow', label: 'Status do Fluxo', type: 'select', isVisible: true, isBI: true, options: ['Para Editar', 'Conferência', 'Enviar Prova', 'Avaliação Autor', 'Alterações', 'Para Publicar', 'Publicado'] },
  { id: 'f_workflow_timeline', label: 'Linha do Tempo Editorial', type: 'workflow', isVisible: true, isBI: false },
  { id: 'f_payment_method', label: 'Forma de Pagamento', type: 'select', isVisible: true, isBI: true, options: ['À vista', 'Parcelado', 'Cortesia', 'Permuta'] },
  { id: 'f_payment_status', label: 'Status do Pagamento', type: 'payment_status', isVisible: true, isBI: true },
  { id: 'f_total', label: 'Valor Total do Livro', type: 'currency', isVisible: true, isBI: true },
  { id: 'f_commission', label: 'Valor da Comissão', type: 'currency', isVisible: true, isBI: true },
  { id: 'f_comm_status', label: 'Status Pgto Comissão', type: 'select', isVisible: true, isBI: true, options: ['Pendente', 'Pago'] },
  { id: 'f_comm_date', label: 'Data Pgto Comissão', type: 'text', isVisible: true, isBI: false },
  { id: 'f_comm_receipt', label: 'Comprovante de Pgto Comissão', type: 'file', isVisible: true, isBI: false },
  { id: 'f_client_cat', label: 'Categoria do Cliente', type: 'select', isVisible: true, isBI: true, options: ['Poisson', 'Fametro', 'UFAM', 'Santa Tereza'] },
  { id: 'f_obs', label: 'Observações', type: 'long_text', isVisible: true, isBI: false },
  { id: 'f_negotiators', label: 'Negociadores', type: 'negotiator', isVisible: true, isBI: false }
];

export const injectMandatoryFields = (meta) => {
  const currentBank = meta.fieldBank || [];
  const newBank = [...currentBank];
  let fieldsAdded = false;

  DEFAULT_MANDATORY_FIELDS.forEach(mandField => {
    if (!newBank.find(f => f.id === mandField.id)) {
      newBank.push(mandField);
      fieldsAdded = true;
    }
  });

  return { ...meta, fieldBank: newBank };
};

export const normalizeMetadata = (meta) => {
  if (!meta) return injectMandatoryFields({ fieldBank: [], tabs: [{ id: 't1', label: 'Principal', icon: 'Info', rows: [[]] }] });
  const migrated = isLegacyMetadata(meta) ? migrateToLayoutFormat(meta) : { ...meta };
  return injectMandatoryFields(migrated);
};
