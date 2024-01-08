const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({path: './config.env'});

const app = require('./app');

console.log(process.env);

mongoose.connect(process.env.CONN_STR, {
    useNewUrlParser: true
}).then((conn) => {
    // console.log(conn);
    console.log('DB Connection Successful');
}).catch((error) => {
    console.log('Some error has occured')
});

// const testMovie = new Movie({
//     name: 'Intersteller',
//     description: 'Sci-fi movie',
//     duration: 139,    
// });

// testMovie.save()
// .then(doc => {
//     console.log(doc);
// })
// .catch(err => {
//     console.log('Error occured: ' + err);
// });

//Create a server
const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log('server has started...');
});