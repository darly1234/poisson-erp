const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    // Check file content AND pm2 error logs
    const cmd = `cat /var/www/poisson-backend/src/routes/crossref.js && pm2 logs poisson-api --err --lines 50 --nostream`;
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
