const express = require('express');
const moviesController = require('./../Controllers/moviesController');

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

router.route('/')
    .get(moviesController.getAllMovies)
    .post(moviesController.createMovie);
    // .post(moviesController.validateBody, moviesController.createMovie); //Use the middleware 'validateBody'

router.route('/:id')
    .get(moviesController.getMovie)
    .patch(moviesController.updateMovie)
    .delete(moviesController.deleteMovie);

module.exports = router;