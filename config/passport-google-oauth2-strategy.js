const passport = require('passport');
const googleStrategy = require('passport-google-oauth').OAuth2Strategy;
const crypto = require('crypto');
const User = require('../models/user');
const { Module } = require('module');

passport.use(new googleStrategy({

    clientID : process.env.GOOGLE_CLIENT_ID,
    clientSecret : process.env.GOOGLE_CLIENT_SECRET,
    callbackURL : process.env.GOOGLE_CALLBACK_URL,
    
},
    function(accessToken, refreshToken, profile, done){
        User.findOne({ email : profile.emails[0].value }).exec(function(error,user){
            if(error){
                console.log("Error in google authentication",error);
                return;
            }


            if(user){
                return done(null, user);
            }else{
                User.create({
                    name : profile.displayName,
                    email : profile.emails[0].value,
                    password : crypto.randomBytes(20).toString('hex'),
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