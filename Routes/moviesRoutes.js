const express = require('express');
const moviesController = require('./../Controllers/moviesController');
const authController = require('./../Controllers/authController');

const router = express.Router();

//Use a param middleware
// router.param('id', moviesController.checkId);
// router.param('id', (req, res, next, value) => {
//     console.log('Movie ID is ' + value);
//     next();
// });

//Aliasing a route
router.route('/highest-rated')
    .get(moviesController.getHighestRated, moviesController.getAllMovies)

//Aggregate pipeline functions    
router.route('/movie-stats')
    .get(moviesController.getMovieStats);

router.route('/movie-by-genre/:genre')
    .get(moviesController.getMovieByGenre);

router.route('/')
    .get(authController.protect, moviesController.getAllMovies)
    .post(moviesController.createMovie);
    // .post(moviesController.validateBody, moviesController.createMovie); //Use the middleware 'validateBody'

router.route('/:id')
    .get(authController.protect, moviesController.getMovie)
    .patch(moviesController.updateMovie)
    .delete(authController.protect, authController.restrict('admin'), moviesController.deleteMovie);

module.exports = router;