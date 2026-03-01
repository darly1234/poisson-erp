const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    // Check if there are other processes listening on port 3001
    const cmd = `netstat -tulpn | grep :3001 && ps -ef | grep node`;
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
