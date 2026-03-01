const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    const cmd = `cd /var/www/poisson-backend && node -e "const { Client } = require('pg'); const client = new Client({ connectionString: 'postgres://postgres:ylrad320%40@localhost:5432/poisson_erp' }); client.connect().then(() => client.query(\\\"SELECT data FROM records WHERE id = 'I-001'\\\")).then(res => { console.log(JSON.stringify(res.rows[0]?.data, null, 2)); client.end(); }).catch(err => { console.error(err); process.exit(1); });"`;
    
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
