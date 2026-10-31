const db = require('../config/db'); 

class LogError extends Error {
    constructor(message, status = 400) {
        super(message);
        this.status = status;
    }
}

const ROOM_STATUSES = ['Available', 'Occupied', 'Maintenance', 'Cleaning'];

const LogModel = {
    LogError,
    ROOM_STATUSES,


    addLog: async ({ room_id, staff_id = null, new_status, remarks = null }) => {
        if (!room_id || !new_status) throw new LogError('room_id and new_status are required.');
        if (!ROOM_STATUSES.includes(new_status)) {
            throw new LogError(`new_status must be one of: ${ROOM_STATUSES.join(', ')}.`);
        }

        const conn = await db.getConnection();
        try {
            await conn.beginTransaction();

            const [[room]] = await conn.query('SELECT current_status FROM rooms WHERE room_id = ? FOR UPDATE', [room_id]);
            if (!room) throw new LogError('Room not found.', 404);
            if (room.current_status === new_status) throw new LogError(`Room is already ${new_status}.`, 409);

            if (room.current_status === 'Occupied') {
                const [active] = await conn.query(
                    "SELECT booking_id FROM bookings WHERE room_id = ? AND booking_status = 'Active' LIMIT 1",
                    [room_id]
                );
                if (active.length) {
                    throw new LogError(`Room has an active booking (#${active[0].booking_id}). Check the guest out first.`, 409);
                }
            }

            await conn.query('UPDATE rooms SET current_status = ? WHERE room_id = ?', [new_status, room_id]);

            const note = remarks && String(remarks).trim() ? String(remarks).trim() : null;
            const [result] = await conn.query(
                `INSERT INTO room_status_logs (room_id, staff_id, previous_status, new_status, remarks)
                 VALUES (?, ?, ?, ?, ?)`,
                [room_id, staff_id || null, room.current_status, new_status, note]
            );

            await conn.commit();
            return result.insertId;
        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }
    },

    getAuditLogReport: async () => {
        const [rows] = await db.query(`
            SELECT l.log_id, r.room_id, r.room_number,
                   l.previous_status, l.new_status, l.changed_at, l.remarks,
                   CONCAT(u.first_name, ' ', u.last_name) AS staff_name
            FROM room_status_logs l
            RIGHT JOIN rooms r ON l.room_id = r.room_id
            LEFT JOIN staff s ON l.staff_id = s.staff_id
            LEFT JOIN users u ON s.user_id = u.user_id
            ORDER BY l.changed_at DESC, r.room_number
        `);
        return rows;
    },
};

module.exports = LogModel;