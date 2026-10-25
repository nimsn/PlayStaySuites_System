const db = require('../config/db');

const UserModel = {
    getAllUsers: async () => {
        const [rows] = await db.query(`
            SELECT u.user_id, u.first_name, u.last_name, u.email, r.role_name 
            FROM users u 
            JOIN roles r ON u.role_id = r.role_id
        `);
        return rows;
    },
    createUser: async (userData) => {
        const { role_id, student_id_number, first_name, last_name, email, password_hash, phone_number } = userData;
        const [result] = await db.query(
            `INSERT INTO users (role_id, student_id_number, first_name, last_name, email, password_hash, phone_number) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [role_id, student_id_number, first_name, last_name, email, password_hash, phone_number]
        );
        return result.insertId;
    },
    deleteUser: async (id) => {
        await db.query('DELETE FROM users WHERE user_id = ?', [id]);
    },
    getInactiveUsersReport: async () => {
        const [rows] = await db.query(`
            SELECT u.user_id, u.first_name, u.last_name, u.email, b.booking_id
            FROM users u
            LEFT JOIN bookings b ON u.user_id = b.user_id
            WHERE b.booking_id IS NULL
        `);
        return rows;
    }
};

module.exports = UserModel;