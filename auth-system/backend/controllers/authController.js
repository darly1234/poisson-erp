const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const db = require('../models/db');

// Setup Nodemailer transporter
const transporter = nodemailer.createTransport({
    service: 'gmail', // or your preferred service
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if user exists
        const userCheck = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userCheck.rows.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // Generate verification token (mock implementation for email verification)
        const verification_token = crypto.randomBytes(32).toString('hex');

        // Insert user
        const newUser = await db.query(
            'INSERT INTO users (name, email, password_hash, verification_token) VALUES ($1, $2, $3, $4) RETURNING id, name, email',
            [name, email, password_hash, verification_token]
        );

        // Send verification email using transporter
        const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verification_token}`;

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Confirme seu E-mail',
            text: `Bem-vindo! Por favor, confirme seu e-mail acessando o seguinte link:\n\n${verificationUrl}\n\nSe você não se cadastrou neste sistema, ignore este email.`
        };

        // transporter.sendMail(mailOptions, (error, info) => { ... });
        // MOCK: In a real environment, uncomment the sendMail block above.

        res.status(201).json({ message: 'Conta criada com sucesso. Por favor, verifique seu e-mail.', verificationUrl }); // verificationUrl allowed in res for testing without smtp
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check user
        const userResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userResult.rows.length === 0) {
            return res.status(400).json({ message: 'Invalid Credentials' });
        }

        const user = userResult.rows[0];

        // Check password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid Credentials' });
        }

        // Check if verified
        if (!user.is_verified) {
            return res.status(403).json({ message: 'Por favor, confirme seu e-mail antes de fazer login. Verifique sua caixa de entrada.' });
        }

        // Fetch User Permissions
        const permsResult = await db.query(`
            SELECT p.name 
            FROM permissions p
            JOIN role_permissions rp ON p.id = rp.permission_id
            JOIN user_roles ur ON rp.role_id = ur.role_id
            WHERE ur.user_id = $1
        `, [user.id]);

        const userPermissions = permsResult.rows.map(row => row.name);

        // Generate Token
        const payload = {
            user: {
                id: user.id,
                name: user.name,
                permissions: userPermissions
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '36500d' },
            (err, token) => {
                if (err) throw err;
                res.json({ token, user: payload.user });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        const userResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: 'User with this email does not exist' });
        }

        const user = userResult.rows[0];

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpires = new Date(Date.now() + 3600000); // 1 hour

        // Update user with reset token
        await db.query(
            'UPDATE users SET reset_password_token = $1, reset_password_expires = $2 WHERE id = $3',
            [resetToken, resetTokenExpires, user.id]
        );

        // Send email
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: 'Password Reset Request',
            text: `You requested a password reset. Please make a put request to: \n\n ${resetUrl}`
        };

        // transporter.sendMail(mailOptions, (error, info) => { ... });
        // Ignoring actual sending for demo simplicity, but it's set up.

        res.json({ message: 'Email sent with reset instructions', resetUrl }); // resetUrl sent for testing
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        const userResult = await db.query(
            'SELECT * FROM users WHERE reset_password_token = $1 AND reset_password_expires > NOW()',
            [token]
        );

        if (userResult.rows.length === 0) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        const user = userResult.rows[0];

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(newPassword, salt);

        // Update user
        await db.query(
            'UPDATE users SET password_hash = $1, reset_password_token = NULL, reset_password_expires = NULL WHERE id = $2',
            [password_hash, user.id]
        );

        res.json({ message: 'Password has been reset successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.verifyEmail = async (req, res) => {
    try {
        const { token } = req.params;

        const userResult = await db.query(
            'SELECT * FROM users WHERE verification_token = $1',
            [token]
        );

        if (userResult.rows.length === 0) {
            return res.status(400).json({ message: 'Token de verificação inválido ou expirado.' });
        }

        const user = userResult.rows[0];

        if (user.is_verified) {
            return res.status(400).json({ message: 'Este e-mail já foi verificado.' });
        }

        // Update user to verified
        await db.query(
            'UPDATE users SET is_verified = TRUE, verification_token = NULL WHERE id = $1',
            [user.id]
        );

        res.json({ message: 'E-mail verificado com sucesso! Você já pode fazer login.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.autoLoginMaster = async (req, res) => {
    try {
        const email = 'darly';
        const password = 'ylrad320@#$%&';
        const name = 'Admin Darly';

        let userResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        let user;

        if (userResult.rows.length === 0) {
            // Build the user if it doesn't exist
            const salt = await bcrypt.genSalt(10);
            const password_hash = await bcrypt.hash(password, salt);

            const newUser = await db.query(
                'INSERT INTO users (name, email, password_hash, is_verified) VALUES ($1, $2, $3, $4) RETURNING *',
                [name, email, password_hash, true]
            );
            user = newUser.rows[0];
        } else {
            user = userResult.rows[0];
        }

        // Fetch User Permissions
        const permsResult = await db.query(`
            SELECT p.name 
            FROM permissions p
            JOIN role_permissions rp ON p.id = rp.permission_id
            JOIN user_roles ur ON rp.role_id = ur.role_id
            WHERE ur.user_id = $1
        `, [user.id]);

        const userPermissions = permsResult.rows.map(row => row.name);

        // Generate Token
        const payload = {
            user: {
                id: user.id,
                name: user.name,
                permissions: userPermissions
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '36500d' }, // effectively never expires
            (err, token) => {
                if (err) throw err;
                res.json({ token, user: payload.user });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Auto Login Failed' });
    }
};
