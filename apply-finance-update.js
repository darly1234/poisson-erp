const fs = require('fs');

async function run() {
    try {
        const res = await fetch('http://localhost:3001/api/metadata');
        let meta = await res.json();

        if (!meta.fieldBank) meta.fieldBank = [];
        if (!meta.tabs) meta.tabs = [];

        // Add Negotiators
        if (!meta.fieldBank.find(f => f.id === 'f_negotiators')) {
            meta.fieldBank.push({ id: 'f_negotiators', label: 'Negociadores', type: 'negotiator', isVisible: true, isBI: false });
        }

        // Clean up old upload fields
        const obsoleteUploads = ['f_up_orig', 'f_up_excel', 'f_up_xml', 'f_up_other', 'f_up_terms'];
        meta.fieldBank = meta.fieldBank.filter(f => !obsoleteUploads.includes(f.id));

        // Remove "Uploads e Anexos" tab
        meta.tabs = meta.tabs.filter(t => t.id !== 't4' && t.label.toLowerCase() !== 'uploads e anexos');

        // Clean up fields from all rows just in case
        meta.tabs.forEach(tab => {
            if (tab.rows) {
                tab.rows.forEach(row => {
                    const idx = row.findIndex(c => obsoleteUploads.includes(c.fieldId));
                    if (idx !== -1) row.splice(idx, 1);
                });
                tab.rows = tab.rows.filter(row => row.length > 0);
            }
        });

        // Add negotiators to Financeiro
        const finTab = meta.tabs.find(t => t.label.toLowerCase() === 'financeiro');
        if (finTab) {
            let hasNeg = false;
            finTab.rows.forEach(row => {
                if (row.find(c => c.fieldId === 'f_negotiators')) hasNeg = true;
            });
            if (!hasNeg) {
                finTab.rows.unshift([{ cellId: `cell-migrated-neg-${Date.now()}`, colSpan: 12, fieldId: 'f_negotiators' }]);
            }
        }

        const postRes = await fetch('http://localhost:3001/api/metadata', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fieldBank: meta.fieldBank, tabs: meta.tabs })
        });

        await postRes.json();
        console.log("UPDATE SUCCESS");
    } catch (err) {
        console.error("ERROR:", err);
    }
}
run();
