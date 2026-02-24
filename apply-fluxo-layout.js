const fs = require('fs');

const DEFAULT_MANDATORY_FIELDS = [
    { id: 'f_title', label: 'Título do Livro', type: 'text', isVisible: true, isBI: true },
    { id: 'f_doi', label: 'DOI', type: 'doi', isVisible: true, isBI: false },
    { id: 'f_isbn', label: 'ISBN', type: 'isbn', isVisible: true, isBI: true },
    { id: 'f_authors', label: 'Autores/Organizadores', type: 'authors', isVisible: true, isBI: false },
    { id: 'f_flow', label: 'Status do Fluxo', type: 'select', isVisible: true, isBI: true, options: ['Para Editar', 'Conferência', 'Enviar Prova', 'Avaliação Autor', 'Alterações', 'Para Publicar', 'Publicado'] },
    { id: 'f_workflow_timeline', label: 'Linha do Tempo Editorial', type: 'workflow', isVisible: true, isBI: false },
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

async function run() {
    try {
        const res = await fetch('http://localhost:3001/api/metadata');
        let meta = await res.json();
        if (!meta.fieldBank) meta.fieldBank = [];
        if (!meta.tabs) meta.tabs = [];

        // Ensure fields exist in fieldBank
        DEFAULT_MANDATORY_FIELDS.forEach(mandField => {
            const idx = meta.fieldBank.findIndex(f => f.id === mandField.id);
            if (idx === -1) {
                meta.fieldBank.push(mandField);
            } else {
                // Force update options for f_flow
                if (mandField.id === 'f_flow') {
                    meta.fieldBank[idx].options = mandField.options;
                }
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

        const removeFromTabs = (fieldId) => {
            meta.tabs.forEach(tab => {
                if (tab.rows) {
                    tab.rows.forEach(row => {
                        const idx = row.findIndex(c => c.fieldId === fieldId);
                        if (idx !== -1) row.splice(idx, 1);
                    });
                    // cleanup empty rows
                    tab.rows = tab.rows.filter(row => row.length > 0);
                }
            });
        };

        // Remove Flow status from anywhere it currently is
        removeFromTabs('f_flow');

        // Mover f_flow e colocar f_workflow_timeline na nova aba Fluxo
        let fluxoTab = meta.tabs.find(t => t.id === 't_fluxo' || t.label.toLowerCase() === 'fluxo');
        if (!fluxoTab) {
            fluxoTab = { id: 't_fluxo', label: 'Fluxo', icon: 'ListOrdered', rows: [] };
            // Inserir antes da aba Financeiro se possível
            const finIdx = meta.tabs.findIndex(t => t.label.toLowerCase() === 'financeiro');
            if (finIdx !== -1) {
                meta.tabs.splice(finIdx, 0, fluxoTab);
            } else {
                meta.tabs.push(fluxoTab);
            }
        }

        if (!hasPlaced('f_flow')) {
            fluxoTab.rows.push([{ cellId: `cell-migrated-1`, colSpan: 12, fieldId: 'f_flow' }]);
        }
        if (!hasPlaced('f_workflow_timeline')) {
            fluxoTab.rows.push([{ cellId: `cell-migrated-2`, colSpan: 12, fieldId: 'f_workflow_timeline' }]);
        }

        const postRes = await fetch('http://localhost:3001/api/metadata', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fieldBank: meta.fieldBank, tabs: meta.tabs })
        });

        await postRes.json();
        console.log("WORKFLOW MIGRATION SUCCESS");
    } catch (err) {
        console.error("ERROR:", err);
    }
}

run();
