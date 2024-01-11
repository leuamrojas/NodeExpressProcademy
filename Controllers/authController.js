const User = require('./../Models/userModel');
const asyncErrorHandler = require('./../Utils/AsyncErrorHandler');
const jwt = require('jsonwebtoken');
const CustomError = require('./../Utils/CustomError');
const util = require('util');

const signToken = id => {
    return jwt.sign({id}, process.env.SECRET_STR, {
        expiresIn: process.env.LOGIN_EXPIRES
    });
}

exports.signup = asyncErrorHandler(async (req, res, next) => {
    const newUser = await User.create(req.body);

    // jwt will not include the extra options payload like 'expiresIn'
    const token = signToken(newUser._id);

    res.status(201).json({
        status: 'success',
        token,
        data: {
            user: newUser
        }
    });
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

    console.log(user);
    //Check if the user exists & password matches (comparePasswordInDb is defined in userModel.js)
    if(!user || !(await user.comparePasswordInDb(password, user.password))) {
        console.log(user);
        const error = new CustomError('Incorrect email or password', 400);
        return next(error);
    }

    const token = signToken(user._id);

    res.status(200).json({
        status: 'success',
        token        
    });
});

// Check if user is authenticated
exports.protect = asyncErrorHandler(async (req, res, next) => {
    //1. Read the token & check if it exists
    const testToken = req.headers.authorization;
    // console.log(req.headers);
    console.log(testToken);
    let token;

    if (testToken && testToken.toLowerCase().startsWith('bearer')) {
        token = testToken.split(' ')[1];
    }

    if(!token){
        next(new CustomError('You\'re not logged in!'), 401);
    }    

    //2. Validate the token
    const decodedToken = await util.promisify(jwt.verify)(token, process.env.SECRET_STR);

    console.log(decodedToken);

    //3. Check if the user exists

    //4. If the user changed password after the token was issued

    //5. Allow user to access route
    next();
});