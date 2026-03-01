const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    // 1. Check if the process is actually listening on ANY IP for port 3001
    // 2. Check for port conflicts or zombie processes
    const cmd = `ss -lptn | grep 3001 || netstat -lnpt | grep 3001 || echo "NOT LISTENING" && ps j $(pm2 jlist | jq '.[] | select(.name=="poisson-api") | .pid')`;
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
