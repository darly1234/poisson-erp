const { Client } = require('ssh2');
const fs = require('fs');
const { exec } = require('child_process');
const conn = new Client();

const config = {
    host: '72.60.254.10',
    port: 22,
    username: 'root',
    password: 'i5dAN0hN.HNAlWaYtS.'
};

conn.on('ready', () => {
    console.log('SSH Connection Ready for DB Pull');

    // 1. Dump da base na VPS
    const dumpCmd = 'PGPASSWORD="ylrad320@" pg_dump -U postgres -d poisson_erp -f /tmp/poisson_dump.sql';
    
    conn.exec(dumpCmd, (err, stream) => {
        if (err) throw err;
        stream.on('close', (code) => {
            if (code !== 0) {
                console.error('Dump failed on VPS');
                conn.end();
                return;
            }
            console.log('Dump completed on VPS');
            
            // 2. Download do arquivo via SFTP
            conn.sftp((err, sftp) => {
                if (err) throw err;
                console.log('Downloading dump...');
                sftp.fastGet('/tmp/poisson_dump.sql', './poisson_vps_dump.sql', (getErr) => {
                    if (getErr) throw getErr;
                    console.log('Dump downloaded to local.');

                    // 3. Restaurar localmente
                    console.log('Restoring local DB...');
                    // Caminho absoluto para o psql no Windows do usuário
                    const psqlPath = '"C:\\Program Files\\PostgreSQL\\17\\bin\\psql.exe"';
                    const restoreCmd = `set PGPASSWORD=ylrad320@&& ${psqlPath} -U postgres -d poisson_erp -f poisson_vps_dump.sql`;
                    
                    exec(restoreCmd, (execErr, stdout, stderr) => {
                        if (execErr) {
                            console.error('Error restoring local DB:', execErr);
                            console.error('Stderr:', stderr);
                        } else {
                            console.log('Local DB restored successfully.');
                        }
                        conn.end();
                    });
                });
            });
        }).on('data', (data) => {
            process.stdout.write(data);
        }).stderr.on('data', (data) => {
            process.stderr.write(data);
        });
    });
}).connect(config);
