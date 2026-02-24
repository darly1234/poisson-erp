const fs = require('fs');

async function run() {
    try {
        const res = await fetch('http://localhost:3001/api/metadata');
        let meta = await res.json();

        if (!meta.fieldBank) meta.fieldBank = [];
        if (!meta.tabs) meta.tabs = [];

        // Ensure f_cover exists in fieldBank
        if (!meta.fieldBank.find(f => f.id === 'f_cover')) {
            meta.fieldBank.push({ id: 'f_cover', label: 'Capa da Obra (Frente/Fundo)', type: 'cover', isVisible: true, isBI: false });
        }

        // Ensure ALL title labels in fieldBank say "Título da Obra" instead of "Título" or "Título do Livro"
        const titleIdx = meta.fieldBank.findIndex(f => f.id === 'f_title' || f.id === 'f_title_work');
        if (titleIdx !== -1) {
            meta.fieldBank[titleIdx].label = 'Título da Obra';
        }

        // Get Fluxo tab
        let fluxoTab = meta.tabs.find(t => t.id === 't5' || t.label.toLowerCase() === 'fluxo');

        if (fluxoTab && fluxoTab.rows) {
            // Remove cover if it already exists somewhere
            meta.tabs.forEach(tab => {
                if (tab.rows) {
                    tab.rows.forEach(row => {
                        const idx = row.findIndex(c => c.fieldId === 'f_cover');
                        if (idx !== -1) { row.splice(idx, 1); }
                    });
                    tab.rows = tab.rows.filter(row => row.length > 0);
                }
            });

            // Re-find fluxoTab as rows might have been mutated
            fluxoTab = meta.tabs.find(t => t.id === 't5' || t.label.toLowerCase() === 'fluxo');

            // In Fluxo tab, find f_flow. Put f_cover right next to it in a new row or same row.
            // Best is to insert it at the very top, before the workflow timeline.
            fluxoTab.rows.unshift([{ cellId: `cell-cover-${Date.now()}`, colSpan: 12, fieldId: 'f_cover' }]);
        }

        const postRes = await fetch('http://localhost:3001/api/metadata', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fieldBank: meta.fieldBank, tabs: meta.tabs })
        });

        await postRes.json();
        console.log("COVER FIELD MIGRATION SUCCESS");
    } catch (err) {
        console.error("ERROR:", err);
    }
}
run();
