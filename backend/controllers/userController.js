const UserModel = require('../models/UserModel');

exports.getUsers = async (req, res) => {
    try {
        const users = await UserModel.getAllUsers();
        res.status(200).json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.addUser = async (req, res) => {
    try {
        const id = await UserModel.createUser(req.body);
        res.status(201).json({ message: 'User created successfully', userId: id });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.removeUser = async (req, res) => {
    try {
        await UserModel.deleteUser(req.params.id);
        res.status(200).json({ message: 'User deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getInactiveReport = async (req, res) => {
    try {
        const report = await UserModel.getInactiveUsersReport();
        res.status(200).json(report);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};