const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    // Check DOI resolution and error logs
    const cmd = `curl -I -L https://doi.org/10.36229/978-65-5866-636-3 && pm2 logs poisson-api --err --lines 50 --nostream`;
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
