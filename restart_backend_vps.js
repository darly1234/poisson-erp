const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    // Restart ONLY the backend to be fast and safe
    const cmd = 'pm2 restart poisson-api';
    conn.exec(cmd, (err, stream) => {
        if (err) {
            console.error('Exec Error:', err);
            conn.end();
            return;
        }
        stream.on('close', (code) => {
            console.log(`Backend restart finished with code ${code}`);
            conn.end();
        }).on('data', (data) => {
            process.stdout.write(data);
        }).stderr.on('data', (data) => {
            process.stderr.write(data);
        });
    });
}).on('error', (err) => {
    console.error('SSH Error:', err);
}).connect({
    host: '72.60.254.10',
    port: 22,
    username: 'root',
    password: 'i5dAN0hN.HNAlWaYtS.'
});
