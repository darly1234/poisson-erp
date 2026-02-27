const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');
const conn = new Client();

// Arquivos a serem sincronizados
const syncList = [
    // Backend
    { local: 'c:/poisson-backend/src/routes/files.js', remote: '/var/www/poisson-backend/src/routes/files.js' },
    { local: 'c:/poisson-backend/src/routes/auth.js', remote: '/var/www/poisson-backend/src/routes/auth.js' },
    { local: 'c:/poisson-backend/src/routes/webhooks.js', remote: '/var/www/poisson-backend/src/routes/webhooks.js' },
    { local: 'c:/poisson-backend/.env', remote: '/var/www/poisson-backend/.env' },

    // Frontend (exige rebuild)
    { local: 'c:/poisson-erp/src/services/api.js', remote: '/var/www/poisson-erp/src/services/api.js' },
    { local: 'c:/poisson-erp/src/App.jsx', remote: '/var/www/poisson-erp/src/App.jsx' },
    { local: 'c:/poisson-erp/src/components/layout/Sidebar.jsx', remote: '/var/www/poisson-erp/src/components/layout/Sidebar.jsx' },
    { local: 'c:/poisson-erp/src/components/layout/AppHeader.jsx', remote: '/var/www/poisson-erp/src/components/layout/AppHeader.jsx' },
    { local: 'c:/poisson-erp/src/views/ListView.jsx', remote: '/var/www/poisson-erp/src/views/ListView.jsx' },
    { local: 'c:/poisson-erp/src/views/DetailView.jsx', remote: '/var/www/poisson-erp/src/views/DetailView.jsx' },
    { local: 'c:/poisson-erp/src/views/ConfigView.jsx', remote: '/var/www/poisson-erp/src/views/ConfigView.jsx' },
    { local: 'c:/poisson-erp/src/views/FilterView.jsx', remote: '/var/www/poisson-erp/src/views/FilterView.jsx' },
    { local: 'c:/poisson-erp/src/views/DashboardView.jsx', remote: '/var/www/poisson-erp/src/views/DashboardView.jsx' },
    { local: 'c:/poisson-erp/src/components/list/RecordsTable.jsx', remote: '/var/www/poisson-erp/src/components/list/RecordsTable.jsx' },
    { local: 'c:/poisson-erp/src/components/MessagingTab.jsx', remote: '/var/www/poisson-erp/src/components/MessagingTab.jsx' },
    { local: 'c:/poisson-erp/src/components/BookPipeline.jsx', remote: '/var/www/poisson-erp/src/components/BookPipeline.jsx' },
    { local: 'c:/poisson-erp/src/components/crossref/CrossrefTab.jsx', remote: '/var/www/poisson-erp/src/components/crossref/CrossrefTab.jsx' }
];

conn.on('ready', () => {
    console.log('SSH Connection Ready');

    conn.sftp((err, sftp) => {
        if (err) {
            console.error('SFTP Error:', err);
            conn.end();
            return;
        }

        let syncIndex = 0;

        function uploadNext() {
            if (syncIndex >= syncList.length) {
                console.log('All files uploaded successfully.');
                runCommands();
                return;
            }

            const item = syncList[syncIndex];
            console.log(`Uploading ${item.local} to ${item.remote}...`);

            sftp.fastPut(item.local, item.remote, (uploadErr) => {
                if (uploadErr) {
                    console.error(`Upload Error (${item.local}):`, uploadErr);
                    // Tenta criar diretório se falhar por falta dele? (Ignorar por agora pois pastas já existem)
                    conn.end();
                    return;
                }
                console.log(`✓ ${path.basename(item.local)} synced.`);
                syncIndex++;
                uploadNext();
            });
        }

        function runCommands() {
            const commands = [
                'cd /var/www/poisson-erp && npm run build',
                'pm2 restart poisson-api || pm2 restart all'
            ];

            let cmdIndex = 0;
            function runNextCmd() {
                if (cmdIndex >= commands.length) {
                    console.log('Build and Restart finished.');
                    conn.end();
                    return;
                }

                const cmd = commands[cmdIndex];
                console.log(`\nExecuting: ${cmd}`);
                conn.exec(cmd, (execErr, stream) => {
                    if (execErr) {
                        console.error(`Error executing ${cmd}:`, execErr);
                        conn.end();
                        return;
                    }
                    stream.on('close', (code) => {
                        console.log(`Command finished with code ${code}`);
                        cmdIndex++;
                        runNextCmd();
                    }).on('data', (data) => {
                        process.stdout.write(data);
                    }).stderr.on('data', (data) => {
                        process.stderr.write(data);
                    });
                });
            }

            runNextCmd();
        }

        uploadNext();
    });
}).on('error', (err) => {
    console.error('SSH Error:', err);
}).connect({
    host: '72.60.254.10',
    port: 22,
    username: 'root',
    password: 'i5dAN0hN.HNAlWaYtS.'
});
