const fs = require('fs');

async function run() {
    try {
        const res = await fetch('http://localhost:3001/api/metadata');
        let meta = await res.json();

        if (!meta.fieldBank) meta.fieldBank = [];
        if (!meta.tabs) meta.tabs = [];

        // Remove f_installments completely from fieldBank
        meta.fieldBank = meta.fieldBank.filter(f => f.id !== 'f_installments');

        // Update f_payment_status in fieldBank
        const payStatusIdx = meta.fieldBank.findIndex(f => f.id === 'f_payment_status');
        if (payStatusIdx !== -1) {
            meta.fieldBank[payStatusIdx].type = 'payment_status';
            delete meta.fieldBank[payStatusIdx].options;
        }

        // Remove f_installments from all layouts
        meta.tabs.forEach(tab => {
            if (tab.rows) {
                tab.rows.forEach(row => {
                    const idx = row.findIndex(c => c.fieldId === 'f_installments');
                    if (idx !== -1) row.splice(idx, 1);
                });
                tab.rows = tab.rows.filter(row => row.length > 0);
            }
        });

        // Pushing updates
        const postRes = await fetch('http://localhost:3001/api/metadata', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fieldBank: meta.fieldBank, tabs: meta.tabs })
        });

        await postRes.json();
        console.log("PAYMENT STATUS MIGRATION SUCCESS");
    } catch (err) {
        console.error("ERROR:", err);
    }
}
run();
