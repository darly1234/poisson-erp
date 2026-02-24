const { Client } = require('pg');
require('dotenv').config();

const setupRbac = async () => {
    // We already know the database exists from previous setup. Connecting directly.
    const appClient = new Client({
        connectionString: process.env.DATABASE_URL
    });

    try {
        await appClient.connect();
        console.log('Connected to poisson_erp_auth database...\n');

        // 1. Create permissions table
        const createPermissionsTable = `
            CREATE TABLE IF NOT EXISTS permissions (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) UNIQUE NOT NULL,
                description TEXT
            );
        `;
        await appClient.query(createPermissionsTable);
        console.log('✅ Table "permissions" checked/created.');

        // 2. Create roles table
        const createRolesTable = `
            CREATE TABLE IF NOT EXISTS roles (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) UNIQUE NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;
        await appClient.query(createRolesTable);
        console.log('✅ Table "roles" checked/created.');

        // 3. Create role_permissions junction
        const createRolePermissionsTable = `
            CREATE TABLE IF NOT EXISTS role_permissions (
                role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
                permission_id INTEGER REFERENCES permissions(id) ON DELETE CASCADE,
                PRIMARY KEY (role_id, permission_id)
            );
        `;
        await appClient.query(createRolePermissionsTable);
        console.log('✅ Table "role_permissions" checked/created.');

        // 4. Create user_roles junction
        const createUserRolesTable = `
            CREATE TABLE IF NOT EXISTS user_roles (
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
                PRIMARY KEY (user_id, role_id)
            );
        `;
        await appClient.query(createUserRolesTable);
        console.log('✅ Table "user_roles" checked/created.');

        // 5. Seed default permissions
        console.log('\nSeeding base permissions...');
        const permissions = [
            { name: 'manage_users', desc: 'Can view, create and edit users' },
            { name: 'manage_roles', desc: 'Can create and configure roles and permissions' },
            { name: 'view_dashboard', desc: 'Can access secure dashboard pages' }
        ];

        for (const p of permissions) {
            await appClient.query(
                'INSERT INTO permissions (name, description) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING',
                [p.name, p.desc]
            );
        }

        // 6. Seed Master Admin role and link to user "darly" if exists
        console.log('\nAssigning Master Admin...');
        const roleResult = await appClient.query(
            "INSERT INTO roles (name, description) VALUES ('Administrador Mestre', 'Acesso total ao sistema') ON CONFLICT (name) DO UPDATE SET name=EXCLUDED.name RETURNING id"
        );
        const adminRoleId = roleResult.rows[0].id;

        // Assign all permissions to Master Admin
        const allPerms = await appClient.query('SELECT id FROM permissions');
        for (const perm of allPerms.rows) {
            await appClient.query(
                'INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                [adminRoleId, perm.id]
            );
        }

        // Find user darly
        const userResult = await appClient.query("SELECT id FROM users WHERE email = 'darly'");
        if (userResult.rows.length > 0) {
            const userId = userResult.rows[0].id;
            await appClient.query(
                'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                [userId, adminRoleId]
            );
            console.log('✅ Granted Administrador Mestre to User: darly');
        } else {
            console.log('⚠️ User darly not found yet, skipping assignment.');
        }

    } catch (err) {
        console.error('❌ Error during RBAC Setup:', err.message);
        process.exit(1);
    } finally {
        await appClient.end();
        console.log('\nRBAC Database Setup completed successfully!');
    }
};

setupRbac();
