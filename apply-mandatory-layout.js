const fs = require('fs');

const DEFAULT_MANDATORY_FIELDS = [
    { id: 'f_title', label: 'Título do Livro', type: 'text', isVisible: true, isBI: true },
    { id: 'f_doi', label: 'DOI', type: 'doi', isVisible: true, isBI: false },
    { id: 'f_isbn', label: 'ISBN', type: 'isbn', isVisible: true, isBI: true },
    { id: 'f_authors', label: 'Autores/Organizadores', type: 'authors', isVisible: true, isBI: false },
    { id: 'f_flow', label: 'Status do Fluxo', type: 'select', isVisible: true, isBI: true, options: ['Para Editar', 'Conferência', 'Enviar Prova', 'Avaliação Autor', 'Alterações', 'Para Publicar', 'Publicado'] },
    { id: 'f_payment_method', label: 'Forma de Pagamento', type: 'select', isVisible: true, isBI: true, options: ['À vista', 'Parcelado', 'Cortesia', 'Permuta'] },
    { id: 'f_payment_status', label: 'Status do Pagamento', type: 'select', isVisible: true, isBI: true, options: ['Em aberto', 'Pago', 'Cortesia', 'Parcelado'] },
    { id: 'f_installments', label: 'Parcelas', type: 'installments', isVisible: true, isBI: false },
    { id: 'f_total', label: 'Valor Total do Livro', type: 'currency', isVisible: true, isBI: true },
    { id: 'f_commission', label: 'Valor da Comissão', type: 'currency', isVisible: true, isBI: true },
    { id: 'f_comm_status', label: 'Status Pgto Comissão', type: 'select', isVisible: true, isBI: true, options: ['Pendente', 'Pago'] },
    { id: 'f_comm_date', label: 'Data Pgto Comissão', type: 'text', isVisible: true, isBI: false },
    { id: 'f_comm_receipt', label: 'Comprovante de Pgto Comissão', type: 'file', isVisible: true, isBI: false },
    { id: 'f_client_cat', label: 'Categoria do Cliente', type: 'select', isVisible: true, isBI: true, options: ['Poisson', 'Fametro', 'UFAM', 'Santa Tereza'] },
    { id: 'f_obs', label: 'Observações', type: 'long_text', isVisible: true, isBI: false },
    { id: 'f_up_orig', label: 'Upload de Original', type: 'file', isVisible: true, isBI: false },
    { id: 'f_up_excel', label: 'Upload de Excel de Autores', type: 'file', isVisible: true, isBI: false },
    { id: 'f_up_xml', label: 'Upload de XML', type: 'file', isVisible: true, isBI: false },
    { id: 'f_up_other', label: 'Upload Arquivos Diversos', type: 'file', isVisible: true, isBI: false },
    { id: 'f_up_terms', label: 'Upload Termos de Cessão', type: 'file', isVisible: true, isBI: false },
];

const producaoIds = ['f_title', 'f_doi', 'f_isbn', 'f_authors', 'f_flow', 'f_obs'];
const financeiroIds = ['f_payment_method', 'f_payment_status', 'f_installments', 'f_total', 'f_client_cat', 'f_commission', 'f_comm_status', 'f_comm_date', 'f_comm_receipt'];
const uploadsIds = ['f_up_orig', 'f_up_excel', 'f_up_xml', 'f_up_other', 'f_up_terms'];

async function run() {
    try {
        const res = await fetch('http://localhost:3001/api/metadata');
        let meta = await res.json();
        if (!meta.fieldBank) meta.fieldBank = [];
        if (!meta.tabs) meta.tabs = [];

        // Ensure fields exist in fieldBank
        DEFAULT_MANDATORY_FIELDS.forEach(mandField => {
            if (!meta.fieldBank.find(f => f.id === mandField.id)) {
                meta.fieldBank.push(mandField);
            }
        });

        const hasPlaced = (fieldId) => {
            for (const tab of meta.tabs) {
                for (const row of tab.rows || []) {
                    for (const cell of row) {
                        if (cell.fieldId === fieldId) return true;
                    }
                }
            }
            return false;
        };

        const placeInTab = (tabId, tabLabel, fieldIds) => {
            let targetTab = meta.tabs.find(t => t.id === tabId || t.label.toLowerCase() === tabLabel.toLowerCase());
            if (!targetTab) {
                targetTab = { id: tabId, label: tabLabel, icon: 'Info', rows: [] };
                meta.tabs.push(targetTab);
            }

            const missingIds = fieldIds.filter(id => !hasPlaced(id));
            if (missingIds.length > 0) {
                missingIds.forEach(id => {
                    const cell = {
                        cellId: `cell-migrated-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
                        colSpan: id === 'f_authors' || id === 'f_installments' || id === 'f_obs' || id.startsWith('f_up_') ? 12 : 6,
                        fieldId: id
                    };
                    targetTab.rows.push([cell]);
                });
            }
        };

        placeInTab('t2', 'Produção', producaoIds);
        placeInTab('t3', 'Financeiro', financeiroIds);
        placeInTab('t4', 'Uploads e Anexos', uploadsIds);

        const postRes = await fetch('http://localhost:3001/api/metadata', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fieldBank: meta.fieldBank, tabs: meta.tabs })
        });

        const result = await postRes.json();
        console.log("SCHEMA MIGRATION SUCCESS");
    } catch (err) {
        console.error("ERROR:", err);
    }
}

run();
