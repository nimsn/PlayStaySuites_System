const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is missing. Add it to your .env file (see .env.example).');
    process.exit(1);
}

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));
app.use((req, res, next) => { console.log(req.method, req.originalUrl); next(); });

app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/rooms', require('./routes/roomRoutes'));
app.use('/api/amenities', require('./routes/amenityRoutes'));
app.use('/api/promos', require('./routes/promoRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/logs', require('./routes/logRoutes'));
app.use('/api/', require('./routes/billingRoutes'));

const db = require('./config/db');
const EXPECTED_COLUMNS = {
    room_types: ['base_rate_per_hour'],
    rooms: ['floor_level'],
    bookings: ['promo_id', 'discount_amount'],
    promos: ['promo_code', 'discount_percentage', 'valid_from', 'valid_until'],
    amenities: ['amenity_name', 'description'],
    room_amenities: ['room_id', 'amenity_id'],
};

async function checkDatabase() {
    try {
        const [[{ dbName }]] = await db.query('SELECT DATABASE() AS dbName');
        const [rows] = await db.query(
            `SELECT TABLE_NAME AS tbl, COLUMN_NAME AS col
             FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN (?)`,
            [Object.keys(EXPECTED_COLUMNS)]
        );
        const have = new Set(rows.map((r) => `${r.tbl}.${r.col}`));
        const missing = Object.entries(EXPECTED_COLUMNS).flatMap(([table, cols]) =>
            cols.filter((c) => !have.has(`${table}.${c}`)).map((c) => `${table}.${c}`)
        );

        if (missing.length) {
            console.warn(`\n!! Connected to database "${dbName}", but it is missing: ${missing.join(', ')}`);
            console.warn('!! Room amenity assignment requires database/migration_room_amenities.sql.');
            console.warn('!! Apply the missing migration before using the Rooms amenity editor.\n');
        } else {
            console.log(`Database check OK ("${dbName}": promos, amenities and room rates are all in place).`);
        }
    } catch (error) {
        console.error(`\n!! Could not read the database (${error.code || error.message}).`);
        console.error('!! Check DB_HOST, DB_USER, DB_PASSWORD and DB_NAME in your .env file, and that MySQL is running.\n');
    }
}

const PORT = process.env.PORT || 9000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    checkDatabase();
});
