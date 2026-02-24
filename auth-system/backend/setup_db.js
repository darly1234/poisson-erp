const { Client } = require('pg');

const setupDatabase = async () => {
    // 1. Connect to the default 'postgres' database to create the new one
    const defaultClient = new Client({
        connectionString: 'postgres://postgres:ylrad320%40@localhost:5432/postgres'
    });

    try {
        await defaultClient.connect();
        console.log('Connected to default postgres database...');

        // Postgres does not have CREATE DATABASE IF NOT EXISTS, so we try and catch
        try {
            await defaultClient.query('CREATE DATABASE poisson_erp_auth');
            console.log('✅ Database "poisson_erp_auth" created successfully!');
        } catch (e) {
            if (e.code === '42P04') {
                console.log('ℹ️ Database "poisson_erp_auth" already exists.');
            } else {
                throw e;
            }
        }
    } catch (err) {
        console.error('❌ Error creating database:', err.message);
        process.exit(1);
    } finally {
        await defaultClient.end();
    }

    // 2. Connect to the newly created database and create the table
    const appClient = new Client({
        connectionString: 'postgres://postgres:ylrad320%40@localhost:5432/poisson_erp_auth'
    });

    try {
        await appClient.connect();
        console.log('\nConnected to poisson_erp_auth database...');

        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                is_verified BOOLEAN DEFAULT FALSE,
                verification_token VARCHAR(255),
                reset_password_token VARCHAR(255),
                reset_password_expires TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                avatar_url TEXT
            );
        `;

        await appClient.query(createTableQuery);
        console.log('✅ Table "users" checked/created successfully with avatar_url column!');

    } catch (err) {
        console.error('❌ Error creating table:', err.message);
        process.exit(1);
    } finally {
        await appClient.end();
        console.log('\nSetup completed successfully!');
    }
};

setupDatabase();
