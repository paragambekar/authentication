const passport = require('passport');
const googleStrategy = require('passport-google-oauth').OAuth2Strategy;
const crypto = require('crypto');
const User = require('../models/user');
const { Module } = require('module');
const { authenticate } = require('passport');

// Using google authenticate to validate user
passport.use(new googleStrategy({

    clientID : process.env.GOOGLE_CLIENT_ID,
    clientSecret : process.env.GOOGLE_CLIENT_SECRET,
    callbackURL : process.env.GOOGLE_CALLBACK_URL,
    
},
    function(accessToken, refreshToken, profile, done){
        // find user with the provided email in the form 
        User.findOne({ email : profile.emails[0].value }).exec(function(error,user){
            if(error){
                console.log("Error in google authentication",error);
                return;
            }

            // if user found return the user 
            if(user){
                return done(null, user);
            }else{
                // if user not found create new user 
                User.create({
                    name : profile.displayName,
                    email : profile.emails[0].value,
                    password : crypto.randomBytes(20).toString('hex'),
                    isVerified : true,
                },function(error, user){
                    if(error){
                        console.log("Error in creating user",error);
                        return;
                    }
                    return done(null,user);
                });
            }

        });
    }
));

module.exports = passport;