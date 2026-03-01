const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    // 1. Check server.js on VPS
    // 2. Check PM2 list for ALL users
    const cmd = `cat /var/www/poisson-backend/server.js | head -n 50 && pm2 list`;
    conn.exec(cmd, (err, stream) => {
        if (err) {
            console.error(err);
            conn.end();
            return;
        }
        stream.on('close', () => conn.end())
              .on('data', (data) => process.stdout.write(data))
              .stderr.on('data', (data) => process.stderr.write(data));
    });
}).on('error', (err) => {
    console.error(err);
}).connect({
    host: '72.60.254.10',
    port: 22,
    username: 'root',
    password: 'i5dAN0hN.HNAlWaYtS.'
});
