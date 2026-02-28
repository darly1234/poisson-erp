const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: 'c:/poisson-backend/.env' });

async function dump() {
    const client = new Client({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
    });

    try {
        await client.connect();
        const meta = await client.query("SELECT tabs, fieldBank FROM metadata ORDER BY id DESC LIMIT 1");
        console.log('--- METADATA ---');
        console.log(JSON.stringify(meta.rows[0], null, 2));

        const record = await client.query("SELECT * FROM records LIMIT 1");
        console.log('--- SAMPLE RECORD ---');
        console.log(JSON.stringify(record.rows[0], null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

dump();
