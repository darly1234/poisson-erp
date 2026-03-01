const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    // Search for submission_id or success messages in the log
    const cmd = `grep -C 5 "crossref" /root/.pm2/logs/poisson-api-out.log | tail -n 50`;
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
