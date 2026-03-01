const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    // 1. Check end of server.js again
    // 2. Search for EADDRINUSE in ALL logs
    const cmd = `tail -n 10 /var/www/poisson-backend/server.js && grep -r "EADDRINUSE" /root/.pm2/logs/`;
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
