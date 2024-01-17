const User = require('./../Models/userModel');
const asyncErrorHandler = require('./../Utils/AsyncErrorHandler');
const jwt = require('jsonwebtoken');
const CustomError = require('./../Utils/CustomError');
const util = require('util');
const sendEmail = require('./../Utils/email');
const crypto = require('crypto');
const createSendResponse = require('../Utils/authResponse');

// const signToken = id => {
//     return jwt.sign({id}, process.env.SECRET_STR, {
//         expiresIn: process.env.LOGIN_EXPIRES
//     });
// }

// exports.createSendResponse = (user, statusCode, res) => {

//     const token = signToken(user._id);

//     res.status(statusCode).json({
//         status: 'success',
//         token,
//         data: {
//             user
//         }
//     });
// }

exports.signup = asyncErrorHandler(async (req, res, next) => {
    const newUser = await User.create(req.body);

    // jwt will not include the extra options payload like 'expiresIn'
    // const token = signToken(newUser._id);

    createSendResponse(newUser, 201, res);
});

exports.login = asyncErrorHandler(async (req, res, next) => {
    const {email, password} = req.body;

    if (!email || !password) {
        const error = new CustomError('Please provide email && password in the login', 400);
        return next(error);
    }

    //Check if user exists with given email and password
    //In the user schema, password has been set with 'select: false', so we don't leak it into the response
    // select('+password') is used to include the password (which is 'select: false) in the schema
    const user = await User.findOne({ email }).select('+password');

    //Instance method to check if the user exists & password matches 
    //(comparePasswordInDb is defined in userModel.js)
    if(!user || !(await user.comparePasswordInDb(password, user.password))) {
        console.log(user);
        const error = new CustomError('Incorrect email or password', 400);
        return next(error);
    }

    createSendResponse(user, 200, res);
    // const token = signToken(user._id);

    // res.status(200).json({
    //     status: 'success',
    //     token        
    // });
});

// Check if user is authenticated
exports.protect = asyncErrorHandler(async (req, res, next) => {
    //1. Read the token & check if it exists
    const testToken = req.headers.authorization;
    let token;
    if (testToken && testToken.toLowerCase().startsWith('bearer')) {
        token = testToken.split(' ')[1];
    }
    if(!token){
        next(new CustomError('You\'re not logged in!'), 401);
    }    

    //2. Validate the token
    const decodedToken = await util.promisify(jwt.verify)(token, process.env.SECRET_STR);

    //3. Check if the user exists (it could be deleted after the token was created)
    const user = await User.findById(decodedToken.id);
    if (!user) {
        const error = new CustomError('The user with the given token does not exist', 401);
        next(error);
    }

    //4. If the user changed password after the token was issued
    if (await user.isPasswordChanged(decodedToken.iat)) {
        const error = new CustomError('The password has been changed recently. Please, login again', 401);
        next(error);
    }

    //5. Allow user to access route
    // this will be useful later (see below) when checking authorization on routes
    req.user = user; 
    next();
});

//Check if user is authorized
//We have to use a wrapping function so we can pass the role to be allowed
exports.restrict = (role) => {
    return (req, res, next) => {
        if (req.user.role != role) {
            const error = new CustomError('You do not have permission to perform this action', 403);
            next(error);
        }
        next();
    };
};

//This is to allow multiple roles to perform a given action 
//authController.restrict('admin', 'test1')
// exports.restrict = (...role) => {
//     return (req, res, next) => {
//         if (!role.includes(req.user.role)) {
//             const error = new CustomError('You do not have permission to perform this action', 403);
//             next(error);
//         }
//         next();
//     };
// };

exports.forgotPassword = asyncErrorHandler(async (req, res, next) => {
    //1. Get user based on posted email
    const user = await User.findOne({email: req.body.email});
    if (!user) {
        const error = new CustomError('We could not find the user the given email', 404);
        next(error);
    }

    //2. Generate a random reset token
    const resetToken = await user.createResetPasswordToken();
    // validateBeforeSave is to skip validations on user model, we just need to send user's email
    user.save({validateBeforeSave: false})

    //3. Send the token back to the user's email
    const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
    const message = `We have received a password reset request. Please use the link below to reset your password\n\n${resetUrl}\n\nThis reset password link will be valid only for 10 minutes`;

    try {
        await sendEmail({
            email: user.email,
            subject: 'Password change request received',
            message: message
        });

        res.status(200).json({
            status: 'success',
            message: 'password reset link sent to the user email'
        });
    
    } catch (err) {
        //This will be exceuted if the sendEmail is not able to send a passwordReset email to the user
        user.passwordResetToken = undefined;
        user.passwordResetTokenExpires = undefined;
        user.save({validateBeforeSave: false});
        const error = 'There was an error sending password reset email. Please try again later';

        return next(new CustomError(error), 500);
    }});

exports.passwordReset = asyncErrorHandler(async (req, res, next) => {
    //1. Check if the user exists with the given token & token has not expired
    const token = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({passwordResetToken: token, passwordResetTokenExpires: {$gt: Date.now()}});

    if (!user) {
        const error = new CustomError("Token is invalid or has expired!", 400);
        next(error);
    }

    //2. Reseting the user password
    user.password = req.body.password;
    user.confirmPassword = req.body.confirmPassword;
    user.passwordResetToken = undefined;
    user.passwordResetTokenExpires = undefined;
    user.passwordChangedAt = Date.now();

    user.save();

    //3. Login user
    createSendResponse(user, 200, res);
    // const loginToken = signToken(user._id);

    // res.status(200).json({
    //     status: 'success',
    //     token: loginToken        
    // });

});

