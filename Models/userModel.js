const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

//name, email
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please enter your name']
    },
    email: {
        type: String,
        required: [true, 'Please enter an email'],
        unique: true,
        lowercase: true, // converts to lowercase before saving into DB,
        validate: [validator.isEmail, 'Please enter a valid email']
    },
    photo: String,
    password: {
        type: String,
        required: [true, 'Please enter a password'],
        minlength: 8
    },
    confirmPassword: {
        type: String,
        required: [true, 'Please confirm your password'],
        validate: {
            validator: function(val) {
                return val === this.password;
            },
            message: 'Password and ConfirmPassword do not match'
        }
    },
});

userSchema.pre('save', async function(next) {
    if(!this.isModified('password')) return next();

    // encrypt the password before saving it
    // 12=salt length (the higher the value, the longer it takes to compute the hash)
    this.password = await bcrypt.hash(this.password, 12); 
    this.confirmPassword = undefined;
    next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;