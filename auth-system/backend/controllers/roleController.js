const db = require('../models/db');

exports.getRoles = async (req, res) => {
    try {
        const rolesResult = await db.query('SELECT * FROM roles ORDER BY created_at ASC');
        const roles = rolesResult.rows;

        // Fetch permissions for each role
        for (let role of roles) {
            const permsResult = await db.query(`
                SELECT p.id, p.name, p.description 
                FROM permissions p
                JOIN role_permissions rp ON p.id = rp.permission_id
                WHERE rp.role_id = $1
            `, [role.id]);
            role.permissions = permsResult.rows;
        }

        res.json(roles);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.createRole = async (req, res) => {
    const client = await db.query('BEGIN'); // Using transaction manually or we can just proceed with standard queries
    // Ideally we would use a client pool for transactions, but we can do it via pool directly for simplicity
    try {
        const { name, description, permissionIds } = req.body;

        const roleResult = await db.query(
            'INSERT INTO roles (name, description) VALUES ($1, $2) RETURNING *',
            [name, description]
        );
        const newRole = roleResult.rows[0];

        if (permissionIds && permissionIds.length > 0) {
            for (const pId of permissionIds) {
                await db.query(
                    'INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)',
                    [newRole.id, pId]
                );
            }
        }

        res.status(201).json({ message: 'Cargo criado com sucesso!', role: newRole });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.updateRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, permissionIds } = req.body;

        await db.query(
            'UPDATE roles SET name = $1, description = $2 WHERE id = $3',
            [name, description, id]
        );

        // Re-assign permissions (naive approach: delete all and insert new ones)
        if (permissionIds !== undefined) {
            await db.query('DELETE FROM role_permissions WHERE role_id = $1', [id]);
            for (const pId of permissionIds) {
                await db.query(
                    'INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)',
                    [id, pId]
                );
            }
        }

        res.json({ message: 'Cargo atualizado com sucesso!' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.deleteRole = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM roles WHERE id = $1', [id]);
        res.json({ message: 'Cargo removido com sucesso!' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.getPermissions = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM permissions ORDER BY id');
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server Error' });
    }
};
