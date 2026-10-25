const db = require('../config/db');

const BookingModel = {
    createBooking: async (bookingData) => {
        const { user_id, room_id, staff_id, check_in_time, total_amount } = bookingData;
        const [result] = await db.query(
            `INSERT INTO bookings (user_id, room_id, staff_id, check_in_time, total_amount, booking_status) 
             VALUES (?, ?, ?, ?, ?, 'Active')`,
            [user_id, room_id, staff_id, check_in_time, total_amount]
        );
        return result.insertId;
    },
   
    getActiveBookingsReport: async () => {
        const [rows] = await db.query(`
            SELECT b.booking_id, u.first_name, u.last_name, r.room_number, b.check_in_time, b.booking_status
            FROM bookings b
            INNER JOIN users u ON b.user_id = u.user_id
            INNER JOIN rooms r ON b.room_id = r.room_id
        `);
        return rows;
    }
};

module.exports = BookingModel;