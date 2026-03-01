const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    console.log('SSH Connection Ready');
    // Manual SQL update for record I-001 to inject the submission_id we know was generated
    const sql = `UPDATE records SET data = data || '{"submission_id": "CR-1740776518177", "last_submission_date": "2026-02-28T18:02:00.000Z"}'::jsonb WHERE id = 'I-001';`;
    const cmd = `sudo -u postgres psql -d poisson_erp -c "${sql}"`;
    
    conn.exec(cmd, (err, stream) => {
        if (err) {
            console.error('Exec Error:', err);
            conn.end();
            return;
        }
        stream.on('close', (code) => {
            console.log(`Update command finished with code ${code}`);
            conn.end();
        }).on('data', (data) => {
            process.stdout.write(data);
        }).stderr.on('data', (data) => {
            process.stderr.write(data);
        });
    });
}).on('error', (err) => {
    console.error('SSH Error:', err);
}).connect({
    host: '72.60.254.10',
    port: 22,
    username: 'root',
    password: 'i5dAN0hN.HNAlWaYtS.'
});
