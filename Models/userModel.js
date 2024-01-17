const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

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
    role: {
        type: String,
        enum: ['user', 'admin', 'test1'],
        default: 'user'
    },
    password: {
        type: String,
        required: [true, 'Please enter a password'],
        minlength: 8,
        select: false
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
    active: {
        type: Boolean,
        default: true,
        select: false
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetTokenExpires: Date
});

userSchema.pre('save', async function(next) {
    if(!this.isModified('password')) return next();

    // encrypt the password before saving it
    // 12=salt length (the higher the value, the longer it takes to compute the hash)
    this.password = await bcrypt.hash(this.password, 12); 
    this.confirmPassword = undefined;
    next();
});

// Used to filter and return only active users
// This function uses regex to run before any query that starts with find
userSchema.pre(/^find/, async function(next) {
    //'this' keyword in the function will point to current query
    // this.find({active: true}); //It will return 0 users because there are some without the 'active' property
    this.find({active: {$ne: false}}); //returns also users without 'active' property set
    next();
});

userSchema.methods.comparePasswordInDb = async function(pwd, pwdDB) {
    return await bcrypt.compare(pwd, pwdDB);
};

userSchema.methods.isPasswordChanged = async function(JWTTimestamp) {
    console.log(this.passwordChangedAt)
    if(this.passwordChangedAt) {
        const passwordChangedAtTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000);
        console.log(passwordChangedAtTimestamp + " - " + JWTTimestamp);
        return passwordChangedAtTimestamp > JWTTimestamp;
    }
    return false;
}

userSchema.methods.createResetPasswordToken = async function() {
    const resetToken = crypto.randomBytes(32).toString('hex');

    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex'); //Encrypt reset token
    this.passwordResetTokenExpires =  Date.now() + 10 * 60 * 1000; //Expires in 10 minutes 

    console.log(resetToken, this.passwordResetToken);

    return resetToken; //plain token to be sent by email to the user
}


const User = mongoose.model('User', userSchema);

module.exports = User;