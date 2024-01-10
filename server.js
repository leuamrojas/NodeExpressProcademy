const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({path: './config.env'});

//These event handler should always be at the top (before require 'app'), so they can capture the exception
process.on('uncaughtException', (err) => {
    console.log(err.name);
    console.log(err.message);
    console.log('Uncaught exception occured! Shutting down...');
    process.exit(1); // 1 = uncaught exception    
});

const app = require('./app');

console.log(process.env);

mongoose.connect(process.env.CONN_STR, {
    useNewUrlParser: true
}).then((conn) => {
    // console.log(conn);
    console.log('DB Connection Successful');
});

//Create a server
const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
    console.log('server has started...');
});

//whenever there is a unhandled rejected promise
process.on('unhandledRejection', (err) => {
    console.log(err.name);
    console.log(err.message);
    console.log('Unhandled rejection occured! Shutting down...');

    server.close(() => {
        process.exit(1); // 1 = uncaught exception
    });    
});