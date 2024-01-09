// const fs = require('fs');
const Movie = require('./../Models/movieModel');
const ApiFeatures = require('./../Utils/ApiFeatures');

//Middleware for aliasing a route
exports.getHighestRated = (req, res, next) => {
    req.query.limit = '5';
    req.query.sort = '-ratings';

    next();
}

//Route handler functions
exports.getAllMovies = async (req, res) => {
    try {

        const features = new ApiFeatures(Movie.find(), req.query)
            .filter()
            .sort()
            .limit()
            .paginate();

        const movies = await features.query;

        // //FILTERS like: duration[gte]=118&ratings[gte]=7&price[lte]=100 will be changed to $gte, etc...
        // let queryStr = JSON.stringify(req.query);
        // queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);        
        // const queryObj = JSON.parse(queryStr);        

        // // const movies = await Movie.find(queryObj);   

        // //When you send additional filters like sort or page, this works only on Mongoose version 7.0 (doesn't work for 8.0)
        // // const movies = await Movie.find(req.query);   
        
        // //************ Mongoose 6.0 or less (or 8.0)**************
        // const excludeFields = ['sort', 'page', 'limit', 'fields'];
        // // console.log("before: " + JSON.stringify(queryObj));        
        // // const queryObj = {...req.query}; //Create shallow copy of the object
        // excludeFields.forEach((el) => {
        //     delete queryObj[el];
        // });
        // // console.log("after: " + JSON.stringify(queryObj));        
        // // const movies = await Movie.find(queryObj);    
        // /******************************************/    
        // let query = Movie.find(queryObj);

        // //SORTING LOGIC (use - before the field to sort in descending order)
        // if(req.query.sort) {            
        //     const sortBy = req.query.sort.split(",").join(" "); //sort filters must be separated by space
        //     // const s = { releaseYear: 1 };
        //     query = query.sort(sortBy);            
        // }
        //  else {
        //     query = query.sort('createdAt'); //default sort order
        // }

        // //LIMITING FIELDS (to exclude fields use -before the field in the query string (e.g. -duration))
        // if(req.query.fields){
        //     const fields = req.query.fields.split(",").join(" ");
        //     query = query.select(fields); //you could also use field property 'select: false' in the schema to hide it
        // } else {
        //     query = query.select('-__v'); //if no field is specified, it will remove '__v' by default
        // }

        // //PAGINATION
        // const page = +req.query.page || 1;
        // const limit = +req.query.limit || 10;
        // //PAGE 1: 1-10; PAGE 2: 11-20; PAGE 3: 21-30
        // const skip = (page-1) * limit;
        // query = query.skip(skip).limit(limit);

        // if(req.query.page) {
        //     const moviesCount = await Movie.countDocuments();
        //     if(skip >= moviesCount){
        //         throw new Error("This page is not found!");
        //     }
        // }

        // const movies = await query;

        //Mongoose special functions (Not suitable for all cases)
        // const movies = await Movie.find()
        //             .where('duration')
        //             .gte(req.query.duration)
        //             .where('ratings')
        //             .gte(req.query.ratings);

        res.status(200).json({
            status: 'success',
            length: movies.length,
            data: {
                movies
            }
        });
    } catch (err) {
        res.status(404).json({
            status: 'fail',
            message: err.message
        });
    }
};

exports.getMovie = async (req, res) => {
    try {
        // const movies = await Movie.find({_id: req.params.id});
        const movie = await Movie.findById(req.params.id);

        res.status(200).json({
            status: 'success',
            data: {
                movie
            }
        });
    } catch (err) {
        res.status(404).json({
            status: 'fail',
            message: err.message
        });
    }
};

exports.createMovie = async (req, res) => {
    // const testMovie = new Movie({});
    // testMovie.save();
    try {
        const movie = await Movie.create(req.body);
        res.status(201).json({
            status: 'success',
            data: {
                movie
            }
        })
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        })
    }
};

exports.updateMovie = async (req, res) => {
    try {
        // new: true will return the document after the update has been applied
        // runValidators: true will run validators defined in the Schema
        const updatedMovie = await Movie.findByIdAndUpdate(req.params.id, req.body, {new: true, runValidators: true}); 

        res.status(200).json({
            status: 'success',
            data: {
                movie: updatedMovie
            }
        })
    } catch (err) {
        res.status(404).json({
            status: 'fail',
            message: err.message
        });
    }
};

exports.deleteMovie = async (req, res) => {
    try {
        await Movie.findByIdAndDelete(req.params.id); 

        res.status(204).json({
            status: 'success',
            data: null
        })
    } catch (err) {
        res.status(404).json({
            status: 'fail',
            message: err.message
        });
    }
};

exports.getMovieStats = async (req, res) => {
    try {
        const stats = await Movie.aggregate([
            { $match: {ratings: { $gte: 4.5 }} },
            { $group: {
                _id: '$releaseYear', // set to null if you want for one group with all the movies
                avgRating: { $avg: '$ratings' },
                avgPrice: { $avg: '$price' },
                minPrice: { $min: '$price' },
                maxPrice: { $max: '$price' },
                priceTotal: { $sum: '$price' },
                moviesCount: { $sum: 1 },
            }},
            { $sort: { minPrice: -1 } },
            { $match: { maxPrice: { $gte: 60 } } }
        ]);

        res.status(200).json({
            count: stats.length,
            status: 'success',
            data: stats
        })
    } catch (err) {
        res.status(404).json({
            status: 'fail',
            message: err.message
        });
    }
}

exports.getMovieByGenre = async (req, res) => {
    try {
        const genre = req.params.genre;
        const movies = await Movie.aggregate([
            { $unwind: '$genres' }, //deconstructs an array field from the input documents to output a document for each element
            { $group: { 
                _id: '$genres',
                moviesCount: { $sum: 1 },
                movies: { $push: '$name' }
            }},
            { $addFields: { genre: '$_id' } },
            { $project: { _id: 0 } }, // 0=remove field from result           
            { $sort: { moviesCount: -1 } },
            { $match: { genre: genre } }
        ]);

        res.status(200).json({
            count: movies.length,
            status: 'success',
            data: movies
        })
    } catch (err) {
        res.status(404).json({
            status: 'fail',
            message: err.message
        });
    }
}

// let movies = JSON.parse(fs.readFileSync('./data/movies.json'));

//In express.js most of the things are done through middleware

//Param middleware to check the movie with id exists
// exports.checkId = (req, res, next, value) => {
//     console.log('Movie ID is ' + value);

//     //Find movie based on id parameter
//     let movie = movies.find(el => el.id === +value);

//     if (!movie) {
//         return res.status(404).json({
//             status: "fail",
//             message: "Movie with ID " + value + " is not found"
//         });
//     }

//     next();
// };

// exports.validateBody = (req, res, next) => {
//     if(!req.body.name || !req.body.releaseYear){
//         return res.status(400).json({
//             status: 'fail',
//             message: 'Not a valid movie data'
//         });
//     }
//     next();
// }

// //Route handler functions
// exports.getAllMovies = (req, res) => {
//     res.status(200).json({
//         status: "success",
//         count: movies.length,
//         data: {
//             movies: movies
//         }
//     });
// };

// exports.getMovie = (req, res) => {
//     //Convert id to number type
//     const id = req.params.id * 1; // or +req.params.id

//     //Find movie based on id parameter
//     let movie = movies.find(el => el.id === id);

//     // if (!movie) {
//     //     return res.status(404).json({
//     //         status: "fail",
//     //         message: "Movie with ID " + id + " is not found"
//     //     });
//     // }

//     res.status(200).json({
//         status: "success",
//         data: {
//             movies: movie
//         }
//     });
// };

// exports.createMovie = (req, res) => {
//     const newId = movies[movies.length-1].id + 1;

//     const newMovie = Object.assign({id: newId}, req.body) // create new object for not to mutate the original
    
//     movies.push(newMovie);

//     fs.writeFile('./data/movies.json', JSON.stringify(movies), () => {
//         res.status(201).json({
//             status: "success",
//             data: {
//                 movie: newMovie
//             }
//         })
//     })
// };

// exports.updateMovie = (req, res) => {
//     const id = req.params.id * 1; // or +req.params.id
//     const  movieToUpdate = movies.find(el => el.id === id);

//     // if (!movieToUpdate) {
//     //     return res.status(404).json({
//     //         status: "fail",
//     //         message: "Movie with ID " + id + " is not found"
//     //     });
//     // }

//     const movieIndex = movies.indexOf(movieToUpdate);   

//     Object.assign(movieToUpdate, req.body);

//     movies[movieIndex] = movieToUpdate;

//     fs.writeFile('./data/movies.json', JSON.stringify(movies), (err) => {
//         res.status(200).json({
//             status: "success",
//             data: {
//                 movie: movieToUpdate
//             }
//         })
//     })
// };

// exports.deleteMovie = (req, res) => {
//     const id = req.params.id * 1; // or +req.params.id
//     const  movieToDelete = movies.find(el => el.id === id);
    
//     // if (!movieToDelete) {
//     //     return res.status(404).json({
//     //         status: "fail",
//     //         message: "Movie with ID " + id + " is not found"
//     //     });
//     // }
    
//     const movieIndex = movies.indexOf(movieToUpdate);

//     movies.splice(movieIndex, 1);

//     fs.writeFile('./data/movies.json', JSON.stringify(movies), (err) => {
//         res.status(204).json({
//             status: "success",
//             data: {
//                 movie: null
//             }
//         })
//     })
// };
