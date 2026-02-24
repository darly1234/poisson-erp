require('dotenv').config();
const db = require('./models/db');
const bcrypt = require('bcryptjs');

async function createAdmin() {
    try {
        const email = 'admin@poisson.com';
        const password = 'admin';

        // Verifica se já existe
        const check = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (check.rows.length > 0) {
            console.log('O usuário admin@poisson.com já existe no banco de dados!');
            process.exit(0);
        }

        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // Insere o admin já com is_verified = TRUE para poder logar direto
        await db.query(
            'INSERT INTO users (name, email, password_hash, is_verified) VALUES ($1, $2, $3, $4)',
            ['Administrador', email, password_hash, true]
        );

        console.log('\n✅ Usuário Admin Padrão criado com sucesso!');
        console.log('------------------------------------------------');
        console.log('E-mail: admin@poisson.com');
        console.log('Senha:  admin');
        console.log('------------------------------------------------\n');
        process.exit(0);
    } catch (err) {
        console.error('Erro ao criar admin:', err);
        process.exit(1);
    }
}

createAdmin();
