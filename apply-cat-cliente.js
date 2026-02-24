const fs = require('fs');

async function run() {
    try {
        const res = await fetch('http://localhost:3001/api/metadata');
        let meta = await res.json();

        if (!meta.fieldBank) meta.fieldBank = [];
        if (!meta.tabs) meta.tabs = [];

        let finTab = meta.tabs.find(t => t.label.toLowerCase() === 'financeiro');

        // Remove 'f_client_cat' from all tabs
        meta.tabs.forEach(tab => {
            if (tab.rows) {
                tab.rows.forEach(row => {
                    const idx = row.findIndex(c => c.fieldId === 'f_client_cat');
                    if (idx !== -1) row.splice(idx, 1);
                });
                tab.rows = tab.rows.filter(row => row.length > 0);
            }
        });

        // Insert at the top of Financeiro
        if (finTab) {
            finTab.rows.unshift([{ cellId: `cell-fin-cat-${Date.now()}`, colSpan: 12, fieldId: 'f_client_cat' }]);
        }

        const postRes = await fetch('http://localhost:3001/api/metadata', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fieldBank: meta.fieldBank, tabs: meta.tabs })
        });

        await postRes.json();
        console.log("CLIENT CAT MIGRATION SUCCESS");
    } catch (err) {
        console.error("ERROR:", err);
    }
}
run();
