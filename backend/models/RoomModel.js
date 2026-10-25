const db = require('../config/db');

const RoomModel = {
    getAllRooms: async () => {
        const [rows] = await db.query('SELECT * FROM rooms');
        return rows;
    },
    updateRoomStatus: async (roomId, status) => {
        await db.query('UPDATE rooms SET current_status = ? WHERE room_id = ?', [status, roomId]);
    },
     
    getRoomDetailsReport: async () => {
        const [rows] = await db.query(`
            SELECT r.room_number, r.current_status, r.floor_level, rt.type_name, rt.base_rate_per_hour
            FROM rooms r
            INNER JOIN room_types rt ON r.room_type_id = rt.room_type_id
        `);
        return rows;
    }
};

module.exports = RoomModel;