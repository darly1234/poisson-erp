const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH Connection Ready');

  const checkScript = `
    cd /var/www/poisson-backend
    node -e "
      const pg = require('pg');
      require('dotenv').config();
      const pool = new pg.Pool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
      });
      async function check() {
        try {
          const resDBs = await pool.query("SELECT datname FROM pg_database WHERE datistemplate = false");
          console.log('Databases:', resDBs.rows.map(r => r.datname).join(', '));
          
          for (const db of resDBs.rows.map(r => r.datname)) {
            console.log('\\\\nChecking Database: ' + db);
            const dbPool = new pg.Pool({
              host: process.env.DB_HOST,
              port: process.env.DB_PORT,
              database: db,
              user: process.env.DB_USER,
              password: process.env.DB_PASS,
            });
            try {
              const resTables = await dbPool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
              console.log('Tables in ' + db + ':', resTables.rows.map(r => r.table_name).join(', '));
              
              for (const table of resTables.rows.map(r => r.table_name)) {
                if (['records', 'message_logs'].includes(table)) {
                  const count = await dbPool.query("SELECT count(*) FROM " + table);
                  console.log('Table ' + table + ' count: ' + count.rows[0].count);
                  if (count.rows[0].count > 0) {
                     const rows = await dbPool.query("SELECT * FROM " + table + " LIMIT 5");
                     console.log('Sample rows in ' + table + ':', JSON.stringify(rows.rows, null, 2));
                  }
                }
              }
            } catch (err) {
              console.log('Could not check DB ' + db + ': ' + err.message);
            } finally {
              await dbPool.end();
            }
          }
          await pool.end();
        } catch (e) {
          console.error(e);
          process.exit(1);
        }
      }
      check();
    "
  `;

  conn.exec(checkScript, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      conn.end();
    }).on('data', (data) => {
      process.stdout.write(data);
    }).stderr.on('data', (data) => {
      process.stderr.write(data);
    });
  });
}).connect({
  host: '72.60.254.10',
  port: 22,
  username: 'root',
  password: 'i5dAN0hN.HNAlWaYtS.',
});
