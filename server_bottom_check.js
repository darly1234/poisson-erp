const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    // Check the end of server.js and the last 100 lines of logs
    const cmd = `tail -n 20 /var/www/poisson-backend/server.js && tail -n 100 /root/.pm2/logs/poisson-api-out.log`;
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
