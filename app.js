const express = require('express');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const sanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const CustomError = require ('./Utils/CustomError');
const globalErrorHandler = require('./Controllers/errorController');
const moviesRouter = require('./Routes/moviesRoutes');
const authRouter = require('./Routes/authRoutes');
const userRouter = require('./Routes/userRoutes');

let app = express();

// adds security HTTP response headers
app.use(helmet()); 

//This will create 3 new headers in the response:
//X-Powered-By, X-RateLimit, X-RateLimit-Remaining
//The rate limit values will be reset on app restart
let limiter = rateLimit({
    max: 3, //number of requests to be allowed
    widnowMs: 60 * 60 * 1000, //timeframe in milliseconds,
    message: 'We have received too many requests from this IP. Please, try after 1 hour.'
});

app.use('/api', limiter);
// Adds a middleware to add the request body to the request object
// Will only accept 10kb in the request body
app.use(express.json({limit: '10kb'})); 

// Will look for any NoSQL query in the body and filter out all the '$' and '.'
// so operators injected no longer work
app.use(sanitize());
// Works removing or encoding potentially dangerous characters and scripts from user input.
app.use(xss());
// Avoid http parameter polution (e.g {{URL}}api/v1/movies?sort=price&sort=duration 
// the sort parameter value in the query string is converted to an array: [price, duration], which is a problem in the sort() function)
// app.use(hpp());
// Using hpp(), it will ONLY apply the last value of sort and omit the previous ones 
// You need to whitelist the fields you don't want to have that behavior:
//  app.use(hpp({whitelist: [
//     'duration',
//     'ratings',
//     'releaseYear'
// ]}));

app.use(express.static('./public')); // Serve static files
// app.get('/api/v1/movies', getAllMovies);
// app.get('/api/v1/movies/:id', getMovie);
// app.post('/api/v1/movies', createMovie);
// app.patch('/api/v1/movies/:id', updateMovie);
// app.delete('/api/v1/movies/:id', deleteMovie);

//Mount the rout;er moviesRouter to path /api/v1/movies. The router is basically a middleware 
//that will only be applied to those requests that contain the path in the url
app.use('/api/v1/movies', moviesRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/user', userRouter);

//will execute for all the urls for which we have not defined a route
//must always come last in the defined routes (if placed first, '/api/v1/movies' route would match the '*' pattern)
app.all('*', (req, res, next) => {
    // res.status(404).json({
    //     status: 'fail',
    //     message: `Can't find ${req.originalUrl} on the server!`
    // });
    // Replaced these lines with CustomError class
    // const err = new Error(`Can't find ${req.originalUrl} on the server!`);
    // err.status = 'fail';
    // err.statusCode = 404;

    const err = new CustomError(`Can't find ${req.originalUrl} on the server!`, 404);

    // whenever we pass any object to 'next()', express assumes there was an error
    // and will skip all other middleware functions in the stack 
    // and directly call the global error handling middleware function
    next(err); 
});

//Global Error Handling Middleware
app.use(globalErrorHandler);


module.exports = app;