const db = require('../config/db');

class AmenityError extends Error {
    constructor(message, status = 400) { super(message); this.status = status; }
}

const validate = (data) => {
    const amenity_name = String(data.amenity_name || '').trim();
    const price = data.price === '' || data.price == null ? 0 : Number(data.price);
    const description = data.description == null ? null : String(data.description).trim();
    if (!amenity_name) throw new AmenityError('Amenity name is required.');
    if (!Number.isFinite(price) || price < 0) throw new AmenityError('Price must be zero or greater.');
    return { amenity_name, price, description };
};

module.exports = {
    AmenityError,
    list: async () => {
        const [rows] = await db.query('SELECT amenity_id, amenity_name, price, description FROM amenities ORDER BY amenity_name');
        return rows;
    },
    create: async (data) => {
        const v = validate(data);
        const [r] = await db.query('INSERT INTO amenities (amenity_name, price, description) VALUES (?, ?, ?)', [v.amenity_name, v.price, v.description]);
        return r.insertId;
    },
    update: async (id, data) => {
        const v = validate(data);
        const [r] = await db.query('UPDATE amenities SET amenity_name = ?, price = ?, description = ? WHERE amenity_id = ?', [v.amenity_name, v.price, v.description, id]);
        if (!r.affectedRows) throw new AmenityError('Amenity not found.', 404);
    },
    remove: async (id) => {
        try {
            const [r] = await db.query('DELETE FROM amenities WHERE amenity_id = ?', [id]);
            if (!r.affectedRows) throw new AmenityError('Amenity not found.', 404);
        } catch (e) {
            if (e.code === 'ER_ROW_IS_REFERENCED_2') throw new AmenityError('This amenity is assigned to a room or booking. Remove those assignments first.', 409);
            throw e;
        }
    }
};
