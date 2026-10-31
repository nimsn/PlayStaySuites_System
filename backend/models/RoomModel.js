const db = require('../config/db'); 
const LogModel = require('./LogModel');


class RoomError extends Error {
    constructor(message, status = 400) {
        super(message);
        this.status = status;
    }
}

const { ROOM_STATUSES } = LogModel;


const validateRoom = (d) => {
    const room_number = d.room_number ? String(d.room_number).trim() : '';
    if (!room_number || !d.room_type_id || d.floor_level === undefined || d.floor_level === null || d.floor_level === '') {
        throw new RoomError('room_number, room_type_id and floor_level are required.');
    }
    const floor_level = Number(d.floor_level);
    if (!Number.isInteger(floor_level)) throw new RoomError('floor_level must be a whole number.');

    const current_status = d.current_status || 'Available';
    if (!ROOM_STATUSES.includes(current_status)) {
        throw new RoomError(current_status must be one of: ${ROOM_STATUSES.join(', ')}.);
    }
    return { room_number, room_type_id: d.room_type_id, floor_level, current_status };
};

const RoomModel = {
    RoomError,

    
    getAllRooms: async () => {
        const [rooms] = await db.query(`
            SELECT r.room_id, r.room_type_id, r.room_number, r.floor_level, r.current_status,
                   rt.type_name, rt.base_rate, rt.max_capacity,
                   GROUP_CONCAT(a.amenity_name ORDER BY a.amenity_name SEPARATOR ', ') AS amenities
            FROM rooms AS r
            INNER JOIN room_types AS rt ON r.room_type_id = rt.room_type_id
            LEFT JOIN room_amenities AS ra ON ra.room_id = r.room_id
            LEFT JOIN amenities AS a ON a.amenity_id = ra.amenity_id
            GROUP BY r.room_id, rt.type_name, rt.base_rate, rt.max_capacity
            ORDER BY r.room_number ASC
        `);
        return rooms;
    },

    
    getRoomTypes: async () => {
        const [types] = await db.query(
            'SELECT room_type_id, type_name, base_rate, max_capacity FROM room_types ORDER BY type_name'
        );
        return types;
    },

    createRoom: async (d) => {
        const v = validateRoom(d);
        const [result] = await db.query(
            'INSERT INTO rooms (room_type_id, room_number, current_status, floor_level) VALUES (?, ?, ?, ?)',
            [v.room_type_id, v.room_number, v.current_status, v.floor_level]
        );
        return result.insertId;
    },

    
    updateRoom: async (roomId, d) => {
        const v = validateRoom(d);

        const conn = await db.getConnection();
        try {
            await conn.beginTransaction();

            const [[room]] = await conn.query('SELECT current_status FROM rooms WHERE room_id = ? FOR UPDATE', [roomId]);
            if (!room) throw new RoomError('Room not found.', 404);

            await conn.query('UPDATE rooms SET room_number = ?, room_type_id = ?, floor_level = ? WHERE room_id = ?', [
                v.room_number,
                v.room_type_id,
                v.floor_level,
                roomId,
            ]);

            if (v.current_status !== room.current_status) {
                await LogModel.applyStatusChange(conn, {
                    room_id: roomId,
                    staff_id: d.staff_id,
                    new_status: v.current_status,
                    remarks: d.remarks || 'Changed from the Rooms page',
                });
            }

            await conn.commit();
        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }
    },

    
    updateRoomStatus: async (roomId, status, { staff_id, remarks } = {}) => {
        return LogModel.addLog({ room_id: roomId, new_status: status, staff_id, remarks });
    },

   
    deleteRoom: async (roomId) => {
        const [[{ n }]] = await db.query('SELECT COUNT(*) AS n FROM bookings WHERE room_id = ?', [roomId]);
        if (n > 0) throw new RoomError('This room has bookings and cannot be deleted. Set it to Maintenance instead.', 409);

        const [result] = await db.query('DELETE FROM rooms WHERE room_id = ?', [roomId]);
        if (!result.affectedRows) throw new RoomError('Room not found.', 404);
    },

    
    getRoomDetailsReport: async () => {
        const [rooms] = await db.query(`
            SELECT r.room_number, r.current_status, r.floor_level,
                   rt.type_name, rt.base_rate, rt.max_capacity
            FROM rooms AS r
            INNER JOIN room_types AS rt ON r.room_type_id = rt.room_type_id
            ORDER BY r.room_number ASC
        `);
        return rooms;
    },
};

module.exports = RoomModel;