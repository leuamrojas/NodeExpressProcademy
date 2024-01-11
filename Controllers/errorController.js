
const CustomError = require ('./../Utils/CustomError');

const devErrors = (res, error) => {
    res.status(error.statusCode).json({
        status: error.statusCode,
        message: error.message,
        stackTrace: error.stack,
        error: error
    });
}

const castErrorHandler = (err) => {
    const msg = `Invalid value for ${err.path}: ${err.value}`;
    return new CustomError(msg, 400);
}

const duplicateKeyErrorHandler = (err) => {
    const msg = `There is already a movie with name ${err.keyValue.name}. Please use another name`;
    return new CustomError(msg, 400);
}

const validationErrorHandler = (err) => {
    const errors = Object.values(err.errors).map(val => val.message);
    const errorMessages = errors.join('. ');
    const msg = `Invalid input data: ${errorMessages}`;    
    return new CustomError(msg, 400);    
}

const tokenExpiredErrorHandler = (err) => {
    return new CustomError('Token has expired. Please, login again!', 401);
}

const jsonWebTokenErrorHandler = (err) => {
    return new CustomError('Invalid token. Please, login again!', 401);
}

const prodErrors = (res, error) => {
    if (error.isOperational) { // Errors that we want to send to the client. They're created by creating a CustomError object
        res.status(error.statusCode).json({
            status: error.statusCode,
            message: error.message,
        });
    } else { 
        // Programmer or server side errors. Also errors created by Mongoose (e.g. validation errors). 
        // Those are not operational (it is fixed below with custom error handlers)
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong! Please, try again later.'
        });
    }    
}

module.exports = (error, req, res, next) => {
    error.statusCode = error.statusCode || 500;
    error.status = error.status || 'error';

    if (process.env.NODE_ENV === 'development') {
        devErrors(res, error);
    } else if (process.env.NODE_ENV === 'production') {
        if (error.name === 'CastError') error = castErrorHandler(error);
        if (error.code === 11000) error = duplicateKeyErrorHandler(error);
        if (error.name === 'ValidationError') error = validationErrorHandler(error); //Mongoose validation errors 
        if (error.name === 'TokenExpiredError') error = tokenExpiredErrorHandler(error);
        if (error.name === 'JsonWebTokenError') error = jsonWebTokenErrorHandler(error);
        //ReferenceError (e.g. variable not defined) will not show up in production because it's not operational

        prodErrors(res, error);
    }    
};