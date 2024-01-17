
const User = require('./../Models/userModel');
const asyncErrorHandler = require('./../Utils/AsyncErrorHandler');
const jwt = require('jsonwebtoken');
const CustomError = require('./../Utils/CustomError');
const util = require('util');
const sendEmail = require('./../Utils/email');
const crypto = require('crypto');
const createSendResponse = require('../Utils/authResponse');

// filter out the properties we don't want to update
const filterReqObj = (obj, ...allowedFields) => {
    const newObj = {};
    Object.keys(obj).forEach(prop => {
        if (allowedFields.includes(prop)) {
            newObj[prop] = obj[prop];
        }
    });
    return newObj;
};

exports.updatePassword = asyncErrorHandler(async (req, res, next) => {

    //GETCURRENT USER DATA FROM DATABASE
    //The user has previously been set in the request by the protect middleware
    //We need to include the password, which is not in the returned data by default
    const user = await User.findById(req.user._id).select('+password');

    //CHECK IF THE SUPPLIED CURRENT PASSWORD IS CORRECT
    //password in DB is encrypted, but new supplied one is not
    //the method will encrypt the new password then do the comparison
    if(!(await user.comparePasswordInDb(req.body.currentPassword, user.password))) {
        return next(new CustomError('The current password you provided is wrong', 401));
    }

    //IF SUPPLIED PASSWORD IS CORRECT, UPDATE USER PASSWORD WITH NEW VALUE
    user.password = req.body.newPassword;
    user.confirmPassword = req.body.confirmPassword;
    user.passwordChangedAt = Date.now();
    console.log(user.password, user.confirmPassword);
    await user.save();

    //LOGIN USER AND SEND JWT
    createSendResponse(user, 200, res);
    // const token = signToken(user._id);
    // res.status(200).json({
    //     status: 'success',
    //     token,
    //     data: {
    //         user
    //     }
    // });
});

exports.updateMe = asyncErrorHandler(async (req, res, next) => {
    //1. Check if request data contain password | confirmPassword
    if(req.body.password || req.body.confirmPassword) {
        const error = new CustomError('You cannot update your password using this endpoint', 400);
        return next(error);
    }

    //2. Update user details
    const filterObj = filterReqObj(req.body, 'name', 'role');
    const updatedUser = await User.findByIdAndUpdate(req.user._id, filterObj, {runValidators: true, new: true});

    res.status(200).json({
        status: 'success',        
        user: updatedUser
        
    });
});