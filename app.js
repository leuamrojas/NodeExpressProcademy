const { fail } = require('assert');
const express = require('express');

const moviesRouter = require('./Routes/moviesRoutes')

let app = express();

app.use(express.json()); // Adds a middleware to add the request body to the request object
app.use(express.static('./public')); // Serve static files
// app.get('/api/v1/movies', getAllMovies);
// app.get('/api/v1/movies/:id', getMovie);
// app.post('/api/v1/movies', createMovie);
// app.patch('/api/v1/movies/:id', updateMovie);
// app.delete('/api/v1/movies/:id', deleteMovie);

//Mount the router moviesRouter to path /api/v1/movies. The router is basically a middleware 
//that will only be applied to those requests that contain the path in the url
app.use('/api/v1/movies', moviesRouter);
app.use('/api/v1/users', moviesRouter);

//will execute for all the urls for which we have not defined a route
//must always come last in the defined routes (if placed first, '/api/v1/movies' route would match the '*' pattern)
app.all('*', (req, res, next) => {
    res.status(404).json({
        status: 'fail',
        message: `Can't find ${req.originalUrl} on the server!`
    })
});


module.exports = app;