const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    // Tail the log and wait a bit to capture output
    const cmd = 'tail -f /root/.pm2/logs/poisson-api-out.log';
    conn.exec(cmd, (err, stream) => {
        if (err) {
            console.error(err);
            conn.end();
            return;
        }
        
        // Output timeout to stop tailing after 5 seconds
        const timeout = setTimeout(() => {
            conn.end();
            process.exit(0);
        }, 5000);

        stream.on('data', (data) => {
            process.stdout.write(data);
        }).stderr.on('data', (data) => {
            process.stderr.write(data);
        });
    });
}).on('error', (err) => {
    console.error(err);
}).connect({
    host: '72.60.254.10',
    port: 22,
    username: 'root',
    password: 'i5dAN0hN.HNAlWaYtS.'
});
