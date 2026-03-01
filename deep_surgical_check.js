const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    // 1. Check ALL listening ports
    // 2. Check PM2 config
    // 3. Test if 3001 is reachable locally
    const cmd = `lsof -i :3001 && pm2 show poisson-api && curl -v http://localhost:3001/api/auth/refresh`;
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
