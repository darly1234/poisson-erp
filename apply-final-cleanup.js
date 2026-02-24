const fs = require('fs');

async function run() {
    try {
        const res = await fetch('http://localhost:3001/api/metadata');
        let meta = await res.json();

        if (!meta.fieldBank) meta.fieldBank = [];
        if (!meta.tabs) meta.tabs = [];

        // Ensure f_obs exists
        if (!meta.fieldBank.find(f => f.id === 'f_obs')) {
            meta.fieldBank.push({ id: 'f_obs', label: 'Observações Gerais', type: 'long_text', isVisible: true, isBI: false });
        } else {
            // Update its label to be clearer if it was just "Observações"
            const obsIdx = meta.fieldBank.findIndex(f => f.id === 'f_obs');
            meta.fieldBank[obsIdx].label = 'Observações Gerais';
            meta.fieldBank[obsIdx].type = 'long_text';
        }

        // Get Principal tab or create it
        let principalTab = meta.tabs.find(t => t.id === 't1' || t.label.toLowerCase() === 'principal');
        if (!principalTab && meta.tabs.length > 0) principalTab = meta.tabs[0]; // fallback

        // Get Financeiro tab
        let financeiroTab = meta.tabs.find(t => t.label.toLowerCase() === 'financeiro');

        // Find Administrativo and Produção tabs
        const tabsToRemove = meta.tabs.filter(t =>
            t.label.toLowerCase() === 'administrativo' ||
            t.label.toLowerCase() === 'produção'
        );

        // Move their fields to Principal
        if (principalTab) {
            tabsToRemove.forEach(tabToKill => {
                if (tabToKill.rows) {
                    tabToKill.rows.forEach(row => {
                        // Push entire row to Principal to save the fields
                        // Only if the field is not already in Principal
                        row.forEach(cell => {
                            let alreadyInPrincipal = false;
                            principalTab.rows.forEach(pRow => {
                                if (pRow.find(c => c.fieldId === cell.fieldId)) alreadyInPrincipal = true;
                            });

                            if (!alreadyInPrincipal && cell.fieldId !== 'empty') {
                                principalTab.rows.push([{ cellId: `cell-rescued-${Date.now()}-${Math.random()}`, colSpan: 12, fieldId: cell.fieldId }]);
                            }
                        });
                    });
                }
            });
        }

        // Exclude the removed tabs from the main array
        meta.tabs = meta.tabs.filter(t =>
            t.label.toLowerCase() !== 'administrativo' &&
            t.label.toLowerCase() !== 'produção'
        );

        // Remove f_obs from wherever it is currently
        meta.tabs.forEach(tab => {
            if (tab.rows) {
                tab.rows.forEach(row => {
                    const idx = row.findIndex(c => c.fieldId === 'f_obs');
                    if (idx !== -1) row.splice(idx, 1);
                });
                tab.rows = tab.rows.filter(row => row.length > 0);
            }
        });

        // Insert f_obs into Financeiro Tab
        if (financeiroTab) {
            // Check if f_obs is already there (safeguard)
            let hasObs = false;
            financeiroTab.rows.forEach(row => {
                if (row.find(c => c.fieldId === 'f_obs')) hasObs = true;
            });

            if (!hasObs) {
                financeiroTab.rows.push([{ cellId: `cell-fin-obs-${Date.now()}`, colSpan: 12, fieldId: 'f_obs' }]);
            }
        }

        const postRes = await fetch('http://localhost:3001/api/metadata', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fieldBank: meta.fieldBank, tabs: meta.tabs })
        });

        await postRes.json();
        console.log("FINAL CLEANUP MIGRATION SUCCESS");
    } catch (err) {
        console.error("ERROR:", err);
    }
}
run();
