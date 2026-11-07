const db = require('../config/db');
class PromoError extends Error { constructor(message, status = 400) { super(message); this.status = status; } }
const validate = (d) => {
    const promo_code = String(d.promo_code || '').trim().toUpperCase();
    const discount_percentage = Number(d.discount_percentage);
    const description = d.description == null ? null : String(d.description).trim();
    const asSqlDateTime = (value) => { if (!value) return null; const raw = String(value).replace('T', ' '); return raw.length === 16 ? raw + ':00' : raw.slice(0, 19); };
    const valid_from = asSqlDateTime(d.valid_from);
    const valid_until = asSqlDateTime(d.valid_until);
    if (!promo_code) throw new PromoError('Promotion code is required.');
    if (!Number.isFinite(discount_percentage) || discount_percentage < 0 || discount_percentage > 100) throw new PromoError('Discount must be between 0 and 100 percent.');
    if (valid_from && valid_until && new Date(valid_until) <= new Date(valid_from)) throw new PromoError('End date must be later than start date.');
    return { promo_code, discount_percentage, description, valid_from, valid_until };
};

module.exports = {
    PromoError,
    list: async () => { const [rows] = await db.query('SELECT promo_id, promo_code, discount_percentage, description, valid_from, valid_until FROM promos ORDER BY promo_code'); return rows; },
    active: async () => { const [rows] = await db.query(`SELECT promo_id, promo_code, discount_percentage, description, valid_from, valid_until FROM promos WHERE (valid_from IS NULL OR valid_from <= NOW()) AND (valid_until IS NULL OR valid_until >= NOW()) ORDER BY promo_code`); return rows; },
    create: async (d) => { const v = validate(d); const [r] = await db.query('INSERT INTO promos (promo_code, discount_percentage, description, valid_from, valid_until) VALUES (?, ?, ?, ?, ?)', [v.promo_code, v.discount_percentage, v.description, v.valid_from, v.valid_until]); return r.insertId; },
    update: async (id, d) => { const v = validate(d); const [r] = await db.query('UPDATE promos SET promo_code = ?, discount_percentage = ?, description = ?, valid_from = ?, valid_until = ? WHERE promo_id = ?', [v.promo_code, v.discount_percentage, v.description, v.valid_from, v.valid_until, id]); if (!r.affectedRows) throw new PromoError('Promotion not found.', 404); },
    remove: async (id) => { const [r] = await db.query('DELETE FROM promos WHERE promo_id = ?', [id]); if (!r.affectedRows) throw new PromoError('Promotion not found.', 404); }
};
