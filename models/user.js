var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');

var User = new Schema({
    firstname: {
        type: String,
        default: ''
    },
    lastname: {
        type: String,
        default: ''
    },
    facebookId: String, // will store the facebook Id of the user that has passed in the access token
    admin: {
        type: Boolean,
        default: false
    }
});

User.plugin(passportLocalMongoose); // apply the passportLocalMongoose plugin to the User schema. this will automatically add into the User schema support for username and password (hashed storage of the password using hash and salt)

module.exports = mongoose.model('User', User);