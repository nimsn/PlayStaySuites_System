const db = require('../config/db');

const LogModel = {
    addLog: async (roomId, staffId, prevStatus, newStatus, remarks) => {
        await db.query(
            `INSERT INTO room_status_logs (room_id, staff_id, previous_status, new_status, remarks) 
             VALUES (?, ?, ?, ?, ?)`,
            [roomId, staffId, prevStatus, newStatus, remarks]
        );
    },

    getAuditLogReport: async () => {
        const [rows] = await db.query(`
            SELECT l.log_id, r.room_number, l.previous_status, l.new_status, l.changed_at, u.first_name AS staff_name
            FROM room_status_logs l
            RIGHT JOIN rooms r ON l.room_id = r.room_id
            LEFT JOIN staff s ON l.staff_id = s.staff_id
            LEFT JOIN users u ON s.user_id = u.user_id
        `);
        return rows;
    }
};

module.exports = LogModel;