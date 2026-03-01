const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    // Check PM2 logs specifically for the recent period
    const cmd = 'pm2 logs poisson-api --lines 100 --nostream';
    conn.exec(cmd, (err, stream) => {
        if (err) {
            console.error('Exec Error:', err);
            conn.end();
            return;
        }
        stream.on('close', (code) => {
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
