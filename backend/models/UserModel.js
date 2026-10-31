const { scrypt, randomBytes } = require('crypto');
const { promisify } = require('util');
const db = require('../config/db'); 

const scryptAsync = promisify(scrypt);

class UserError extends Error {
    constructor(message, status = 400) {
        super(message);
        this.status = status;
    }
}

const hashPassword = async (password) => {
    const salt = randomBytes(16).toString('hex');
    const key = await scryptAsync(String(password), salt, 64);
    return ${salt}:${key.toString('hex')};
};

const t = (v) => String(v).trim();
const clean = (v) => (v === undefined || v === null || t(v) === '' ? null : t(v)); // empty -> NULL

const validate = (d, passwordRequired) => {
    if (!d.first_name || !d.last_name || !d.email || !d.phone_number || !d.role_id) {
        throw new UserError('first_name, last_name, email, phone_number and role_id are required.');
    }
    if (!/^\S+@\S+\.\S+$/.test(t(d.email))) throw new UserError('Email address is not valid.');
    if (passwordRequired && !d.password) throw new UserError('Password is required.');
    if (d.password && String(d.password).length < throw new UserError('Password must be at least 8 characters.');
};

const UserModel = {
    UserError,

    getAllUsers: async () => {
        const [rows] = await db.query(`
            SELECT u.user_id, u.role_id, u.student_id_number, u.first_name, u.last_name,
                   u.email, u.phone_number, u.created_at,
                   r.role_name, s.staff_id, s.position, s.shift_schedule
            FROM users u
            INNER JOIN roles r ON r.role_id = u.role_id
            LEFT JOIN staff s ON s.user_id = u.user_id
            ORDER BY u.user_id
        `);
        return rows;
    },

    getRoles: async () => {
        const [rows] = await db.query('SELECT role_id, role_name FROM roles ORDER BY role_name');
        return rows;
    },

   
    createUser: async (d) => {
        validate(d, true);
        const hash = await hashPassword(d.password);

        const conn = await db.getConnection();
        try {
            await conn.beginTransaction();
            const [result] = await conn.query(
                `INSERT INTO users (role_id, student_id_number, first_name, last_name, email, password_hash, phone_number)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [d.role_id, clean(d.student_id_number), t(d.first_name), t(d.last_name), t(d.email), hash, t(d.phone_number)]
            );
            if (clean(d.position)) {
                await conn.query('INSERT INTO staff (user_id, position, shift_schedule) VALUES (?, ?, ?)', [
                    result.insertId,
                    clean(d.position),
                    clean(d.shift_schedule),
                ]);
            }
            await conn.commit();
            return result.insertId;
        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }
    },

    updateUser: async (id, d) => {
        validate(d, false);
        const hash = d.password ? await hashPassword(d.password) : null;

        const conn = await db.getConnection();
        try {
            await conn.beginTransaction();

            const [[user]] = await conn.query('SELECT user_id FROM users WHERE user_id = ? FOR UPDATE', [id]);
            if (!user) throw new UserError('User not found.', 404);

            const sets = ['role_id = ?', 'student_id_number = ?', 'first_name = ?', 'last_name = ?', 'email = ?', 'phone_number = ?'];
            const params = [d.role_id, clean(d.student_id_number), t(d.first_name), t(d.last_name), t(d.email), t(d.phone_number)];
            if (hash) {
                sets.push('password_hash = ?');
                params.push(hash);
            }
            await conn.query(UPDATE users SET ${sets.join(', ')} WHERE user_id = ?, [...params, id]);

            const [[staff]] = await conn.query('SELECT staff_id FROM staff WHERE user_id = ?', [id]);
            const position = clean(d.position);
            if (position && staff) {
                await conn.query('UPDATE staff SET position = ?, shift_schedule = ? WHERE staff_id = ?', [position, clean(d.shift_schedule), staff.staff_id]);
            } else if (position) {
                await conn.query('INSERT INTO staff (user_id, position, shift_schedule) VALUES (?, ?, ?)', [id, position, clean(d.shift_schedule)]);
            } else if (staff) {
                await conn.query('DELETE FROM staff WHERE staff_id = ?', [staff.staff_id]); // their bookings and logs keep working (staff_id becomes NULL)
            }

            await conn.commit();
        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }
    },

    deleteUser: async (id) => {
        const [[{ n }]] = await db.query('SELECT COUNT(*) AS n FROM bookings WHERE user_id = ?', [id]);
        if (n > 0) throw new UserError('This user has bookings and cannot be deleted.', 409);

        const [result] = await db.query('DELETE FROM users WHERE user_id = ?', [id]);
        if (!result.affectedRows) throw new UserError('User not found.', 404);
    },

    getInactiveUsersReport: async () => {
        const [rows] = await db.query(`
            SELECT u.user_id, CONCAT(u.first_name, ' ', u.last_name) AS full_name,
                   u.email, u.phone_number, r.role_name, u.created_at
            FROM users u
            INNER JOIN roles r ON r.role_id = u.role_id
            LEFT JOIN bookings b ON b.user_id = u.user_id
            WHERE b.booking_id IS NULL
            ORDER BY u.created_at DESC
        `);
        return rows;
    },
};

module.exports = UserModel;