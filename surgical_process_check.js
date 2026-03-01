const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    // Find more details about the running process
    // 1. Where is the process running from?
    // 2. What files does it have open?
    const cmd = `pm2 show poisson-api | grep -E "pid|status|interpreter|path" && pwdx $(pm2 jlist | jq '.[] | select(.name=="poisson-api") | .pid') && ps aux | grep poisson-api`;
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
