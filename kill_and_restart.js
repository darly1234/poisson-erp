const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    // 1. Kill the specific process using port 3001
    // 2. Kill all pm2 instances if necessary
    // 3. Restart the api
    const cmd = `fuser -k 3001/tcp; pm2 stop all; pm2 delete all; pm2 start /var/www/poisson-backend/server.js --name "poisson-api"`;
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
