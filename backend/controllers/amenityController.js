const Model = require('../models/AmenityModel');
const fail = (res, e, action) => {
    if (e.status) return res.status(e.status).json({ message: e.message });
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'That amenity already exists.' });
    console.error(`Amenity ${action} failed:`, e);
    return res.status(500).json({ message: `Unable to ${action} amenity.` });
};
exports.list = async (req, res) => { try { res.json(await Model.list()); } catch (e) { fail(res, e, 'load'); } };
exports.create = async (req, res) => { try { res.status(201).json({ message: 'Amenity created.', amenityId: await Model.create(req.body || {}) }); } catch (e) { fail(res, e, 'create'); } };
exports.update = async (req, res) => { try { await Model.update(Number(req.params.id), req.body || {}); res.json({ message: 'Amenity updated.' }); } catch (e) { fail(res, e, 'update'); } };
exports.remove = async (req, res) => { try { await Model.remove(Number(req.params.id)); res.json({ message: 'Amenity deleted.' }); } catch (e) { fail(res, e, 'delete'); } };
