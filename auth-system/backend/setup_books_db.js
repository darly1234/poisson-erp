const { Client } = require('pg');
const dotenv = require('dotenv');

// Carrega variáveis de ambiente
dotenv.config();

// Usando a connection string da aplicação principal
const connectionString = process.env.DATABASE_URL;

const createBooksTable = async () => {
    const client = new Client({
        connectionString: connectionString
    });

    try {
        await client.connect();
        console.log('🔗 Conectado ao banco de dados PostgreSQL.');

        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS books (
                id SERIAL PRIMARY KEY,
                status VARCHAR(50) NOT NULL,
                title VARCHAR(255) NOT NULL,
                contact_name VARCHAR(255) NOT NULL,
                contact_phone VARCHAR(20) NOT NULL,
                contact_email VARCHAR(255) NOT NULL,
                authors JSONB NOT NULL,
                isbn VARCHAR(50),
                doi VARCHAR(100),
                contract_value DECIMAL(10, 2),
                installments INTEGER,
                payment_status VARCHAR(50),
                commission_value DECIMAL(10, 2) DEFAULT 0.00,
                commission_payment_status VARCHAR(50),
                upload_original TEXT,
                upload_edited TEXT,
                upload_covers JSONB, -- { front: url, back: url }
                upload_commission_receipt TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;

        await client.query(createTableQuery);
        console.log('✅ Tabela "books" conferida/criada com sucesso!');

    } catch (err) {
        console.error('❌ Erro de banco de dados:', err);
    } finally {
        await client.end();
        console.log('🔌 Conexão encerrada.');
    }
};

createBooksTable();
