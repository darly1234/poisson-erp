const fs = require('fs');

async function run() {
    try {
        const res = await fetch('http://localhost:3001/api/metadata');
        let meta = await res.json();

        let fluxoTab = meta.tabs.find(t => t.id === 't5' || t.label.toLowerCase() === 'fluxo');

        if (fluxoTab && fluxoTab.rows) {
            let flowCell = null;
            let coverCell = null;

            // Remove both from existing positions
            meta.tabs.forEach(tab => {
                if (tab.rows) {
                    tab.rows.forEach(row => {
                        row.forEach((c, idx) => {
                            if (c.fieldId === 'f_flow') { flowCell = c; row.splice(idx, 1); }
                        });
                        // Recalculate indexes to splice cleanly
                        row.forEach((c, idx) => {
                            if (c.fieldId === 'f_cover') { coverCell = c; row.splice(idx, 1); }
                        });
                    });
                    tab.rows = tab.rows.filter(row => row.length > 0);
                }
            });

            // Fallback if missing
            if (!flowCell) flowCell = { cellId: `cell-flow-${Date.now()}`, fieldId: 'f_flow' };
            if (!coverCell) coverCell = { cellId: `cell-cover-${Date.now()}`, fieldId: 'f_cover' };

            // Mod spans
            flowCell.colSpan = 6;
            coverCell.colSpan = 6;

            // Re-find in mutated array
            fluxoTab = meta.tabs.find(t => t.id === 't5' || t.label.toLowerCase() === 'fluxo');

            // Insert at top as the first row with 2 items
            fluxoTab.rows.unshift([flowCell, coverCell]);
        }

        const postRes = await fetch('http://localhost:3001/api/metadata', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fieldBank: meta.fieldBank, tabs: meta.tabs })
        });

        await postRes.json();
        console.log("SIDE-BY-SIDE LAYOUT MIGRATION SUCCESS");
    } catch (err) {
        console.error("ERROR:", err);
    }
}
run();
