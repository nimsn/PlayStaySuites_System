const UserModel = require('../models/UserModel');

const handleError = (res, error, action) => {
    if (error.status) {
        return res.status(error.status).json({ message: error.message });
    }
    if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ message: 'Email, phone number or student ID is already in use.' });
    }
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
        return res.status(400).json({ message: 'The selected role does not exist.' });
    }

    console.error(Error trying to ${action}:, error);
    return res.status(500).json({ message: Unable to ${action} at the moment. });
};

const isValidId = (id) => /^[1-9]\d*$/.test(String(id));

exports.getUsers = async (req, res) => {
    try {
        const users = await UserModel.getAllUsers();

        return res.status(200).json(users);
    } catch (error) {
        return handleError(res, error, 'get users');
    }
};

exports.getRoles = async (req, res) => {
    try {
        const roles = await UserModel.getRoles();

        return res.status(200).json(roles);
    } catch (error) {
        return handleError(res, error, 'get roles');
    }
};

exports.addUser = async (req, res) => {
    try {
        const userId = await UserModel.createUser(req.body || {});

        return res.status(201).json({
            message: 'User added successfully.',
            userId: userId
        });
    } catch (error) {
        return handleError(res, error, 'add user');
    }
};

exports.editUser = async (req, res) => {
    try {
        const userId = req.params.id;

        if (!isValidId(userId)) {
            return res.status(400).json({
                message: 'Please provide a valid user ID.'
            });
        }

        await UserModel.updateUser(Number(userId), req.body || {});

        return res.status(200).json({
            message: 'User updated successfully.'
        });
    } catch (error) {
        return handleError(res, error, 'update user');
    }
};

exports.removeUser = async (req, res) => {
    try {
        const userId = req.params.id;

        if (!isValidId(userId)) {
            return res.status(400).json({
                message: 'Please provide a valid user ID.'
            });
        }

        await UserModel.deleteUser(Number(userId));

        return res.status(200).json({
            message: 'User deleted successfully.'
        });
    } catch (error) {
        return handleError(res, error, 'delete user');
    }
};


exports.getInactiveReport = async (req, res) => {
    try {
        const inactiveUsers = await UserModel.getInactiveUsersReport();

        return res.status(200).json(inactiveUsers);
    } catch (error) {
        return handleError(res, error, 'get inactive users report');
    }
};