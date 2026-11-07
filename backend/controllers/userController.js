const UserModel = require('../models/UserModel');
const jwt = require('jsonwebtoken');
const { scrypt, timingSafeEqual } = require('crypto');
const { promisify } = require('util');
const db = require('../config/db');

const scryptAsync = promisify(scrypt);

const verifyPassword = async (password, storedHash) => {
    const [salt, key] = String(storedHash || '').split(':');
    if (!salt || !key) return false;
    const stored = Buffer.from(key, 'hex');
    const derived = await scryptAsync(String(password), salt, 64);
    return stored.length === derived.length && timingSafeEqual(stored, derived);
};

const handleError = (res, error, action) => {
    if (error.status) {
        return res.status(error.status).json({ message: error.message });
    }
    if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ message: 'Email, phone number or student ID is already in use.' });
    }
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
        return res.status(400).json({ message: 'The selected role does not exist.' });
    }

    console.error(`Error trying to ${action}:`, error);
    return res.status(500).json({ message: `Unable to ${action} at the moment.` });
};

const isValidId = (id) => /^[1-9]\d*$/.test(String(id));

exports.getUsers = async (req, res) => {
    try {
        const users = await UserModel.getAllUsers();
        return res.status(200).json(users);
    } catch (error) {
        return handleError(res, error, 'get users');
    }
};

exports.getCustomers = async (req, res) => {
    try {
        return res.status(200).json(await UserModel.getCustomers());
    } catch (error) {
        return handleError(res, error, 'get customers');
    }
};

exports.getRoles = async (req, res) => {
    try {
        const roles = await UserModel.getRoles();
        return res.status(200).json(roles);
    } catch (error) {
        return handleError(res, error, 'get roles');
    }
};

exports.loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        if (!email || !password) {
            return res.status(400).json({
                message: 'Email and password are required.'
            });
        }

        const [rows] = await db.query(
            `SELECT u.user_id, u.email, u.password_hash, r.role_name
             FROM users u
             INNER JOIN roles r ON u.role_id = r.role_id
             WHERE u.email = ?`,
            [email.trim()]
        );

        if (rows.length === 0) {
            return res.status(401).json({
                message: 'Invalid email or password.'
            });
        }

        const user = rows[0];

        const isValid = await verifyPassword(
            password,
            user.password_hash
        );

        if (!isValid) {
            return res.status(401).json({
                message: 'Invalid email or password.'
            });
        }

        const token = jwt.sign(
            {
                user_id: user.user_id,
                email: user.email,
                role: user.role_name
            },
            process.env.JWT_SECRET,
            {
                expiresIn: '8h'
            }
        );

        return res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                user_id: user.user_id,
                email: user.email,
                role: user.role_name
            }
        });

    } catch (error) {
        return handleError(res, error, 'login user');
    }
};

exports.registerUser = async (req, res) => {
    try {
        const {
            first_name,
            last_name,
            email,
            password,
            phone_number,
            student_id_number
        } = req.body || {};

        
        const [roleRows] = await db.query(
            "SELECT role_id FROM roles WHERE role_name = 'Student' LIMIT 1"
        );

        if (roleRows.length === 0) {
            return res.status(500).json({
                message: 'Student role is not configured in the database.'
            });
        }

        const userId = await UserModel.createUser({
            first_name,
            last_name,
            email,
            password,
            phone_number,
            student_id_number,
            role_id: roleRows[0].role_id,
            position: null,
            shift_schedule: null
        });

        return res.status(201).json({
            message: 'Student account registered successfully.',
            userId
        });

    } catch (error) {
        return handleError(res, error, 'register student');
    }
};

exports.addUser = async (req, res) => {
    try {
        const userId = await UserModel.createUser(req.body || {});
        return res.status(201).json({
            message: 'User added successfully.',
            userId: userId
        });
    } catch (error) {
        return handleError(res, error, 'add user');
    }
};

exports.editUser = async (req, res) => {
    try {
        const userId = req.params.id;
        if (!isValidId(userId)) {
            return res.status(400).json({ message: 'Please provide a valid user ID.' });
        }

        await UserModel.updateUser(Number(userId), req.body || {});
        return res.status(200).json({ message: 'User updated successfully.' });
    } catch (error) {
        return handleError(res, error, 'update user');
    }
};

exports.removeUser = async (req, res) => {
    try {
        const userId = req.params.id;
        if (!isValidId(userId)) {
            return res.status(400).json({ message: 'Please provide a valid user ID.' });
        }

        await UserModel.deleteUser(Number(userId));
        return res.status(200).json({ message: 'User deleted successfully.' });
    } catch (error) {
        return handleError(res, error, 'delete user');
    }
};

exports.getInactiveReport = async (req, res) => {
    try {
        const inactiveUsers = await UserModel.getInactiveUsersReport();
        return res.status(200).json(inactiveUsers);
    } catch (error) {
        return handleError(res, error, 'get inactive users report');
    }
};