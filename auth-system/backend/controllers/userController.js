const db = require('../models/db');
const bcrypt = require('bcryptjs');

exports.getProfile = async (req, res) => {
    try {
        const userId = req.user.user.id;

        const userResult = await db.query(
            'SELECT id, name, email, avatar_url, created_at FROM users WHERE id = $1',
            [userId]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: 'Usuário não encontrado' });
        }

        res.json(userResult.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Erro no servidor' });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user.user.id;
        const { currentPassword, newPassword, avatar_url } = req.body;

        let queryUpdates = [];
        let queryValues = [];
        let paramIndex = 1;

        if (currentPassword && newPassword) {
            // Check password
            const userResult = await db.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
            const isMatch = await bcrypt.compare(currentPassword, userResult.rows[0].password_hash);

            if (!isMatch) {
                return res.status(400).json({ message: 'A senha atual está incorreta.' });
            }

            const salt = await bcrypt.genSalt(10);
            const password_hash = await bcrypt.hash(newPassword, salt);

            queryUpdates.push(`password_hash = $${paramIndex}`);
            queryValues.push(password_hash);
            paramIndex++;
        }

        if (avatar_url !== undefined) {
            queryUpdates.push(`avatar_url = $${paramIndex}`);
            queryValues.push(avatar_url);
            paramIndex++;
        }

        if (queryUpdates.length === 0) {
            return res.status(400).json({ message: 'Nada para atualizar' });
        }

        queryValues.push(userId);
        const queryText = `UPDATE users SET ${queryUpdates.join(', ')} WHERE id = $${paramIndex} RETURNING id, name, email, avatar_url`;

        const updatedUser = await db.query(queryText, queryValues);

        res.json({ message: 'Perfil atualizado com sucesso.', user: updatedUser.rows[0] });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Erro no servidor' });
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT u.id, u.name, u.email, u.is_verified, u.created_at, r.id as role_id, r.name as role_name
            FROM users u
            LEFT JOIN user_roles ur ON u.id = ur.user_id
            LEFT JOIN roles r ON ur.role_id = r.id
            ORDER BY u.created_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Erro no servidor' });
    }
};

exports.createUser = async (req, res) => {
    try {
        const { name, email, password, role_id } = req.body;

        const userCheck = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userCheck.rows.length > 0) {
            return res.status(400).json({ message: 'Email já cadastrado' });
        }

        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        const newUser = await db.query(
            'INSERT INTO users (name, email, password_hash, is_verified) VALUES ($1, $2, $3, TRUE) RETURNING id, name, email, is_verified, created_at',
            [name, email, password_hash]
        );

        const userId = newUser.rows[0].id;

        if (role_id) {
            await db.query(
                'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)',
                [userId, role_id]
            );
        }

        res.status(201).json({ message: 'Usuário administrador criado com sucesso.', user: newUser.rows[0] });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Erro no servidor' });
    }
};
