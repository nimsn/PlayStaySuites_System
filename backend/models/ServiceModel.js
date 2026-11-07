const db = require('../config/db');

class ServiceError extends Error {
    constructor(message, status = 400) { super(message); this.status = status; }
}

const validate = (data) => {
    const service_name = String(data.service_name || '').trim();
    const unit_price = data.unit_price === '' || data.unit_price == null ? NaN : Number(data.unit_price);
    const category = data.category == null || String(data.category).trim() === '' ? null : String(data.category).trim();
    if (!service_name) throw new ServiceError('Service name is required.');
    if (!Number.isFinite(unit_price) || unit_price < 0) throw new ServiceError('Unit price must be zero or greater.');
    return { service_name, unit_price, category };
};

module.exports = {
    ServiceError,

    list: async () => {
        const [rows] = await db.query(`
            SELECT s.service_id, s.service_name, s.unit_price, s.category,
                   COUNT(bs.booking_service_id) AS times_used
            FROM services s
            LEFT JOIN booking_services bs ON bs.service_id = s.service_id
            GROUP BY s.service_id, s.service_name, s.unit_price, s.category
            ORDER BY s.category, s.service_name
        `);
        return rows;
    },

    get: async (id) => {
        const [[row]] = await db.query('SELECT service_id, service_name, unit_price, category FROM services WHERE service_id = ?', [id]);
        if (!row) throw new ServiceError('Service not found.', 404);
        return row;
    },

    create: async (data) => {
        const v = validate(data);
        const [r] = await db.query('INSERT INTO services (service_name, unit_price, category) VALUES (?, ?, ?)', [v.service_name, v.unit_price, v.category]);
        return r.insertId;
    },

    update: async (id, data) => {
        const v = validate(data);
        const [r] = await db.query('UPDATE services SET service_name = ?, unit_price = ?, category = ? WHERE service_id = ?', [v.service_name, v.unit_price, v.category, id]);
        if (!r.affectedRows) throw new ServiceError('Service not found.', 404);
    },

    remove: async (id) => {
        const [[{ n }]] = await db.query('SELECT COUNT(*) AS n FROM booking_services WHERE service_id = ?', [id]);
        if (n > 0) throw new ServiceError(`This service is used on ${n} booking line${n === 1 ? '' : 's'} and cannot be deleted.`, 409);
        const [r] = await db.query('DELETE FROM services WHERE service_id = ?', [id]);
        if (!r.affectedRows) throw new ServiceError('Service not found.', 404);
    },
};
