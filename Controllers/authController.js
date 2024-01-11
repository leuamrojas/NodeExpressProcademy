const User = require('./../Models/userModel');
const asyncErrorHandler = require('./../Utils/AsyncErrorHandler');

exports.signup = asyncErrorHandler(async (req, res, next) => {
    const newUser = await User.create(req.body);

    res.status(201).json({
        status: 'success',
        data: {
            user: newUser
        }
    });
});