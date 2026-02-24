const fs = require('fs');
const http = require('http');

async function run() {
    try {
        const backupData = fs.readFileSync('C:/poisson-backend/backups/backup_2026-02-22_13-45-27.json', 'utf8');
        const backup = JSON.parse(backupData);

        const fieldBank = [];
        backup.metadata.tabs.forEach(tab => {
            (tab.fields || []).forEach(f => {
                if (!fieldBank.find(exist => exist.id === f.id)) {
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

        // We also need the current metadata because we don't want to overwrite the Layout rows!
        const res = await fetch('http://localhost:3001/api/metadata');
        const currentMeta = await res.json();

        const payload = {
            fieldBank: fieldBank,
            tabs: currentMeta.tabs
        };

        const postRes = await fetch('http://localhost:3001/api/metadata', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await postRes.json();
        console.log("RESTORE SUCCESS:", result);
    } catch (err) {
        console.error("ERROR:", err);
    }
}

run();
