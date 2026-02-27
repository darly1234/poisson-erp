const { Client } = require('ssh2');
const conn = new Client();

const dbResetScript = `
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
});

async function reset() {
  try {
    console.log('Resetting database...');
    await pool.query('TRUNCATE TABLE message_logs RESTART IDENTITY CASCADE');
    await pool.query('TRUNCATE TABLE records RESTART IDENTITY CASCADE');
    console.log('Database reset successful.');
  } catch (err) {
    console.error('Reset failed:', err);
  } finally {
    await pool.end();
  }
}
reset();
`;

conn.on('ready', () => {
    console.log('SSH Ready for DB Reset');

    conn.sftp((err, sftp) => {
        if (err) throw err;

        const remotePath = '/var/www/poisson-backend/reset_db_temp.js';
        const stream = sftp.createWriteStream(remotePath);
        stream.on('close', () => {
            console.log('Script uploaded to backend dir.');
            conn.exec(`cd /var/www/poisson-backend && node reset_db_temp.js`, (execErr, execStream) => {
                if (execErr) throw execErr;
                execStream.on('close', () => {
                    console.log('VPS Script finished.');
                    // Remove o arquivo temporário
                    sftp.unlink(remotePath, () => {
                        conn.end();
                    });
                }).on('data', (data) => process.stdout.write(data))
                    .stderr.on('data', (data) => process.stderr.write(data));
            });
        });
        stream.end(dbResetScript);
    });
}).connect({
    host: '72.60.254.10',
    port: 22,
    username: 'root',
    password: 'i5dAN0hN.HNAlWaYtS.'
});
