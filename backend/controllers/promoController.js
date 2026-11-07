const Model = require('../models/PromoModel');
const fail = (res, e, action) => {
    if (e.status) return res.status(e.status).json({ message: e.message });
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'That promotion code already exists.' });
    if (e.code === 'ER_ROW_IS_REFERENCED_2') return res.status(409).json({ message: 'This promotion is already used by a booking and cannot be deleted.' });
    console.error(`Promotion ${action} failed:`, e);
    return res.status(500).json({ message: `Unable to ${action} promotion.` });
};
exports.list = async (req, res) => { try { res.json(await Model.list()); } catch (e) { fail(res, e, 'load'); } };
exports.active = async (req, res) => { try { res.json(await Model.active()); } catch (e) { fail(res, e, 'load'); } };
exports.create = async (req, res) => { try { res.status(201).json({ message: 'Promotion created.', promoId: await Model.create(req.body || {}) }); } catch (e) { fail(res, e, 'create'); } };
exports.update = async (req, res) => { try { await Model.update(Number(req.params.id), req.body || {}); res.json({ message: 'Promotion updated.' }); } catch (e) { fail(res, e, 'update'); } };
exports.remove = async (req, res) => { try { await Model.remove(Number(req.params.id)); res.json({ message: 'Promotion deleted.' }); } catch (e) { fail(res, e, 'delete'); } };
