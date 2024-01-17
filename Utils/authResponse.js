const jwt = require('jsonwebtoken');

const signToken = id => {
    return jwt.sign({id}, process.env.SECRET_STR, {
        expiresIn: process.env.LOGIN_EXPIRES
    });
}

const createSendResponse = (user, statusCode, res) => {
    const token = signToken(user._id);

    const options = {
        maxAge: process.env.LOGIN_EXPIRES,
        httpOnly: true //makes sure the cookie cannot be accessed or modified by the browser;
    };

    if (process.env.NODE_ENV === 'production') {
        options.secure = true //makes sure the cookie is only sent on https
    }

    res.cookie('jwt', token, options);

    user.password = undefined;

    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user
        }
    });
};

module.exports = createSendResponse;