const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const conn = new Client();
conn.on('ready', () => {
    console.log('SSH Connection Ready');

    const localScriptPath = path.join(__dirname, 'vps_db_research.js');
    const remoteScriptPath = '/tmp/vps_db_research.js';

    // Create the script content to be uploaded
    const scriptContent = `
const pg = require('pg');
require('dotenv').config({ path: '/var/www/poisson-backend/.env' });

const config = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
};

async function check() {
    const mainPool = new pg.Pool({ ...config, database: 'postgres' });
    try {
        const resDBs = await mainPool.query("SELECT datname FROM pg_database WHERE datistemplate = false");
        console.log('Databases found:', resDBs.rows.map(r => r.datname).join(', '));

        for (const db of resDBs.rows.map(r => r.datname)) {
            console.log('\\n--- Checking Database: ' + db + ' ---');
            const pool = new pg.Pool({ ...config, database: db });
            try {
                const resTables = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
                for (const table of resTables.rows.map(r => r.table_name)) {
                    const countRes = await pool.query("SELECT count(*) FROM \\"" + table + "\\"");
                    const count = countRes.rows[0].count;
                    console.log('Table ' + table + ': ' + count + ' rows');
                    if (count > 0) {
                        const rows = await pool.query("SELECT * FROM \\"" + table + "\\" LIMIT 3");
                        console.log('Sample rows in ' + table + ':');
                        console.log(JSON.stringify(rows.rows, null, 2));
                    }
                }
            } catch (e) {
                console.log('Error checking ' + db + ': ' + e.message);
            } finally {
                await pool.end();
            }
        }
    } catch (e) {
        console.error('Final Error:', e);
    } finally {
        await mainPool.end();
    }
}
check();
`;

    fs.writeFileSync(localScriptPath, scriptContent);

    conn.sftp((err, sftp) => {
        if (err) throw err;
        sftp.fastPut(localScriptPath, remoteScriptPath, (uploadErr) => {
            if (uploadErr) throw uploadErr;
            console.log('Research script uploaded to /tmp/vps_db_research.js');

            conn.exec('cd /var/www/poisson-backend && node /tmp/vps_db_research.js', (execErr, stream) => {
                if (execErr) throw execErr;
                stream.on('close', (code) => {
                    console.log('Research finished with code ' + code);
                    conn.end();
                    fs.unlinkSync(localScriptPath);
                }).on('data', (data) => {
                    process.stdout.write(data);
                }).stderr.on('data', (data) => {
                    process.stderr.write(data);
                });
            });
        });
    });
}).connect({
    host: '72.60.254.10',
    port: 22,
    username: 'root',
    password: 'i5dAN0hN.HNAlWaYtS.'
});
