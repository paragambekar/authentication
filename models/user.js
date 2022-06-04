const mongoose = require('mongoose');

// Define User Schema
const userSchema = new mongoose.Schema({
    // email of user
    email : {
        type : String,
        required : true,
        unique : true,
    },
    // password
    password : {
        type : String,
        required : true,
    },
    // name
    name : {
        type : String,
        required : true,
    },
    // to check if user is verified
    isVerified : {
        type : Boolean,
    },
    // email token to validate user for change password 
    emailToken : {
        type : String,
    },
    // token expires in
    tokenExpiresIn : {
        type : Date
    }
},{
    timestamps : true
});  

// Model the User Schema
const User = mongoose.model('User',userSchema);

module.exports = User;