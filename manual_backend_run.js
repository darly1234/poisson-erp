const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    // 1. Check if ANY process is listening on 3001 now
    // 2. Try to run the backend manually once to see error output clearly
    const cmd = `lsof -i :3001 || netstat -tulpen | grep 3001; cd /var/www/poisson-backend && node server.js 2>&1 | head -n 20`;
    conn.exec(cmd, (err, stream) => {
        if (err) {
            console.error(err);
            conn.end();
            return;
        }
        
        // Timeout to kill the manual node process if it hangs (it should hang if successful)
        const killer = setTimeout(() => {
            conn.end();
            process.exit(0);
        }, 8000);

        stream.on('data', (data) => {
            process.stdout.write(data);
            if (data.toString().includes('rodando na porta')) {
                console.log('\n--- SERVER LOGGED READINESS ---');
            }
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
