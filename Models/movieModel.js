const mongoose = require('mongoose');
const fs = require('fs');

const movieSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required field!'],
        unique: true,
        trim: true
    },
    description: { 
        type: String,
        required: [true, 'Description is required field!'],
        trim: true
    },
    duration: {
        type: Number,
        required: [true, 'Duration is required field!']
    },
    ratings: {
        type: Number
    },
    totalRating: {
        type: Number
    },
    releaseYear: {
        type: Number,
        required: [true, 'Release Year is required field!']
    },
    releaseDate: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now()
    },
    genres: {
        type: [String],
        required: [true, 'Genres is required field!']
    },
    directors: {
        type: [String],
        required: [true, 'Directors is required field!']
    },
    coverImage: { 
        type: String,
        required: [true, 'Cover image is required field!']
    },
    actors: {
        type: [String],
        required: [true, 'Actors is required field!']
    },
    price: {
        type: Number,
        required: [true, 'Price is required field!']
    },
    createdBy: string
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true } //Make it accesible to use from code
});

//Create virtual properties
movieSchema.virtual('durationInHours').get(function() {
  return this.duration / 60; // we don't use arrow function because it doesn't have its own 'this' keyword  
});

//Document Middleware: executed before the document is saved in DB
//.save() or .create()
//insertMany, findByIdAndUpdate will not work
//You can have multiple middlewares and they will be executed in the order of appearance
movieSchema.pre('save', function(next) {
    this.createdBy = 'LOGGED_IN_USER'; //We add the logged in username before the doc is saved (pre-hook on save event)

    next();
});

movieSchema.post('save', function(doc, next) {
    const content = `A new movie document with name ${doc.name} has been created by ${doc.createdBy}\n`;
    fs.writeFileSync('./Log/log.txt', content, {flag: 'a'}, (err) => {
        console.log(err.message);
    });

    next();
});

const Movie = mongoose.model('Movie', movieSchema);

module.exports = Movie;