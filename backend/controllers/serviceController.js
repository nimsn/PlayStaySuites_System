const Model = require('../models/ServiceModel');

const isValidId = (id) => /^[1-9]\d*$/.test(String(id));
const fail = (res, e, action) => {
    if (e.status) return res.status(e.status).json({ message: e.message });
    console.error(`Service ${action} failed:`, e);
    return res.status(500).json({ message: `Unable to ${action} service.` });
};
const withId = (handler) => async (req, res) => {
    if (!isValidId(req.params.id)) return res.status(400).json({ message: 'Please provide a valid service ID.' });
    return handler(req, res, Number(req.params.id));
};

exports.list = async (req, res) => { try { res.json(await Model.list()); } catch (e) { fail(res, e, 'load'); } };
exports.get = withId(async (req, res, id) => { try { res.json(await Model.get(id)); } catch (e) { fail(res, e, 'load'); } });
exports.create = async (req, res) => { try { res.status(201).json({ message: 'Service created.', serviceId: await Model.create(req.body || {}) }); } catch (e) { fail(res, e, 'create'); } };
exports.update = withId(async (req, res, id) => { try { await Model.update(id, req.body || {}); res.json({ message: 'Service updated.' }); } catch (e) { fail(res, e, 'update'); } });
exports.remove = withId(async (req, res, id) => { try { await Model.remove(id); res.json({ message: 'Service deleted.' }); } catch (e) { fail(res, e, 'delete'); } });
