const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({

    email : {
        required : true,
        unique : true,
    },
    password : {
        type : String,
        required : true,
    },
    name : {
        type : String,
        required : true,
    },

}); 