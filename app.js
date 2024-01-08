const { fail } = require('assert');
const express = require('express');

const moviesRouter = require('./Routes/moviesRoutes')

let app = express();

app.use(express.json()); // Adds a middleware to add the request body to the request object
app.use(express.static('./public'));
// app.get('/api/v1/movies', getAllMovies);
// app.get('/api/v1/movies/:id', getMovie);
// app.post('/api/v1/movies', createMovie);
// app.patch('/api/v1/movies/:id', updateMovie);
// app.delete('/api/v1/movies/:id', deleteMovie);

//Mount the router moviesRouter to path /api/v1/movies. The router is basically a middleware 
//that will only be applied to those requests that contain the path in the url
app.use('/api/v1/movies', moviesRouter);

module.exports = app;